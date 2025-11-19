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
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const formSchema = z.object({
  airline_code: z.string().min(2).max(3),
  aircraft_id: z.coerce.number().min(1).max(9999),
  number_route: z.string().min(1).max(9999),
  outbound: z.date({
    required_error: "Departure date is required",
  }),
  return_: z.date({
    required_error: "Return date is required", 
  }),
});

type FlightFormValues = z.infer<typeof formSchema>;

export default function FlightCreationForm({
  airlineCode,
}: {
  airlineCode?: string;
}) {
  const form = useForm<FlightFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      airline_code: airlineCode || "AZ",
      aircraft_id: undefined ,
      number_route: undefined,
      outbound: undefined,
      return_: undefined,
    },
  });

  // Separate state for each date picker
  const [dodOpen, setDodOpen] = useState(false);
  const [dorOpen, setDorOpen] = useState(false);

  async function onSubmit(data: FlightFormValues) {
    try {
      console.log("Submitting flight data:", data);
      
      // Format the dates for API
      const payload = {
        airline_code: data.airline_code.toUpperCase(),
        aircraft_id: data.aircraft_id,
        flight_schedule: [
          {
            outbound: format(data.outbound, "yyyy-MM-dd"),
            return_: format(data.return_, "yyyy-MM-dd"),
          }
          // Add more objects here if you want to support multiple flight schedules
        ],
      };

      console.log("API Payload:", payload);

      // Make the API callflights/create
      await api.post(`/airline/route/${data.number_route.toUpperCase()}/add-flight`, payload); // Update with your actual endpoint
      
      toast.success("Flight created successfully!");
      
      // Reset form after successful submission
      form.reset();
      
      // Close dialog if needed
      document.getElementById("close-flight-dialog")?.click();
      
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
          {/* NUMBER OF AIRCRAFT */}
          <FormField
            control={form.control}
            name="aircraft_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Aircraft</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 10" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* NUMBER OF ROUTES */}
          <FormField
            control={form.control}
            name="number_route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code of the Route</FormLabel>
                <FormControl>
                  <Input  
                    placeholder="e.g., 20" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
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
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="w-full md:w-auto"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Creating..." : "Create Flight"}
          </Button>
        </div>
      </form>
    </Form>
  );
}