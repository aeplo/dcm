"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { assignIPAddress } from "@/lib/actions/ip-management"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface IPAssignmentFormProps {
  availableIPs: any[]
  assets: any[]
}

export function IPAssignmentForm({ availableIPs, assets }: IPAssignmentFormProps) {
  const [selectedIP, setSelectedIP] = useState("")
  const [selectedAsset, setSelectedAsset] = useState("")
  const [hostname, setHostname] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedIP) {
      toast.error("Please select an IP address")
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("ipId", selectedIP)
      formData.append("assetId", selectedAsset)
      formData.append("hostname", hostname)

      await assignIPAddress(formData)
      toast.success("IP address assigned successfully")
      router.push("/dashboard/ip-management")
    } catch (error) {
      toast.error("Failed to assign IP address")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedIPData = availableIPs.find((ip) => ip.id === selectedIP)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ip">IP Address *</Label>
        <Select value={selectedIP} onValueChange={setSelectedIP}>
          <SelectTrigger>
            <SelectValue placeholder="Select an IP address" />
          </SelectTrigger>
          <SelectContent>
            {availableIPs.map((ip) => (
              <SelectItem key={ip.id} value={ip.id}>
                <div className="flex items-center gap-2">
                  <code className="font-mono">{ip.ip_address}</code>
                  <span className="text-muted-foreground">({ip.ip_pools?.name})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIPData && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-sm space-y-1">
            <div>
              <strong>Pool:</strong> {selectedIPData.ip_pools?.name}
            </div>
            <div>
              <strong>Network:</strong> {selectedIPData.ip_pools?.network_address}/
              {selectedIPData.ip_pools?.subnet_mask}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="asset">Asset (Optional)</Label>
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectTrigger>
            <SelectValue placeholder="Select an asset" />
          </SelectTrigger>
          <SelectContent>
            {assets.map((asset) => (
              <SelectItem key={asset.id} value={asset.id}>
                <div className="flex items-center gap-2">
                  <span>{asset.name}</span>
                  {asset.asset_tag && <span className="text-muted-foreground">({asset.asset_tag})</span>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hostname">Hostname</Label>
        <Input
          id="hostname"
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="e.g., server01.example.com"
        />
      </div>

      <Button type="submit" disabled={!selectedIP || isSubmitting}>
        {isSubmitting ? "Assigning..." : "Assign IP Address"}
      </Button>
    </form>
  )
}
