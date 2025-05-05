"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const FormSchema = z.object({
  dod: z.date({
    required_error: "A date of departure is required.",
  }),
  dor: z.date({
    required_error: "A date of return is required.",
  }),
  dpc: z.string({
    required_error: "A city of departure is required.",
  }),
  dpa: z.string({
    required_error: "A city of arrival is required.",
  }),
  class: z.string({
    required_error: "A class is required.",
  }),
  terms: z.boolean().default(false).optional(),
  adults: z.number().int().min(0, "A number of adults is required."),
  children: z.number().int().min(0, "A number of children is required."),
  infants: z.number().int().min(0, "A number of infants is required."),
});

const cities = [
  { value: "new-york", label: "New York" },
  { value: "los-angeles", label: "Los Angeles" },
  { value: "chicago", label: "Chicago" },
  { value: "houston", label: "Houston" },
  { value: "miami", label: "Miami" },
];

export function MainForm() {
  const [openDeparture, setOpenDeparture] = useState(false);
  const [openArrival, setOpenArrival] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      adults: 0,
      children: 0,
      infants: 0,
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast("You submitted!");
    console.log(data);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 flex flex-col items-center w-full">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 w-full"
        >
          {/* Cities Selection */}
          <div className="w-full space-y-6">
            <FormField
              control={form.control}
              name="dpc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Departure
                  </FormLabel>
                  <Popover open={openDeparture} onOpenChange={setOpenDeparture}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal bg-transparent border border-gray-700 rounded-md h-12",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? cities.find(city => city.value === field.value)
                                ?.label
                            : "Select the city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="flex flex-col">
                        {cities.map(city => (
                          <Button
                            key={city.value}
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              field.onChange(
                                city.value === field.value ? "" : city.value
                              );
                              setOpenDeparture(false);
                            }}
                          >
                            {city.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Arrival</FormLabel>
                  <Popover open={openArrival} onOpenChange={setOpenArrival}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal bg-transparent border border-gray-700 rounded-md h-12",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? cities.find(city => city.value === field.value)
                                ?.label
                            : "Select the city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="flex flex-col">
                        {cities.map(city => (
                          <Button
                            key={city.value}
                            variant="ghost"
                            className="justify-start"
                            onClick={() => {
                              field.onChange(
                                city.value === field.value ? "" : city.value
                              );
                              setOpenArrival(false);
                            }}
                          >
                            {city.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates Selection */}
          <div className="w-full space-y-6">
            <FormField
              control={form.control}
              name="dod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Date of Departure
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal bg-transparent border border-gray-700 rounded-md h-12",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MMM d, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={date =>
                          date < new Date() || date < new Date("1900-01-01")
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
              name="dor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Date of Return
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal bg-transparent border border-gray-700 rounded-md h-12",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "MMM d, yyyy")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={date =>
                          date < new Date() || date < new Date("1900-01-01")
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

          {/* Class Selection */}
          <div className="w-full space-y-6">
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Flight Class
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2 mt-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="First" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          First
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Business" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          Business
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Premium" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          Premium Economy
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Economy" />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">
                          Economy
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Passenger Count */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="adults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Adults
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={8}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value}
                        className="bg-transparent border border-gray-700 rounded-md h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="children"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Children
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={8}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value}
                        className="bg-transparent border border-gray-700 rounded-md h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="infants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Infants
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={8}
                        onChange={e => field.onChange(Number(e.target.value))}
                        value={field.value}
                        className="bg-transparent border border-gray-700 rounded-md h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      id="terms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium leading-none">
                    Accept terms and conditions
                  </FormLabel>
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 mt-2 bg-white text-black hover:bg-gray-200 rounded-md font-medium"
          >
            Search Flights
          </Button>
        </form>
      </Form>
    </div>
  );
}
