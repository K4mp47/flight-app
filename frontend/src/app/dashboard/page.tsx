"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./fleet.json"

import React, { useEffect, useState } from "react";
// import { createDropdownMenuScope } from "@radix-ui/react-dropdown-menu"

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


export default function Page() {
  const [userIataCode, setUserIataCode] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<Aircraft[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      try {
        const response = await fetch("http://localhost:5000/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token ?? ""}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log(data.airline_code);
          setUserIataCode(data.airline_code);
        } else {
          throw new Error("No User data fetched");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (userIataCode) {
      // Filter data based on userIataCode
      const filtered = data.filter(
        (item) => item.airline.iata_code == userIataCode
      );
      setFilteredData(filtered);
      console.log(filtered);
    } else {
      setFilteredData([]);
    }

    console.log("Filtered Data:", filteredData);
  }, [userIataCode]);

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
