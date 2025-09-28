import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { IPAssignmentForm } from "@/components/ip-management/ip-assignment-form"

export default async function AssignIPPage() {
  const supabase = await createClient()

  // Fetch available IP addresses
  const { data: availableIPs } = await supabase
    .from("ip_addresses")
    .select(`
      *,
      ip_pools(name, network_address, subnet_mask)
    `)
    .eq("status", "available")
    .order("ip_address")

  // Fetch assets for assignment
  const { data: assets } = await supabase.from("assets").select("id, name, asset_tag, type").order("name")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/ip-management">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to IP Management
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assign IP Address</h2>
          <p className="text-muted-foreground">Assign an available IP address to an asset</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IP Assignment</CardTitle>
            <CardDescription>Select an IP address and assign it to an asset</CardDescription>
          </CardHeader>
          <CardContent>
            <IPAssignmentForm availableIPs={availableIPs || []} assets={assets || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available IP Addresses</CardTitle>
            <CardDescription>{availableIPs?.length || 0} IP addresses available for assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableIPs?.map((ip) => (
                <div key={ip.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{ip.ip_address}</code>
                    <div className="text-sm text-muted-foreground mt-1">
                      Pool: {ip.ip_pools?.name} ({ip.ip_pools?.network_address}/{ip.ip_pools?.subnet_mask})
                    </div>
                  </div>
                </div>
              ))}
              {(!availableIPs || availableIPs.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">No available IP addresses found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
