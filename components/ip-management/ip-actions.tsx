"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Ban, CheckCircle } from "lucide-react"
import { releaseIPAddress, reserveIPAddress } from "@/lib/actions/ip-management"
import { toast } from "sonner"

interface IPActionsProps {
  ip: any
  onUpdate?: () => void
}

export function IPActions({ ip, onUpdate }: IPActionsProps) {
  const [showReserveDialog, setShowReserveDialog] = useState(false)
  const [reserveReason, setReserveReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleRelease = async () => {
    setIsLoading(true)
    try {
      await releaseIPAddress(ip.id)
      toast.success("IP address released successfully")
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to release IP address")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReserve = async () => {
    if (!reserveReason.trim()) {
      toast.error("Please provide a reason for reservation")
      return
    }

    setIsLoading(true)
    try {
      await reserveIPAddress(ip.id, reserveReason)
      toast.success("IP address reserved successfully")
      setShowReserveDialog(false)
      setReserveReason("")
      onUpdate?.()
    } catch (error) {
      toast.error("Failed to reserve IP address")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "default"
      case "available":
        return "secondary"
      case "reserved":
        return "outline"
      case "blocked":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor(ip.status)}>{ip.status}</Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ip.status === "assigned" && (
              <DropdownMenuItem onClick={handleRelease} disabled={isLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Release IP
              </DropdownMenuItem>
            )}
            {ip.status === "available" && (
              <DropdownMenuItem onClick={() => setShowReserveDialog(true)} disabled={isLoading}>
                <Ban className="mr-2 h-4 w-4" />
                Reserve IP
              </DropdownMenuItem>
            )}
            {ip.status === "reserved" && (
              <DropdownMenuItem onClick={handleRelease} disabled={isLoading}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Make Available
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reserve IP Address</DialogTitle>
            <DialogDescription>Reserve {ip.ip_address} and provide a reason for the reservation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Reservation</Label>
              <Input
                id="reason"
                value={reserveReason}
                onChange={(e) => setReserveReason(e.target.value)}
                placeholder="e.g., Reserved for future server deployment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReserveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReserve} disabled={isLoading}>
              {isLoading ? "Reserving..." : "Reserve IP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
