import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Users, Building2, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"

export default async function CustomersPage() {
  const supabase = await createClient()

  // Fetch customers with project and asset counts
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      *,
      projects(id, status, budget),
      assets(id, status)
    `)
    .order("created_at", { ascending: false })

  // Calculate customer statistics
  const customerStats = customers?.map((customer) => {
    const projects = customer.projects || []
    const assets = customer.assets || []
    const totalBudget = projects.reduce((sum: number, project: any) => sum + (project.budget || 0), 0)
    const activeProjects = projects.filter((project: any) => project.status === "active").length
    const activeAssets = assets.filter((asset: any) => asset.status === "active").length

    return {
      ...customer,
      stats: {
        totalProjects: projects.length,
        activeProjects,
        totalAssets: assets.length,
        activeAssets,
        totalBudget,
      },
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const totalStats = {
    totalCustomers: customerStats?.length || 0,
    activeCustomers: customerStats?.filter((c) => c.status === "active").length || 0,
    totalBudget: customerStats?.reduce((sum, c) => sum + c.stats.totalBudget, 0) || 0,
    totalProjects: customerStats?.reduce((sum, c) => sum + c.stats.totalProjects, 0) || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">Manage customer accounts, projects, and service relationships</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{totalStats.activeCustomers} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Across all customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalStats.totalBudget / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">Combined project value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerStats?.filter((c) => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">New customers</p>
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
                <Input placeholder="Search customers..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="projects">Project Count</SelectItem>
                <SelectItem value="budget">Total Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {customerStats?.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <CardDescription>{customer.contact_email}</CardDescription>
                </div>
                <Badge variant={getStatusColor(customer.status)}>{customer.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-lg">{customer.stats.activeProjects}</div>
                  <div className="text-muted-foreground">Active Projects</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-lg">{customer.stats.activeAssets}</div>
                  <div className="text-muted-foreground">Assets</div>
                </div>
              </div>

              {customer.stats.totalBudget > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Budget:</span>
                  <span className="ml-2 font-medium">${(customer.stats.totalBudget / 1000).toFixed(0)}K</span>
                </div>
              )}

              {customer.contact_phone && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="ml-2">{customer.contact_phone}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/customers/${customer.id}`}>View Details</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/customers/${customer.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!customerStats || customerStats.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No customers found</h3>
              <p className="text-muted-foreground">Add your first customer to start managing client relationships.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/customers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Customer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
