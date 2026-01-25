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

// Validation schema for Price Policy
const formSchema = z.object({
  fixed_markup: z.coerce.number().min(0, "Fixed markup must be non-negative"),
  price_for_km: z.coerce.number().min(0, "Price per km must be non-negative"),
  fee_for_stopover: z.coerce.number().min(0, "Fee for stopover must be non-negative"),
})

type PricePolicyFormValues = z.infer<typeof formSchema>

interface PricePolicyCreationFormProps {
  initialData?: PricePolicy | null
  isEditMode?: boolean
  onSuccess?: () => void
}

export function PricePolicyCreationForm({ 
  initialData, 
  isEditMode = false,
  onSuccess 
}: PricePolicyCreationFormProps) {
  const form = useForm<PricePolicyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fixed_markup: initialData?.fixed_markup ?? 10,
      price_for_km: initialData?.price_for_km ?? 0.05,
      fee_for_stopover: initialData?.fee_for_stopover ?? 20,
    },
    mode: "onChange",
  })

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        fixed_markup: initialData.fixed_markup,
        price_for_km: initialData.price_for_km,
        fee_for_stopover: initialData.fee_for_stopover,
      })
    }
  }, [initialData, form])

  async function onSubmit(data: PricePolicyFormValues) {
    try {
      // Get the current user's airline code
      const user = await api.get<{ airline_code?: string }>("/users/me").catch(() => null)
      const airlineCode = user?.airline_code

      if (!airlineCode) {
        toast.error("Could not determine your airline. Please try again.")
        return
      }

      const apiPayload = {
        fixed_markup: data.fixed_markup,
        price_for_km: data.price_for_km,
        fee_for_stopover: data.fee_for_stopover,
      }

      console.log("API Payload:", JSON.stringify(apiPayload, null, 2))
      
      if (isEditMode) {
        await api.put(`/airline/${encodeURIComponent(airlineCode)}/price-policy/modify`, apiPayload)
        toast.success("Price policy updated successfully!")
      } else {
        await api.post(`/airline/${encodeURIComponent(airlineCode)}/add/price-policy`, apiPayload)
        toast.success("Price policy created successfully!")
      }
      
      // Call onSuccess callback if provided
      onSuccess?.()
      
      // Close the dialog if needed
      document.getElementById("close-pricepolicy-dialog")?.click()

    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} price policy:`, error)
      toast.error(`Error ${isEditMode ? 'updating' : 'creating'} price policy: ` + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fixed Markup */}
          <FormField
            control={form.control}
            name="fixed_markup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fixed Markup (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Base fee added to every ticket
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price per KM */}
          <FormField
            control={form.control}
            name="price_for_km"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price per KM (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="0.05"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Cost multiplied by total distance
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fee for Stopover */}
          <FormField
            control={form.control}
            name="fee_for_stopover"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee per Stopover (€)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="20.00"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Additional fee for each stopover
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Price Formula Explanation */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Price Formula:</strong> base_price = fixed_markup + (total_km × price_for_km) + (stopovers × fee_for_stopover)
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting 
              ? (isEditMode ? "Updating..." : "Creating...") 
              : (isEditMode ? "Update Price Policy" : "Create Price Policy")
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default PricePolicyCreationForm
