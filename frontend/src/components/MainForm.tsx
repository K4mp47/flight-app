"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronsUpDown, PlaneTakeoff, PlaneLanding, Users } from "lucide-react";
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
  dod: z.date({ required_error: "Date of departure required" }),
  dor: z.date({ required_error: "Date of return required" }),
  dpc: z.string({ required_error: "Departure city required" }),
  dpa: z.string({ required_error: "Arrival city required" }),
  class: z.string({ required_error: "Class required" }),
  terms: z.boolean().default(false).optional(),
  adults: z.number().int().min(1, "At least 1 adult required."),
  children: z.number().int().min(0),
  infants: z.number().int().min(0),
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
      adults: 1,
      children: 0,
      infants: 0,
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast.success("Flight search initiated!");
    console.log(data);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 bg-gradient-to-b from-[#1e2022] to-black rounded-2xl shadow-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* --- City Selection --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departure */}
            <FormField
              control={form.control}
              name="dpc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 flex items-center gap-2">
                    <PlaneTakeoff className="w-4 h-4" /> Departure
                  </FormLabel>
                  <Popover open={openDeparture} onOpenChange={setOpenDeparture}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal h-12 bg-[#1e2022] text-white hover:bg-gray-700 transition",
                            !field.value && "text-gray-400"
                          )}
                        >
                          {field.value
                            ? cities.find(c => c.value === field.value)?.label
                            : "Select city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full bg-[#1e2022]  p-0">
                      <div className="flex flex-col">
                        {cities.map(city => (
                          <Button
                            key={city.value}
                            variant="ghost"
                            className="justify-start text-gray-200 hover:bg-gray-800"
                            onClick={() => {
                              field.onChange(city.value);
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

            {/* Arrival */}
            <FormField
              control={form.control}
              name="dpa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 flex items-center gap-2">
                    <PlaneLanding className="w-4 h-4" /> Arrival
                  </FormLabel>
                  <Popover open={openArrival} onOpenChange={setOpenArrival}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-between text-left font-normal h-12 bg-[#1e2022] text-white hover:bg-gray-700 transition",
                            !field.value && "text-gray-400"
                          )}
                        >
                          {field.value
                            ? cities.find(c => c.value === field.value)?.label
                            : "Select city..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full bg-[#1e2022]  p-0">
                      <div className="flex flex-col">
                        {cities.map(city => (
                          <Button
                            key={city.value}
                            variant="ghost"
                            className="justify-start text-gray-200 hover:bg-gray-800"
                            onClick={() => {
                              field.onChange(city.value);
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

          {/* --- Dates --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["dod", "dor"].map((name, idx) => (
              <FormField
                key={name}
                control={form.control}
                name={name as "dod" | "dor"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />{" "}
                      {idx === 0 ? "Departure Date" : "Return Date"}
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-between text-left font-normal h-12 bg-[#1e2022] text-white hover:bg-gray-700 transition",
                              !field.value && "text-gray-400"
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
                      <PopoverContent className="w-auto bg-[#1e2022]  p-2">
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
            ))}
          </div>

          {/* --- Class + Passengers --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Class */}
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Class</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-2 mt-2"
                    >
                      {["First", "Business", "Premium", "Economy"].map(cls => (
                        <FormItem
                          key={cls}
                          className="flex items-center space-x-2 rounded-md bg-[#1e2022] border px-3 py-2 hover:bg-[#303336] transition"
                        >
                          <FormControl>
                            <RadioGroupItem value={cls} />
                          </FormControl>
                          <FormLabel className="text-sm text-gray-200 font-normal">
                            {cls}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Passengers */}
            <div className="space-y-3">
              <FormLabel className="text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" /> Passengers
              </FormLabel>
              {["adults", "children", "infants"].map((type, i) => (
                <FormField
                  key={i}
                  control={form.control}
                  name={type as "adults" | "children" | "infants"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-gray-400 capitalize">
                        {type}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={8}
                          value={field.value}
                          onChange={e => field.onChange(Number(e.target.value))}
                          className="bg-gray-800 text-white h-10 focus:ring-1 focus:ring-white transition"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* --- Terms --- */}
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
                <FormLabel className="text-gray-300 text-sm">
                  I accept the terms and conditions
                </FormLabel>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-12 text-black bg-white font-semibold rounded-lg hover:bg-gray-200 transition-all"
          >
            Search Flights
          </Button>
        </form>
      </Form>
    </div>
  );
}
export default MainForm;