"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Network, Loader2 } from "lucide-react"
import { scanNetwork } from "@/lib/actions/ip-management"
import { toast } from "sonner"

export function NetworkScanner() {
  const [networkRange, setNetworkRange] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<any[]>([])

  const handleScan = async () => {
    if (!networkRange.trim()) {
      toast.error("Please enter a network range")
      return
    }

    setIsScanning(true)
    try {
      const results = await scanNetwork(networkRange)
      setScanResults(results)
      toast.success(`Scan completed. Found ${results.length} active devices.`)
    } catch (error) {
      toast.error("Failed to scan network")
      console.error(error)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Network Scanner</CardTitle>
          <CardDescription>Scan network ranges for active devices and IP conflicts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter IP range (e.g., 192.168.1.0/24)"
                  value={networkRange}
                  onChange={(e) => setNetworkRange(e.target.value)}
                />
              </div>
              <Button onClick={handleScan} disabled={isScanning}>
                {isScanning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {isScanning ? "Scanning..." : "Scan Network"}
              </Button>
            </div>

            {scanResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Scan Results</h3>
                  <Badge variant="outline">{scanResults.length} devices found</Badge>
                </div>

                <div className="space-y-2">
                  {scanResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <code className="bg-muted px-2 py-1 rounded font-mono text-sm">{result.ip}</code>
                        <Badge variant={result.status === "active" ? "default" : "secondary"}>{result.status}</Badge>
                        {result.hostname && <span className="text-sm text-muted-foreground">{result.hostname}</span>}
                      </div>
                      <div className="text-right">
                        {result.mac && <div className="text-xs text-muted-foreground font-mono">{result.mac}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isScanning && scanResults.length === 0 && networkRange && (
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scan results yet. Click "Scan Network" to start.</p>
              </div>
            )}

            {!networkRange && (
              <div className="text-center py-12 text-muted-foreground">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter an IP range above to scan for active devices</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
