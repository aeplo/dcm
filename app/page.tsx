import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-balance">Data Center Management Platform</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Comprehensive solution for managing data center assets, IP addresses, rack locations, and customer
              projects with real-time monitoring and analytics.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/sign-up">Create Account</Link>
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>
                Track and manage all your data center assets with detailed inventory and location mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Complete asset inventory</li>
                <li>• Rack position tracking</li>
                <li>• Warranty management</li>
                <li>• Customer associations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IP Address Management</CardTitle>
              <CardDescription>
                Efficiently manage IP address pools, assignments, and network configurations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• IP pool management</li>
                <li>• Automatic assignments</li>
                <li>• VLAN configuration</li>
                <li>• DNS integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>Monitor system performance, alerts, and generate comprehensive reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Performance metrics</li>
                <li>• Alert management</li>
                <li>• Custom dashboards</li>
                <li>• Audit trails</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
