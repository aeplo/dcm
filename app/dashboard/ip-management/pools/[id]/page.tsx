import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { IPActions } from "@/components/ip-management/ip-actions"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function IPPoolDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch IP pool details
  const { data: pool } = await supabase.from("ip_pools").select("*").eq("id", id).single()

  if (!pool) {
    notFound()
  }

  // Fetch IP addresses in this pool
  const { data: ipAddresses } = await supabase
    .from("ip_addresses")
    .select(`
      *,
      assets(name, asset_tag)
    `)
    .eq("pool_id", id)
    .order("ip_address")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "default"
      case "available":
        return "secondary"
      case "reserved":
        return "outline"
      case "blocked":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const stats = {
    total: ipAddresses?.length || 0,
    assigned: ipAddresses?.filter((ip) => ip.status === "assigned").length || 0,
    available: ipAddresses?.filter((ip) => ip.status === "available").length || 0,
    reserved: ipAddresses?.filter((ip) => ip.status === "reserved").length || 0,
    blocked: ipAddresses?.filter((ip) => ip.status === "blocked").length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/ip-management">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to IP Management
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{pool.name}</h2>
          <p className="text-muted-foreground">
            {pool.network_address}/{pool.subnet_mask} - {pool.description}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/ip-management/pools/${id}/edit`}>Edit Pool</Link>
        </Button>
      </div>

      {/* Pool Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Network Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network:</span>
              <code className="font-mono">
                {pool.network_address}/{pool.subnet_mask}
              </code>
            </div>
            {pool.gateway && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway:</span>
                <code className="font-mono">{pool.gateway}</code>
              </div>
            )}
            {pool.vlan_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VLAN:</span>
                <span>{pool.vlan_id}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">In this pool</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <p className="text-xs text-muted-foreground">Ready to assign</p>
          </CardContent>
        </Card>
      </div>

      {/* DNS Servers */}
      {pool.dns_servers && pool.dns_servers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DNS Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pool.dns_servers.map((dns: string, index: number) => (
                <Badge key={index} variant="outline" className="font-mono">
                  {dns}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IP Address List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">IP Addresses</CardTitle>
              <CardDescription>All addresses in this pool</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search IPs..." className="w-64 pl-10" />
              </div>
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ipAddresses?.map((ip) => (
              <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                  <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{ip.ip_address}</code>
                  {ip.hostname && <span className="text-sm text-muted-foreground">{ip.hostname}</span>}
                </div>
                <div className="flex items-center gap-4">
                  {ip.assets && (
                    <div className="text-right">
                      <div className="text-sm font-medium">{ip.assets.name}</div>
                      {ip.assets.asset_tag && (
                        <div className="text-xs text-muted-foreground">{ip.assets.asset_tag}</div>
                      )}
                    </div>
                  )}
                  {ip.assignment_date && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(ip.assignment_date).toLocaleDateString()}
                    </div>
                  )}
                  <IPActions ip={ip} />
                </div>
              </div>
            ))}
          </div>

          {(!ipAddresses || ipAddresses.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">No IP addresses found in this pool</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
