'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { IconArrowLeft, IconPlane } from '@tabler/icons-react';
import { toast } from 'sonner';
import { MainNavBar } from '@/components/MainNavBar';

interface SeatBlock {
  id_cabin: number;
  id_class: number;
  occupied_seats: number;
  seats: Array<{
    id_cell: number;
    x: number;
    y: number;
    occupied: boolean;
  }>;
}

interface PassengerInfo {
  name: string;
  lastname: string;
  email: string;
  sex: 'M' | 'F';
  date_birth: string;
  phone_number: string;
  passport_number: string;
  id_seat_outbound: number | null;
  id_seat_return: number | null;
}

export default function FlightBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outboundFlightId = searchParams.get('outboundFlightId');
  const returnFlightId = searchParams.get('returnFlightId');

  const [outboundSeatBlocks, setOutboundSeatBlocks] = useState<SeatBlock[]>([]);
  const [returnSeatBlocks, setReturnSeatBlocks] = useState<SeatBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeatForModal, setSelectedSeatForModal] = useState<{ seatId: number; type: 'outbound' | 'return' } | null>(null);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    {
      name: '',
      lastname: '',
      email: '',
      sex: 'M',
      date_birth: '',
      phone_number: '',
      passport_number: '',
      id_seat_outbound: null,
      id_seat_return: null,
    },
  ]);
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
    const fetchSeats = async () => {
      setLoading(true);
      try {
        if (outboundFlightId) {
          const outboundData = await api.get<SeatBlock[]>(`/flight/${outboundFlightId}/seat-availability`);
          setOutboundSeatBlocks(outboundData);
        }
        if (returnFlightId) {
          const returnData = await api.get<SeatBlock[]>(`/flight/${returnFlightId}/seat-availability`);
          setReturnSeatBlocks(returnData);
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch seats:', err);
        toast.error('Failed to load seat information');
        setLoading(false);
      }
    };

    fetchSeats();
  }, [outboundFlightId, returnFlightId]);

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: '',
        lastname: '',
        email: '',
        sex: 'M',
        date_birth: '',
        phone_number: '',
        passport_number: '',
        id_seat_outbound: null,
        id_seat_return: null,
      },
    ]);
  };

  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string | number | null) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const assignSeatToPassenger = (seatId: number, passengerIndex: number, type: 'outbound' | 'return') => {
    const seatField = type === 'outbound' ? 'id_seat_outbound' : 'id_seat_return';
    
    const updated = passengers.map((p) => ({
      ...p,
      [seatField]: p[seatField] === seatId ? null : p[seatField],
    }));
    
    updated[passengerIndex] = { ...updated[passengerIndex], [seatField]: seatId };
    setPassengers(updated);
    setSelectedSeatForModal(null);
    toast.success(`Seat assigned to Passenger ${passengerIndex + 1} for ${type} flight.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    
    if (!token) {
      toast.error('You must be logged in to book a flight');
      return;
    }

    let id_buyer: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      id_buyer = payload.sub || payload.id;
    } catch (err) {
      console.error('Token parse error:', err);
      toast.error('Invalid user token');
      return;
    }
    
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.lastname || !p.email || !p.date_birth || !p.phone_number || !p.passport_number || !p.id_seat_outbound || (returnFlightId && !p.id_seat_return)) {
        toast.error(`Please complete all information and select seats for passenger ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const tickets = passengers.flatMap(p => {
        const outboundTicket = {
          passenger_info: { ...p },
          ticket_info: {
            id_flight: parseInt(outboundFlightId!),
            id_seat: p.id_seat_outbound!,
            additional_baggage: [],
          },
        };
        if (returnFlightId && p.id_seat_return) {
          const returnTicket = {
            passenger_info: { ...p },
            ticket_info: {
              id_flight: parseInt(returnFlightId),
              id_seat: p.id_seat_return,
              additional_baggage: [],
            },
          };
          return [outboundTicket, returnTicket];
        }
        return [outboundTicket];
      });

      const bookingData = {
        id_buyer,
        tickets,
      };

      await api.post('/flight/book', bookingData);
      
      toast.success('Booking successful!');
      router.push('/profile');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error((error as Error).message || 'Failed to complete booking');
      setSubmitting(false);
    }
  };

  const renderSeatSelection = (flightType: 'outbound' | 'return', seatBlocks: SeatBlock[]) => (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Select Seats ({flightType === 'outbound' ? 'Outbound' : 'Return'})</CardTitle>
        <CardDescription>
          Click on a seat to assign it to a passenger. Gray seats are occupied, blue are selected, white are available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {seatBlocks.map((block) => (
          <div key={block.id_cabin} className="border p-6 rounded-lg bg-gray-50 mb-4">
             <div className="overflow-x-auto inline-block border-2 border-gray-800 rounded-lg p-6 bg-white">
                {Array.from({ length: Math.max(...block.seats.map(s => s.y)) + 1 }, (_, rowIdx) => (
                  <div key={rowIdx} className="flex gap-4 mb-3 items-center justify-center">
                    <div className="flex gap-2">
                      {block.seats.filter(s => s.y === rowIdx).map((seat) => {
                        const seatField = flightType === 'outbound' ? 'id_seat_outbound' : 'id_seat_return';
                        const assignedPassenger = passengers.find(p => p[seatField] === seat.id_cell);
                        const isSelected = !!assignedPassenger;
                        
                        return (
                          <button
                            key={seat.id_cell}
                            type="button"
                            disabled={seat.occupied}
                            onClick={() => {
                              if (seat.occupied) return;
                              if (assignedPassenger) {
                                const passengerIndex = passengers.indexOf(assignedPassenger);
                                updatePassenger(passengerIndex, seatField, null);
                              } else {
                                setSelectedSeatForModal({ seatId: seat.id_cell, type: flightType });
                              }
                            }}
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded font-semibold text-sm transition-all ${
                              seat.occupied ? 'bg-gray-400 cursor-not-allowed' : isSelected ? 'bg-blue-600 text-white' : 'bg-white border-2 hover:border-blue-500'
                            }`}
                          >
                            {isSelected ? passengers.indexOf(assignedPassenger) + 1 : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <Button variant="outline" className="fixed left-4 top-4 z-50" onClick={() => router.back()}><IconArrowLeft /></Button>
      <MainNavBar companyuser={companyuser} />
      
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Book Your Flights</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {outboundSeatBlocks.length > 0 && renderSeatSelection('outbound', outboundSeatBlocks)}
            {returnSeatBlocks.length > 0 && renderSeatSelection('return', returnSeatBlocks)}
            
            <Card className="lg:col-span-3 mt-8">
              <CardHeader><CardTitle>Passenger Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border p-4 rounded space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Passenger {index + 1}</h3>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removePassenger(index)}>Remove</Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input placeholder="First Name" value={passenger.name} onChange={(e) => updatePassenger(index, 'name', e.target.value)} />
                      <Input placeholder="Last Name" value={passenger.lastname} onChange={(e) => updatePassenger(index, 'lastname', e.target.value)} />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addPassenger}>+ Add Passenger</Button>
              </CardContent>
            </Card>
          </div>
          
          <Button type="submit" className="w-full mt-8" size="lg" disabled={submitting}>
            {submitting ? 'Processing...' : 'Complete Booking'}
          </Button>
        </form>

        {selectedSeatForModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader><CardTitle>Select Passenger</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {passengers.map((p, index) => (
                  <Button key={index} variant="outline" className="w-full" onClick={() => assignSeatToPassenger(selectedSeatForModal.seatId, index, selectedSeatForModal.type)}>
                    Passenger {index + 1} ({p.name} {p.lastname})
                  </Button>
                ))}
                <Button variant="outline" className="w-full" onClick={() => setSelectedSeatForModal(null)}>Cancel</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}