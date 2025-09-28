import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { DeleteAssetButton } from "@/components/DeleteAssetButton"

import Link from "next/link"

interface PageProps {
  params: { id: string }
}

export default async function AssetDetailPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: asset, error } = await (await supabase)
    .from("assets")
    .select(`
      *,
      asset_categories(name),
      racks(name, data_centers(name)),
      customers(name),
      projects(name)
    `)
    .eq("id", params.id)
    .single()

  if (!asset || error) {
    return notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "maintenance":
        return "destructive"
      case "decommissioned":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
        <><div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Asset Details</h2>
          <div className="flex gap-2">
              <Button asChild variant="outline">
                  <Link href={`/dashboard/assets/${params.id}/edit`}>Edit</Link>
              </Button>
              <DeleteAssetButton assetId={params.id} />
          </div>
      </div><Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">{asset.name}</CardTitle>
                      <Badge variant={getStatusColor(asset.status)}>{asset.status}</Badge>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Detail label="Asset Tag" value={asset.asset_tag} />
                      <Detail label="Serial Number" value={asset.serial_number} />
                      <Detail label="Model" value={asset.model} />
                      <Detail label="Manufacturer" value={asset.manufacturer} />
                      <Detail label="Category" value={asset.asset_categories?.name} />
                      <Detail label="Rack" value={asset.racks?.name} />
                      <Detail label="Rack Position" value={asset.rack_position} />
                      <Detail label="Height Units" value={asset.height_units} />
                      <Detail label="Power (W)" value={asset.power_consumption_watts} />
                      <Detail label="Weight (kg)" value={asset.weight_kg} />
                      <Detail label="Purchase Date" value={asset.purchase_date} />
                      <Detail label="Warranty Expiry" value={asset.warranty_expiry} />
                      <Detail label="Purchase Cost" value={asset.purchase_cost} />
                      <Detail label="Customer" value={asset.customers?.name || "Internal"} />
                      <Detail label="Project" value={asset.projects?.name} />
                      <Detail label="Location" value={asset.racks?.data_centers?.name} />
                  </div>
                  {asset.notes && (
                      <div>
                          <p className="text-muted-foreground font-medium">Notes:</p>
                          <p className="mt-1 whitespace-pre-wrap">{asset.notes}</p>
                      </div>
                  )}
              </CardContent>
          </Card><div className="pt-4">
              <Button asChild variant="link">
                  <Link href="/dashboard/assets">← Back to Assets</Link>
              </Button>
          </div></>
  )
}

// Small helper component
function Detail({ label, value }: { label: string; value?: any }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "N/A"}</p>
    </div>
  )
}
