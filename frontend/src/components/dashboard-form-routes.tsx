import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { IconTrash, IconPlaneArrival, IconPlaneDeparture, IconPlus } from "@tabler/icons-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { api } from "@/lib/api"

// Schema di validazione per una singola sezione
const sectionSchema = z.object({
  departure_time: z.string().optional(),
  waiting_time: z.coerce.number().min(120, "Must be at least 120 minutes (2h)").optional(),
  departure_airport: z.string().min(3, "Required, 3-letter IATA code").max(3),
  arrival_airport: z.string().min(3, "Required, 3-letter IATA code").max(3),
})

// Schema di validazione per l'intera Route
const formSchema = z.object({
  airline_code: z.string().min(2, "Required, 2-letter IATA code").max(3),
  number_route: z.coerce.number().min(1).max(9999),
  start_date: z.date({
    required_error: "Start date is required.",
  }),
  end_date: z.date({
    required_error: "End date is required.",
  }),
  base_price: z.coerce.number().min(0, "Base price must be non-negative"),
  delta_for_return_route: z.coerce.number().min(1, "Delta must be at least 1 minute"),
  sections: z.array(sectionSchema).min(1, "At least one flight segment is required"),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date.",
  path: ["end_date"],
});

type RouteFormValues = z.infer<typeof formSchema>

export function RouteCreationForm({ airlineCode }: { airlineCode?: string }) {
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      airline_code: airlineCode ?? "",
      number_route: 1,
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      base_price: 10,
      delta_for_return_route: 120,
      sections: [{
        departure_time: "09:00",
        departure_airport: "FCO",
        arrival_airport: "GYD",
      }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sections",
  })

  const convertSectionsToApiFormat = (sections: RouteFormValues['sections']): ApiSection | null => {
    if (sections.length === 0) {
      return null;
    }

    let currentSection: ApiSection | null = null;
    let firstSection: ApiSection | null = null;

    sections.forEach((section, index) => {
      const apiSection: ApiSection = {
        departure_airport: section.departure_airport,
        arrival_airport: section.arrival_airport,
        next_session: null,
      };

      if (index === 0) {
        apiSection.departure_time = section.departure_time;
      } else {
        apiSection.waiting_time = section.waiting_time;
      }

      if (currentSection) {
        currentSection.next_session = apiSection;
      } else {
        firstSection = apiSection;
      }
      currentSection = apiSection;
    });

    return firstSection;
  };

  async function onSubmit(data: RouteFormValues) {
    try {
      for (let i = 0; i < data.sections.length - 1; i++) {
        if (data.sections[i].arrival_airport !== data.sections[i + 1].departure_airport) {
          toast.error(`Error: Departure airport of segment ${i + 2} (${data.sections[i + 1].departure_airport}) must match arrival airport of segment ${i + 1} (${data.sections[i].arrival_airport}).`);
          return;
        }
      }

      if (!data.sections[0]?.departure_time) {
        toast.error("First segment must have a departure time");
        return;
      }

      for (let i = 1; i < data.sections.length; i++) {
        if (!data.sections[i]?.waiting_time) {
          toast.error(`Segment ${i + 1} must have a waiting time`);
          return;
        }
      }

      const apiPayload = {
        airline_code: data.airline_code.toUpperCase(),
        number_route: data.number_route,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        base_price: data.base_price,
        delta_for_return_route: data.delta_for_return_route,
        section: convertSectionsToApiFormat(data.sections),
      }

      console.log("API Payload:", JSON.stringify(apiPayload, null, 2));
      
      await api.post("/airline/add/route", apiPayload);
      toast.success(`Route ${data.airline_code.toUpperCase()}${data.number_route} created successfully!`);
      
      // Chiudi il dialog se necessario
      document.getElementById("close-route-dialog")?.click();

    } catch (error: unknown) {
      console.error("Error creating route:", error);
      toast.error("Error creating route: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  // ✅ Funzione migliorata per aggiungere segmenti
  const addSegment = () => {
    const lastSection = fields[fields.length - 1];
    
    if (!lastSection?.arrival_airport) {
      toast.error("Please complete the previous segment first");
      return;
    }

    const newSegment = {
      waiting_time: 120,
      departure_airport: lastSection.arrival_airport,
      arrival_airport: "",
      departure_time: undefined,
    };
    
    append(newSegment);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Informazioni base della route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="airline_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Airline Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="AZ" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.toUpperCase())} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="number_route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Route Number</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1930" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                
                    <FormControl>
                      
                    <Input 
                      type="date" 
                      {...field} 
                      value={
                        (() => {
                          const d = field.value instanceof Date ? field.value : field.value ? new Date(field.value) : null;
                          return d && !isNaN(d.getTime()) ? format(d, "yyyy-MM-dd") : "";
                        })()
                      }
                      onChange={e => {
                        const val = e.target.value;
                        const parsed = val ? new Date(val) : null;
                        field.onChange(parsed);
                      }}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                    </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                      
                    <Input 
                      type="date" 
                      {...field} 
                      value={
                        (() => {
                          const d = field.value instanceof Date ? field.value : field.value ? new Date(field.value) : null;
                          return d && !isNaN(d.getTime()) ? format(d, "yyyy-MM-dd") : "";
                        })()
                      }
                      onChange={e => {
                        const val = e.target.value;
                        const parsed = val ? new Date(val) : null;
                        field.onChange(parsed);
                      }}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                    </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Prezzi e delta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="10" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="delta_for_return_route"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Return Route Delta (min)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="120" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                  />
                </FormControl>
                <FormDescription>Minutes after arrival for return route departure</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sezioni del volo */}
        <div className="space-y-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-lg">Flight Segments</h4>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addSegment}
              disabled={fields.length === 0 || !form.getValues(`sections.${fields.length - 1}.arrival_airport`)}
            >
              <IconPlus className="mr-2 h-4 w-4" />
              Add Stopover
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="relative p-6 border rounded-lg space-y-4 bg-card">
              <div className="flex items-center gap-2 mb-4">
                {index === 0 ? (
                  <IconPlaneDeparture className="h-5 w-5 text-blue-600" />
                ) : (
                  <IconPlaneArrival className="h-5 w-5 text-orange-600" />
                )}
                <h5 className="font-medium">
                  {index === 0 ? `Flight Segment 1 (Departure)` : `Stopover Segment ${index + 1}`}
                </h5>
                {index > 0 && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm"
                    onClick={() => remove(index)}
                    className="ml-auto h-8 w-8"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tempo: departure_time per primo segmento, waiting_time per altri */}
                {index === 0 ? (
                  <FormField
                    control={form.control}
                    name={`sections.${index}.departure_time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name={`sections.${index}.waiting_time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waiting Time (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="120" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormDescription>Min 120 minutes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Departure Airport */}
                <FormField
                  control={form.control}
                  name={`sections.${index}.departure_airport`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departure Airport</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="FCO" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value.toUpperCase())}
                          disabled={index > 0}
                          className={cn({ "bg-muted": index > 0 })}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Arrival Airport */}
                <FormField
                  control={form.control}
                  name={`sections.${index}.arrival_airport`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arrival Airport</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="GYD" 
                          {...field} 
                          onChange={e => field.onChange(e.target.value.toUpperCase())} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="outline" onClick={() => document.getElementById("close-route-dialog")?.click()}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Creating..." : "Create Route"}
          </Button>
        </div>
      </form>
    </Form>
  )
}