import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Network, Globe } from "lucide-react"
import Link from "next/link"
import { NetworkScanner } from "@/components/ip-management/network-scanner"

export default async function IPManagementPage() {
  const supabase = await createClient()

  // Fetch IP pools with statistics
  const { data: ipPools } = await supabase
    .from("ip_pools")
    .select(`
    *,
    ip_addresses(id, status)
  `)
    .order("created_at", { ascending: false })

  // Fetch recent IP assignments
  const { data: recentAssignments } = await supabase
    .from("ip_addresses")
    .select(`
      *,
      assets(name, asset_tag),
      ip_pools(name)
    `)
    .eq("status", "assigned")
    .order("assignment_date", { ascending: false })
    .limit(10)

  // Calculate pool statistics
  const poolStats = ipPools?.map((pool) => {
    const addresses = pool.ip_addresses || []
    const total = addresses.length
    const assigned = addresses.filter((ip: any) => ip.status === "assigned").length
    const available = addresses.filter((ip: any) => ip.status === "available").length
    const reserved = addresses.filter((ip: any) => ip.status === "reserved").length

    return {
      ...pool,
      stats: {
        total,
        assigned,
        available,
        reserved,
        utilization: total > 0 ? Math.round((assigned / total) * 100) : 0,
      },
    }
  })

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">IP Address Management</h2>
          <p className="text-muted-foreground">Manage IP pools, assignments, and network configurations</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/ip-management/pools/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Pool
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/ip-management/assign">
              <Network className="mr-2 h-4 w-4" />
              Assign IP
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pools" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pools">IP Pools</TabsTrigger>
          <TabsTrigger value="assignments">Recent Assignments</TabsTrigger>
          <TabsTrigger value="scanner">Network Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-6">
          {/* Pool Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pools</CardTitle>
                <Globe className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{poolStats?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active IP pools</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total IPs</CardTitle>
                <Network className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {poolStats?.reduce((sum, pool) => sum + pool.stats.total, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Managed addresses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <div className="h-4 w-4 rounded-full bg-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {poolStats?.reduce((sum, pool) => sum + pool.stats.assigned, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">In use</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <div className="h-4 w-4 rounded-full bg-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {poolStats?.reduce((sum, pool) => sum + pool.stats.available, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Ready to assign</p>
              </CardContent>
            </Card>
          </div>

          {/* IP Pools Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {poolStats?.map((pool) => (
              <Card key={pool.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      <CardDescription>
                        {pool.network_address}/{pool.subnet_mask}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">VLAN {pool.vlan_id || "N/A"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Utilization</span>
                      <span className="font-medium">{pool.stats.utilization}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${pool.stats.utilization}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{pool.stats.assigned}</div>
                      <div className="text-muted-foreground">Assigned</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold text-lg">{pool.stats.available}</div>
                      <div className="text-muted-foreground">Available</div>
                    </div>
                  </div>

                  {pool.gateway && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Gateway:</span>
                      <span className="ml-2 font-mono">{pool.gateway}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/ip-management/pools/${pool.id}`}>View Pool</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/ip-management/pools/${pool.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!poolStats || poolStats.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No IP pools found</h3>
                  <p className="text-muted-foreground">
                    Create your first IP pool to start managing network addresses.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/ip-management/pools/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create IP Pool
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent IP Assignments</CardTitle>
              <CardDescription>Latest IP address assignments to assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAssignments && recentAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {recentAssignments.map((assignment: any) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                              {assignment.ip_address}
                            </code>
                            <Badge variant={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {assignment.hostname && <span className="mr-4">Hostname: {assignment.hostname}</span>}
                            Pool: {assignment.ip_pools?.name}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{assignment.assets?.name || "Unassigned"}</div>
                          {assignment.assets?.asset_tag && (
                            <div className="text-sm text-muted-foreground">{assignment.assets.asset_tag}</div>
                          )}
                          {assignment.assignment_date && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(assignment.assignment_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No recent IP assignments found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <NetworkScanner />
        </TabsContent>
      </Tabs>
    </div>
  )
}
