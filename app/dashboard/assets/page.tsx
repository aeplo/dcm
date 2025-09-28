import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

export default async function AssetsPage() {
  const supabase = await createClient()

  // Fetch assets with related data
  const { data: assets } = await supabase
    .from("assets")
    .select(`
      *,
      asset_categories(name),
      racks(name, data_centers(name)),
      customers(name),
      projects(name)
    `)
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("asset_categories").select("*").order("name")

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Asset Management</h2>
          <p className="text-muted-foreground">Manage and track all your data center assets</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
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
                <Input placeholder="Search assets..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets?.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
                  <CardDescription>
                    {asset.manufacturer} {asset.model}
                  </CardDescription>
                </div>
                <Badge variant={getStatusColor(asset.status)}>{asset.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Asset Tag:</span>
                  <p className="font-medium">{asset.asset_tag || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{asset.asset_categories?.name || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium">
                    {asset.racks?.name || "Unassigned"}
                    {asset.racks?.data_centers?.name && (
                      <span className="text-muted-foreground"> ({asset.racks.data_centers.name})</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{asset.customers?.name || "Internal"}</p>
                </div>
              </div>

              {asset.power_consumption_watts && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Power:</span>
                  <span className="font-medium">{asset.power_consumption_watts}W</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/assets/${asset.id}`}>View Details</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/assets/${asset.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!assets || assets.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No assets found</h3>
              <p className="text-muted-foreground">Get started by adding your first asset to the system.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/assets/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Asset
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
