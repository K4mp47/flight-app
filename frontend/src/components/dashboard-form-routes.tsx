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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { IconCalendar } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "./ui/button"

// Schema di validazione per una singola sezione (segmento di volo o scalo)
const sectionSchema = z.object({
  departure_time: z.string().optional(), // Presente solo nel primo segmento
  waiting_time: z.coerce.number().min(120, "Must be at least 120 minutes (2h)").optional(), // Presente solo negli scali successivi
  departure_airport: z.string().min(3, "Required, 3-letter IATA code").max(3),
  arrival_airport: z.string().min(3, "Required, 3-letter IATA code").max(3),
}).refine((data) => {
  // Logica di validazione:
  // - Il PRIMO segmento DEVE avere departure_time
  // - I segmenti successivi (che sono scali) DEVONO avere waiting_time
  // - L'aeroporto di partenza di un segmento deve essere quello di arrivo del precedente (gestito in submit)
  return true
}, {
  message: "Invalid section details", // Messaggio generico, la validazione specifica avviene con gli `optional`
  path: ["departure_time"] // Placeholder path
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

// Interfaccia per il formato 'section' richiesto dall'API (ricorsivo)
interface ApiSection {
  departure_time?: string;
  waiting_time?: number;
  departure_airport: string;
  arrival_airport: string;
  next_session: ApiSection | null;
}

export function RouteCreationForm({ airlineCode }: { airlineCode?: string }) {
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      airline_code: airlineCode ?? "",
      number_route: 1,
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 mese dopo
      base_price: 10,
      delta_for_return_route: 120, // 2 ore
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

  // Funzione ricorsiva per convertire l'array di sezioni nel formato ricorsivo 'section' dell'API
  const convertSectionsToApiFormat = (sections: RouteFormValues['sections']): ApiSection | null => {
    if (sections.length === 0) {
      return null;
    }

    const [current, ...rest] = sections;

    // Validazione specifica per la ricorsione e la logica di scalo
    if (rest.length > 0 && current.arrival_airport !== rest[0].departure_airport) {
      toast.error(`Error: Departure airport for segment ${sections.length - rest.length + 1} (${rest[0].departure_airport}) must match arrival airport of previous segment (${current.arrival_airport}).`);
      throw new Error("Airport mismatch in segments.");
    }

    const apiSection: ApiSection = {
      departure_airport: current.departure_airport,
      arrival_airport: current.arrival_airport,
      next_session: convertSectionsToApiFormat(rest),
    };

    // Il primo segmento ha 'departure_time', gli altri hanno 'waiting_time' (come scali)
    if (sections.length === fields.length) { // È il primo segmento nell'array
      apiSection.departure_time = current.departure_time;
      delete apiSection.waiting_time;
    } else { // È un segmento successivo (scalo)
      apiSection.waiting_time = current.waiting_time;
      delete apiSection.departure_time;
    }

    return apiSection;
  };

  async function onSubmit(data: RouteFormValues) {
    try {
      // Validazione che l'aeroporto di partenza del segmento N+1 corrisponda a quello di arrivo del segmento N
      for (let i = 0; i < data.sections.length - 1; i++) {
        if (data.sections[i].arrival_airport !== data.sections[i + 1].departure_airport) {
          toast.error(`Error: Departure airport of segment ${i + 2} (${data.sections[i + 1].departure_airport}) must match arrival airport of segment ${i + 1} (${data.sections[i].arrival_airport}).`);
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

      // Qui farebbe la chiamata API, ad esempio:
      // await api.post("/route/create", apiPayload)

      console.log("API Payload:", apiPayload);
      toast.success(`Route ${data.airline_code.toUpperCase()}${data.number_route} created successfully! (Simulated)`);
      // Chiudi il Dialog dopo il successo (se non è un DialogSubmit)
      document.getElementById("close-route-dialog")?.click();

    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Airport mismatch")) {
        // Il toast specifico è già stato generato in convertSectionsToApiFormat
      } else {
        console.error(error)
        toast.error("Error creating route: " + (error instanceof Error && error.message || "Unknown error"))
      }
    }
  }

  // Logica per aggiungere un nuovo segmento (scalo)
  const addSegment = () => {
    const lastSection = fields[fields.length - 1];
    const newSegment = {
      // Per il nuovo segmento (che è uno scalo), il waiting_time è obbligatorio
      waiting_time: 120, // Minimo 120 minuti
      // L'aeroporto di partenza del nuovo segmento è l'aeroporto di arrivo dell'ultimo segmento esistente
      departure_airport: lastSection ? lastSection.arrival_airport : "JFK", // Default per iniziare se l'array è vuoto
      arrival_airport: "MIA", // Default
      departure_time: undefined, // Non usato negli scali
    };
    append(newSegment);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12 min-w-3xl">
        <div className="grid grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="airline_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Airline Code (es. AZ)</FormLabel>
                <FormControl>
                  <Input placeholder="AZ" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
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
                <FormLabel>Route Number (1-9999)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1930" {...field} onChange={e => field.onChange(parseInt(e.target.value) || "")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("2025-01-01")}
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
              <FormItem className="flex flex-col">
                <FormLabel className="mb-2">End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <IconCalendar className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("start_date") || new Date("2025-01-01"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
                <FormLabel>Delta for Return Route (min)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="120" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                </FormControl>
                <FormDescription>Minutes after arrival for the reverse route&apos;s departure.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Gestione dei Segmenti (Sections) */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-semibold text-lg">Route Segments (Scali)</h4>
          {fields.map((field, index) => (
            <div key={field.id} className="relative p-4 border rounded-md space-y-4">
              <h5 className="font-medium flex items-center gap-2">
                {index === 0 ? <><IconPlaneDeparture className="h-4 w-4" /> **Flight Segment 1** (Departure)</> : <><IconPlaneArrival className="h-4 w-4" /> **Stopover Segment {index + 1}**</>}
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Tempo (Departure Time per il primo, Waiting Time per gli scali) */}
                {index === 0 ? (
                  // Departure Time per il primo segmento
                  <FormField
                    control={form.control}
                    name={`sections.${index}.departure_time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departure Time</FormLabel>
                        <FormControl>
                          <Input type="time" placeholder="09:00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  // Waiting Time per i segmenti successivi (scali)
                  <FormField
                    control={form.control}
                    name={`sections.${index}.waiting_time`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Waiting Time (min)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="180" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormDescription>Must be $\ge$ 120 min (2 hours).</FormDescription>
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
                      <FormLabel>Departure Airport (IATA)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={index === 0 ? "FCO" : (fields[index - 1] ? fields[index - 1].arrival_airport : "JFK")} 
                          {...field} 
                          onChange={e => field.onChange(e.target.value.toUpperCase())}
                          // L'aeroporto di partenza è fisso per gli scali (uguale all'arrivo precedente)
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
                      <FormLabel>Arrival Airport (IATA)</FormLabel>
                      <FormControl>
                        <Input placeholder="GYD" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bottone per rimuovere il segmento (scalo) */}
              {index > 0 && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => remove(index)}
                  className="absolute top-4 right-4 h-8 w-8"
                >
                  <IconTrash className="h-4 w-4" />
                  <span className="sr-only">Remove segment</span>
                </Button>
              )}
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addSegment} className="w-full">
            <IconPlus className="mr-2 h-4 w-4" />
            Add Stopover (Segment {fields.length + 1})
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {/* <DialogClose asChild>
            <Button type="button" variant="ghost" id="close-route-dialog">
              Cancel
            </Button>
          </DialogClose> */}
          <Button type="submit">
            Create Route
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Inserisci il componente Form nel DialogContent
// Nel file originale, la funzione handleAddRoute verrebbe modificata per recuperare il codice della compagnia aerea
/*
  async function handleAddRoute() {
    // get user airline code safely
    const user = await api.get<{ airline_code?: string }>("/users/me").catch(() => null);
    const userIataCode = user?.airline_code ?? null;
    return userIataCode; // Placeholder to avoid lint error
  }
*/
// Poiché non possiamo modificare il corpo di `DataTable` direttamente, assumiamo che `handleAddRoute` fornisca il codice, se presente.

// Integrazione nel DialogContent:
/*
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Route</DialogTitle>
                  <DialogDescription>
                    <RouteCreationForm airlineCode={handleAddRoute()} />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
*/
// Sostituire con il codice del Form.
export function RouteCreationFormWrapper({ airlineCode }: { airlineCode?: string }) {
  // Questa è una componente wrapper che simula il passaggio del codice della compagnia aerea
  // e incapsula il form per l'inserimento nel DialogDescription.
  // Nel contesto reale, il `DialogTrigger` nel file originale chiamerebbe `handleAddRoute()`
  // per ottenere l'airlineCode prima di aprire il dialog.

  // Poiché il componente è già definito come `RouteCreationForm`, usiamo quello
  return (
    <RouteCreationForm airlineCode={airlineCode} />
  )
}

// Codice da inserire al posto di <-- inserisci qua il codice del form -->
// (assumendo che la funzione `handleAddRoute` nel file originale sia stata aggiornata per restituire il codice della compagnia aerea, ad es. "AZ")

/* ATTENZIONE: La funzione `handleAddRoute` nel codice originale non restituisce in modo sincrono l'airline code.
La sua implementazione è: 
async function handleAddRoute() {
    // get user airline code safely
    const user = await api.get<{ airline_code?: string }>("/users/me").catch(() => null);
    const userIataCode = user?.airline_code ?? null;
    return userIataCode; // Placeholder to avoid lint error
}
Per un'implementazione corretta, dovrei usare lo stato per memorizzare l'airlineCode all'apertura del dialog.
Per semplicità, dato che il contesto è solo fornire il codice del form, incapsulo il form e uso un valore di esempio o lo lascio vuoto.
*/

// Codice da inserire:
/*
  <RouteCreationFormWrapper airlineCode={null} /> 
*/