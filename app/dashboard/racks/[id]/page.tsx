import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Zap, Weight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import InteractiveRack from "@/components/rack-management/interactive-rack"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RackDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch rack details with assets
  const { data: rack } = await supabase
    .from("racks")
    .select(`
      *,
      data_centers(name, location),
      assets(
        id,
        name,
        asset_tag,
        model,
        manufacturer,
        rack_position,
        height_units,
        power_consumption_watts,
        weight_kg,
        status,
        customers(name)
      )
    `)
    .eq("id", id)
    .single()

  if (!rack) {
    notFound()
  }

  // Sort assets by rack position
  const sortedAssets = rack.assets?.sort((a: any, b: any) => (a.rack_position || 0) - (b.rack_position || 0)) || []

  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 border-green-300 text-green-800"
      case "inactive":
        return "bg-gray-100 border-gray-300 text-gray-600"
      case "maintenance":
        return "bg-red-100 border-red-300 text-red-800"
      case "decommissioned":
        return "bg-gray-50 border-gray-200 text-gray-400"
      default:
        return "bg-blue-100 border-blue-300 text-blue-800"
    }
  }

  const stats = {
    totalAssets: sortedAssets.length,
    usedUnits: sortedAssets.reduce((sum: number, asset: any) => sum + (asset.height_units || 1), 0),
    totalPower: sortedAssets.reduce((sum: number, asset: any) => sum + (asset.power_consumption_watts || 0), 0),
    totalWeight: sortedAssets.reduce((sum: number, asset: any) => sum + (asset.weight_kg || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/racks">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Racks
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{rack.name}</h2>
          <p className="text-muted-foreground">
            {rack.data_centers?.name} - {rack.row_position} {rack.column_position}
          </p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/racks/${id}/edit`}>Edit Rack</Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Rack Information */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rack Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={rack.status === "available" ? "secondary" : "default"}>{rack.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Height:</span>
                <span>{rack.height_units}U</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span>
                  {rack.row_position} {rack.column_position}
                </span>
              </div>
              {rack.power_capacity_watts && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power Capacity:</span>
                  <span>{rack.power_capacity_watts}W</span>
                </div>
              )}
              {rack.weight_capacity_kg && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight Capacity:</span>
                  <span>{rack.weight_capacity_kg}kg</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{stats.totalAssets}</div>
                  <div className="text-sm text-muted-foreground">Assets</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{stats.usedUnits}U</div>
                  <div className="text-sm text-muted-foreground">Used Space</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Power Usage: {stats.totalPower}W</span>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Total Weight: {stats.totalWeight.toFixed(1)}kg</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rack Visualization */}
        <div className="md:col-span-2">
          <InteractiveRack
            rack={{
              id: rack.id,
              name: rack.name,
              height_units: rack.height_units || 42,
              assets: sortedAssets,
            }}
          />
        </div>
      </div>

      {/* Assets List */}
      <Card>
        <CardHeader>
          <CardTitle>Assets in this Rack</CardTitle>
          <CardDescription>Detailed list of all assets installed in this rack</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAssets.length > 0 ? (
              sortedAssets.map((asset: any) => (
                <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{asset.name}</h4>
                      <Badge variant="outline">{asset.asset_tag}</Badge>
                      <Badge variant={asset.status === "active" ? "default" : "secondary"}>{asset.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {asset.manufacturer} {asset.model}
                      {asset.customers && <span className="ml-4">Customer: {asset.customers.name}</span>}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium">Position: {asset.rack_position}U</div>
                    <div className="text-xs text-muted-foreground">
                      {asset.height_units}U height
                      {asset.power_consumption_watts && <span className="ml-2">{asset.power_consumption_watts}W</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No assets installed in this rack</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
