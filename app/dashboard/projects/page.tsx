import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Plus, Search, FolderOpen, Calendar, DollarSign, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function ProjectsPage() {
  const supabase = await createClient()

  // Fetch projects with customer and asset information
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      customers(name, contact_email),
      assets(id, status, purchase_cost)
    `)
    .order("created_at", { ascending: false })

  // Calculate project statistics
  const projectStats = projects?.map((project) => {
    const assets = project.assets || []
    const assetValue = assets.reduce((sum: number, asset: any) => sum + (asset.purchase_cost || 0), 0)
    const activeAssets = assets.filter((asset: any) => asset.status === "active").length

    // Calculate progress based on dates
    let progress = 0
    if (project.start_date && project.end_date) {
      const start = new Date(project.start_date).getTime()
      const end = new Date(project.end_date).getTime()
      const now = Date.now()
      if (now >= start && now <= end) {
        progress = Math.round(((now - start) / (end - start)) * 100)
      } else if (now > end) {
        progress = 100
      }
    }

    return {
      ...project,
      stats: {
        assetCount: assets.length,
        activeAssets,
        assetValue,
        progress,
      },
    }
  })

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

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "text-green-600"
    if (progress >= 50) return "text-blue-600"
    return "text-yellow-600"
  }

  const totalStats = {
    totalProjects: projectStats?.length || 0,
    activeProjects: projectStats?.filter((p) => p.status === "active").length || 0,
    completedProjects: projectStats?.filter((p) => p.status === "completed").length || 0,
    totalBudget: projectStats?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Management</h2>
          <p className="text-muted-foreground">Track project progress, budgets, and asset deployments</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{totalStats.activeProjects} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.totalProjects > 0
                ? Math.round((totalStats.completedProjects / totalStats.totalProjects) * 100)
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalStats.totalBudget / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Combined project value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Quarter</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectStats?.filter((p) => new Date(p.created_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
                .length || 0}
            </div>
            <p className="text-xs text-muted-foreground">New projects</p>
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
                <Input placeholder="Search projects..." className="pl-10" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projectStats?.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>{project.customers?.name}</CardDescription>
                </div>
                <Badge variant={getStatusColor(project.status)}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.status === "active" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className={`font-medium ${getProgressColor(project.stats.progress)}`}>
                      {project.stats.progress}%
                    </span>
                  </div>
                  <Progress value={project.stats.progress} className="h-2" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-lg">{project.stats.assetCount}</div>
                  <div className="text-muted-foreground">Assets</div>
                </div>
                <div className="text-center p-2 bg-muted/50 rounded">
                  <div className="font-bold text-lg">
                    ${project.budget ? (project.budget / 1000).toFixed(0) + "K" : "0"}
                  </div>
                  <div className="text-muted-foreground">Budget</div>
                </div>
              </div>

              {project.start_date && project.end_date && (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End:</span>
                    <span>{new Date(project.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/projects/${project.id}`}>View Project</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/dashboard/projects/${project.id}/edit`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!projectStats || projectStats.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">Create your first project to start tracking deployments.</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
