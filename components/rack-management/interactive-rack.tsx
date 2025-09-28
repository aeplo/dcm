"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { moveAssetToRack, removeAssetFromRack, getAvailableAssets } from "@/lib/actions/rack-management"
import { toast } from "@/hooks/use-toast"

interface Asset {
  id: string
  name: string
  asset_tag: string
  model: string
  manufacturer: string
  rack_position?: number
  height_units: number
  power_consumption_watts?: number
  weight_kg?: number
  status: string
  customers?: { name: string }
}

interface InteractiveRackProps {
  rack: {
    id: string
    name: string
    height_units: number
    assets: Asset[]
  }
  onUpdate?: () => void
}

export default function InteractiveRack({ rack, onUpdate }: InteractiveRackProps) {
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string>("")
  const [selectedPosition, setSelectedPosition] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Sort assets by rack position
  const sortedAssets = rack.assets?.sort((a, b) => (a.rack_position || 0) - (b.rack_position || 0)) || []

  // Create rack visualization
  const rackUnits = Array.from({ length: rack.height_units }, (_, i) => {
    const unitNumber = rack.height_units - i // Count from top
    const asset = sortedAssets.find((asset) => {
      const startPos = asset.rack_position || 0
      const endPos = startPos + (asset.height_units || 1) - 1
      return unitNumber >= startPos && unitNumber <= endPos
    })
    return {
      unitNumber,
      asset,
      isAssetStart: asset && unitNumber === asset.rack_position,
      isEmpty: !asset,
    }
  })

  useEffect(() => {
    loadAvailableAssets()
  }, [])

  const loadAvailableAssets = async () => {
    const result = await getAvailableAssets()
    if (result.success) {
      setAvailableAssets(result.assets || [])
    }
  }

  const handleAddAsset = async () => {
    if (!selectedAsset) return

    setIsLoading(true)
    try {
      const result = await moveAssetToRack({
        asset_id: selectedAsset,
        rack_id: rack.id,
        rack_position: selectedPosition,
      })

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Asset added to rack successfully",
        })
        setShowAddDialog(false)
        setSelectedAsset("")
        setSelectedPosition(1)
        loadAvailableAssets()
        onUpdate?.()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add asset to rack",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAsset = async (assetId: string, assetName: string) => {
    if (!confirm(`Remove ${assetName} from this rack?`)) return

    setIsLoading(true)
    try {
      const result = await removeAssetFromRack(assetId)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Asset removed from rack successfully",
        })
        loadAvailableAssets()
        onUpdate?.()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove asset from rack",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAssetStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
      case "inactive":
        return "bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200"
      case "maintenance":
        return "bg-red-100 border-red-300 text-red-800 hover:bg-red-200"
      case "decommissioned":
        return "bg-gray-50 border-gray-200 text-gray-400"
      default:
        return "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
    }
  }

  const getAvailablePositions = () => {
    const selectedAssetData = availableAssets.find((a) => a.id === selectedAsset)
    if (!selectedAssetData) return []

    const assetHeight = selectedAssetData.height_units || 1
    const positions = []

    for (let pos = 1; pos <= rack.height_units - assetHeight + 1; pos++) {
      // Check if this position range is free
      let isFree = true
      for (let checkPos = pos; checkPos < pos + assetHeight; checkPos++) {
        const hasAsset = sortedAssets.some((asset) => {
          const startPos = asset.rack_position || 0
          const endPos = startPos + (asset.height_units || 1) - 1
          return checkPos >= startPos && checkPos <= endPos
        })
        if (hasAsset) {
          isFree = false
          break
        }
      }
      if (isFree) {
        positions.push(pos)
      }
    }

    return positions
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interactive Rack Layout</CardTitle>
            <CardDescription>Click on empty positions to add assets, or click on assets to manage them</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Asset to Rack</DialogTitle>
                <DialogDescription>Select an available asset and position to add to this rack</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available Assets</label>
                  <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAssets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.asset_tag}) - {asset.height_units}U
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedAsset && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position (U)</label>
                    <Select
                      value={selectedPosition.toString()}
                      onValueChange={(value) => setSelectedPosition(Number.parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailablePositions().map((pos) => (
                          <SelectItem key={pos} value={pos.toString()}>
                            Position {pos}U
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleAddAsset} disabled={!selectedAsset || isLoading}>
                    {isLoading ? "Adding..." : "Add Asset"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {rackUnits.map(({ unitNumber, asset, isAssetStart, isEmpty }) => (
            <div key={unitNumber} className="flex items-center gap-2">
              <div className="w-8 text-xs text-muted-foreground text-right">{unitNumber}U</div>
              <div
                className={`flex-1 h-6 border rounded flex items-center px-2 text-xs transition-colors ${
                  asset
                    ? getAssetStatusColor(asset.status)
                    : "bg-white border-gray-200 hover:bg-gray-50 cursor-pointer border-dashed"
                }`}
                onClick={() => {
                  if (isEmpty) {
                    setSelectedPosition(unitNumber)
                    setShowAddDialog(true)
                  }
                }}
              >
                {asset && isAssetStart && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate">{asset.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-75">{asset.height_units}U</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-red-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveAsset(asset.id, asset.name)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {asset && !isAssetStart && <div className="w-full border-t border-dashed opacity-50" />}
                {isEmpty && <span className="text-muted-foreground text-xs">Click to add asset</span>}
              </div>
            </div>
          ))}
        </div>

        {availableAssets.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No available assets to add. All assets are either assigned to racks or not active.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
