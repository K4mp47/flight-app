"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api"

interface Aircraft {
  aircraft: {
    double_deck: boolean;
    id_aircraft: number;
    manufacturer: {
      id_manufacturer: number;
      name: string;
    };
    max_economy_seats: number;
    name: string;
  };
  airline: {
    iata_code: string;
    name: string;
  };
  current_position: string;
  flying_towards: string | null;
  id_aircraft_airline: number;
}

interface User {
  email: string;
  lastname: string;
  name: string;
  airline_code: string;
}


export default function Page() {
  const [userIataCode, setUserIataCode] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<Aircraft[]>([]);
  const [data, setData] = useState<Aircraft[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/me") as User;
        setUserIataCode(response.airline_code);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchFleetData = async () => {
      try {
        if (!userIataCode) return;
        const response = await api.get<Aircraft[]>("/airline/fleet?airline_code=" + userIataCode);
        console.log("Fleet data:", response);
        setData(response);
      } catch (error) {
        console.error(error);
      }
    }

    fetchUserData();
    fetchFleetData();
  }, [userIataCode]);

  useEffect(() => {
    if (userIataCode) {
      // Filter data based on userIataCode
      const filtered = data.filter(
        (item) => item.airline.iata_code == userIataCode
      );
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [userIataCode, data]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
      defaultOpen={false}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              {/* <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div> */}
              <DataTable initialData={filteredData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
