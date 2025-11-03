'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
// import BookingForm from '@/components/BookingForm';


interface Flight {
  id: string;
  company_id: string;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  base_price: string;
  total_seats: number;
  available_seats: number;
  class_config: { [key: string]: { seats_available: number; price_multiplier: number } };
}

export default function FlightDetailsPage() {
  const params = useParams();
  const flightId = params.id as string;
  const [flight, setFlight] = useState<Flight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlightDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Flight>(`/flight/${flightId}/seats-occupied`);
      setFlight(data);
      setLoading(false);
    } catch (error: Error | unknown) {
      toast.error((error as Error).message + ": " +(error as Error).name || 'Failed to fetch flight details');
    } 
  };

  useEffect(() => {
    if (flightId) {
      fetchFlightDetails();

      // Setup Realtime subscription
      // const channel = supabase
      //   .channel(`flight-${flightId}`)
      //   .on(
      //     'postgres_changes',
      //     {
      //       event: 'UPDATE',
      //       schema: 'public',
      //       table: 'flights',
      //       filter: `id=eq.${flightId}`
      //     },
      //     (payload: any) => {
      //       console.log('Realtime update received:', payload);
      //       setFlight((prevFlight) => {
      //         if (prevFlight && payload.new) {
      //           return {
      //             ...prevFlight,
      //             available_seats: payload.new.available_seats,
      //           };
      //         }
      //         return prevFlight;
      //       });
      //     }
      //   )
      //   .subscribe();

      // return () => {
      //   supabase.removeChannel(channel);
      // };
    }
  }, [flightId]); // Dipendenza da flightId per la sottoscrizione e fetch iniziale

  if (loading) {
    return (
      <Card className="p-6 m-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <Skeleton className="h-10 w-full mt-8" />
      </Card>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!flight) {
    return <p className="text-center text-muted-foreground">Flight not found.</p>;
  }

  const departureDate = new Date(flight.departure_time);
  const arrivalDate = new Date(flight.arrival_time);

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{flight.origin} &rarr; {flight.destination}</CardTitle>
          <CardDescription className="text-lg">Flight No: {flight.flight_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Departure:</p>
            <p>{format(departureDate, 'MMM dd, yyyy HH:mm')} ({flight.origin})</p>
          </div>
          <div>
            <p className="font-semibold">Arrival:</p>
            <p>{format(arrivalDate, 'MMM dd, yyyy HH:mm')} ({flight.destination})</p>
          </div>
          <div>
            <p className="font-semibold">Duration:</p>
            <p>{flight.duration}</p>
          </div>
          <div>
            <p className="font-semibold">Base Price:</p>
            <p className="text-2xl font-bold text-blue-600">${flight.base_price}</p>
          </div>
          <div>
            <p className="font-semibold">Available Seats:</p>
            <p className={`text-xl font-bold ${flight.available_seats <= 5 ? 'text-red-500' : 'text-green-600'}`}>
              {flight.available_seats} / {flight.total_seats}
            </p>
          </div>
          <div>
            <p className="font-semibold">Class Configuration:</p>
            {flight.class_config ? (
              <ul>
                {Object.entries(flight.class_config).map(([className, config]) => (
                  <li key={className}>
                    {className.charAt(0).toUpperCase() + className.slice(1)}: 
                    {config.seats_available} seats, 
                    Price multiplier: {config.price_multiplier}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No specific class configuration available.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Book Your Flight</CardTitle>
          <CardDescription>Select your class and proceed with booking.</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingForm flight={flight} onBookingSuccess={fetchFlightDetails} />
        </CardContent>
      </Card>
    </div>
  );
}