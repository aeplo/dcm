import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Building, ArrowLeft, Edit, Server, MapPin, Zap, Thermometer, Activity, CheckCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default async function DataCenterDetailPage({ params }: PageProps) {
  const supabase = await createClient()

  // Fetch data center with all related data
  const { data: dataCenter } = await supabase
    .from("data_centers")
    .select(`
      *,
      racks(
        id,
        name,
        row_position,
        column_position,
        height_units,
        power_capacity_watts,
        status,
        assets(
          id,
          name,
          status,
          power_consumption_watts,
          rack_position,
          height_units
        )
      )
    `)
    .eq("id", params.id)
    .single()

  if (!dataCenter) {
    notFound()
  }

  // Calculate comprehensive statistics
  const totalRacks = dataCenter.racks?.length || 0
  const totalAssets = dataCenter.racks?.reduce((sum, rack) => sum + (rack.assets?.length || 0), 0) || 0
  const totalUnits = dataCenter.racks?.reduce((sum, rack) => sum + (rack.height_units || 0), 0) || 0
  const usedUnits =
    dataCenter.racks?.reduce((sum, rack) => {
      return (
        sum +
        (rack.assets?.reduce((assetSum, asset) => {
          const units = asset.height_units || 1
          return assetSum + units
        }, 0) || 0)
      )
    }, 0) || 0

  const utilization = totalUnits > 0 ? Math.round((usedUnits / totalUnits) * 100) : 0

  const totalPowerConsumption =
    dataCenter.racks?.reduce((sum, rack) => {
      return (
        sum +
        (rack.assets?.reduce((assetSum, asset) => {
          return assetSum + (asset.power_consumption_watts || 0)
        }, 0) || 0)
      )
    }, 0) || 0

  const powerUtilization = dataCenter.power_capacity_kw
    ? Math.round((totalPowerConsumption / (dataCenter.power_capacity_kw * 1000)) * 100)
    : 0

  // Status counts
  const rackStatusCounts =
    dataCenter.racks?.reduce(
      (counts, rack) => {
        counts[rack.status || "unknown"] = (counts[rack.status || "unknown"] || 0) + 1
        return counts
      },
      {} as Record<string, number>,
    ) || {}

  const assetStatusCounts =
    dataCenter.racks?.reduce(
      (counts, rack) => {
        rack.assets?.forEach((asset) => {
          counts[asset.status || "unknown"] = (counts[asset.status || "unknown"] || 0) + 1
        })
        return counts
      },
      {} as Record<string, number>,
    ) || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/data-centers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data Centers
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8" />
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{dataCenter.name}</h2>
              <p className="text-muted-foreground">{dataCenter.location}</p>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/data-centers/${dataCenter.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Space Utilization</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilization}%</div>
            <Progress value={utilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {usedUnits} of {totalUnits} units used
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Utilization</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{powerUtilization}%</div>
            <Progress value={powerUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {(totalPowerConsumption / 1000).toFixed(1)}kW of {dataCenter.power_capacity_kw?.toFixed(0) || 0}kW
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Racks</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRacks}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {rackStatusCounts.active || 0} Active
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {rackStatusCounts.maintenance || 0} Maintenance
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default" className="text-xs">
                {assetStatusCounts.active || 0} Active
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {assetStatusCounts.maintenance || 0} Issues
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="racks">Racks</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Data Center Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Location</h4>
                    <p className="text-muted-foreground">{dataCenter.location}</p>
                  </div>
                  {dataCenter.address && (
                    <div>
                      <h4 className="font-medium mb-1">Address</h4>
                      <p className="text-muted-foreground">{dataCenter.address}</p>
                    </div>
                  )}
                  {dataCenter.power_capacity_kw && (
                    <div>
                      <h4 className="font-medium mb-1">Power Capacity</h4>
                      <p className="text-muted-foreground">{dataCenter.power_capacity_kw} kW</p>
                    </div>
                  )}
                  {dataCenter.cooling_capacity_tons && (
                    <div>
                      <h4 className="font-medium mb-1">Cooling Capacity</h4>
                      <p className="text-muted-foreground">{dataCenter.cooling_capacity_tons} tons</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-1">Created</h4>
                    <p className="text-muted-foreground">{new Date(dataCenter.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Total Racks</h4>
                    <p className="text-muted-foreground">{dataCenter.total_racks || totalRacks}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity Planning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Space Utilization</span>
                    <span>{utilization}%</span>
                  </div>
                  <Progress value={utilization} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Power Utilization</span>
                    <span>{powerUtilization}%</span>
                  </div>
                  <Progress value={powerUtilization} />
                </div>
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Available Units</span>
                    <span>{totalUnits - usedUnits}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Available Power</span>
                    <span>{((dataCenter.power_capacity_kw || 0) - totalPowerConsumption / 1000).toFixed(1)}kW</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="racks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dataCenter.racks?.map((rack) => (
              <Card key={rack.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rack.name}</CardTitle>
                    <Badge variant={rack.status === "active" ? "default" : "secondary"}>{rack.status}</Badge>
                  </div>
                  <CardDescription>
                    Position: {rack.row_position} {rack.column_position}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Assets:</span>
                      <span>{rack.assets?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Units:</span>
                      <span>{rack.height_units}</span>
                    </div>
                    {rack.power_capacity_watts && (
                      <div className="flex justify-between">
                        <span>Power Capacity:</span>
                        <span>{(rack.power_capacity_watts / 1000).toFixed(1)}kW</span>
                      </div>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full mt-4 bg-transparent">
                    <Link href={`/dashboard/racks/${rack.id}`}>View Rack</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="space-y-4">
            {dataCenter.racks?.map((rack) => (
              <Card key={rack.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{rack.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {rack.assets && rack.assets.length > 0 ? (
                    <div className="space-y-2">
                      {rack.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Position: U{asset.rack_position} ({asset.height_units}U)
                            </div>
                          </div>
                          <Badge variant={asset.status === "active" ? "default" : "secondary"}>{asset.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No assets in this rack</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="environmental" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Temperature Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Temperature</span>
                    <Badge variant="default">22°C</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Humidity</span>
                    <Badge variant="default">45%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status</span>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Normal
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Power Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Current Load</span>
                    <Badge variant="default">{(totalPowerConsumption / 1000).toFixed(1)}kW</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Efficiency</span>
                    <Badge variant="default">94%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Status</span>
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Optimal
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
