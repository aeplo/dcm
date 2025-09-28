"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

interface PageProps {
  params: {
    id: string
  }
}

interface DataCenterData {
  name: string
  location: string
  address?: string
  power_capacity_kw?: number
  cooling_capacity_tons?: number
}

export default function EditDataCenterPage({ params }: PageProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<DataCenterData>({
    name: "",
    location: "",
    address: "",
    power_capacity_kw: undefined,
    cooling_capacity_tons: undefined,
  })

  useEffect(() => {
    const fetchDataCenter = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("data_centers").select("*").eq("id", params.id).single()

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load data center",
          variant: "destructive",
        })
        router.push("/dashboard/data-centers")
        return
      }

      setFormData({
        name: data.name,
        location: data.location,
        address: data.address || "",
        power_capacity_kw: data.power_capacity_kw,
        cooling_capacity_tons: data.cooling_capacity_tons,
      })
      setIsLoading(false)
    }

    fetchDataCenter()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("data_centers").update(formData).eq("id", params.id)

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update data center",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Data center updated successfully",
        })
        router.push(`/dashboard/data-centers/${params.id}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update data center",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof DataCenterData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/data-centers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Data Centers
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/data-centers/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data Center
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Data Center</h2>
          <p className="text-muted-foreground">Update data center information</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Data Center Details
          </CardTitle>
          <CardDescription>Update the details for this data center</CardDescription>
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
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Full address of the data center..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power_capacity">Power Capacity (kW)</Label>
                <Input
                  id="power_capacity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.power_capacity_kw || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "power_capacity_kw",
                      e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 100"
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
                {isSubmitting ? "Updating..." : "Update Data Center"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/dashboard/data-centers/${params.id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
