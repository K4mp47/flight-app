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

// Validation schema for Class Price Policy
const formSchema = z.object({
  id_class: z.coerce.number().min(1, "Class is required"),
  price_multiplier: z.coerce.number().gt(0, "Price multiplier must be greater than 0"),
  fixed_markup: z.coerce.number().int("Fixed markup must be an integer"),
})

type ClassPricePolicyFormValues = z.infer<typeof formSchema>

// Seat classes - in a real app, fetch these from the backend
const SEAT_CLASSES = [
  { id: 1, code: "F", name: "First" },
  { id: 2, code: "J", name: "Business" },
  { id: 3, code: "W", name: "Premium Economy" },
  { id: 4, code: "Y", name: "Economy" },
]

interface ClassPricePolicyCreationFormProps {
  initialData?: ClassPricePolicy | null
  isEditMode?: boolean
  onSuccess?: () => void
}

export function ClassPricePolicyCreationForm({ 
  initialData, 
  isEditMode = false,
  onSuccess 
}: ClassPricePolicyCreationFormProps) {
  const form = useForm<ClassPricePolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_class: initialData?.class_seat?.id_class ?? 1,
      price_multiplier: initialData?.price_multiplier ?? 1,
      fixed_markup: initialData?.fixed_markup ?? 0,
    },
    mode: "onChange",
  })

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        id_class: initialData.class_seat?.id_class ?? 1,
        price_multiplier: initialData.price_multiplier,
        fixed_markup: initialData.fixed_markup,
      })
    }
  }, [initialData, form])

  async function onSubmit(data: ClassPricePolicyFormValues) {
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
          airline_code: airlineCode,
          price_multiplier: data.price_multiplier,
          fixed_markup: data.fixed_markup,
        }

        console.log("API Payload (PUT):", JSON.stringify(apiPayload, null, 2))
        await api.put(`/airline/class-price-policy/${initialData.id_class_price_policy}/modify`, apiPayload)
        toast.success("Class price policy updated successfully!")
      } else {
        // POST request for creating
        const apiPayload = {
          id_class: data.id_class,
          airline_code: airlineCode,
          price_multiplier: data.price_multiplier,
          fixed_markup: data.fixed_markup,
        }

        console.log("API Payload (POST):", JSON.stringify(apiPayload, null, 2))
        await api.post("/airline/add-class-price-policy", apiPayload)
        toast.success("Class price policy created successfully!")
      }
      
      onSuccess?.()
      document.getElementById("close-classpricepolicy-dialog")?.click()

    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} class price policy:`, error)
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} class price policy: ` + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Class Selection - only show for create mode */}
        {!isEditMode && (
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
                  Select the cabin class to configure pricing for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Show class name in edit mode */}
        {isEditMode && initialData && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Editing pricing for:</p>
            <p className="font-medium text-lg">{initialData.class_seat?.name} ({initialData.class_seat?.code})</p>
          </div>
        )}

        {/* Pricing Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price_multiplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Multiplier (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" placeholder="20" {...field} />
                </FormControl>
                <FormDescription>
                  Percentage markup applied to base ticket price
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fixed_markup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Markup (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" {...field} />
                </FormControl>
                <FormDescription>
                  Fixed surcharge added to ticket price
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Class Price Policy" : "Create Class Price Policy")
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default ClassPricePolicyCreationForm
