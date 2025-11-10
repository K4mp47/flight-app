'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
// import FlightCard from '@/components/FlightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MainNavBar } from '@/components/MainNavBar';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('departure_time');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
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
    const fetchFlights = async () => {
      setLoading(true);
      setError(null);
      try {
        const origin = searchParams.get('origin') || '';
        const destination = searchParams.get('destination') || '';
        const departure_date = searchParams.get('departure_date') || '';

        const query = new URLSearchParams();
        if (origin) query.append('origin', origin);
        if (destination) query.append('destination', destination);
        if (departure_date) query.append('departure_date', departure_date);
        query.append('sort_by', sortBy);
        query.append('sort_order', sortOrder);

        const data = await api.get<Flight[]>(`/flights/search?${query.toString()}`);
        setFlights(data);
        setLoading(false);
      } catch (error: Error | unknown) {
        toast.error((error as Error).message || 'Failed to fetch flights');
      }
        // } finally {
      //   setLoading(false);
      // }
    };

    fetchFlights();
  }, [searchParams, sortBy, sortOrder]);

  return (
    <div className="min-h-screen">
      <Button variant="outline" className="fixed left-4 top-4 z-50 hover:cursor-pointer" onClick={() => router.back()}><IconArrowLeft /></Button>
      <MainNavBar companyuser={companyuser} />
            <div className="relative">
              <Image
                src="/banner.svg"
                alt="Logo"
                width={1920}
                height={1080}
                className="w-full h-40 sm:h-60 md:h-80 object-cover"
              />
              <div className="absolute bottom-0 left-0 w-full h-30 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none" />
            </div>
      <h1 className="text-5 xl font-bold mb-6 w-full flex justify-center">Search Results</h1>

      <div className="flex items-center space-x-4 mb-6 justify-center">
        <div className="grid gap-2 dark:bg-gray-950 dark:shadow-gray-600">
          <Label htmlFor="sortBy">Sort By</Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sortBy" className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-950 '>
              <SelectItem value="departure_time">Departure Time</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1 dark:bg-gray-950 dark:shadow-gray-700">
          <Label htmlFor="sortOrder">Order</Label>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger id="sortOrder" className="w-[180px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent className='dark:bg-gray-950 '>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && flights.length === 0 && !error && (
        <p className="text-center text-muted-foreground">No flights found matching your criteria.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {flights.map((flight) => (
          <></>
          // <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
    </div>
  );
}