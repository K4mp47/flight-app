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

interface User {
  email: string
  lastname: string
  name: string
}

export default function ProfilePage() {

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser()
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
      <h1 className="text-2xl font-bold mb-6">Welcome, {user.name}</h1>
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
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-2" />
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