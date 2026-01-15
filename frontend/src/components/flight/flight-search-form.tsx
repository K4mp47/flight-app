import * as React from "react"
import { DateRange } from "react-day-picker"
import { format, addDays } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Users } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Minus, Plus } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { AirportSearchInput } from "./airport-search-input"
import { cn } from "@/lib/utils"

interface Airport {
  iata_code: string;
  name?: string;
}

interface FlightSearchFormProps {
  onSearch: (params: {
    origin: string;
    destination: string;
    departureDate: Date | undefined;
    returnDate: Date | undefined;
    adults: number;
    children: number;
    tripType: 'one-way' | 'round-trip';
    flightClass: number; // Added
    directFlights: boolean; // Added
  }) => void;
}

export function FlightSearchForm({ onSearch }: FlightSearchFormProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })
  const [passengers, setPassengers] = React.useState({ adults: 1, children: 0 });
  const [originCode, setOriginCode] = React.useState(''); // Stores IATA code
  const [originDisplay, setOriginDisplay] = React.useState(''); // For input display
  const [destinationCode, setDestinationCode] = React.useState(''); // Stores IATA code
  const [destinationDisplay, setDestinationDisplay] = React.useState(''); // For input display
  const [tripType, setTripType] = React.useState<'one-way' | 'round-trip'>('round-trip');
  const [flightClass, setFlightClass] = React.useState<number>(4); // Default to Economy
  const [directFlights, setDirectFlights] = React.useState<boolean>(false);

  const handlePassengerChange = (type: 'adults' | 'children', amount: number) => {
    setPassengers(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] + amount)
    }));
  };

  const handleSearchClick = () => {
    if (!originCode || !destinationCode) {
      // Potentially show a toast error here
      return;
    }
    onSearch({
      origin: originCode,
      destination: destinationCode,
      departureDate: date?.from,
      returnDate: tripType === 'round-trip' ? date?.to : undefined,
      adults: passengers.adults,
      children: passengers.children,
      tripType: tripType === 'one-way' ? 'one-way' : 'round-trip',
      flightClass,
      directFlights,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 bg-card rounded-xl shadow-lg -mt-16 z-10 relative">
      {/* Trip Type Selection */}
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant={tripType === 'round-trip' ? 'default' : 'outline'}
          onClick={() => setTripType('round-trip')}
          className="flex-1 sm:flex-none"
        >
          Round Trip
        </Button>
        <Button
          type="button"
          variant={tripType === 'one-way' ? 'default' : 'outline'}
          onClick={() => setTripType('one-way')}
          className="flex-1 sm:flex-none"
        >
          One Way
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center flex-row-reverse justify-end">
        <div className="flex items-center space-x-2">
          <Checkbox id="direct-flights" checked={directFlights} onCheckedChange={(checked) => setDirectFlights(checked === true)} />
          <Label htmlFor="direct-flights">Direct Flights Only</Label>
        </div>

        <Select value={String(flightClass)} onValueChange={(value) => setFlightClass(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">First Class</SelectItem>
            <SelectItem value="2">Business Class</SelectItem>
            <SelectItem value="3">Premium Economy</SelectItem>
            <SelectItem value="4">Economy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
        
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
          <AirportSearchInput 
            placeholder="Origin" 
            value={originDisplay}
            onValueChange={setOriginDisplay}
            onSelectAirport={(airport: Airport | null) => setOriginCode(airport ? airport.iata_code : '')}
          />
          <AirportSearchInput 
            placeholder="Destination" 
            value={destinationDisplay}
            onValueChange={setDestinationDisplay}
            onSelectAirport={(airport: Airport | null) => setDestinationCode(airport ? airport.iata_code : '')}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-[1.3rem] -translate-y-1/2 hidden sm:flex items-center justify-center w-10 h-10 bg-card rounded-full border">
             <ArrowRight className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="md:col-span-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to && tripType === 'round-trip' ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {tripType === "one-way" ? (
                <Calendar
                  initialFocus
                  mode="single"
                  defaultMonth={date?.from}
                  selected={date?.from}
                  onSelect={(selectedDate) => setDate({ from: selectedDate })}
                  numberOfMonths={1}
                  disabled={(day) => day < new Date()}
                />
              ) : (
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  disabled={(day) => day < new Date()}
                />
              )}
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="md:col-span-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{passengers.adults} Adults, {passengers.children} Children</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="adults">Adults</Label>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => handlePassengerChange('adults', -1)} disabled={passengers.adults <= 1}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{passengers.adults}</span>
                                <Button size="icon" variant="outline" onClick={() => handlePassengerChange('adults', 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="children">Children</Label>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => handlePassengerChange('children', -1)} disabled={passengers.children <= 0}>
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center">{passengers.children}</span>
                                <Button size="icon" variant="outline" onClick={() => handlePassengerChange('children', 1)}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        <Button className="md:col-span-1 w-full" onClick={handleSearchClick}>Search</Button>
      </div>
    </div>
  )
}
