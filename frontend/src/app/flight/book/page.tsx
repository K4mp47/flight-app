'use client';
import { BookingSummarySidebar } from '@/components/booking';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconArrowLeft, IconChevronDown, IconChevronUp, IconPlaneInflight, IconCheck } from '@tabler/icons-react';
import { Label } from '@/components/ui/label';
import { MainNavBar } from '@/components/layout';
import { toast } from 'sonner';

export interface PassengerInfo {
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

export interface SeatBlock {
  id_cabin: number;
  id_class: number;
  seats: {
    id_cell: number;
    x: number;
    y: number;
    occupied: boolean;
  }[];
}

// Clean Seat Icon Component
const SeatIcon = ({ status, size = 'md' }: { status: 'available' | 'occupied' | 'selected', size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const colors = {
    available: '#E5E7EB',
    occupied: '#6B7280', 
    selected: '#10B981'
  };

  return (
    <svg className={sizeClasses[size]} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V10Z"
        fill={colors[status]}
      />
      <path
        d="M7 8V6C7 5.44772 7.44772 5 8 5H16C16.5523 5 17 5.44772 17 6V8"
        stroke={colors[status]}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="6" y="18" width="12" height="2" rx="1" fill={colors[status]} opacity="0.6"/>
    </svg>
  );
};

// Modern Simplified Seat Grid
const SimplifiedSeatGrid = ({ 
  flightType, 
  seatBlocks, 
  passengers, 
  onSeatSelect,
  selectedPassengerIndex
}: { 
  flightType: 'outbound' | 'return', 
  seatBlocks: SeatBlock[], 
  passengers: PassengerInfo[],
  onSeatSelect: (seatId: number) => void,
  selectedPassengerIndex: number
}) => {
  const seatField = flightType === 'outbound' ? 'id_seat_outbound' : 'id_seat_return';
  const assignedSeats = passengers.map(p => p[seatField]).filter(Boolean);

  interface SeatWithClass {
    id_cell: number;
    x: number;
    y: number;
    occupied: boolean;
    classType: number;
  }

  const getSeatAtPosition = (x: number, y: number): SeatWithClass | null => {
    for (const block of seatBlocks) {
      const seat = block.seats.find(s => s.x === x && s.y === y);
      if (seat) return { ...seat, classType: block.id_class };
    }
    return null;
  };

  const getSeatStatus = (seat: SeatWithClass): 'available' | 'occupied' | 'selected' => {
    if (seat.occupied) return 'occupied';
    const currentPassengerSeat = passengers[selectedPassengerIndex]?.[seatField];
    if (seat.id_cell === currentPassengerSeat || assignedSeats.includes(seat.id_cell)) return 'selected';
    return 'available';
  };

  const getRowLabel = (y: number) => String.fromCharCode(65 + y);

  const getClassLabel = (classType: number) => {
    switch(classType) {
      case 1: return 'First Class';
      case 2: return 'Business Class';
      case 3: return 'Premium Economy';
      case 4: return 'Economy Class';
      default: return 'Economy Class';
    }
  };

  // Group seats by class
  const seatsByClass = seatBlocks.reduce((acc, block) => {
    if (!acc[block.id_class]) {
      acc[block.id_class] = [];
    }
    acc[block.id_class].push(...block.seats);
    return acc;
  }, {} as Record<number, SeatBlock['seats']>);

  return (
    <div className="bg-card rounded-lg!">
      <div className="px-6 py-4 bg-card rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-200">
            {flightType === 'outbound' ? 'Outbound Flight' : 'Return Flight'}
          </h3>
          <div className="text-sm text-primary">
            Passenger {selectedPassengerIndex + 1}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Legend */}
        <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-200/20">
          <div className="flex items-center gap-2">
            <SeatIcon status="available" size="sm" />
            <span className="text-sm text-gray-200">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <SeatIcon status="selected" size="sm" />
            <span className="text-sm text-gray-200">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <SeatIcon status="occupied" size="sm" />
            <span className="text-sm text-gray-200">Occupied</span>
          </div>
        </div>

        {/* Seat Grid by Class */}
        <div className="space-y-8">
          {Object.entries(seatsByClass).sort(([a], [b]) => Number(a) - Number(b)).map(([classType, classSeats]) => {
            // Get dimensions for this class
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            classSeats.forEach(seat => {
              minX = Math.min(minX, seat.x);
              maxX = Math.max(maxX, seat.x);
              minY = Math.min(minY, seat.y);
              maxY = Math.max(maxY, seat.y);
            });

            const classRows = maxY - minY + 1;
            const classCols = maxX - minX + 1;

            return (
              <div key={classType}>
                <h4 className="text-sm font-semibold text-gray-200 mb-4">{getClassLabel(Number(classType))}</h4>
                
                <div className="inline-block">
                  {/* Column numbers */}
                  <div className="flex mb-2 ml-10">
                    {Array.from({ length: classCols }, (_, i) => (
                      <div key={i} className="w-14 text-center text-xs font-medium text-gray-200">
                        {minX + i + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* Rows */}
                  {Array.from({ length: classRows }, (_, y) => {
                    const actualY = minY + y;
                    return (
                      <div key={actualY} className="flex items-center mb-3">
                        <div className="w-8 text-center text-xs font-medium text-gray-200">
                          {getRowLabel(actualY)}
                        </div>
                        {Array.from({ length: classCols }, (_, x) => {
                          const actualX = minX + x;
                          const seat = getSeatAtPosition(actualX, actualY);
                          
                          if (!seat) {
                            return <div key={x} className="w-14 h-14"></div>;
                          }
                          
                          const status = getSeatStatus(seat);
                          const isDisabled = status === 'occupied';
                          
                          return (
                            <button
                              key={x}
                              onClick={() => !isDisabled && onSeatSelect(seat.id_cell)}
                              disabled={isDisabled}
                              className={`
                                w-14 h-14 flex items-center justify-center
                                transition-all duration-150
                                ${!isDisabled && 'hover:scale-110 cursor-pointer'}
                                ${isDisabled && 'cursor-not-allowed opacity-60'}
                              `}
                              title={`${getRowLabel(actualY)}${actualX + 1}`}
                            >
                              <div className="relative">
                                <SeatIcon status={status} size="md" />
                                {status === 'selected' && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <IconCheck className="w-5 h-5 text-white mt-1" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Selected Seat Info */}
        {passengers[selectedPassengerIndex]?.[seatField] && (
          <div className="mt-6 pt-6 border-t border-gray-200/20">
            <div className="bg-background rounded-lg p-4">
              <p className="text-sm font-medium text-primary">
                Selected Seat: {(() => {
                  const seatId = passengers[selectedPassengerIndex]?.[seatField];
                  for (const block of seatBlocks) {
                    const seat = block.seats.find(s => s.id_cell === seatId);
                    if (seat) return `${getRowLabel(seat.y)}${seat.x + 1}`;
                  }
                  return '';
                })()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function FlightBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outboundFlightId = searchParams.get('outboundFlightId');
  const returnFlightId = searchParams.get('returnFlightId');
  const baseFlightPrice = Number(searchParams.get('baseFlightPrice'));
  const selectedFlightClass = Number(searchParams.get('flightClass') || '4');

  const [outboundSeatBlocks, setOutboundSeatBlocks] = useState<SeatBlock[]>([]);
  const [returnSeatBlocks, setReturnSeatBlocks] = useState<SeatBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPassengerIndex, setSelectedPassengerIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'seats' | 'info'>('seats');
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
  const [expandedPassengerIndex, setExpandedPassengerIndex] = useState<number | null>(0);

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
      if (!outboundFlightId) {
        toast.error('No flight selected');
        router.push('/search');
        return;
      }

      setLoading(true);
      try {
        const outboundData = await api.get<SeatBlock[]>(`/flight/${outboundFlightId}/seat-availability`);
        console.log('Selected flight class:', selectedFlightClass);
        console.log('Available seat blocks:', outboundData.map(b => ({ id_class: b.id_class, seats: b.seats.length })));
        // Filter to only show seats for the selected class
        const filteredOutbound = outboundData.filter(block => block.id_class === selectedFlightClass);
        console.log('Filtered blocks:', filteredOutbound.map(b => ({ id_class: b.id_class, seats: b.seats.length })));
        setOutboundSeatBlocks(filteredOutbound);
        
        if (returnFlightId) {
          const returnData = await api.get<SeatBlock[]>(`/flight/${returnFlightId}/seat-availability`);
          // Filter to only show seats for the selected class
          const filteredReturn = returnData.filter(block => block.id_class === selectedFlightClass);
          setReturnSeatBlocks(filteredReturn);
        }
      } catch (err) {
        console.error('Failed to fetch seats:', err);
        toast.error('Failed to load seat information');
        router.push('/search');
      } finally {
        setLoading(false);
      }
    };

    fetchSeats();
  }, [outboundFlightId, returnFlightId, router]);

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
    setExpandedPassengerIndex(passengers.length);
    setSelectedPassengerIndex(passengers.length);
  };

  const removePassenger = (index: number) => {
    setPassengers(passengers.filter((_, i) => i !== index));
    if (expandedPassengerIndex === index) {
      setExpandedPassengerIndex(null);
    } else if (expandedPassengerIndex && expandedPassengerIndex > index) {
      setExpandedPassengerIndex(expandedPassengerIndex - 1);
    }
    if (selectedPassengerIndex >= passengers.length - 1) {
      setSelectedPassengerIndex(Math.max(0, passengers.length - 2));
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string | number | null) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleSeatSelect = (seatId: number, type: 'outbound' | 'return') => {
    const seatField = type === 'outbound' ? 'id_seat_outbound' : 'id_seat_return';
    const updated = [...passengers];
    
    // Check if seat is already assigned to another passenger
    const seatAlreadyAssigned = passengers.some((p, idx) => 
      idx !== selectedPassengerIndex && p[seatField] === seatId
    );
    
    if (seatAlreadyAssigned) {
      toast.error('This seat is already selected by another passenger');
      return;
    }
    
    // Toggle seat selection for current passenger
    if (updated[selectedPassengerIndex][seatField] === seatId) {
      updated[selectedPassengerIndex][seatField] = null;
      toast.info('Seat deselected');
    } else {
      updated[selectedPassengerIndex][seatField] = seatId;
      toast.success('Seat selected');
    }
    
    setPassengers(updated);
  };

  const canProceedToInfo = () => {
    const allSeatsSelected = passengers.every(p => 
      p.id_seat_outbound && (!returnFlightId || p.id_seat_return)
    );
    
    if (!allSeatsSelected && passengers.length > 0) {
      return false;
    }
    
    return passengers.length > 0;
  };

  const proceedToInfo = () => {
    if (!canProceedToInfo()) {
      toast.error('Please select seats for all passengers before proceeding');
      return;
    }
    setCurrentStep('info');
  };

  const handleSubmit = async () => {
    // Validate all passenger information before submission
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name || !p.lastname || !p.email || !p.date_birth || !p.phone_number || !p.passport_number) {
        toast.error(`Please complete all information for passenger ${i + 1}`);
        setCurrentStep('info');
        setExpandedPassengerIndex(i);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(p.email)) {
        toast.error(`Invalid email format for passenger ${i + 1}`);
        setCurrentStep('info');
        setExpandedPassengerIndex(i);
        return;
      }
      
      // Validate date of birth (must be in the past)
      const birthDate = new Date(p.date_birth);
      if (birthDate >= new Date()) {
        toast.error(`Date of birth must be in the past for passenger ${i + 1}`);
        setCurrentStep('info');
        setExpandedPassengerIndex(i);
        return;
      }
    }

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    
    if (!token) {
      toast.error('You must be logged in to book a flight');
      router.push('/login');
      return;
    }

    let id_buyer: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      id_buyer = payload.sub || payload.id;
      
      if (!id_buyer) {
        throw new Error('Invalid user ID in token');
      }
    } catch (err) {
      console.error('Token parse error:', err);
      toast.error('Invalid user token. Please log in again.');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      const tickets = passengers.flatMap(p => {
        const passengerDetails = {
          name: p.name,
          lastname: p.lastname,
          email: p.email,
          sex: p.sex,
          date_birth: p.date_birth,
          phone_number: p.phone_number,
          passport_number: p.passport_number,
        };

        const ticketsList = [];
        
        // Add outbound ticket
        if (p.id_seat_outbound) {
          ticketsList.push({
            passenger_info: passengerDetails,
            ticket_info: {
              id_flight: parseInt(outboundFlightId!),
              id_seat: p.id_seat_outbound,
              additional_baggage: [],
            },
          });
        }
        
        // Add return ticket if applicable
        if (returnFlightId && p.id_seat_return) {
          ticketsList.push({
            passenger_info: passengerDetails,
            ticket_info: {
              id_flight: parseInt(returnFlightId),
              id_seat: p.id_seat_return,
              additional_baggage: [],
            },
          });
        }
        
        return ticketsList;
      });

      const bookingData = {
        id_buyer,
        tickets,
      };

      await api.post('/flight/book', bookingData);
      
      toast.success(' uccessful! Redirecting to your profile...');
      
      // Delay redirect to let user see success message
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error) {
      console.error('Booking error:', error);
      const errorMessage = (error as Error).message || 'Failed to complete booking';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <IconPlaneInflight className="w-16 h-16 mx-auto mb-4 text-input" />
        <p className="text-lg font-medium text-primary">Loading seats...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Button variant="outline" className="fixed left-4 top-4 z-50 border-0!" onClick={() => router.back()}>
        <IconArrowLeft />
      </Button>
      <MainNavBar companyuser={companyuser} />
      
      <div className="container mx-auto my-6 px-4">
        <div className="flex gap-6">
          {/* Left Sidebar - Steps */}
          <div className="w-64 shrink-0">
            <div className="bg-card text-white rounded-lg overflow-hidden sticky top-4">
              <div className="pt-4 mx-4">
                <h2 className="font-semibold">Seat Booking</h2>
              </div>
              <div className="p-4">
                <button
                  onClick={() => setCurrentStep('seats')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentStep === 'seats' 
                      ? 'bg-input text-white' 
                      : 'text-gray-200 hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 'seats' ? 'bg-white text-ring' : 'bg-input'
                    }`}>
                      1
                    </div>
                    <span>Pick Your Seat</span>
                  </div>
                </button>
                <button
                  onClick={() => canProceedToInfo() && setCurrentStep('info')}
                  disabled={!canProceedToInfo()}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors mt-1 ${
                    currentStep === 'info' 
                      ? 'bg-input text-white' 
                      : !canProceedToInfo()
                      ? 'text-gray-500 cursor-not-allowed opacity-80'
                      : 'text-gray-200 hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 'info' ? 'bg-white text-ring' : 'bg-input'
                    }`}>
                      2
                    </div>
                    <span>Passenger Info</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {currentStep === 'seats' ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">Pick Your Seat</h1>
                  <p className="text-primary/20">Select seats for all passengers</p>
                </div>

                {/* Passenger Tabs */}
                <div className="bg-card rounded-lg border-0 p-4">
                  <div className="flex gap-2 flex-wrap">
                    {passengers.map((p, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPassengerIndex(index)}
                        className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                          selectedPassengerIndex === index
                            ? 'bg-secondary text-muted-foreground border-gray-200/20'
                            : 'bg-card text-ring hover:bg-gray-400/20'
                        }`}
                      >
                        Passenger {index + 1}
                        {p.name && ` - ${p.name}`}
                      </button>
                    ))}
                    <button
                      onClick={addPassenger}
                      className="px-4 py-2 rounded-md font-medium text-sm bg-secondary text-ring hover:bg-secondary/60 border-2 border-dashed border-gray-200/20"
                    >
                      + Add Passenger
                    </button>
                  </div>
                </div>

                {/* Seat Grids */}
                <div className="space-y-6">
                  {outboundSeatBlocks.length === 0 && returnSeatBlocks.length === 0 ? (
                    <div className="bg-card rounded-lg p-6 text-center">
                      <p className="text-destructive font-medium">No seats available for the selected flight(s)</p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-0!"
                        onClick={() => router.push('/search')}
                      >
                        Back to Search
                      </Button>
                    </div>
                  ) : (
                    <>
                      {outboundSeatBlocks.length > 0 && (
                        <SimplifiedSeatGrid
                          flightType="outbound"
                          seatBlocks={outboundSeatBlocks}
                          passengers={passengers}
                          selectedPassengerIndex={selectedPassengerIndex}
                          onSeatSelect={(seatId) => handleSeatSelect(seatId, 'outbound')}
                        />
                      )}
                      {returnSeatBlocks.length > 0 && (
                        <SimplifiedSeatGrid
                          flightType="return"
                          seatBlocks={returnSeatBlocks}
                          passengers={passengers}
                          selectedPassengerIndex={selectedPassengerIndex}
                          onSeatSelect={(seatId) => handleSeatSelect(seatId, 'return')}
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  {passengers.length > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => removePassenger(selectedPassengerIndex)}
                    >
                      Remove Passenger
                    </Button>
                  )}
                  <Button
                    onClick={proceedToInfo}
                    disabled={!canProceedToInfo()}
                    className="bg-secondary hover:bg-input text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Passenger Information
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-2">Passenger Information</h1>
                  <p className="text-primary">Complete details for all passengers</p>
                </div>

                <div className="space-y-4">
                  {passengers.map((passenger, index) => (
                    <Card key={index} className={`border-0 ${expandedPassengerIndex === index ? "" : "hover:opacity-80"}`} onClick={() => setExpandedPassengerIndex(expandedPassengerIndex === index ? null : index)}>
                      <CardHeader className="cursor-pointer">
                        <CardTitle className="flex items-center justify-between text-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-input text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <span>
                              {passenger.name || passenger.lastname 
                                ? `${passenger.name} ${passenger.lastname}` 
                                : `Passenger ${index + 1}`}
                            </span>
                          </div>
                          {expandedPassengerIndex === index ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                        </CardTitle>
                      </CardHeader>
                      {expandedPassengerIndex === index && (
                        <CardContent className="pt-0" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor={`name-${index}`}>First Name *</Label>
                              <Input
                                id={`name-${index}`}
                                value={passenger.name}
                                onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`lastname-${index}`}>Last Name *</Label>
                              <Input
                                id={`lastname-${index}`}
                                value={passenger.lastname}
                                onChange={(e) => updatePassenger(index, 'lastname', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`email-${index}`}>Email *</Label>
                              <Input
                                id={`email-${index}`}
                                type="email"
                                value={passenger.email}
                                onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`phone-${index}`}>Mobile Number *</Label>
                              <Input
                                id={`phone-${index}`}
                                type="tel"
                                value={passenger.phone_number}
                                onChange={(e) => updatePassenger(index, 'phone_number', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`passport-${index}`}>Passport Number *</Label>
                              <Input
                                id={`passport-${index}`}
                                value={passenger.passport_number}
                                onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`dob-${index}`}>Date of Birth *</Label>
                              <Input
                                id={`dob-${index}`}
                                type="date"
                                value={passenger.date_birth}
                                onChange={(e) => updatePassenger(index, 'date_birth', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`gender-${index}`}>Gender *</Label>
                              <Select value={passenger.sex} onValueChange={(value: 'M' | 'F') => updatePassenger(index, 'sex', value)}>
                                <SelectTrigger id={`gender-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Male</SelectItem>
                                  <SelectItem value="F">Female</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between gap-3 pt-4">
                  <Button
                    variant="outline"
                    className='border-0!'
                    onClick={() => setCurrentStep('seats')}
                  >
                    Back to Seats
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-input hover:bg-border text-white"
                  >
                    {submitting ? 'Processing...' : 'Submit Booking'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Summary */}
          <div className="w-80 shrink-0">
            <BookingSummarySidebar
              passengers={passengers}
              outboundFlightId={outboundFlightId}
              returnFlightId={returnFlightId}
              baseFlightPrice={baseFlightPrice}
              numPassengers={passengers.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlightBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    }>
      <FlightBookingContent />
    </Suspense>
  );
}