"use client";
import { useState } from 'react';
import Image from 'next/image';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlightSearchForm, FlightCard } from '@/components/flight';
import { Skeleton } from '@/components/ui/skeleton';
import { MainNavBar } from '@/components/layout';
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
        setLoading(true);
        setOutboundFlights([]);
        setReturnFlights([]);
        setSelectedOutbound(null);
        setSelectedReturn(null);
        setSelectedFlightClass(params.flightClass); // Store selected class
        setIsRoundTrip(params.tripType === 'round-trip');
        try {
            const payload = {
                departure_airport: params.origin,
                arrival_airport: params.destination,
                round_trip_flight: params.tripType === 'round-trip',
                direct_flights: params.directFlights,
                departure_date_outbound: params.departureDate ? format(params.departureDate, 'yyyy-MM-dd') : undefined,
                departure_date_return: params.returnDate ? format(params.returnDate, 'yyyy-MM-dd') : undefined,
                id_class: params.flightClass,
            };

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
            <div className="relative h-[400px] md:h-[450px] flex items-center justify-center">
                <Image
                    src="/banner.svg"
                    alt="Scenic landscape"
                    layout="fill"
                    objectFit="cover"
                    className="z-0"
                />
                <div className="absolute inset-0 bg-black/50 z-0" /> {/* Darker overlay */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Find Your Next Adventure</h1>
                    <p className="text-lg md:text-xl text-gray-200 mb-8">Book flights to anywhere in the world.</p>
                </div>
                {/* Search Form positioned slightly overlapping the hero */}
                <div className="absolute bottom-0 translate-y-3/4 w-full max-w-6xl z-20">
                    <FlightSearchForm onSearch={handleSearch} />
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8 bg-background"> {/* Adjusted padding-top */}
                
                {/* Outbound Flights */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-6">{isRoundTrip ? 'Outbound Flights' : 'Available Flights'}</h2>
                    <div className="space-y-4">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                               <Card key={i} className="p-4">
                                   <div className="flex items-center space-x-4">
                                       <Skeleton className="h-12 w-12 rounded-full" />
                                       <div className="space-y-2 flex-1">
                                           <Skeleton className="h-4 w-3/4" />
                                           <Skeleton className="h-4 w-1/2" />
                                       </div>
                                       <Skeleton className="h-10 w-24" />
                                   </div>
                               </Card>
                            ))
                        ) : (
                            outboundFlights.map((flight, idx) => (
                                <div 
                                    key={idx}
                                    className={selectedOutbound === flight.id_flight ? 'ring-2 ring-primary rounded-lg' : ''}
                                >
                                    <FlightCard 
                                        flight={flight} 
                                        selectedClass={selectedFlightClass}
                                        onSelect={() => setSelectedOutbound(flight.id_flight)}
                                        isSelected={selectedOutbound === flight.id_flight}
                                    />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Return Flights */}
                {isRoundTrip && returnFlights.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-6">Return Flights</h2>
                        <div className="space-y-4">
                            {returnFlights.map((flight, idx) => (
                                <div 
                                    key={idx}
                                    className={selectedReturn === flight.id_flight ? 'ring-2 ring-primary rounded-lg' : ''}
                                >
                                    <FlightCard 
                                        flight={flight} 
                                        selectedClass={selectedFlightClass}
                                        onSelect={() => setSelectedReturn(flight.id_flight)}
                                        isSelected={selectedReturn === flight.id_flight}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Book Button */}
                {((selectedOutbound && !isRoundTrip) || (selectedOutbound && selectedReturn && isRoundTrip)) && (
                    <div className="fixed bottom-8 right-8 z-50">
                        <Button 
                            size="lg"
                            className="shadow-lg"
                            onClick={() => {
                                const url = isRoundTrip
                                    ? `/flight/book?outboundFlightId=${selectedOutbound}&returnFlightId=${selectedReturn}&baseFlightPrice=${outboundFlights.find(f => f.id_flight === selectedOutbound)?.base_price || 0}&flightClass=${selectedFlightClass}`
                                    : `/flight/book?outboundFlightId=${selectedOutbound}&baseFlightPrice=${outboundFlights.find(f => f.id_flight === selectedOutbound)?.base_price || 0}&flightClass=${selectedFlightClass}`;
                                router.push(url);
                            }}
                        >
                            Continue to Booking
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
