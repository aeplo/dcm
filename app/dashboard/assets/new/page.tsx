'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Option = {
  id: string
  name: string
}

export default function AddAssetPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    asset_tag: "",
    serial_number: "",
    model: "",
    manufacturer: "",
    status: "active",
    category_id: "",
    rack_id: "",
    rack_position: "",
    height_units: "1",
    power_consumption_watts: "",
    weight_kg: "",
    purchase_date: "",
    warranty_expiry: "",
    purchase_cost: "",
    customer_id: "",
    project_id: "",
    notes: "",
  })

  const [categories, setCategories] = useState<Option[]>([])
  const [racks, setRacks] = useState<Option[]>([])
  const [customers, setCustomers] = useState<Option[]>([])
  const [projects, setProjects] = useState<Option[]>([])

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [{ data: cats }, { data: racks }, { data: customers }, { data: projects }] = await Promise.all([
        supabase.from("asset_categories").select("id, name").order("name"),
        supabase.from("racks").select("id, name").order("name"),
        supabase.from("customers").select("id, name").order("name"),
        supabase.from("projects").select("id, name").order("name"),
      ])

      setCategories(cats ?? [])
      setRacks(racks ?? [])
      setCustomers(customers ?? [])
      setProjects(projects ?? [])
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    const { error } = await supabase.from("assets").insert([
      {
        name: formData.name,
        asset_tag: formData.asset_tag || null,
        serial_number: formData.serial_number || null,
        model: formData.model || null,
        manufacturer: formData.manufacturer || null,
        category_id: formData.category_id || null,
        rack_id: formData.rack_id || null,
        rack_position: formData.rack_position ? parseInt(formData.rack_position) : null,
        height_units: formData.height_units ? parseInt(formData.height_units) : 1,
        power_consumption_watts: formData.power_consumption_watts ? parseInt(formData.power_consumption_watts) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
        status: formData.status,
        customer_id: formData.customer_id || null,
        project_id: formData.project_id || null,
        notes: formData.notes || null,
        // Optionally: created_by — add current user ID if available
      }
    ])

    if (error) {
      toast.error("Failed to add asset: " + error.message)
    } else {
      toast.success("Asset added!")
      router.push("/dashboard/assets")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Add New Asset</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input name="name" value={formData.name} onChange={handleChange} required /></div>
              <div><Label>Asset Tag</Label><Input name="asset_tag" value={formData.asset_tag} onChange={handleChange} /></div>
              <div><Label>Serial Number</Label><Input name="serial_number" value={formData.serial_number} onChange={handleChange} /></div>
              <div><Label>Manufacturer</Label><Input name="manufacturer" value={formData.manufacturer} onChange={handleChange} /></div>
              <div><Label>Model</Label><Input name="model" value={formData.model} onChange={handleChange} /></div>
              <div><Label>Rack Position</Label><Input name="rack_position" type="number" value={formData.rack_position} onChange={handleChange} /></div>
              <div><Label>Height Units</Label><Input name="height_units" type="number" value={formData.height_units} onChange={handleChange} /></div>
              <div><Label>Power (Watts)</Label><Input name="power_consumption_watts" type="number" value={formData.power_consumption_watts} onChange={handleChange} /></div>
              <div><Label>Weight (kg)</Label><Input name="weight_kg" type="number" step="0.01" value={formData.weight_kg} onChange={handleChange} /></div>
              <div><Label>Purchase Date</Label><Input name="purchase_date" type="date" value={formData.purchase_date} onChange={handleChange} /></div>
              <div><Label>Warranty Expiry</Label><Input name="warranty_expiry" type="date" value={formData.warranty_expiry} onChange={handleChange} /></div>
              <div><Label>Purchase Cost</Label><Input name="purchase_cost" type="number" step="0.01" value={formData.purchase_cost} onChange={handleChange} /></div>
              <div>
                <Label>Status</Label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="decommissioned">Decommissioned</option>
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Rack</Label>
                <select name="rack_id" value={formData.rack_id} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Select rack</option>
                  {racks.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Customer</Label>
                <select name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Internal</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Project</Label>
                <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" rows={3}></textarea>
            </div>

            <Button type="submit" className="mt-6">Add Asset</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
