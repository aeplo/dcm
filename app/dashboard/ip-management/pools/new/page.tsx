import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createIPPool } from "@/lib/actions/ip-management"

export default function NewIPPoolPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/ip-management">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to IP Management
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create IP Pool</h2>
          <p className="text-muted-foreground">Add a new IP address pool to manage network addresses</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Pool Configuration</CardTitle>
          <CardDescription>Configure the network settings for your new IP pool</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createIPPool} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Pool Name *</Label>
                <Input id="name" name="name" placeholder="e.g., Production Network" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vlanId">VLAN ID</Label>
                <Input id="vlanId" name="vlanId" type="number" placeholder="e.g., 100" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Brief description of this IP pool" rows={3} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="networkAddress">Network Address *</Label>
                <Input id="networkAddress" name="networkAddress" placeholder="e.g., 192.168.1.0" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subnetMask">Subnet Mask (CIDR) *</Label>
                <Input
                  id="subnetMask"
                  name="subnetMask"
                  type="number"
                  min="8"
                  max="30"
                  placeholder="e.g., 24"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gateway">Gateway Address</Label>
              <Input id="gateway" name="gateway" placeholder="e.g., 192.168.1.1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dnsServers">DNS Servers</Label>
              <Input id="dnsServers" name="dnsServers" placeholder="e.g., 8.8.8.8, 8.8.4.4" />
              <p className="text-sm text-muted-foreground">Separate multiple DNS servers with commas</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit">Create IP Pool</Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/ip-management">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
