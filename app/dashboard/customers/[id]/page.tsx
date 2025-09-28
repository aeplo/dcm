import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Mail, Phone, MapPin, Building, Server, FolderOpen } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch customer details
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  // Fetch customer projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  // Fetch customer assets
  const { data: assets } = await supabase
    .from("assets")
    .select(`
      *,
      asset_categories(name),
      racks(name, data_centers(name))
    `)
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "planning":
        return "secondary"
      case "completed":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => p.status === "active").length || 0,
    totalAssets: assets?.length || 0,
    activeAssets: assets?.filter((a) => a.status === "active").length || 0,
    totalBudget: projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground">Customer Details and Service Overview</p>
        </div>
        <Badge variant={getStatusColor(customer.status)} className="text-sm">
          {customer.status}
        </Badge>
        <Button asChild>
          <Link href={`/dashboard/customers/${id}/edit`}>Edit Customer</Link>
        </Button>
      </div>

      {/* Customer Information */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customer.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.contact_email}</span>
              </div>
            )}
            {customer.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.contact_phone}</span>
              </div>
            )}
            {customer.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded">
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded">
                <div className="text-2xl font-bold">{stats.activeProjects}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">${(stats.totalBudget / 1000).toFixed(0)}K</div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asset Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded">
                <div className="text-2xl font-bold">{stats.totalAssets}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded">
                <div className="text-2xl font-bold">{stats.activeAssets}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Customer Projects</h3>
            <Button asChild size="sm">
              <Link href={`/dashboard/projects/new?customer=${id}`}>
                <FolderOpen className="mr-2 h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        {project.start_date && project.end_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(project.start_date).toLocaleDateString()} -{" "}
                            {new Date(project.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
                        {project.budget && (
                          <div className="text-sm font-medium">${(project.budget / 1000).toFixed(0)}K</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No projects found for this customer</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Customer Assets</h3>
            <Button asChild size="sm">
              <Link href={`/dashboard/assets/new?customer=${id}`}>
                <Server className="mr-2 h-4 w-4" />
                Add Asset
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {assets && assets.length > 0 ? (
              assets.map((asset) => (
                <Card key={asset.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{asset.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {asset.manufacturer} {asset.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {asset.racks?.name && `${asset.racks.name} - `}
                          {asset.asset_categories?.name}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={asset.status === "active" ? "default" : "secondary"}>{asset.status}</Badge>
                        {asset.asset_tag && <div className="text-xs text-muted-foreground">{asset.asset_tag}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No assets found for this customer</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <h3 className="text-lg font-semibold">Billing Information</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {customer.billing_address && (
                  <div>
                    <h4 className="font-medium mb-2">Billing Address</h4>
                    <p className="text-sm text-muted-foreground">{customer.billing_address}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Account Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Project Value:</span>
                      <div className="font-medium">${(stats.totalBudget / 1000).toFixed(0)}K</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Active Projects:</span>
                      <div className="font-medium">{stats.activeProjects}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
