'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChartAreaInteractive } from "@/components/dashboard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // This line is already present
import { Plane, PlaneLanding, PlaneTakeoff } from "lucide-react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebarUser } from "@/components/layout"


export default function ProfilePage() {

  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<Ticket []>([])
  const [activeView, setActiveView] = useState("profile"); // To manage active view in sidebar
  
  useEffect(() => {
    fetchUser()
    fetchTickets()
  }, [])

  const fetchUser = async () => {
    await api.get<User>('/users/me').then(response => {
      setUser(response)
    }).catch(error => {
      console.error('Error fetching user data:', error)
      // Use fake data as fallback
      const fakeUser: User = {
        email: "demo.user@example.com",
        lastname: "User",
        name: "Demo",
        airline_code: undefined
      };
      setUser(fakeUser)
      toast.info('Using demo user data')
    })
  }

  const fetchTickets = async () => {
    await api.get<Ticket[]>('/users/flights').then(response => {
      setTickets(response)
    }).catch(error => {
      console.error('Error fetching tickets:', error)
      // Use fake data as fallback
      const fakeTickets: Ticket[] = [
        {
          id_buyer: 1,
          id_passenger_ticket: 1,
          passenger: {
            id_passengers: 1,
            date_birth: "1990-05-15",
            email: "john.doe@example.com",
            lastname: "Doe",
            name: "John",
            passport_number: "AB123456",
            phone_number: "+1234567890"
          },
          ticket: {
            id_ticket: 1001,
            price: 450.00,
            flight: {
              airline: {
                iata_code: "AA",
                name: "American Airlines"
              },
              base_price: 400.00,
              id_aircraft: 1,
              id_flight: 101,
              route_code: "AA101",
              scheduled_arrival_day: "2026-02-15",
              scheduled_departure_day: "2026-02-15",
              sections: [
                {
                  arrival_time: "14:30:00",
                  departure_time: "09:00:00",
                  id_airline_routes: 1,
                  next_id: null,
                  section: {
                    code_arrival_airport: "LAX",
                    code_departure_airport: "JFK",
                    id_routes_section: 1
                  }
                }
              ]
            }
          }
        },
        {
          id_buyer: 1,
          id_passenger_ticket: 2,
          passenger: {
            id_passengers: 1,
            date_birth: "1990-05-15",
            email: "john.doe@example.com",
            lastname: "Doe",
            name: "John",
            passport_number: "AB123456",
            phone_number: "+1234567890"
          },
          ticket: {
            id_ticket: 1002,
            price: 780.00,
            flight: {
              airline: {
                iata_code: "DL",
                name: "Delta Airlines"
              },
              base_price: 720.00,
              id_aircraft: 2,
              id_flight: 202,
              route_code: "DL202",
              scheduled_arrival_day: "2026-03-10",
              scheduled_departure_day: "2026-03-10",
              sections: [
                {
                  arrival_time: "18:45:00",
                  departure_time: "12:15:00",
                  id_airline_routes: 2,
                  next_id: null,
                  section: {
                    code_arrival_airport: "CDG",
                    code_departure_airport: "ATL",
                    id_routes_section: 2
                  }
                }
              ]
            }
          }
        }
      ];
      setTickets(fakeTickets)
      toast.info('Using demo flight data')
    })
  }

  if(!user) {
    return (
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <AppSidebarUser />
          <main className="flex-1 overflow-auto p-8">
            <Skeleton className="h-8 w-1/2 mb-6" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/3 mb-2" />
              </CardContent>
            </Card>
            <Skeleton className="h-8 w-1/2 mt-6" />
            <Skeleton className="h-8 w-1/2 mt-6" />
          </main>
        </div>
      </SidebarProvider>
    )
  }

  return (
      <div className="flex h-screen bg-background">
        <SidebarProvider>
        <AppSidebarUser onSelect={(view) => typeof view === 'string' && setActiveView(view.toLowerCase())} />
        <main className="overflow-auto w-full p-4 md:p-8"> {/* Adjusted padding for responsiveness */}
          {/* Mobile Sidebar Trigger */}
          <div className="flex items-center gap-3 mb-4">
            <SidebarTrigger className="lg:hidden" />
          </div>
          <h1 className="text-2xl font-bold mb-6 hidden lg:block">Welcome, {user?.name}</h1>
          {activeView === "profile" && (
            <>
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>User Information</CardTitle>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Look at your personal details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>First Name:</strong> {user.name}</p>
                      <p><strong>Last Name:</strong> {user.lastname}</p>
                    </div>
                    <div>
                      <p><strong>Email:</strong> {user.email}</p>
                      {user.airline_code && <p><strong>Airline:</strong> {user.airline_code}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Your Bookings</CardTitle>
                  <p className="text-sm text-muted-foreground">Detailed information about your booked flights</p>
                </CardHeader>
                <CardContent>
                  {tickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bookings found.</p>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((t) => {
                        const flight = t.ticket.flight
                        const section = flight.sections?.[0]
                        return (
                          <Card key={t.ticket.id_ticket} className="p-4">
                            <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                              <CardTitle className="text-base">Booking ID: {t.ticket.id_ticket}</CardTitle>
                              <span className="text-sm font-semibold">${t.ticket.price}</span>
                            </CardHeader>
                            <CardContent className="p-0 text-sm grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center gap-2">
                                <Plane className="h-4 w-4 text-muted-foreground" />
                                <p><strong>Airline:</strong> {flight.airline.name} ({flight.airline.iata_code})</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <PlaneTakeoff className="h-4 w-4 text-muted-foreground" />
                                <p><strong>From:</strong> {section?.section?.code_departure_airport ?? ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <PlaneLanding className="h-4 w-4 text-muted-foreground" />
                                <p><strong>To:</strong> {section?.section?.code_arrival_airport ?? ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p><strong>Departure:</strong> {flight.scheduled_departure_day} {section?.departure_time ?? ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p><strong>Arrival:</strong> {flight.scheduled_arrival_day} {section?.arrival_time ?? ''}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <p><strong>Passenger:</strong> {t.passenger.name} {t.passenger.lastname}</p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
          {activeView === "dashboard" && (
            <Card className="mb-6 w-full">
              <CardHeader>
                <CardTitle>Flight Activity</CardTitle>
                <p className="text-sm text-muted-foreground">Fake generated graph, for demo purposes only</p>
              </CardHeader>
              <CardContent>
                <ChartAreaInteractive />
              </CardContent>
            </Card>
          )}
          {activeView === "settings" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Settings</CardTitle>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
              </CardHeader>
              <CardContent>
                {/* <Button variant="destructive" onClick={handleLogout}>Logout</Button> */}
                Work in progress...
              </CardContent>
            </Card>
          )}
        </main>
        </SidebarProvider>
      </div>
  )
}
