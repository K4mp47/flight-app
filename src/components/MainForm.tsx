'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useState } from 'react';

const FormSchema = z.object({
  dod: z.date({
    required_error: 'A date of birth is required.',
  }),
  dor: z.date({
    required_error: 'A date of return is required.',
  }),
  dpc: z.string({
    required_error: 'A city of departure is required.',
  }),
  dpa: z.string({
    required_error: 'A city of return is required.',
  }),
  class: z.string({
    required_error: 'A class is required.',
  }),
  terms: z.boolean().default(false).optional(),
  adults: z.number().int().min(0, 'A number of adults is required.'),
  children: z.number().int().min(0, 'A number of children is required.'),
  infants: z.number().int().min(0, 'A number of infants is required.'),
});

const cities = [
  {
    value: 'new-york',
    label: 'New York',
  },
  {
    value: 'los-angeles',
    label: 'Los Angeles',
  },
  {
    value: 'chicago',
    label: 'Chicago',
  },
  {
    value: 'houston',
    label: 'Houston',
  },
  {
    value: 'miami',
    label: 'Miami',
  },
];

export function MainForm() {
  const [open1, setOpen1] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast('You submitted!');
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="dpc"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Departure</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 justify-between text-left  font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? cities.find(
                              departureCity =>
                                departureCity.value === field.value
                            )?.label
                          : 'Select the city...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col">
                      {cities.map(departureCity => (
                        <Button
                          key={departureCity.value}
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            field.onChange(
                              departureCity.value === field.value
                                ? ''
                                : departureCity.value
                            );
                            setOpen(false);
                          }}
                        >
                          {departureCity.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>Select the departure city.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dpa"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Arrival</FormLabel>
                <Popover open={open1} onOpenChange={setOpen1}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 justify-between text-left  font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value
                          ? cities.find(
                              departureCity =>
                                departureCity.value === field.value
                            )?.label
                          : 'Select the city...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col">
                      {cities.map(departureCity => (
                        <Button
                          key={departureCity.value}
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            field.onChange(
                              departureCity.value === field.value
                                ? ''
                                : departureCity.value
                            );
                            setOpen1(false);
                          }}
                        >
                          {departureCity.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <FormDescription>Select the arrival city.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="dod"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Departure</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
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
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Your date of departure.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dor"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Arrival</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
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
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Your date of arrival.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4">
          <div className="grid gap-4">
            <FormField
              control={form.control}
              name="class"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Class</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="First" />
                        </FormControl>
                        <FormLabel className="font-normal">First </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Business" />
                        </FormControl>
                        <FormLabel className="font-normal">Business </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Premium" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Premium Economy
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="Economy" />
                        </FormControl>
                        <FormLabel className="font-normal">Economy</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormDescription>The class of the flight.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end space-x-2 mb-4">
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        id="terms"
                        checked={field.value} // Use 'checked' instead of 'value'
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Accept terms and conditions
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <FormField
            control={form.control}
            name="adults"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Adults</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    onChange={e => field.onChange(Number(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>The number of adults.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="children"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Children</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    onChange={e => field.onChange(Number(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>The number of children.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="infants"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Children</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    onChange={e => field.onChange(Number(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>The number of children.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
