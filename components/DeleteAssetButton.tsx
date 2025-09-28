'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function DeleteAssetButton({ assetId }: { assetId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this asset? This cannot be undone.")
    if (!confirmed) return

    const { error } = await supabase.from("assets").delete().eq("id", assetId)

    if (error) {
      toast.error("Failed to delete asset: " + error.message)
    } else {
      toast.success("Asset deleted successfully.")
      router.push("/dashboard/assets")
    }
  }

  return (
    <Button variant="destructive" onClick={handleDelete}>
      Delete
    </Button>
  )
}
