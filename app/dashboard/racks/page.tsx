import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, MapPin, Building, Zap } from "lucide-react"
import Link from "next/link"
import FloorPlanEditor from "@/components/rack-management/floor-plan-editor"

export default async function RacksPage() {
  const supabase = await createClient()

  // Fetch data centers
  const { data: dataCenters } = await supabase.from("data_centers").select("*").order("name")

  // Fetch racks with asset counts
  const { data: racks } = await supabase
    .from("racks")
    .select(`
      *,
      data_centers(name, location),
      assets(id, height_units, status)
    `)
    .order("name")

  // Calculate rack statistics
  const rackStats = racks?.map((rack) => {
    const assets = rack.assets || []
    const usedUnits = assets
      .filter((asset: any) => asset.status !== "decommissioned")
      .reduce((sum: number, asset: any) => sum + (asset.height_units || 1), 0)
    const totalUnits = rack.height_units || 42
    const utilization = Math.round((usedUnits / totalUnits) * 100)

    return {
      ...rack,
      stats: {
        usedUnits,
        totalUnits,
        availableUnits: totalUnits - usedUnits,
        utilization,
        assetCount: assets.length,
      },
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "secondary"
      case "occupied":
        return "default"
      case "maintenance":
        return "destructive"
      case "reserved":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-600"
    if (utilization >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rack Location Mapping</h2>
          <p className="text-muted-foreground">Visualize and manage data center rack layouts and capacity</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/racks/data-centers/new">
              <Building className="mr-2 h-4 w-4" />
              Add Data Center
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/racks/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Rack
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="floor-plan">Floor Plan</TabsTrigger>
          <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Racks</CardTitle>
                <MapPin className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rackStats?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Across all data centers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Centers</CardTitle>
                <Building className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dataCenters?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                <div className="h-4 w-4 rounded bg-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rackStats?.reduce((sum, rack) => sum + rack.stats.totalUnits, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Rack units available</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rackStats && rackStats.length > 0
                    ? Math.round(rackStats.reduce((sum, rack) => sum + rack.stats.utilization, 0) / rackStats.length)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Average across racks</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search racks..." className="pl-10" />
                  </div>
                </div>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Data Center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data Centers</SelectItem>
                    {dataCenters?.map((dc) => (
                      <SelectItem key={dc.id} value={dc.id}>
                        {dc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Racks Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rackStats?.map((rack) => (
              <Card key={rack.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{rack.name}</CardTitle>
                      <CardDescription>
                        {rack.data_centers?.name} - {rack.row_position} {rack.column_position}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(rack.status)}>{rack.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Capacity Utilization</span>
                      <span className={`font-medium ${getUtilizationColor(rack.stats.utilization)}`}>
                        {rack.stats.utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          rack.stats.utilization >= 90
                            ? "bg-red-600"
                            : rack.stats.utilization >= 70
                              ? "bg-yellow-600"
                              : "bg-green-600"
                        }`}
                        style={{ width: `${rack.stats.utilization}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold">{rack.stats.usedUnits}</div>
                      <div className="text-muted-foreground text-xs">Used</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold">{rack.stats.availableUnits}</div>
                      <div className="text-muted-foreground text-xs">Available</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <div className="font-bold">{rack.stats.assetCount}</div>
                      <div className="text-muted-foreground text-xs">Assets</div>
                    </div>
                  </div>

                  {rack.power_capacity_watts && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Power Capacity:</span>
                      <span className="ml-2 font-medium">{rack.power_capacity_watts}W</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/racks/${rack.id}`}>View Rack</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Link href={`/dashboard/racks/${rack.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!rackStats || rackStats.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No racks found</h3>
                  <p className="text-muted-foreground">Add your first rack to start managing data center layouts.</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/racks/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Rack
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="floor-plan" className="space-y-6">
          <FloorPlanEditor dataCenters={dataCenters || []} racks={rackStats || []} />
        </TabsContent>

        <TabsContent value="capacity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capacity Planning</CardTitle>
              <CardDescription>Analyze current capacity and plan for future growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dataCenters?.map((dc) => {
                  const dcRacks = rackStats?.filter((rack) => rack.data_center_id === dc.id) || []
                  const totalUnits = dcRacks.reduce((sum, rack) => sum + rack.stats.totalUnits, 0)
                  const usedUnits = dcRacks.reduce((sum, rack) => sum + rack.stats.usedUnits, 0)
                  const utilization = totalUnits > 0 ? Math.round((usedUnits / totalUnits) * 100) : 0

                  return (
                    <div key={dc.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">{dc.name}</h3>
                        <div className="text-sm text-muted-foreground">{dc.location}</div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dcRacks.length}</div>
                          <div className="text-sm text-muted-foreground">Racks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{totalUnits}</div>
                          <div className="text-sm text-muted-foreground">Total Units</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usedUnits}</div>
                          <div className="text-sm text-muted-foreground">Used Units</div>
                        </div>
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getUtilizationColor(utilization)}`}>{utilization}%</div>
                          <div className="text-sm text-muted-foreground">Utilization</div>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            utilization >= 90 ? "bg-red-600" : utilization >= 70 ? "bg-yellow-600" : "bg-green-600"
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
