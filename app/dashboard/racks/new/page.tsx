"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/server"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { createRack, type CreateRackData } from "@/lib/actions/rack-management"
import { toast } from "@/hooks/use-toast"

// This would normally come from a server component or API
const mockDataCenters = [
  { id: "1", name: "DC-East-01", location: "New York" },
  { id: "2", name: "DC-West-01", location: "California" },
  { id: "3", name: "DC-Central-01", location: "Chicago" },
]





export default function NewRackPage() {

  const supabase = await createClient()

  // Fetch data center


  const [dataCenters, setDataCenters] = useState<{ id: string; name: string; location: string }[]>([])

    
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateRackData>({
    name: "",
    data_center_id: "",
    row_position: "",
    column_position: "",
    height_units: 42,
    power_capacity_watts: undefined,
    weight_capacity_kg: undefined,
    status: "available",
    notes: "",
  })

  useEffect(() => {
    const fetchDataCenters = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("data_centers").select("*").order("name")

      if (error) {
        toast({
          title: "Error fetching data centers",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setDataCenters(data || [])
      }
    }

    fetchDataCenters()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await createRack(formData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Rack created successfully",
        })
        router.push("/dashboard/racks")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create rack",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CreateRackData, value: any) => {
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
          <h2 className="text-3xl font-bold tracking-tight">Add New Rack</h2>
          <p className="text-muted-foreground">Create a new rack in your data center</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Rack Details
          </CardTitle>
          <CardDescription>Enter the details for the new rack</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Rack Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., RACK-A01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_center">Data Center *</Label>
                <Select
                  value={formData.data_center_id}
                  onValueChange={(value) => handleInputChange("data_center_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Data Centers</SelectItem>
                    {dataCenters?.map((dc) => (
                      <SelectItem key={dc.id} value={dc.id}>
                        {dc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="row_position">Row Position *</Label>
                <Input
                  id="row_position"
                  value={formData.row_position}
                  onChange={(e) => handleInputChange("row_position", e.target.value)}
                  placeholder="e.g., A"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="column_position">Column Position *</Label>
                <Input
                  id="column_position"
                  value={formData.column_position}
                  onChange={(e) => handleInputChange("column_position", e.target.value)}
                  placeholder="e.g., 01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_units">Height (U) *</Label>
                <Input
                  id="height_units"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.height_units}
                  onChange={(e) => handleInputChange("height_units", Number.parseInt(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="power_capacity">Power Capacity (W)</Label>
                <Input
                  id="power_capacity"
                  type="number"
                  min="0"
                  value={formData.power_capacity_watts || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "power_capacity_watts",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_capacity">Weight Capacity (kg)</Label>
                <Input
                  id="weight_capacity"
                  type="number"
                  min="0"
                  value={formData.weight_capacity_kg || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "weight_capacity_kg",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="e.g., 1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about this rack..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Rack"}
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
