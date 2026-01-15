import { Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from 'next/navigation';
import { differenceInMinutes } from 'date-fns';

interface FlightSearchResult {
    airline: {
        iata_code: string;
        name: string;
    };
    base_price: number;
    route_code: string;
    scheduled_arrival_day: string; // Date part
    scheduled_departure_day: string; // Date part
    id_flight: number; // Assuming id_flight is part of the result for booking
    sections: Array<{
        arrival_time: string; // Time part (e.g., "14:30:00")
        departure_time: string; // Time part (e.g., "09:00:00")
        section: {
            code_arrival_airport: string;
            code_departure_airport: string;
        };
    }>;
}

type FlightCardProps = {
  flight: FlightSearchResult;
  className?: string;
  selectedClass?: number;
  onSelect?: () => void;
  onDeselect?: () => void;
  isSelected?: boolean;
}

export function FlightCard({ flight, className, selectedClass = 4, onSelect, onDeselect, isSelected }: FlightCardProps) {
  const router = useRouter();

  const departureTime = flight.sections?.[0]?.departure_time;
  const departureCode = flight.sections?.[0]?.section?.code_departure_airport;
  const arrivalTime = flight.sections?.[flight.sections.length - 1]?.arrival_time;
  const arrivalCode = flight.sections?.[flight.sections.length - 1]?.section?.code_arrival_airport;

  const calculateDuration = (depTime: string, arrTime: string): string => {
    // Assuming times are in "HH:MM:SS" format and for the same day for simplicity
    // For multi-day flights, a more robust calculation involving dates would be needed
    try {
      // Create dummy dates to calculate difference
      const dep = new Date(`2000-01-01T${depTime}`);
      const arr = new Date(`2000-01-01T${arrTime}`);
      
      let diffMinutes = differenceInMinutes(arr, dep);
      if (diffMinutes < 0) { // Handle overnight flights
        diffMinutes += 24 * 60;
      }
      
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch (e) {
      console.error("Error calculating duration:", e);
      return "N/A";
    }
  };

  const duration = (departureTime && arrivalTime) ? calculateDuration(departureTime, arrivalTime) : "N/A";

  const handleSelectFlight = () => {
    if (onSelect && onDeselect) {
      // Selection mode for round-trip booking - toggle
      if (isSelected) {
        onDeselect();
      } else {
        onSelect();
      }
    } else if (onSelect) {
      // Selection mode without deselect
      onSelect();
    } else if (flight.id_flight) {
      // Direct navigation mode for one-way booking
      router.push(`/flight/book?outboundFlightId=${flight.id_flight}&baseFlightPrice=${flight.base_price}&flightClass=${selectedClass}`);
    } else {
      console.error("Flight ID is missing, cannot book.");
    }
  };

  return (
    <Card className={cn("w-full transition-all hover:shadow-lg hover:-translate-y-1", className)}>
      <CardContent className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center">

        {/* Airline Info */}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 sm:gap-4">
          {/* If there were airline logos, they would go here. For now, just text. */}
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{flight.airline.name}</span>
            <span className="text-xs text-muted-foreground truncate">Flight {flight.route_code}</span>
          </div>
        </div>

        {/* Flight Timeline - Responsive */}
        <div className="sm:col-span-2 lg:col-span-6 flex items-center justify-center text-xs sm:text-sm">
          <div className="flex flex-col items-center text-center">
            <span className="font-bold text-base sm:text-lg">{departureTime?.substring(0, 5)}</span> {/* Display HH:MM */}
            <span className="text-muted-foreground text-xs truncate">{departureCode}</span>
          </div>
          <div className="flex-1 mx-2 sm:mx-4 flex flex-col items-center">
            <div className="w-full h-px bg-border relative md:mb-5 mb-3">
              <Plane className="w-8 h-8 sm:w-12 sm:h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-card px-1 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground mt-1">{duration}</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="font-bold text-base sm:text-lg">{arrivalTime?.substring(0, 5)}</span> {/* Display HH:MM */}
            <span className="text-muted-foreground text-xs truncate">{arrivalCode}</span>
          </div>
        </div>

        {/* Price and CTA - Responsive */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-end justify-center gap-2 text-right">
          <div className="flex flex-col items-end">
            <span className="font-bold text-lg sm:text-xl">${flight.base_price}</span>
            <span className="text-xs text-muted-foreground">per person</span>
          </div>
          {/* isBestValue is not available from backend */}
          <Button className="w-full sm:w-auto mt-2" onClick={handleSelectFlight} size="sm">
            {isSelected ? 'Selected ✓' : (onSelect ? 'Select Flight' : 'Book Flight')}
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
