import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { toast } from "sonner"
import { Button } from "./ui/button"
import { api } from "@/lib/api"
import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Validation schema for Class Baggage Policy
const formSchema = z.object({
  id_baggage_type: z.coerce.number().min(1, "Baggage type is required"),
  id_class: z.coerce.number().min(1, "Class is required"),
  quantity_included: z.coerce.number().min(0, "Quantity must be 0 or greater"),
})

type ClassBaggagePolicyFormValues = z.infer<typeof formSchema>

// Baggage types - in a real app, fetch these from the backend
const BAGGAGE_TYPES = [
  { id: 1, name: "Cabin Bag" },
  { id: 2, name: "Checked Bag" },
  { id: 3, name: "Personal Item" },
]

// Seat classes - in a real app, fetch these from the backend
const SEAT_CLASSES = [
  { id: 1, code: "F", name: "First" },
  { id: 2, code: "J", name: "Business" },
  { id: 3, code: "W", name: "Premium Economy" },
  { id: 4, code: "Y", name: "Economy" },
]

interface ClassBaggagePolicyCreationFormProps {
  initialData?: ClassBaggagePolicy | null
  isEditMode?: boolean
  onSuccess?: () => void
}

export function ClassBaggagePolicyCreationForm({ 
  initialData, 
  isEditMode = false,
  onSuccess 
}: ClassBaggagePolicyCreationFormProps) {
  const form = useForm<ClassBaggagePolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_baggage_type: initialData?.baggage?.id_baggage ?? 1,
      id_class: initialData?.class_?.id_class ?? 1,
      quantity_included: initialData?.quantity_included ?? 1,
    },
    mode: "onChange",
  })

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        id_baggage_type: initialData.baggage?.id_baggage ?? 1,
        id_class: initialData.class_?.id_class ?? 1,
        quantity_included: initialData.quantity_included,
      })
    }
  }, [initialData, form])

  async function onSubmit(data: ClassBaggagePolicyFormValues) {
    try {
      // Get the current user's airline code
      const user = await api.get<{ airline_code?: string }>("/users/me").catch(() => null)
      const airlineCode = user?.airline_code

      if (!airlineCode) {
        toast.error("Could not determine your airline. Please try again.")
        return
      }

      if (isEditMode && initialData) {
        // PUT request for updating
        const apiPayload = {
          id_class_baggage_policy: initialData.id_class_baggage_policy,
          airline_code: airlineCode,
          quantity_included: data.quantity_included,
        }

        console.log("API Payload (PUT):", JSON.stringify(apiPayload, null, 2))
        await api.put("/baggage/class-policy", apiPayload)
        toast.success("Class baggage policy updated successfully!")
      } else {
        // POST request for creating
        const apiPayload = {
          airline_code: airlineCode,
          id_baggage_type: data.id_baggage_type,
          id_class: data.id_class,
          quantity_included: data.quantity_included,
        }

        console.log("API Payload (POST):", JSON.stringify(apiPayload, null, 2))
        await api.post("/baggage/class-policy", apiPayload)
        toast.success("Class baggage policy created successfully!")
      }
      
      onSuccess?.()
      document.getElementById("close-classbaggagepolicy-dialog")?.click()

    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} class baggage policy:`, error)
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} class baggage policy: ` + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Class and Baggage Type Selection - only show for create mode */}
        {!isEditMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="id_class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Class</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select seat class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SEAT_CLASSES.map((cls) => (
                        <SelectItem key={cls.id} value={String(cls.id)}>
                          {cls.name} ({cls.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The cabin class for this policy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_baggage_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Baggage Type</FormLabel>
                  <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select baggage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BAGGAGE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of baggage included
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Show class and baggage info in edit mode */}
        {isEditMode && initialData && (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Editing policy for:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="font-medium">{initialData.class_?.name} ({initialData.class_?.code})</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Baggage Type</p>
                <p className="font-medium">{initialData.baggage?.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Included */}
        <FormField
          control={form.control}
          name="quantity_included"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Included</FormLabel>
              <FormControl>
                <Input type="number" min="0" placeholder="1" {...field} />
              </FormControl>
              <FormDescription>
                Number of pieces of this baggage type included in the ticket price for this class
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Class Baggage Policy" : "Create Class Baggage Policy")
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default ClassBaggagePolicyCreationForm
