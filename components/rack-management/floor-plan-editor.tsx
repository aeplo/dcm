"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit } from "lucide-react"
import Link from "next/link"

interface Rack {
  id: string
  name: string
  row_position: string
  column_position: string
  status: string
  stats: {
    utilization: number
    usedUnits: number
    totalUnits: number
    assetCount: number
  }
}

interface DataCenter {
  id: string
  name: string
  location: string
}

interface FloorPlanEditorProps {
  dataCenters: DataCenter[]
  racks: Rack[]
}

export default function FloorPlanEditor({ dataCenters, racks }: FloorPlanEditorProps) {
  const [selectedDataCenter, setSelectedDataCenter] = useState<string>(dataCenters[0]?.id || "")
  const [gridSize, setGridSize] = useState({ rows: 10, cols: 10 })
  const [showGridSettings, setShowGridSettings] = useState(false)

  const selectedDC = dataCenters.find((dc) => dc.id === selectedDataCenter)
  const dcRacks = racks.filter((rack) => rack.data_center_id === selectedDataCenter)

  // Create a grid representation
  const createGrid = () => {
    const grid = Array(gridSize.rows)
      .fill(null)
      .map(() => Array(gridSize.cols).fill(null))

    dcRacks.forEach((rack) => {
      const row = Number.parseInt(rack.row_position) - 1
      const col = Number.parseInt(rack.column_position) - 1
      if (row >= 0 && row < gridSize.rows && col >= 0 && col < gridSize.cols) {
        grid[row][col] = rack
      }
    })

    return grid
  }

  const grid = createGrid()

  const getRackColor = (rack: Rack | null) => {
    if (!rack) return "bg-gray-50 border-gray-200 hover:bg-gray-100"

    const utilization = rack.stats.utilization
    if (utilization >= 90) return "bg-red-100 border-red-300 text-red-800"
    if (utilization >= 70) return "bg-yellow-100 border-yellow-300 text-yellow-800"
    if (utilization > 0) return "bg-blue-100 border-blue-300 text-blue-800"
    return "bg-green-100 border-green-300 text-green-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedDataCenter} onValueChange={setSelectedDataCenter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select data center" />
            </SelectTrigger>
            <SelectContent>
              {dataCenters.map((dc) => (
                <SelectItem key={dc.id} value={dc.id}>
                  {dc.name} - {dc.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">{dcRacks.length} racks</Badge>
        </div>
        <div className="flex gap-2">
          <Dialog open={showGridSettings} onOpenChange={setShowGridSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Grid Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Floor Plan Grid Settings</DialogTitle>
                <DialogDescription>Adjust the grid size for the floor plan layout</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min="5"
                    max="20"
                    value={gridSize.rows}
                    onChange={(e) => setGridSize((prev) => ({ ...prev, rows: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Columns</Label>
                  <Input
                    id="cols"
                    type="number"
                    min="5"
                    max="20"
                    value={gridSize.cols}
                    onChange={(e) => setGridSize((prev) => ({ ...prev, cols: Number.parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              <Button onClick={() => setShowGridSettings(false)}>Apply Changes</Button>
            </DialogContent>
          </Dialog>
          <Button asChild size="sm">
            <Link href="/dashboard/racks/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Rack
            </Link>
          </Button>
        </div>
      </div>

      {selectedDC && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedDC.name} Floor Plan</CardTitle>
            <CardDescription>Interactive floor plan showing rack positions and utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>Low Usage (&lt;70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>High Usage (70-90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Critical (&gt;90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded border-dashed"></div>
                  <span>Empty Position</span>
                </div>
              </div>

              {/* Grid */}
              <div className="overflow-auto">
                <div
                  className="grid gap-1 p-4 bg-muted/20 rounded-lg min-w-fit"
                  style={{
                    gridTemplateColumns: `repeat(${gridSize.cols}, minmax(60px, 1fr))`,
                    gridTemplateRows: `repeat(${gridSize.rows}, 60px)`,
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((rack, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          border-2 rounded flex flex-col items-center justify-center text-xs font-medium 
                          cursor-pointer transition-all hover:shadow-md relative
                          ${getRackColor(rack)}
                          ${!rack ? "border-dashed" : ""}
                        `}
                        title={
                          rack
                            ? `${rack.name} - ${rack.stats.utilization}% utilized`
                            : `Empty position (${rowIndex + 1}, ${colIndex + 1})`
                        }
                      >
                        {rack ? (
                          <>
                            <div className="font-semibold truncate w-full text-center">
                              {rack.name.split("-").pop()}
                            </div>
                            <div className="text-xs opacity-75">{rack.stats.utilization}%</div>
                            <div className="absolute top-1 right-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                                asChild
                              >
                                <Link href={`/dashboard/racks/${rack.id}`}>
                                  <Edit className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-muted-foreground text-xs">
                            {rowIndex + 1},{colIndex + 1}
                          </div>
                        )}
                      </div>
                    )),
                  )}
                </div>
              </div>

              {/* Position Labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Rows: 1-{gridSize.rows}</span>
                <span>Columns: 1-{gridSize.cols}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
