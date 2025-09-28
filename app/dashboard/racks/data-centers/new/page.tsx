"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building } from "lucide-react"
import Link from "next/link"
import { createDataCenter, type CreateDataCenterData } from "@/lib/actions/rack-management"
import { toast } from "@/hooks/use-toast"

export default function NewDataCenterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateDataCenterData>({
    name: "",
    location: "",
    description: "",
    total_power_capacity_watts: undefined,
    cooling_capacity_tons: undefined,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createDataCenter(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Data center created successfully",
        })
        router.push("/dashboard/racks")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create data center",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CreateDataCenterData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Data Center</h2>
          <p className="text-muted-foreground">Create a new data center location</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Data Center Details
          </CardTitle>
          <CardDescription>Enter the details for the new data center</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Data Center Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., DC-East-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., New York, NY"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Description of the data center..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power_capacity">Total Power Capacity (W)</Label>
                <Input
                  id="power_capacity"
                  type="number"
                  min="0"
                  value={formData.total_power_capacity_watts || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "total_power_capacity_watts",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cooling_capacity">Cooling Capacity (tons)</Label>
                <Input
                  id="cooling_capacity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.cooling_capacity_tons || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "cooling_capacity_tons",
                      e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Data Center"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/racks">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
