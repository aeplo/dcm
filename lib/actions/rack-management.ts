"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CreateRackData {
  name: string
  data_center_id: string
  row_position: string
  column_position: string
  height_units: number
  power_capacity_watts?: number
  weight_capacity_kg?: number
  status: "available" | "occupied" | "maintenance" | "reserved"
  // notes?: string
}

export interface CreateDataCenterData {
  name: string
  location: string
  address?: string
  power_capacity_kw?: number
  cooling_capacity_tons?: number
}

export interface MoveAssetData {
  asset_id: string
  rack_id: string
  rack_position: number
}

export async function createRack(data: CreateRackData) {
  const supabase = await createClient()

  try {
    // Check if rack position is already taken
    const { data: existingRack } = await supabase
      .from("racks")
      .select("id")
      .eq("data_center_id", data.data_center_id)
      .eq("row_position", data.row_position)
      .eq("column_position", data.column_position)
      .single()

    if (existingRack) {
      return { error: "A rack already exists at this position" }
    }

    const { data: rack, error } = await supabase.from("racks").insert([data]).select().single()

    if (error) {
      console.error("Error creating rack:", error)
      return { error: "Failed to create rack" }
    }

    revalidatePath("/dashboard/racks")
    return { success: true, rack }
  } catch (error) {
    console.error("Error creating rack:", error)
    return { error: "Failed to create rack" }
  }
}

export async function updateRack(id: string, data: Partial<CreateRackData>) {
  const supabase = await createClient()

  try {
    const { data: rack, error } = await supabase.from("racks").update(data).eq("id", id).select().single()

    if (error) {
      console.error("Error updating rack:", error)
      return { error: "Failed to update rack" }
    }

    revalidatePath("/dashboard/racks")
    revalidatePath(`/dashboard/racks/${id}`)
    return { success: true, rack }
  } catch (error) {
    console.error("Error updating rack:", error)
    return { error: "Failed to update rack" }
  }
}

export async function deleteRack(id: string) {
  const supabase = await createClient()

  try {
    // Check if rack has assets
    const { data: assets } = await supabase.from("assets").select("id").eq("rack_id", id).limit(1)

    if (assets && assets.length > 0) {
      return { error: "Cannot delete rack with assets. Please move or remove assets first." }
    }

    const { error } = await supabase.from("racks").delete().eq("id", id)

    if (error) {
      console.error("Error deleting rack:", error)
      return { error: "Failed to delete rack" }
    }

    revalidatePath("/dashboard/racks")
    return { success: true }
  } catch (error) {
    console.error("Error deleting rack:", error)
    return { error: "Failed to delete rack" }
  }
}

export async function createDataCenter(data: CreateDataCenterData) {
  const supabase = await createClient()

  try {
    const { data: dataCenter, error } = await supabase.from("data_centers").insert([data]).select().single()

    if (error) {
      console.error("Error creating data center:", error)
      return { error: "Failed to create data center" }
    }

    revalidatePath("/dashboard/racks")
    return { success: true, dataCenter }
  } catch (error) {
    console.error("Error creating data center:", error)
    return { error: "Failed to create data center" }
  }
}

export async function moveAssetToRack(data: MoveAssetData) {
  const supabase = await createClient()

  try {
    // Get asset details to check height
    const { data: asset } = await supabase.from("assets").select("height_units, name").eq("id", data.asset_id).single()

    if (!asset) {
      return { error: "Asset not found" }
    }

    // Get rack details
    const { data: rack } = await supabase.from("racks").select("height_units").eq("id", data.rack_id).single()

    if (!rack) {
      return { error: "Rack not found" }
    }

    // Check if position is valid
    const assetHeight = asset.height_units || 1
    if (data.rack_position + assetHeight - 1 > rack.height_units) {
      return { error: "Asset doesn't fit at this position" }
    }

    // Check for conflicts with existing assets
    const { data: conflictingAssets } = await supabase
      .from("assets")
      .select("id, name, rack_position, height_units")
      .eq("rack_id", data.rack_id)
      .neq("id", data.asset_id)

    if (conflictingAssets) {
      for (const existingAsset of conflictingAssets) {
        const existingStart = existingAsset.rack_position || 0
        const existingEnd = existingStart + (existingAsset.height_units || 1) - 1
        const newStart = data.rack_position
        const newEnd = newStart + assetHeight - 1

        if (
          (newStart >= existingStart && newStart <= existingEnd) ||
          (newEnd >= existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd)
        ) {
          return { error: `Position conflicts with ${existingAsset.name}` }
        }
      }
    }

    // Update asset position
    const { error } = await supabase
      .from("assets")
      .update({
        rack_id: data.rack_id,
        rack_position: data.rack_position,
      })
      .eq("id", data.asset_id)

    if (error) {
      console.error("Error moving asset:", error)
      return { error: "Failed to move asset" }
    }

    revalidatePath("/dashboard/racks")
    revalidatePath(`/dashboard/racks/${data.rack_id}`)
    revalidatePath("/dashboard/assets")
    return { success: true }
  } catch (error) {
    console.error("Error moving asset:", error)
    return { error: "Failed to move asset" }
  }
}

export async function removeAssetFromRack(assetId: string) {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from("assets")
      .update({
        rack_id: null,
        rack_position: null,
      })
      .eq("id", assetId)

    if (error) {
      console.error("Error removing asset from rack:", error)
      return { error: "Failed to remove asset from rack" }
    }

    revalidatePath("/dashboard/racks")
    revalidatePath("/dashboard/assets")
    return { success: true }
  } catch (error) {
    console.error("Error removing asset from rack:", error)
    return { error: "Failed to remove asset from rack" }
  }
}

export async function getAvailableAssets() {
  const supabase = await createClient()

  try {
    const { data: assets, error } = await supabase
      .from("assets")
      .select(`
        id,
        name,
        asset_tag,
        model,
        manufacturer,
        height_units,
        power_consumption_watts,
        weight_kg,
        status
      `)
      .is("rack_id", null)
      .eq("status", "active")
      .order("name")

    if (error) {
      console.error("Error fetching available assets:", error)
      return { error: "Failed to fetch available assets" }
    }

    return { success: true, assets: assets || [] }
  } catch (error) {
    console.error("Error fetching available assets:", error)
    return { error: "Failed to fetch available assets" }
  }
}
