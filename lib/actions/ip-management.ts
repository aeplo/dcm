"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createIPPool(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const networkAddress = formData.get("networkAddress") as string
  const subnetMask = formData.get("subnetMask") as string
  const gateway = formData.get("gateway") as string
  const vlanId = formData.get("vlanId") as string
  const dnsServers = formData.get("dnsServers") as string

  // Parse DNS servers
  const dnsArray = dnsServers
    ? dnsServers
        .split(",")
        .map((dns) => dns.trim())
        .filter(Boolean)
    : []

  // Create the IP pool
  const { data: pool, error: poolError } = await supabase
    .from("ip_pools")
    .insert({
      name,
      description,
      network_address: networkAddress,
      subnet_mask: Number.parseInt(subnetMask),
      gateway: gateway || null,
      vlan_id: vlanId ? Number.parseInt(vlanId) : null,
      dns_servers: dnsArray.length > 0 ? dnsArray : null,
    })
    .select()
    .single()

  if (poolError) {
    throw new Error(`Failed to create IP pool: ${poolError.message}`)
  }

  // Generate IP addresses for the pool
  await generateIPAddresses(pool.id, networkAddress, Number.parseInt(subnetMask), gateway)

  revalidatePath("/dashboard/ip-management")
  redirect("/dashboard/ip-management")
}

export async function updateIPPool(poolId: string, formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const gateway = formData.get("gateway") as string
  const vlanId = formData.get("vlanId") as string
  const dnsServers = formData.get("dnsServers") as string

  const dnsArray = dnsServers
    ? dnsServers
        .split(",")
        .map((dns) => dns.trim())
        .filter(Boolean)
    : []

  const { error } = await supabase
    .from("ip_pools")
    .update({
      name,
      description,
      gateway: gateway || null,
      vlan_id: vlanId ? Number.parseInt(vlanId) : null,
      dns_servers: dnsArray.length > 0 ? dnsArray : null,
    })
    .eq("id", poolId)

  if (error) {
    throw new Error(`Failed to update IP pool: ${error.message}`)
  }

  revalidatePath("/dashboard/ip-management")
  revalidatePath(`/dashboard/ip-management/pools/${poolId}`)
  redirect(`/dashboard/ip-management/pools/${poolId}`)
}

export async function assignIPAddress(formData: FormData) {
  const supabase = await createClient()

  const ipId = formData.get("ipId") as string
  const assetId = formData.get("assetId") as string
  const hostname = formData.get("hostname") as string

  const { error } = await supabase
    .from("ip_addresses")
    .update({
      asset_id: assetId || null,
      hostname: hostname || null,
      status: "assigned",
      assignment_date: new Date().toISOString(),
    })
    .eq("id", ipId)

  if (error) {
    throw new Error(`Failed to assign IP address: ${error.message}`)
  }

  // Log the assignment
  await supabase.from("change_logs").insert({
    table_name: "ip_addresses",
    record_id: ipId,
    action: "UPDATE",
    changes: {
      status: "assigned",
      asset_id: assetId,
      hostname: hostname,
    },
    description: `IP address assigned to ${hostname || "asset"}`,
  })

  revalidatePath("/dashboard/ip-management")
}

export async function releaseIPAddress(ipId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("ip_addresses")
    .update({
      asset_id: null,
      hostname: null,
      status: "available",
      assignment_date: null,
    })
    .eq("id", ipId)

  if (error) {
    throw new Error(`Failed to release IP address: ${error.message}`)
  }

  // Log the release
  await supabase.from("change_logs").insert({
    table_name: "ip_addresses",
    record_id: ipId,
    action: "UPDATE",
    changes: {
      status: "available",
      asset_id: null,
      hostname: null,
    },
    description: "IP address released",
  })

  revalidatePath("/dashboard/ip-management")
}

export async function reserveIPAddress(ipId: string, reason: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("ip_addresses")
    .update({
      status: "reserved",
      notes: reason,
    })
    .eq("id", ipId)

  if (error) {
    throw new Error(`Failed to reserve IP address: ${error.message}`)
  }

  revalidatePath("/dashboard/ip-management")
}

export async function bulkUpdateIPStatus(ipIds: string[], status: string, reason?: string) {
  const supabase = await createClient()

  const updateData: any = { status }
  if (reason) updateData.notes = reason

  const { error } = await supabase.from("ip_addresses").update(updateData).in("id", ipIds)

  if (error) {
    throw new Error(`Failed to bulk update IP addresses: ${error.message}`)
  }

  revalidatePath("/dashboard/ip-management")
}

async function generateIPAddresses(poolId: string, networkAddress: string, subnetMask: number, gateway?: string) {
  const supabase = await createClient()

  // Calculate IP range based on network address and subnet mask
  const ipAddresses = calculateIPRange(networkAddress, subnetMask, gateway)

  // Insert IP addresses in batches
  const batchSize = 100
  for (let i = 0; i < ipAddresses.length; i += batchSize) {
    const batch = ipAddresses.slice(i, i + batchSize).map((ip) => ({
      pool_id: poolId,
      ip_address: ip.address,
      status: ip.status,
    }))

    await supabase.from("ip_addresses").insert(batch)
  }
}

function calculateIPRange(networkAddress: string, subnetMask: number, gateway?: string) {
  const ipAddresses: { address: string; status: string }[] = []

  // Convert network address to number
  const networkParts = networkAddress.split(".").map(Number)
  const networkNum = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3]

  // Calculate number of host bits and total hosts
  const hostBits = 32 - subnetMask
  const totalHosts = Math.pow(2, hostBits)

  // Generate IP addresses
  for (let i = 1; i < totalHosts - 1; i++) {
    // Skip network and broadcast addresses
    const ipNum = networkNum + i
    const ip = [(ipNum >>> 24) & 255, (ipNum >>> 16) & 255, (ipNum >>> 8) & 255, ipNum & 255].join(".")

    // Mark gateway as reserved, others as available
    const status = ip === gateway ? "reserved" : "available"
    ipAddresses.push({ address: ip, status })
  }

  return ipAddresses
}

export async function scanNetwork(networkRange: string) {
  // This would typically involve actual network scanning
  // For demo purposes, we'll simulate some results
  const mockResults = [
    { ip: "192.168.1.1", status: "active", hostname: "gateway.local", mac: "00:11:22:33:44:55" },
    { ip: "192.168.1.10", status: "active", hostname: "server01.local", mac: "00:11:22:33:44:66" },
    { ip: "192.168.1.20", status: "active", hostname: "workstation01.local", mac: "00:11:22:33:44:77" },
  ]

  // In a real implementation, you would:
  // 1. Parse the network range
  // 2. Ping each IP in the range
  // 3. Perform reverse DNS lookups
  // 4. Check ARP tables for MAC addresses
  // 5. Return the results

  return mockResults
}
