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
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Validation schema for Baggage Rule
const formSchema = z.object({
  id_baggage_type: z.coerce.number().min(1, "Baggage type is required"),
  max_weight_kg: z.coerce.number().min(1, "Max weight must be positive").optional().nullable(),
  max_length_cm: z.coerce.number().min(1, "Max length must be positive"),
  max_width_cm: z.coerce.number().min(1, "Max width must be positive"),
  max_height_cm: z.coerce.number().min(1, "Max height must be positive"),
  max_linear_cm: z.coerce.number().min(1, "Max linear must be positive").optional().nullable(),
  over_weight_fee: z.coerce.number().min(0, "Fee must be non-negative").optional().nullable(),
  over_size_fee: z.coerce.number().min(0, "Fee must be non-negative"),
  base_price: z.coerce.number().gt(0, "Base price must be greater than 0"),
  allow_extra: z.boolean(),
})

type BaggageRuleFormValues = z.infer<typeof formSchema>

// Baggage types - in a real app, fetch these from the backend
const BAGGAGE_TYPES = [
  { id: 1, name: "Cabin Bag" },
  { id: 2, name: "Checked Bag" },
  { id: 3, name: "Personal Item" },
]

interface BaggageRuleCreationFormProps {
  initialData?: BaggageRule | null
  isEditMode?: boolean
  onSuccess?: () => void
}

export function BaggageRuleCreationForm({ 
  initialData, 
  isEditMode = false,
  onSuccess 
}: BaggageRuleCreationFormProps) {
  const form = useForm<BaggageRuleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id_baggage_type: initialData?.baggage?.id_baggage ?? 1,
      max_weight_kg: initialData?.max_weight_kg ?? 10,
      max_length_cm: initialData?.max_length_cm ?? 55,
      max_width_cm: initialData?.max_width_cm ?? 40,
      max_height_cm: initialData?.max_height_cm ?? 20,
      max_linear_cm: initialData?.max_linear_cm ?? 115,
      over_weight_fee: initialData?.over_weight_fee ?? 30,
      over_size_fee: initialData?.over_size_fee ?? 50,
      base_price: initialData?.base_price ?? 25,
      allow_extra: initialData?.allow_extra ?? false,
    },
    mode: "onChange",
  })

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        id_baggage_type: initialData.baggage?.id_baggage ?? 1,
        max_weight_kg: initialData.max_weight_kg,
        max_length_cm: initialData.max_length_cm,
        max_width_cm: initialData.max_width_cm,
        max_height_cm: initialData.max_height_cm,
        max_linear_cm: initialData.max_linear_cm,
        over_weight_fee: initialData.over_weight_fee,
        over_size_fee: initialData.over_size_fee,
        base_price: initialData.base_price,
        allow_extra: initialData.allow_extra,
      })
    }
  }, [initialData, form])

  async function onSubmit(data: BaggageRuleFormValues) {
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
          id_baggage_rules: initialData.id_baggage_rules,
          airline_code: airlineCode,
          max_weight_kg: data.max_weight_kg || null,
          max_length_cm: data.max_length_cm,
          max_width_cm: data.max_width_cm,
          max_height_cm: data.max_height_cm,
          max_linear_cm: data.max_linear_cm || null,
          over_weight_fee: data.over_weight_fee || null,
          over_size_fee: data.over_size_fee,
          base_price: data.base_price,
          allow_extra: data.allow_extra,
        }

        console.log("API Payload (PUT):", JSON.stringify(apiPayload, null, 2))
        await api.put("/baggage/rules", apiPayload)
        toast.success("Baggage rule updated successfully!")
      } else {
        // POST request for creating
        const apiPayload = {
          id_baggage_type: data.id_baggage_type,
          airline_code: airlineCode,
          max_weight_kg: data.max_weight_kg || null,
          max_length_cm: data.max_length_cm,
          max_width_cm: data.max_width_cm,
          max_height_cm: data.max_height_cm,
          max_linear_cm: data.max_linear_cm || null,
          over_weight_fee: data.over_weight_fee || null,
          over_size_fee: data.over_size_fee,
          base_price: data.base_price,
          allow_extra: data.allow_extra,
        }

        console.log("API Payload (POST):", JSON.stringify(apiPayload, null, 2))
        await api.post("/baggage/rules", apiPayload)
        toast.success("Baggage rule created successfully!")
      }
      
      onSuccess?.()
      document.getElementById("close-baggagerule-dialog")?.click()

    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} baggage rule:`, error)
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} baggage rule: ` + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Baggage Type - only show for create mode */}
        {!isEditMode && (
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
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="max_length_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Length (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="55" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_width_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Width (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="40" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_height_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="max_linear_cm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Linear (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="115" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormDescription>L+W+H combined</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Weight and Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField
            control={form.control}
            name="max_weight_kg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="base_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="over_weight_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overweight Fee (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="over_size_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Oversize Fee (€)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Allow Extra Toggle */}
        <FormField
          control={form.control}
          name="allow_extra"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Allow Extra Baggage</FormLabel>
                <FormDescription>
                  Allow passengers to purchase additional baggage of this type
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Baggage Rule" : "Create Baggage Rule")
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default BaggageRuleCreationForm
