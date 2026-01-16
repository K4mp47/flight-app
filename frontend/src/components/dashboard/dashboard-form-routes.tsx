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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
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

export function RouteCreationForm({ airlineCode, onClose }: { airlineCode?: string, onClose?: () => void }) {
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
      
      onClose?.();

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Informazioni base della route */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="airline_code"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>Airline Code</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="AZ" 
                    {...field} 
                    onChange={e => field.onChange(e.target.value.toUpperCase())} 
                    className="h-10"
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
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>Route Number</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="1930" 
                    {...field} 
                    className="h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Prezzi e delta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>Base Price (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="10" 
                    {...field} 
                    className="h-10"
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
              <FormItem className="flex flex-col space-y-2">
                <FormLabel>Return Route Delta (min)</FormLabel>
                <FormControl>
                  <Input 
                    type="text" 
                    inputMode="numeric"
                    placeholder="120" 
                    {...field} 
                    className="h-10"
                  />
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Minutes after arrival for return route departure
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sezioni del volo */}
        <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3">
            <h4 className="font-semibold text-lg">Flight Segments</h4>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addSegment}
              disabled={fields.length === 0 || !form.getValues(`sections.${fields.length - 1}.arrival_airport`)}
            >
              <IconPlus className="mr-2 h-4 w-4" />
              Add Stopover
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="relative p-3 sm:p-4 md:p-6 border rounded-lg space-y-3 sm:space-y-4 bg-card">
              <div className="flex items-center gap-2">
                {index === 0 ? (
                  <IconPlaneDeparture className="h-4 w-4 sm:h-5 sm:w-5 text-ring shrink-0" />
                ) : (
                  <IconPlaneArrival className="h-4 w-4 sm:h-5 sm:w-5 text-ring shrink-0" />
                )}
                <h5 className="font-medium text-sm sm:text-base line-clamp-1">
                  {index === 0 ? `Flight Segment` : `Stopover Segment ${index + 1}`}
                </h5>
                {index > 0 && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon"
                    onClick={() => remove(index)}
                    className="ml-auto h-7 w-7 sm:h-8 sm:w-8 shrink-0 bg-input!"
                  >
                    <IconTrash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Tempo: departure_time per primo segmento, waiting_time per altri */}
                {index === 0 ? (
                  <FormField
                    control={form.control}
                    name={`sections.${index}.departure_time`}
                    render={({ field }) => (
                      <FormItem className="flex flex-col space-y-2">
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <TimePicker 
                            value={field.value} 
                            onChange={field.onChange}
                          />
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
                      <FormItem className="flex flex-col space-y-2">
                        <FormLabel>Waiting Time (min)</FormLabel>
                        <FormControl>
                          <Input 
                            type="text"
                            inputMode="numeric"
                            placeholder="120" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Min 120 minutes</FormDescription>
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
                    <FormItem className="flex flex-col space-y-2">
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
                    <FormItem className="flex flex-col space-y-2">
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

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 sm:pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto h-10">
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto h-10">
            {form.formState.isSubmitting ? "Creating..." : "Create Route"}
          </Button>
        </div>
      </form>
    </Form>
  )
}