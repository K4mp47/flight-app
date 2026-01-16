"use client";
import { useState } from 'react';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlightSearchForm, FlightCard } from '@/components/flight';
import { Skeleton } from '@/components/ui/skeleton';
import { MainNavBar } from '@/components/layout';
import { WorldMap } from '@/components/ui/world-map';
import { airportData } from '@/lib/airport-data';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface FlightSearchResult {
    airline: {
        iata_code: string;
        name: string;
    };
    id_flight: number;
    base_price: number;
    route_code: string;
    scheduled_arrival_day: string;
    scheduled_departure_day: string;
    sections: Array<{
        arrival_time: string;
        departure_time: string;
        section: {
            code_arrival_airport: string;
            code_departure_airport: string;
        };
    }>;
}

interface FlightSearchResponse {
    outbound_flights: FlightSearchResult[];
    return_flights?: FlightSearchResult[];
}

export default function SearchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [outboundFlights, setOutboundFlights] = useState<FlightSearchResult[]>([]);
    const [returnFlights, setReturnFlights] = useState<FlightSearchResult[]>([]);
    const [companyuser, setCompanyuser] = useState(false);
    const [selectedFlightClass, setSelectedFlightClass] = useState<number>(4);
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [selectedOutbound, setSelectedOutbound] = useState<number | null>(null);
    const [selectedReturn, setSelectedReturn] = useState<number | null>(null);
    const [adults, setAdults] = useState<number>(1);
    const [children, setChildren] = useState<number>(0);
    const [searchPerformed, setSearchPerformed] = useState(false);

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


    const handleSearch = async (params: {
        origin: string;
        destination: string;
        departureDate: Date | undefined;
        returnDate: Date | undefined;
        adults: number;
        children: number;
        tripType: 'one-way' | 'round-trip';
        flightClass: number; // Added
        directFlights: boolean; // Added
    }) => {
        setSearchPerformed(true);
        setLoading(true);
        setOutboundFlights([]);
        setReturnFlights([]);
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setSelectedFlightClass(params.flightClass); // Store selected class
        setIsRoundTrip(params.tripType === 'round-trip');
        setAdults(params.adults);
        setChildren(params.children);
        try {
            const payload = {
                departure_airport: params.origin,
                arrival_airport: params.destination,
                round_trip_flight: params.tripType === 'round-trip',
                direct_flights: params.directFlights,
                departure_date_outbound: params.departureDate ? format(params.departureDate, 'yyyy-MM-dd') : null,
                departure_date_return: params.returnDate ? format(params.returnDate, 'yyyy-MM-dd') : null,
                id_class: params.flightClass,
            };
            console.log('Search payload:', payload);

            const response = await api.post<FlightSearchResponse>('/flight/search', payload);
            
            if (response.outbound_flights) {
                setOutboundFlights(response.outbound_flights);
            }
            if (response.return_flights && params.tripType === 'round-trip') {
                setReturnFlights(response.return_flights);
            }

        } catch (error) {
            console.error('Flight search error:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-background">
            <MainNavBar companyuser={companyuser} />
            
            {/* Hero Section */}
            <div className="relative h-75 sm:h-87.5 md:h-100 lg:h-112.5 flex items-center justify-center shadow-2xl">
                <Image
                    src="/banner.svg"
                    alt="Scenic landscape"
                    layout="fill"
                    objectFit="cover"
                    className="z-0"
                />
                <div className="absolute inset-0 bg-black/50 z-0" /> {/* Darker overlay */}
                {/* Shadow gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-black/60 to-transparent z-1" />
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-3 sm:px-4">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-lg">Find Your Next Adventure</h1>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-4 sm:mb-8">Book flights to anywhere in the world.</p>
                </div>
                {/* Search Form positioned slightly overlapping the hero */}
                <div className="absolute bottom-0 translate-y-3/4 w-full px-3 sm:px-4 z-20 flex justify-center">
                    <div className="w-full max-w-6xl">
                        <FlightSearchForm onSearch={handleSearch} />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="w-full pt-32 sm:pt-36 md:pt-40 pb-8 sm:pb-12 px-3 sm:px-4 md:px-6 lg:px-8 bg-background">
                <div className="max-w-7xl mx-auto md:mt-8 mt-40">
                
                {/* Outbound Flights */}
                {(searchPerformed || loading) && (
                    <div className="mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">{isRoundTrip ? 'Outbound Flights' : 'Available Flights'}</h2>
                        <div className="space-y-3 sm:space-y-4">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                   <Card key={i} className="p-3 sm:p-4">
                                       <div className="flex items-center space-x-3 sm:space-x-4">
                                           <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
                                           <div className="space-y-2 flex-1 min-w-0">
                                               <Skeleton className="h-4 w-3/4" />
                                               <Skeleton className="h-3 w-1/2" />
                                           </div>
                                           <Skeleton className="h-9 w-20 sm:h-10 sm:w-24 shrink-0" />
                                       </div>
                                   </Card>
                                ))
                            ) : searchPerformed && outboundFlights.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No flights found for your search criteria.</p>
                                    <p>Please try adjusting your filters or search again.</p>
                                </div>
                            ) : (
                                outboundFlights.map((flight, idx) => (
                                    <div 
                                        key={idx}
                                    >
                                        <FlightCard 
                                            flight={flight} 
                                            selectedClass={selectedFlightClass}
                                            onSelect={() => setSelectedOutbound(flight.id_flight)}
                                            onDeselect={() => setSelectedOutbound(null)}
                                            isSelected={selectedOutbound === flight.id_flight}
                                            className={selectedOutbound === flight.id_flight ? 'ring-2 ring-primary rounded-lg' : ''}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Return Flights */}
                {isRoundTrip && searchPerformed && (
                    <div className="mb-8 sm:mb-12">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Return Flights</h2>
                        <div className="space-y-3 sm:space-y-4">
                            {returnFlights.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <p>No return flights found for your selected outbound flight.</p>
                                    <p>Please try adjusting your filters or search again.</p>
                                </div>
                            ) : (
                                returnFlights.map((flight, idx) => (
                                    <div 
                                        key={idx}
                                    >
                                        <FlightCard 
                                            flight={flight} 
                                            selectedClass={selectedFlightClass}
                                            onSelect={() => setSelectedReturn(flight.id_flight)}
                                            onDeselect={() => setSelectedReturn(null)}
                                            isSelected={selectedReturn === flight.id_flight}
                                            className={selectedReturn === flight.id_flight ? 'ring-2 ring-primary rounded-lg' : ''}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* World Map Section */}
                {!searchPerformed && (
                    <div className="mb-8 sm:mb-12 hidden md:block">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                                Global Connectivity
                            </h2>
                            <p className="text-muted-foreground text-sm sm:text-base">
                                Discover our network of {airportData.length} airports worldwide
                            </p>
                        </div>
                        <WorldMap 
                            dots={[
                                // Popular flight routes
                                {
                                    start: { lat: 45.5051, lng: 12.3388 }, // Venice
                                    end: { lat: 41.8003, lng: 12.2389 }, // Rome
                                },
                                {
                                    start: { lat: 40.6413, lng: -73.7781 }, // New York JFK
                                    end: { lat: 51.4700, lng: -0.4543 }, // London Heathrow
                                },
                                {
                                    start: { lat: 35.5494, lng: 139.7798 }, // Tokyo
                                    end: { lat: 1.3644, lng: 103.9915 }, // Singapore
                                },
                                {
                                    start: { lat: 25.2532, lng: 55.3657 }, // Dubai
                                    end: { lat: -33.9399, lng: 18.6017 }, // Cape Town
                                },
                                {
                                    start: { lat: 48.3538, lng: 14.1875 }, // Linz
                                    end: { lat: 37.4693, lng: 15.0664 }, // Catania
                                },
                            ]}
                            points={airportData.map(airport => ({
                                lat: airport.lat,
                                lng: airport.lng,
                                label: airport.name
                            }))}
                            lineColor="#D0D0D0"
                            dotColor="#D0D0D0"
                        />
                    </div>
                )}

                {/* Book Button */}
                {((selectedOutbound && !isRoundTrip) || (selectedOutbound && selectedReturn && isRoundTrip)) && (
                    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
                        <Button 
                            size="lg"
                            className="shadow-lg w-full sm:w-auto"
                            onClick={() => {
                                const url = isRoundTrip
                                    ? `/flight/book?outboundFlightId=${selectedOutbound}&returnFlightId=${selectedReturn}&baseFlightPrice=${outboundFlights.find(f => f.id_flight === selectedOutbound)?.base_price || 0}&flightClass=${selectedFlightClass}&adults=${adults}&children=${children}`
                                    : `/flight/book?outboundFlightId=${selectedOutbound}&baseFlightPrice=${outboundFlights.find(f => f.id_flight === selectedOutbound)?.base_price || 0}&flightClass=${selectedFlightClass}&adults=${adults}&children=${children}`;
                                router.push(url);
                            }}
                        >
                            Continue to Booking
                        </Button>
                    </div>
                )}
                </div>
            </main>
        </div>
    );
}
