'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { Plane } from "lucide-react"
import Link from "next/dist/client/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function ProfilePage() {

  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<Ticket []>([])

  useEffect(() => {
    fetchUser()
    fetchTickets()
  }, [])

  const handleLogout = async () => {
    await api.post('/users/logout', {
      token: document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1],
    }).then(() => {
      toast.success('Logged out successfully')
      document.cookie = "token=; path=/; max-age=0;" 
      window.location.href = "/login" // Redirect to login page
    }).catch(error => {
      toast.error('Error logging out: ' + error.message)
      console.error('Error logging out:', error)
    })
  }

  const fetchUser = async () => {
    await api.get<User>('/users/me').then(response => {
      setUser(response)
    }).catch(error => {
      toast.error('Error fetching user data: ' + error.message)
      console.error('Error fetching user data:', error)
    })
  }

  const fetchTickets = async () => {
    await api.get<Ticket[]>('/users/flights').then(response => {
      setTickets(response)
    }).catch(error => {
      toast.error('Error fetching user data: ' + error.message)
      console.error('Error fetching user data:', error)
    })
  }

  if(!user) {
    return <div className="p-8">
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
    </div>
  }

  return (
    <div className="p-8">
      <Link href="/" className="flex items-center gap-2 font-medium mb-6">
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <Plane className="size-4" />
        </div>
        Flight app
      </Link>
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.name}</h1>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" >Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">User Information</h2>
              <h3 className="text-sm text-muted-foreground">Look at your personal details</h3>
            </CardHeader>
            <CardContent>
              <p><strong>Name:</strong> {user.name} {user.lastname}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Booking List</h2>
              <h3 className="text-sm text-muted-foreground">Your booking information</h3>
            </CardHeader>
            <CardContent>
              <CardContent>
              {tickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings found.</p>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t) => {
                    const flight = t.ticket.flight
                    const section = flight.sections?.[0]
                    return (
                      <div key={t.ticket.id_ticket} className="p-4 border rounded-md">
                        <p><strong>Passenger:</strong> {t.passenger.name} {t.passenger.lastname}</p>
                        <p><strong>Airline:</strong> {flight.airline.name} ({flight.airline.iata_code})</p>
                        <p><strong>Route:</strong> {section?.section?.code_departure_airport ?? ''} - {section?.section?.code_arrival_airport ?? ''}</p>
                        <p><strong>Departure:</strong> {flight.scheduled_departure_day} {section?.departure_time ?? ''}</p>
                        <p><strong>Arrival:</strong> {flight.scheduled_arrival_day} {section?.arrival_time ?? ''}</p>
                        <p><strong>Price:</strong> ${t.ticket.price}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-lg font-semibold">Settings</h2>
              <h3 className="text-sm text-muted-foreground">Manage your account settings</h3>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>Logout</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}