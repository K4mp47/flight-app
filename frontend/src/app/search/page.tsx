'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
// import FlightCard from '@/components/FlightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MainNavBar } from '@/components/MainNavBar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface FlightSection {
  id_airline_routes: number;
  next_id: number | null;
  arrival_time: string;
  departure_time: string;
  section: {
    code_arrival_airport: string;
    code_departure_airport: string;
    id_routes_section: number;
  };
}

interface Flight {
  id_flight: number;
  airline: {
    iata_code: string;
    name: string;
  };
  price: number | null;
  route_code: string;
  scheduled_arrival_day: string;
  scheduled_departure_day: string;
  sections: FlightSection[];
}

interface FlightSearchResponse {
  outbound_flights: Flight[];
  return_flights?: Flight[];
}

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [outboundFlights, setOutboundFlights] = useState<Flight[]>([]);
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('departure_time');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [companyuser, setCompanyuser] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCompanyuser(payload.role === 'Airline-Admin');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const origin = searchParams.get('origin') || '';
        const destination = searchParams.get('destination') || '';
        const departure_date = searchParams.get('departure_date') || '';
        const return_date = searchParams.get('return_date') || '';
        const flightClass = searchParams.get('class') || 'Economy';

        console.log('Search params:', { origin, destination, departure_date, return_date, flightClass });

        if (!origin || !destination || !departure_date) {
          toast.error('Missing required search parameters');
          setLoading(false);
          return;
        }

        const classMapping: Record<string, number> = {
          Economy: 1,
          Premium: 2,
          Business: 3,
          First: 4,
        };

        // Check if return_date exists and is a valid date string
        const hasReturnDate = Boolean(return_date && return_date.trim() !== '');

        const requestBody = {
          departure_airport: origin,
          arrival_airport: destination,
          departure_date_outbound: departure_date,
          departure_date_return: hasReturnDate ? return_date : null,
          round_trip_flight: hasReturnDate,
          direct_flights: false,
          id_class: classMapping[flightClass] || 1,
        };

        console.log('Searching flights with:', requestBody);

        const data = await api.post<FlightSearchResponse>('/flight/search', requestBody);
        
        console.log('Flight search response:', data);
        
        setOutboundFlights(data.outbound_flights || []);
        setReturnFlights(data.return_flights || []);
        setLoading(false);
      } catch (error: Error | unknown) {
        console.error('Flight search error:', error);
        setError((error as Error).message || 'Failed to fetch flights');
        toast.error((error as Error).message || 'Failed to fetch flights');
        setLoading(false);
      }
    };

    fetchFlights();
  }, [searchParams]);

  return (
    <div className="min-h-screen">
      <Button variant="outline" className="fixed left-4 top-4 z-50 hover:cursor-pointer" onClick={() => router.back()}><IconArrowLeft /></Button>
      <MainNavBar companyuser={companyuser} />
            <div className="relative">
              <Image
                src="/banner.svg"
                alt="Logo"
                width={1920}
                height={1080}
                className="w-full h-40 sm:h-60 md:h-80 object-cover"
              />
              <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
            </div>
      <h1 className="text-5 xl font-bold mb-6 w-full flex justify-center">Search Results</h1>

      <div className="flex items-center space-x-4 mb-6 justify-center">
        <div className="grid gap-2 dark:bg-gray-950 dark:shadow-gray-600">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sortBy" className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-950 '>
              <SelectItem value="departure_time">Departure Time</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1 dark:bg-gray-950 dark:shadow-gray-700">
          <Label htmlFor="sortOrder">Order</Label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger id="sortOrder" className="w-[180px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-950 '>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && outboundFlights.length === 0 && !error && (
        <p className="text-center text-muted-foreground">No flights found matching your criteria.</p>
      )}

      {!loading && outboundFlights.length > 0 && (
        <div className="space-y-8 px-4">
          <div>
            <h2 className="text-3xl font-bold mb-4">Outbound Flights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {outboundFlights.map((flight, idx) => (
                <div key={idx} className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{flight.airline.name}</h3>
                      <p className="text-sm text-muted-foreground">{flight.airline.iata_code}</p>
                    </div>
                    {flight.price && (
                      <p className="text-2xl font-bold">${flight.price.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Route:</strong> {flight.route_code}</p>
                    <p className="text-sm"><strong>Departure:</strong> {new Date(flight.scheduled_departure_day).toLocaleDateString()}</p>
                    <p className="text-sm"><strong>Arrival:</strong> {new Date(flight.scheduled_arrival_day).toLocaleDateString()}</p>
                    <p className="text-sm"><strong>Segments:</strong> {flight.sections.length}</p>
                  </div>
                  <div className="mt-4">
                    {flight.sections.map((section, sIdx) => (
                      <div key={sIdx} className="text-xs text-muted-foreground mb-1">
                        {section.section.code_departure_airport} → {section.section.code_arrival_airport}
                        <span className="ml-2">
                          {new Date(section.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                          {new Date(section.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => router.push(`/flight/book/${flight.id_flight}?type=outbound&origin=${searchParams.get('origin')}&destination=${searchParams.get('destination')}&departure_date=${flight.scheduled_departure_day}&class=${searchParams.get('class')}`)}
                  >
                    Select Flight
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {returnFlights.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-4">Return Flights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {returnFlights.map((flight, idx) => (
                  <div key={idx} className="p-6 border rounded-lg bg-card hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">{flight.airline.name}</h3>
                        <p className="text-sm text-muted-foreground">{flight.airline.iata_code}</p>
                      </div>
                      {flight.price && (
                        <p className="text-2xl font-bold">${flight.price.toFixed(2)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Route:</strong> {flight.route_code}</p>
                      <p className="text-sm"><strong>Departure:</strong> {new Date(flight.scheduled_departure_day).toLocaleDateString()}</p>
                      <p className="text-sm"><strong>Arrival:</strong> {new Date(flight.scheduled_arrival_day).toLocaleDateString()}</p>
                      <p className="text-sm"><strong>Segments:</strong> {flight.sections.length}</p>
                    </div>
                    <div className="mt-4">
                      {flight.sections.map((section, sIdx) => (
                        <div key={sIdx} className="text-xs text-muted-foreground mb-1">
                          {section.section.code_departure_airport} → {section.section.code_arrival_airport}
                          <span className="ml-2">
                            {new Date(section.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(section.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={() => router.push(`/flight/book/${flight.id_flight}?type=return&origin=${searchParams.get('destination')}&destination=${searchParams.get('origin')}&departure_date=${flight.scheduled_departure_day}&class=${searchParams.get('class')}`)}
                    >
                      Select Flight
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}