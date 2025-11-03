"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"


import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { api } from "@/lib/api"

/** interfaccia per lavorare con gli aerei fisici */
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

/** compatibilità col codice che usa `Routes[]` */
interface Routes {
  routes: Route[];
}

/** dettaglio di una singola sezione di route */
interface RouteDetail {
  arrival_airport: string;
  arrival_time: string;
  departure_airport: string;
  departure_time: string;
  id_next: number | null;
  route_detail_id: number;
  route_section_id: number;
}

/** singola route */
interface Route {
  details: RouteDetail[];
  end_date: string;
  route_code: string;
  route_created_at?: string;
  start_date: string;
}

export default function Page() {
  const [view, setView] = React.useState<string>("Fleet")
  const [tableData, setTableData] = React.useState<(Aircraft | Route)[]>([])
  const [, setLoading] = React.useState<boolean>(false)

  React.useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        const user = await api.get<{ airline_code?: string }>("/users/me").catch(() => ({} as User))
        const code = user?.airline_code ?? ""
        if (view === "Fleet") {
          // try to fetch user's airline fleet, fallback to bundled JSON  
          const res = await api.get<Aircraft[]>(`/airline/${encodeURIComponent(code)}/fleet`)
          console.log(res)
          if (mounted) setTableData(res)
        } else if (view === "Routes") {
          const route_res = await api.get<Routes>(`/airline/${encodeURIComponent(code)}/route`)
          console.log(route_res)
          if (mounted) setTableData(route_res.routes)
        } else {
          if (mounted) setTableData([])
        }
      } catch (err) {
        console.error(err)
        if (mounted) setTableData([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [view])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" onSelect={(v: unknown) => { if (typeof v === "string") setView(v); }} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              {/* optional small title to show current selection */}
              <div className="px-4 lg:px-6">
                <h2 className="mb-4 text-lg font-semibold">{view}</h2>
              </div>

              <DataTable view={view} initialData={tableData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
