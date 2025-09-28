import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, Wifi, MapPin, Users, AlertTriangle, CheckCircle } from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch dashboard statistics
  const [
    { count: totalAssets },
    { count: activeAssets },
    { count: totalIPs },
    { count: assignedIPs },
    { count: totalRacks },
    { count: totalCustomers },
    { data: recentAlerts },
  ] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("ip_addresses").select("*", { count: "exact", head: true }),
    supabase.from("ip_addresses").select("*", { count: "exact", head: true }).eq("status", "assigned"),
    supabase.from("racks").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("alerts")
      .select("*, assets(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const stats = [
    {
      title: "Total Assets",
      value: totalAssets || 0,
      description: `${activeAssets || 0} active`,
      icon: Server,
      color: "text-blue-600",
    },
    {
      title: "IP Addresses",
      value: totalIPs || 0,
      description: `${assignedIPs || 0} assigned`,
      icon: Wifi,
      color: "text-green-600",
    },
    {
      title: "Racks",
      value: totalRacks || 0,
      description: "Available locations",
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      title: "Customers",
      value: totalCustomers || 0,
      description: "Active accounts",
      icon: Users,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-muted-foreground">Monitor your data center infrastructure and key metrics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recent Alerts
            </CardTitle>
            <CardDescription>Latest system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.assets?.name || "Unknown Asset"}</p>
                    </div>
                    <Badge
                      variant={
                        alert.alert_type === "critical"
                          ? "destructive"
                          : alert.alert_type === "warning"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {alert.alert_type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  No active alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall infrastructure status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Asset Utilization</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${totalAssets ? (activeAssets! / totalAssets) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalAssets ? Math.round((activeAssets! / totalAssets) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">IP Allocation</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${totalIPs ? (assignedIPs! / totalIPs) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {totalIPs ? Math.round((assignedIPs! / totalIPs) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Rack Capacity</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full" style={{ width: "65%" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">65%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
