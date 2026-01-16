import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import React, { useState, useEffect } from "react"; // Changed import to React, { useState, useEffect }
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  airline_code: z.string().min(2).max(3),
  aircraft_id: z.number({ required_error: "Aircraft is required" }), // Changed to number and required
  route_code: z.string({ required_error: "Route is required" }), // Changed to required
  outbound: z.date({
    required_error: "Departure date is required",
  }),
  return_: z.date({
    required_error: "Return date is required",
  }),
});

type FlightFormValues = z.infer<typeof formSchema>;

export default function FlightCreationForm({ onClose }: { onClose?: () => void }) {
  const form = useForm<FlightFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      airline_code: "", // Will be fetched
      aircraft_id: undefined,
      route_code: "",
      outbound: undefined,
      return_: undefined,
    },
  });

  const [dodOpen, setDodOpen] = useState(false);
  const [dorOpen, setDorOpen] = useState(false);
  const [userAirlineCode, setUserAirlineCode] = useState<string | null>(null);
  const [availableAircraft, setAvailableAircraft] = useState<Aircraft[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [loadingAircraft, setLoadingAircraft] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [loadingAirlineCode, setLoadingAirlineCode] = useState(true);

  // Fetch user's airline code
  useEffect(() => {
    async function fetchUserAirlineCode() {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.airline_code) {
            setUserAirlineCode(payload.airline_code);
            form.setValue("airline_code", payload.airline_code);
          } else {
            toast.error("User is not assigned to an airline.");
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error("Failed to retrieve user airline information.");
      } finally {
        setLoadingAirlineCode(false);
      }
    }
    fetchUserAirlineCode();
  }, []);

  // Fetch available aircraft and routes when userAirlineCode is set
  useEffect(() => {
    async function fetchData() {
      if (!userAirlineCode) return;

      // Fetch aircraft
      setLoadingAircraft(true);
      try {
        const aircraftRes = await api.get<Aircraft[]>(`/airline/${userAirlineCode}/fleet`);
        setAvailableAircraft(aircraftRes);
      } catch (error) {
        console.error("Error fetching aircraft:", error);
        toast.error("Failed to load available aircraft.");
      } finally {
        setLoadingAircraft(false);
      }

      // Fetch routes
      setLoadingRoutes(true);
      try {
        const routesRes = await api.get<{ routes: Route[] }>(`/airline/${userAirlineCode}/route`);
        setAvailableRoutes(routesRes.routes);
      } catch (error) {
        console.error("Error fetching routes:", error);
        toast.error("Failed to load available routes.");
      } finally {
        setLoadingRoutes(false);
      }
    }
    fetchData();
  }, [userAirlineCode]);

  async function onSubmit(data: FlightFormValues) {
    try {
      if (!userAirlineCode) {
        toast.error("Airline code not found for user.");
        return;
      }
      console.log("Submitting flight data:", data);

      const payload = {
        airline_code: userAirlineCode,
        aircraft_id: data.aircraft_id,
        flight_schedule: [
          {
            outbound: format(data.outbound, "yyyy-MM-dd"),
            return_: format(data.return_, "yyyy-MM-dd"),
          },
        ],
      };

      console.log("API Payload:", payload);

      await api.post(`/airline/route/${data.route_code}/add-flight`, payload);

      toast.success("Flight created successfully!");
      form.reset({
        airline_code: userAirlineCode,
        aircraft_id: undefined,
        route_code: "",
        outbound: undefined,
        return_: undefined,
      }); // Reset form with airline_code preserved

      onClose?.();

    } catch (error: unknown) {
      console.error("Error creating flight:", error);
      toast.error(
        "Error creating flight: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center gap-4">
          {/* Airline Code (Read-only/Hidden) */}
          <FormField
            control={form.control}
            name="airline_code"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Airline Code</FormLabel>
                <FormControl>
                  <Input {...field} disabled readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Aircraft ID Dropdown */}
          <FormField
            control={form.control}
            name="aircraft_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Aircraft</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={loadingAircraft || loadingAirlineCode}
                      >
                        {loadingAircraft ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : field.value ? (
                          availableAircraft.find(
                            (aircraft) => aircraft.id_aircraft_airline === field.value
                          )?.aircraft.name + " (" + availableAircraft.find(
                            (aircraft) => aircraft.id_aircraft_airline === field.value
                          )?.id_aircraft_airline + ")"
                        ) : (
                          "Select aircraft"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-popover-trigger-width] no-scrollbar max-h-48 overflow-y-auto">
                    {availableAircraft.map((aircraft) => (
                      <DropdownMenuItem
                        key={aircraft.id_aircraft_airline}
                        onSelect={() => {
                          form.setValue("aircraft_id", aircraft.id_aircraft_airline);
                        }}
                      >
                        {aircraft.aircraft.name} ({aircraft.id_aircraft_airline})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Route Code Dropdown */}
          <FormField
            control={form.control}
            name="route_code"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Route</FormLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={loadingRoutes || loadingAirlineCode}
                      >
                        {loadingRoutes ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : field.value ? (
                          availableRoutes.find(
                            (route) => route.route_code === field.value
                          )?.route_code
                        ) : (
                          "Select route"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-popover-trigger-width] no-scrollbar max-h-48 overflow-y-auto">
                    {availableRoutes.map((route) => (
                      <DropdownMenuItem
                        key={route.route_code}
                        onSelect={() => {
                          form.setValue("route_code", route.route_code);
                        }}
                      >
                        {route.route_code}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* DEPARTURE DATE (DOD) */}
          <FormField
            control={form.control}
            name="outbound"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Departure Date
                </FormLabel>
                <Popover open={dodOpen} onOpenChange={setDodOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-between text-left font-normal h-12",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-2"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(value) => {
                        field.onChange(value);
                        setDodOpen(false);
                      }}
                      disabled={(date) =>
                        date < new Date() ||
                        date < new Date("1900-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* RETURN DATE (DOR) */}
          <FormField
            control={form.control}
            name="return_"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Return Date
                </FormLabel>
                <Popover open={dorOpen} onOpenChange={setDorOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full justify-between text-left font-normal h-12",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "MMM d, yyyy")
                        ) : (
                          <span>Select date</span>
                        )}
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-2"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(value) => {
                        field.onChange(value);
                        setDorOpen(false);
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        const dod = form.getValues("outbound");
                        // Disable dates before today, before 1900, or before departure date
                        return (
                          date < today ||
                          date < new Date("1900-01-01") ||
                          (dod && date < dod)
                        );
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || loadingAirlineCode || loadingAircraft || loadingRoutes}
          >
            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Flight"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
