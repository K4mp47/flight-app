'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  id_seat: number | null;
}

export default function FlightBookingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const flightId = params.id as string;

  const [seatBlocks, setSeatBlocks] = useState<SeatBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSeatForModal, setSelectedSeatForModal] = useState<number | null>(null);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    {
      name: '',
      lastname: '',
      email: '',
      sex: 'M',
      date_birth: '',
      phone_number: '',
      passport_number: '',
      id_seat: null,
    },
  ]);
  const [companyuser, setCompanyuser] = useState(false);

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const departureDate = searchParams.get('departure_date') || '';
  const flightClass = searchParams.get('class') || 'Economy';

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
        // Use the public seat-availability endpoint
        const data = await api.get<SeatBlock[]>(`/flight/${flightId}/seat-availability`);
        console.log('Seat data received:', data);
        setSeatBlocks(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch seats:', err);
        toast.error('Failed to load seat information');
        setLoading(false);
      }
    };

    if (flightId) {
      fetchSeats();
    }
  }, [flightId]);

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
        id_seat: null,
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

  const assignSeatToPassenger = (seatId: number, passengerIndex: number) => {
    // Remove seat from any other passenger who might have it
    const updated = passengers.map((p) => ({
      ...p,
      id_seat: p.id_seat === seatId ? null : p.id_seat,
    }));
    // Assign to selected passenger
    updated[passengerIndex] = { ...updated[passengerIndex], id_seat: seatId };
    setPassengers(updated);
    setSelectedSeatForModal(null);
    toast.success(`Seat assigned to Passenger ${passengerIndex + 1}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get user ID from token
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
    
    // Validate all passengers have required info and seats
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.lastname || !p.email || !p.date_birth || !p.phone_number || !p.passport_number || !p.id_seat) {
        toast.error(`Please complete all information for passenger ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const bookingData = {
        id_buyer,
        tickets: passengers.map(p => ({
          passenger_info: {
            name: p.name,
            lastname: p.lastname,
            email: p.email,
            sex: p.sex,
            date_birth: p.date_birth,
            phone_number: p.phone_number,
            passport_number: p.passport_number,
          },
          ticket_info: {
            id_flight: parseInt(flightId),
            id_seat: p.id_seat!,
            additional_baggage: [],
          },
        })),
      };

      console.log('Booking data:', bookingData);
      
      await api.post('/flight/book', bookingData);
      
      toast.success('Booking successful!');
      router.push('/profile');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error((error as Error).message || 'Failed to complete booking');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <MainNavBar companyuser={companyuser} />
        <div className="container mx-auto p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Button
        variant="outline"
        className="fixed left-4 top-4 z-50"
        onClick={() => router.back()}
      >
        <IconArrowLeft />
      </Button>
      <MainNavBar companyuser={companyuser} />
      
      <div className="container mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Book Your Flight</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconPlane className="w-5 h-5" />
            <span>
              {origin} → {destination} | {new Date(departureDate).toLocaleDateString()} | {flightClass}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-1 gap-8">
            {/* Seat Selection */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Seats</CardTitle>
                <CardDescription>
                  Click on a seat to assign it to a passenger. Gray seats are occupied, blue are selected, white are available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Legend */}
                  <div className="flex gap-6 justify-center flex-wrap text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-600 rounded text-white flex items-center justify-center text-xs">1</div>
                      <span>Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-400 rounded opacity-50 cursor-not-allowed"></div>
                      <span>Occupied</span>
                    </div>
                  </div>

                  {/* Seat Grid */}
                  {seatBlocks.map((block) => (
                    <div key={block.id_cabin} className="border p-6 rounded-lg bg-gray-50">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg">
                          Class {block.id_class} - Cabin {block.id_cabin}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Occupied: {block.occupied_seats} / {block.seats.length}
                        </p>
                      </div>

                      {/* Airplane cabin visualization */}
                      <div className="inline-block border-2 border-gray-800 rounded-lg p-6 bg-white">
                        {/* Group seats by row (y coordinate) */}
                        {Array.from(
                          { length: Math.max(...block.seats.map(s => s.y)) + 1 },
                          (_, rowIdx) => rowIdx
                        ).map((rowIdx) => {
                          const seatsInRow = block.seats
                            .filter(seat => seat.y === rowIdx)
                            .sort((a, b) => a.x - b.x);
                          
                          if (seatsInRow.length === 0) return null;

                          return (
                            <div key={rowIdx} className="flex gap-4 mb-3 items-center justify-center">
                              {/* Row number */}
                              <div className="w-8 text-right font-semibold text-gray-600">
                                {rowIdx + 1}
                              </div>

                              {/* Seats */}
                              <div className="flex gap-2">
                                {seatsInRow.map((seat) => {
                                  const assignedPassenger = passengers.find(p => p.id_seat === seat.id_cell);
                                  const isSelected = !!assignedPassenger;
                                  const passengerNumber = isSelected ? passengers.indexOf(assignedPassenger) + 1 : null;

                                  return (
                                    <button
                                      key={seat.id_cell}
                                      type="button"
                                      disabled={seat.occupied}
                                      onClick={() => {
                                        if (seat.occupied) return;
                                        
                                        // If seat is already selected, deselect it
                                        if (assignedPassenger) {
                                          const passengerIndex = passengers.indexOf(assignedPassenger);
                                          updatePassenger(passengerIndex, 'id_seat', null);
                                          toast.success(`Seat removed from Passenger ${passengerIndex + 1}`);
                                        } else {
                                          // Show modal to choose which passenger
                                          const unassignedPassengers = passengers.filter(p => !p.id_seat);
                                          
                                          if (unassignedPassengers.length === 0) {
                                            toast.error('All passengers already have seats assigned');
                                            return;
                                          }
                                          
                                          if (unassignedPassengers.length === 1) {
                                            // Auto-assign if only one unassigned passenger
                                            const passengerIndex = passengers.indexOf(unassignedPassengers[0]);
                                            assignSeatToPassenger(seat.id_cell, passengerIndex);
                                          } else {
                                            // Store seat and show selector
                                            setSelectedSeatForModal(seat.id_cell);
                                          }
                                        }
                                      }}
                                      className={`w-10 h-10 rounded font-semibold text-sm transition-all relative flex items-center justify-center ${
                                        seat.occupied
                                          ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                          : isSelected
                                          ? 'bg-blue-600 text-white shadow-lg'
                                          : 'bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                                      }`}
                                      title={`Seat ${seat.x + 1},${seat.y + 1}`}
                                    >
                                      {isSelected ? (
                                        <span>{passengerNumber}</span>
                                      ) : seat.occupied ? (
                                        <span className="text-gray-600">✕</span>
                                      ) : (
                                        <span className="text-gray-400 text-xs">
                                          {String.fromCharCode(65 + seat.x)}{seat.y + 1}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Right row number */}
                              <div className="w-8 font-semibold text-gray-600">
                                {rowIdx + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Passenger Information */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Passenger Information</CardTitle>
                <CardDescription>
                  Enter details for each passenger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border p-4 rounded space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Passenger {index + 1}</h3>
                      {passengers.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removePassenger(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          required
                          value={passenger.name}
                          onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          required
                          value={passenger.lastname}
                          onChange={(e) => updatePassenger(index, 'lastname', e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        required
                        value={passenger.email}
                        onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Phone Number *</Label>
                        <Input
                          type="tel"
                          required
                          placeholder="+1234567890"
                          value={passenger.phone_number}
                          onChange={(e) => updatePassenger(index, 'phone_number', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Passport Number *</Label>
                        <Input
                          required
                          placeholder="AB123456"
                          value={passenger.passport_number}
                          onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Sex *</Label>
                        <select
                          className="w-full p-2 border rounded"
                          value={passenger.sex}
                          onChange={(e) => updatePassenger(index, 'sex', e.target.value)}
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                      </div>
                      <div>
                        <Label>Date of Birth *</Label>
                        <Input
                          type="date"
                          required
                          value={passenger.date_birth}
                          onChange={(e) => updatePassenger(index, 'date_birth', e.target.value)}
                        />
                      </div>
                    </div>

                    {passenger.id_seat && (
                      <div className="text-sm text-green-600 font-semibold">
                        ✓ Seat selected: {passenger.id_seat}
                      </div>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addPassenger}
                >
                  + Add Another Passenger
                </Button>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || passengers.some(p => !p.id_seat)}
                >
                  {submitting ? 'Processing...' : 'Complete Booking'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        {/* Passenger Selector Modal */}
        {selectedSeatForModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Select Passenger</CardTitle>
                <CardDescription>
                  Choose which passenger will take seat {selectedSeatForModal}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {passengers
                  .map((passenger, index) => ({
                    passenger,
                    index,
                  }))
                  .filter(({ passenger }) => !passenger.id_seat)
                  .map(({ passenger, index }) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start"
                      onClick={() => assignSeatToPassenger(selectedSeatForModal, index)}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">
                          Passenger {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {passenger.name} {passenger.lastname}
                        </span>
                      </div>
                    </Button>
                  ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedSeatForModal(null)}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
