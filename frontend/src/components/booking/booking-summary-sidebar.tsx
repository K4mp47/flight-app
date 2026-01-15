"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PassengerInfo } from "@/app/flight/book/page"
import { PlaneTakeoff, PlaneLanding } from "lucide-react"

interface BookingSummarySidebarProps {
  passengers: PassengerInfo[];
  outboundFlightId: string | null;
  returnFlightId: string | null;
  baseFlightPrice: number;
  numPassengers: number;
}

export function BookingSummarySidebar({ 
  passengers, 
  outboundFlightId, 
  returnFlightId, 
  baseFlightPrice,
  numPassengers 
}: BookingSummarySidebarProps) {
  // Calculate total price - simplified for now
  // This would ideally come from a more complex calculation involving actual seat prices, baggage, etc.
  const totalSeatsSelected = passengers.filter(p => p.id_seat_outbound !== null || p.id_seat_return !== null).length;
  
  // Calculate total based on number of flights per passenger
  let totalFlights = 0;
  passengers.forEach(p => {
    if (p.id_seat_outbound) totalFlights++;
    if (p.id_seat_return) totalFlights++;
  });
  
  const totalPrice = baseFlightPrice * totalFlights;

  // Function to get seat display from seat map
  const getSeatDisplay = (seatId: number | null): string => {
    if (seatId === null) return "Not selected";
    return `Seat ${seatId}`;
  };

  return (
    <Card className="sticky top-4 h-fit border-0">
      <CardHeader className="bg-card">
        <CardTitle className="text-xl font-bold text-primary">Booking Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">Booking Summary
        <div>
          <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">Flight Details</h3>
          <div className="space-y-3 text-sm">
            {outboundFlightId && (
              <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg border-gray-200/20">
                <PlaneTakeoff className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-ring">Outbound Flight</p>
                  <p className="text-input text-xs mt-1">Flight ID: {outboundFlightId}</p>
                </div>
              </div>
            )}
            {returnFlightId && (
              <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg border-gray-200/20">
                <PlaneLanding className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-ring">Return Flight</p>
                  <p className="text-input text-xs mt-1">Flight ID: {returnFlightId}</p>
                </div>
              </div>
            )}
            {!outboundFlightId && !returnFlightId && (
              <p className="text-gray-500 text-center py-4">No flights selected</p>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">
            Passengers ({numPassengers})
          </h3>
          <div className="space-y-3">
            {passengers.map((p, index) => (
              <div key={index} className="p-3 rounded-lg bg-secondary hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium text-sm text-ring">
                    {p.name && p.lastname ? `${p.name} ${p.lastname}` : `Passenger ${index + 1}`}
                  </p>
                  <span className="text-xs bg-background text-primary px-2 py-1 rounded-full">
                    #{index + 1}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-ring">
                  <div className="flex items-center justify-between">
                    <span>Outbound:</span>
                    <span className={p.id_seat_outbound ? "text-green-600 font-medium" : "text-input"}>
                      {getSeatDisplay(p.id_seat_outbound)}
                    </span>
                  </div>
                  {returnFlightId && (
                    <div className="flex items-center justify-between">
                      <span>Return:</span>
                      <span className={p.id_seat_return ? "text-green-600 font-medium" : "text-gray-400"}>
                        {getSeatDisplay(p.id_seat_return)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {passengers.length === 0 && (
              <p className="text-gray-500 text-center py-4">No passengers added</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="bg-card -mx-6 -mb-6 p-6 rounded-b-lg">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-ring">
              <span>Base price per flight:</span>
              <span>${baseFlightPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-ring">
              <span>Total flights:</span>
              <span>{totalFlights}</span>
            </div>
            {totalSeatsSelected > 0 && (
              <div className="flex justify-between text-sm text-ring">
                <span>Seats selected:</span>
                <span>{totalSeatsSelected}</span>
              </div>
            )}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-ring">Total Price</span>
            <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
