"use client"

import * as React from "react"
import { Plane } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import { api } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"


interface AirportSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string; // The city name displayed in the main input
  onValueChange: (city: string) => void; // Callback for when the city name changes
  onSelectAirport: (airport: Airport | null) => void; // Callback for when an airport is truly selected (provides the Airport object)
  placeholder?: string;
}

export function AirportSearchInput({ value, onValueChange, onSelectAirport, placeholder, ...props }: AirportSearchInputProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(""); // The term typed into the CommandInput
  const [airports, setAirports] = React.useState<Airport[]>([]);
  const [loading, setLoading] = React.useState(false);
  const debouncedQuery = useDebounce(query, 500); // Debounce search input

  // Effect to fetch airports based on debounced query
  React.useEffect(() => {
    const fetchAirports = async () => {
      if (!debouncedQuery) {
        setAirports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await api.get<AirportSearchResponse>(`/airports/search?q=${debouncedQuery}`);
        setAirports(response.airports || []);
      } catch (error) {
        console.error("Failed to fetch airports:", error);
        setAirports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, [debouncedQuery]);

  const handleSelect = (selectedIataCode: string) => {
    const selectedAirport = airports.find(airport => airport.iata_code === selectedIataCode);
    if (selectedAirport) {
      const cityDisplayName = selectedAirport.city.name;
      onValueChange(cityDisplayName); // Update parent's display value with city name
      onSelectAirport(selectedAirport); // Notify parent of selected airport object
      setQuery(cityDisplayName); // Set internal query to city name for display in the input
    } else {
      onSelectAirport(null); // Clear selected airport if none found
      onValueChange(""); // Clear display value in parent
    }
    setOpen(false); // Close popover
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Plane className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            {...props}
            value={query} // Input now controlled by internal query state
            onChange={(e) => setQuery(e.target.value)} // Update query as user types
            placeholder={placeholder}
            className="pl-10 cursor-pointer"
            onFocus={() => {
                setOpen(true);
                setQuery(value); // Set query to current value for editing
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent 
        className="p-0 bg-popover text-popover-foreground border border-border" 
        align="start" 
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="bg-popover text-popover-foreground">
          <CommandList>
            {loading && <CommandEmpty>Searching...</CommandEmpty>}
            {!loading && airports.length === 0 && query && debouncedQuery && <CommandEmpty>No airport found.</CommandEmpty>}
            {!loading && airports.length === 0 && !query && <CommandEmpty>Start typing to search airports.</CommandEmpty>}
            <CommandGroup>
              {airports.map((airport) => (
                <CommandItem
                  key={airport.iata_code}
                  value={airport.iata_code} // Use IATA code as the value for selection
                  onSelect={handleSelect}
                  className="aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Plane className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{airport.name} ({airport.iata_code})</span>
                  <span className="ml-auto text-muted-foreground">{airport.city.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
