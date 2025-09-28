import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Zap, Thermometer, Server, MapPin } from "lucide-react"
import Link from "next/link"

export default async function DataCentersPage() {
  const supabase = await createClient()

  // Fetch data centers with statistics
  const { data: dataCenters } = await supabase
    .from("data_centers")
    .select(`
      *,
      racks(
        id,
        name,
        height_units,
        assets(id, name, status)
      )
    `)
    .order("name")

  // Calculate statistics for each data center
  const datacentersWithStats =
    dataCenters?.map((dc) => {
      const totalRacks = dc.racks?.length || 0
      const totalAssets = dc.racks?.reduce((sum, rack) => sum + (rack.assets?.length || 0), 0) || 0
      const totalUnits = dc.racks?.reduce((sum, rack) => sum + (rack.height_units || 0), 0) || 0
      const usedUnits =
        dc.racks?.reduce((sum, rack) => {
          return sum + (rack.assets?.reduce((assetSum, asset) => assetSum + 1, 0) || 0)
        }, 0) || 0
      const utilization = totalUnits > 0 ? Math.round((usedUnits / totalUnits) * 100) : 0

      return {
        ...dc,
        stats: {
          totalRacks,
          totalAssets,
          totalUnits,
          usedUnits,
          utilization,
        },
      }
    }) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Centers</h2>
          <p className="text-muted-foreground">Manage and monitor your data center facilities</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/data-centers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Data Center
          </Link>
        </Button>
      </div>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Centers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datacentersWithStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Racks</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datacentersWithStats.reduce((sum, dc) => sum + dc.stats.totalRacks, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datacentersWithStats.reduce((sum, dc) => sum + dc.stats.totalAssets, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datacentersWithStats.length > 0
                ? Math.round(
                    datacentersWithStats.reduce((sum, dc) => sum + dc.stats.utilization, 0) /
                      datacentersWithStats.length,
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Centers Grid */}
      {datacentersWithStats.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {datacentersWithStats.map((dc) => (
            <Card key={dc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {dc.name}
                  </CardTitle>
                  <Badge
                    variant={
                      dc.stats.utilization > 80 ? "destructive" : dc.stats.utilization > 60 ? "secondary" : "default"
                    }
                  >
                    {dc.stats.utilization}% Used
                  </Badge>
                </div>
                <CardDescription>{dc.location}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dc.description && <p className="text-sm text-muted-foreground line-clamp-2">{dc.description}</p>}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span>{dc.stats.totalRacks} Racks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{dc.stats.totalAssets} Assets</span>
                  </div>
                  {dc.power_capacity_kw && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{dc.power_capacity_kw}kW</span>
                    </div>
                  )}
                  {dc.cooling_capacity_tons && (
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-muted-foreground" />
                      <span>{dc.cooling_capacity_tons} tons</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/dashboard/data-centers/${dc.id}`}>View Details</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Link href={`/dashboard/data-centers/${dc.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Centers</h3>
            <p className="text-muted-foreground mb-4">Create your first data center to get started.</p>
            <Button asChild>
              <Link href="/dashboard/data-centers/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Data Center
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
