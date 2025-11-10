"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconMinus, IconRotateClockwise } from "@tabler/icons-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

export function CreateSeatBlockDialog({
  cabin_max_cols,
  max_economy_seats = 180,
  airline_code,
  aircraft_code,
}: CreateSeatBlockDialogProps) {
  const [selectedClass, setSelectedClass] = React.useState<string>("")
  const [rows, setRows] = React.useState<number>(10)
  const [cols, setCols] = React.useState<number>(cabin_max_cols ?? 1)
  const [matrix, setMatrix] = React.useState<boolean[][]>([])

  // Initialize matrix when rows or cols change
  React.useEffect(() => {
    setMatrix(prev => {
      // If no previous matrix, create new one
      if (prev.length === 0) {
        return Array(rows).fill(null).map(() => Array(cols).fill(false))
      }
      
      // Preserve existing data and adjust size
      const newMatrix = Array(rows).fill(null).map((_, rowIndex) => {
        if (rowIndex < prev.length) {
          // Existing row - preserve data and adjust columns
          const existingRow = prev[rowIndex] || []
          return Array(cols).fill(null).map((_, colIndex) => {
            return colIndex < existingRow.length ? existingRow[colIndex] : false
          })
        } else {
          // New row - fill with false
          return Array(cols).fill(false)
        }
      })
      
      return newMatrix
    })
  }, [rows, cols])

  const countSeats = React.useCallback(() => {
    return matrix.flat().filter(Boolean).length
  }, [matrix])

  const totalSeats = countSeats()

  const toggleSeat = (row: number, col: number) => {
    setMatrix(prev => {
      const newMatrix = [...prev]
      const newValue = !newMatrix[row][col]
      
      // Check if we're trying to add a seat and would exceed the limit
      if (newValue && totalSeats >= max_economy_seats) {
        toast.error(`Cannot exceed ${max_economy_seats} seats limit`)
        return prev
      }
      
      newMatrix[row] = [...newMatrix[row]]
      newMatrix[row][col] = newValue
      return newMatrix
    })
  }

  const toggleColumn = (colIndex: number) => {
    setMatrix(prev => {
      const newMatrix = [...prev]
      
      // Check if all seats in this column are currently true
      const allSeatsTrue = newMatrix.every(row => row[colIndex])
      
      // If all are true, turn them all off
      // If not all are true, turn them all on (but respect seat limit)
      const newValue = !allSeatsTrue
      
      if (newValue) {
        // Count how many new seats we'd be adding
        const currentFalseSeats = newMatrix.filter(row => !row[colIndex]).length
        if (totalSeats + currentFalseSeats > max_economy_seats) {
          toast.error(`Cannot exceed ${max_economy_seats} seats limit`)
          return prev
        }
      }
      
      // Apply the change to all rows in this column
      return newMatrix.map(row => {
        const newRow = [...row]
        newRow[colIndex] = newValue
        return newRow
      })
    })
  }

  const addRow = () => {
    if (rows < 50) { // reasonable limit
      setRows(prev => prev + 1)
    }
  }

  const removeRow = () => {
    if (rows > 1) {
      setRows(prev => prev - 1)
    }
  }

  const resetMatrix = () => {
    setMatrix(Array(rows).fill(null).map(() => Array(cols).fill(false)))
  }

  const handleConfirm = () => {
    if (!selectedClass) {
      toast.error("Please select a class")
      return
    }

    if (totalSeats === 0) {
      toast.error("Please add at least one seat")
      return
    }

    const result = {
      matrix,
      airline_code,
      id_class: parseInt(selectedClass),
      total_seats: totalSeats,
      rows,
      cols
    }

    console.log("Seat matrix configuration:", result)
    api.post(`/airline/add/block/aircraft/${aircraft_code.value}`, result)
    toast.success(`Seat matrix created with ${totalSeats} seats`)
  }

  const isConfirmDisabled = !selectedClass || totalSeats === 0 || totalSeats > max_economy_seats

  return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class-select">Seat Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="class-select">
                <SelectValue placeholder="Select seat class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Economy</SelectItem>
                <SelectItem value="2">Business</SelectItem>
                <SelectItem value="3">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Matrix Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rows-input">Number of Rows</Label>
              <Input
                id="rows-input"
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cols-input">Number of Columns</Label>
              <Input
                id="cols-input"
                type="number"
                min="1"
                max={cabin_max_cols || 20}
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div>

          {/* Seat Counter and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant={totalSeats > max_economy_seats ? "destructive" : "default"}>
                <span className="text-xs sm:text-sm">{totalSeats} / {max_economy_seats} seats</span>
              </Badge>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={removeRow} disabled={rows <= 1}>
                <IconMinus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Remove Row</span>
              </Button>
              <Button variant="outline" size="sm" onClick={addRow} disabled={rows >= 50}>
                <IconPlus className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Add Row</span>
              </Button>
              <Button variant="outline" size="sm" onClick={resetMatrix}>
                <IconRotateClockwise className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Reset</span>
              </Button>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="space-y-2">
            <Label>Seat Matrix</Label>
            <div className="border rounded-lg p-2 sm:p-4 bg-muted/30 overflow-x-auto">
              <div className="min-w-fit">
                {/* Column headers */}
                <div className="flex mb-2">
                  <div className="w-6 sm:w-8"></div> {/* Row number space */}
                  {Array.from({ length: cols }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => toggleColumn(i)}
                      className="w-6 h-5 sm:w-8 sm:h-6 flex items-center justify-center text-xs font-medium hover:bg-blue-100 rounded transition-colors cursor-pointer border border-transparent hover:border-blue-300"
                      title={`Click to toggle entire column ${String.fromCharCode(65 + i)}`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                  ))}
                </div>

                {/* Matrix rows */}
                <div className="space-y-1">
                  {matrix.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center">
                      {/* Row number */}
                      <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-medium">
                        {rowIndex + 1}
                      </div>
                      {/* Seat cells */}
                      {row.map((isSeat, colIndex) => (
                        <button
                          key={colIndex}
                          onClick={() => toggleSeat(rowIndex, colIndex)}
                          className={`w-6 h-6 sm:w-8 sm:h-8 m-0.5 rounded border-2 transition-colors ${
                            isSeat
                              ? 'bg-green-500 border-green-600 text-white hover:bg-green-600'
                              : 'bg-gray-200 border-gray-300 hover:bg-gray-300'
                          }`}
                          title={`${String.fromCharCode(65 + colIndex)}${rowIndex + 1}: ${isSeat ? 'Seat' : 'Aisle'}`}
                        >
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Click cells to toggle individual seats between seat (green) and aisle (gray).
              <span className="hidden sm:inline"> Click column letters (A, B, C...) to toggle entire columns.</span>
              Green cells represent seats, gray cells represent aisles or empty spaces.
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={handleConfirm} 
            disabled={isConfirmDisabled}
          >
            Confirm Matrix
          </Button>
        </div>
  )
}
export const SeatmapCreationForm = React.memo(function SeatmapCreation({ aircraft_code, airline_code, cabin_max_cols }: { aircraft_code: { value: string }, airline_code?: string, cabin_max_cols: number }) {
  return (
    <div key="seatmap-form">
      <CreateSeatBlockDialog
        max_economy_seats={180}
        airline_code={airline_code}
        aircraft_code={aircraft_code}
        cabin_max_cols={cabin_max_cols}
      />
    </div>
  )
})
