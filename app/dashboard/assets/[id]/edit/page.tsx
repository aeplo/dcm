'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function EditAssetPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const supabase = createClient()
  const assetId = params.id

  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    asset_tag: "",
    serial_number: "",
    model: "",
    manufacturer: "",
    category_id: "",
    rack_id: "",
    rack_position: "",
    height_units: "",
    power_consumption_watts: "",
    weight_kg: "",
    purchase_date: "",
    warranty_expiry: "",
    purchase_cost: "",
    status: "active",
    customer_id: "",
    project_id: "",
    notes: "",
  })

  type Option = { id: string; name: string }
  const [categories, setCategories] = useState<Option[]>([])
  const [racks, setRacks] = useState<Option[]>([])
  const [customers, setCustomers] = useState<Option[]>([])
  const [projects, setProjects] = useState<Option[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data: asset, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", assetId)
        .single()

      if (error || !asset) {
        toast.error("Failed to load asset.")
        router.push("/dashboard/assets")
        return
      }

      const [
        { data: cats },
        { data: rackList },
        { data: custList },
        { data: projList },
      ] = await Promise.all([
        supabase.from("asset_categories").select("id, name").order("name"),
        supabase.from("racks").select("id, name"),
        supabase.from("customers").select("id, name"),
        supabase.from("projects").select("id, name"),
      ])

      setFormData({
        ...asset,
        rack_position: asset.rack_position?.toString() || "",
        height_units: asset.height_units?.toString() || "",
        power_consumption_watts: asset.power_consumption_watts?.toString() || "",
        weight_kg: asset.weight_kg?.toString() || "",
        purchase_date: asset.purchase_date || "",
        warranty_expiry: asset.warranty_expiry || "",
        purchase_cost: asset.purchase_cost?.toString() || "",
      })

      setCategories(cats || [])
      setRacks(rackList || [])
      setCustomers(custList || [])
      setProjects(projList || [])

      setLoading(false)
    }

    fetchData()
  }, [assetId, supabase, router])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    const { error } = await supabase.from("assets").update({
      ...formData,
      rack_position: formData.rack_position ? parseInt(formData.rack_position) : null,
      height_units: formData.height_units ? parseInt(formData.height_units) : null,
      power_consumption_watts: formData.power_consumption_watts
        ? parseFloat(formData.power_consumption_watts)
        : null,
      weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      purchase_cost: formData.purchase_cost ? parseFloat(formData.purchase_cost) : null,
    }).eq("id", assetId)

    if (error) {
      toast.error("Failed to update asset: " + error.message)
    } else {
      toast.success("Asset updated!")
      router.push(`/dashboard/assets/${assetId}`)
    }
  }

  if (loading) return <p className="text-center py-10">Loading asset...</p>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Edit Asset</h2>

      <Card>
        <CardHeader>
          <CardTitle>Asset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Name", name: "name" },
                { label: "Asset Tag", name: "asset_tag" },
                { label: "Serial Number", name: "serial_number" },
                { label: "Manufacturer", name: "manufacturer" },
                { label: "Model", name: "model" },
                { label: "Power Consumption (W)", name: "power_consumption_watts", type: "number" },
                { label: "Weight (kg)", name: "weight_kg", type: "number" },
                { label: "Rack Position", name: "rack_position", type: "number" },
                { label: "Height Units", name: "height_units", type: "number" },
                { label: "Purchase Cost", name: "purchase_cost", type: "number" },
                { label: "Purchase Date", name: "purchase_date", type: "date" },
                { label: "Warranty Expiry", name: "warranty_expiry", type: "date" },
              ].map(({ label, name, type = "text" }) => (
                <div key={name}>
                  <Label>{label}</Label>
                  <Input
                    name={name}
                    type={type}
                    value={(formData as any)[name] || ""}
                    onChange={handleChange}
                  />
                </div>
              ))}
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
                <select name="category_id" value={formData.category_id || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Rack</Label>
                <select name="rack_id" value={formData.rack_id || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Select rack</option>
                  {racks.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Customer</Label>
                <select name="customer_id" value={formData.customer_id || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">Internal</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Project</Label>
                <select name="project_id" value={formData.project_id || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded-md">
                  <option value="">None</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <textarea name="notes" value={formData.notes || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded-md" rows={3}></textarea>
            </div>
            <Button type="submit" className="mt-6">Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
