"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
  const [hours, setHours] = React.useState<string>(value?.split(":")?.[0] || "09")
  const [minutes, setMinutes] = React.useState<string>(value?.split(":")?.[1] || "00")

  React.useEffect(() => {
    if (value) {
      const parts = value.split(":")
      if (parts.length === 2) {
        setHours(parts[0])
        setMinutes(parts[1])
      }
    }
  }, [value])

  const handleHourChange = (newHour: string) => {
    setHours(newHour)
    onChange?.(`${newHour}:${minutes}`)
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinutes(newMinute)
    onChange?.(`${hours}:${newMinute}`)
  }

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-center mb-2">Select Time</div>
          <div className="flex gap-2 items-center">
            <Select value={hours} onValueChange={handleHourChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="HH" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {hourOptions.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-medium">:</span>
            <Select value={minutes} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-[70px]">
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {minuteOptions.map((minute) => (
                  <SelectItem key={minute} value={minute}>
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
