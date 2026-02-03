"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { api } from "@/lib/api";
// Removed the direct import from @radix-ui/react-dialog to avoid context mismatch
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Imported from local ui/dialog
} from "@/components/ui/dialog";
import { RouteCreationForm } from "./dashboard-form-routes";
import { SeatmapCreationForm } from "./dashboard-form-seatmap";
import FlightCreationForm from "./dashboard-form-flight";
import PricePolicyCreationForm from "./dashboard-form-pricepolicy";
import BaggageRuleCreationForm from "./dashboard-form-baggagerule";
import ClassPricePolicyCreationForm from "./dashboard-form-classpricepolicy";
import ClassBaggagePolicyCreationForm from "./dashboard-form-classbaggagepolicy";
import { Input } from "@/components/ui/input";

export function DataTable({
  initialData,
  view,
}: {
  initialData?: (
    | Aircraft
    | Route
    | Flight
    | PricePolicy
    | BaggageRule
    | ClassPricePolicy
    | ClassBaggagePolicy
  )[];
  view: string;
}) {
  const [isCopying, setIsCopying] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAddRouteOpen, setIsAddRouteOpen] = React.useState(false);
  const [isAddFlightOpen, setIsAddFlightOpen] = React.useState(false);
  const [selectedAircraft, setSelectedAircraft] =
    React.useState<Aircraft | null>(null);
  const [copyAircraftId, setCopyAircraftId] = React.useState<number | null>(
    null
  );
  const [isEditingPricePolicy, setIsEditingPricePolicy] = React.useState(false);
  const [selectedPricePolicy, setSelectedPricePolicy] =
    React.useState<PricePolicy | null>(null);
  const [isEditingBaggageRule, setIsEditingBaggageRule] = React.useState(false);
  const [selectedBaggageRule, setSelectedBaggageRule] =
    React.useState<BaggageRule | null>(null);
  const [isEditingClassPricePolicy, setIsEditingClassPricePolicy] =
    React.useState(false);
  const [selectedClassPricePolicy, setSelectedClassPricePolicy] =
    React.useState<ClassPricePolicy | null>(null);
  const [isEditingClassBaggagePolicy, setIsEditingClassBaggagePolicy] =
    React.useState(false);
  const [selectedClassBaggagePolicy, setSelectedClassBaggagePolicy] =
    React.useState<ClassBaggagePolicy | null>(null);
  const [aircraftList, setAircraftList] = React.useState<
    AircraftCatalog[] | null
  >(null);

  // Fleet columns
  const fleetColumns: ColumnDef<Aircraft>[] = [
    {
      id: "drag",
      header: () => null,
      cell: () => <div className="w-4 h-8 text" />,
    },
    {
      accessorKey: "id_aircraft_airline",
      header: "ID",
      cell: ({ row }) => {
        return (
          <p className="font-bold text-md cursor-default">
            {row.original.id_aircraft_airline}
          </p>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "aircraft.name",
      header: "Aircraft",
      cell: ({ row }) => (
        <div className="w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {row.original?.aircraft?.name || "Unknown"}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "aircraft.max_seats",
      header: () => <div className="w-full">Max Seats</div>,
      cell: ({ row }) => (
        <form
          onSubmit={e => {
            e.preventDefault();
            toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
              loading: `Saving ${row.original.current_position}`,
              success: "Done",
              error: "Error",
            });
          }}
        >
          <Label
            htmlFor={`${row.original.id_aircraft_airline}-max_seats`}
            className="sr-only"
          >
            Max Seats
          </Label>
          <Badge
            variant="outline"
            className="text-muted-foreground px-1.5 mr-2"
          >
            {row.original?.aircraft?.max_seats || 0}
          </Badge>
        </form>
      ),
    },
    {
      accessorKey: "used_seats",
      header: "Used Seats",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5 mr-2">
          {row.original?.used_seats || 0}
        </Badge>
      ),
    },
    {
      accessorKey: "airline.name",
      header: "Airline",
      cell: ({ row }) => <div>{row.original?.airline?.name || "Unknown"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedAircraft(row.original);
                setIsDialogOpen(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                setSelectedAircraft(row.original);
                setIsCopying(true);
              }}
            >
              Make a copy
            </DropdownMenuItem>
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleRemoveAircraft(row.original)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Routes columns
  const routeColumns: ColumnDef<Route>[] = [
    {
      accessorKey: "route_code",
      header: "Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.route_code}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "start_date",
      header: "Start",
      cell: ({ row }) => <div>{row.original.start_date}</div>,
    },
    {
      accessorKey: "end_date",
      header: "End",
      cell: ({ row }) => <div>{row.original.end_date}</div>,
    },
    {
      id: "segments",
      header: "Segments",
      cell: ({ row }) => (
        <div>
          {Array.isArray(row.original.details)
            ? row.original.details.length
            : 0}
        </div>
      ),
    },
    {
      id: "first-route",
      header: "First / Last",
      cell: ({ row }) => {
        const details = row.original.details || [];
        const first = details[0];
        const last = details[details.length - 1];
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {first
                ? `${first.departure_airport} → ${first.arrival_airport}`
                : "-"}
            </span>
            <span className="text-xs text-muted-foreground">
              {last
                ? `${last.departure_airport} → ${last.arrival_airport}`
                : ""}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error(
                  `Delete functionality not implemented yet for ${row.original?.route_code}`
                )
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Fixed Flight columns
  const flightColumns: ColumnDef<Flight>[] = [
    {
      accessorKey: "id_flight",
      header: "Flight Code",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.id_flight}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "route_code",
      header: "Route",
      cell: ({ row }) => <div>{row.original.route_code}</div>,
    },
    {
      accessorKey: "origin",
      header: "Origin",
      cell: ({ row }) => <div>{row.original.origin}</div>,
    },
    {
      accessorKey: "destination",
      header: "Destination",
      cell: ({ row }) => <div>{row.original.destination}</div>,
    },
    {
      accessorKey: "departure_date",
      header: "Departure",
      cell: ({ row }) => <div>{row.original.departure_day}</div>,
    },
    {
      accessorKey: "arrival_date",
      header: "Arrival",
      cell: ({ row }) => <div>{row.original.arrival_day}</div>,
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => <div>{row.original.duration}</div>,
    },
    {
      accessorKey: "base_price",
      header: "Base Price",
      cell: ({ row }) => <div>{row.original.base_price || "N/A"}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Favorite</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error(
                  `Delete functionality not implemented yet for ${row.original?.id_flight}`
                )
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const pricePolicyColumns: ColumnDef<PricePolicy>[] = [
    {
      accessorKey: "fixed_markup",
      header: "Fixed Markup",
      cell: ({ row }) => (
        <div className="font-medium">€{row.original.fixed_markup}</div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "price_for_km",
      header: "Price for KM",
      cell: ({ row }) => <div>€{row.original.price_for_km}/km</div>,
    },
    {
      accessorKey: "fee_for_stopover",
      header: "Fee for Stopover",
      cell: ({ row }) => <div>€{row.original.fee_for_stopover}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedPricePolicy(row.original);
                setIsEditingPricePolicy(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error(
                  "Delete functionality not implemented - each airline can only have one price policy"
                )
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Baggage Rules columns
  const baggageRuleColumns: ColumnDef<BaggageRule>[] = [
    {
      accessorKey: "baggage.name",
      header: "Baggage Type",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.baggage?.name || "Unknown"}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "max_weight_kg",
      header: "Max Weight",
      cell: ({ row }) => (
        <div>
          {row.original.max_weight_kg
            ? `${row.original.max_weight_kg} kg`
            : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "dimensions",
      header: "Dimensions (L×W×H)",
      cell: ({ row }) => (
        <div>
          {row.original.max_length_cm}×{row.original.max_width_cm}×
          {row.original.max_height_cm} cm
        </div>
      ),
    },
    {
      accessorKey: "max_linear_cm",
      header: "Max Linear",
      cell: ({ row }) => (
        <div>
          {row.original.max_linear_cm
            ? `${row.original.max_linear_cm} cm`
            : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "base_price",
      header: "Base Price",
      cell: ({ row }) => <div>€{row.original.base_price}</div>,
    },
    {
      accessorKey: "over_weight_fee",
      header: "Overweight Fee",
      cell: ({ row }) => (
        <div>
          {row.original.over_weight_fee
            ? `€${row.original.over_weight_fee}`
            : "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "over_size_fee",
      header: "Oversize Fee",
      cell: ({ row }) => <div>€{row.original.over_size_fee}</div>,
    },
    {
      accessorKey: "allow_extra",
      header: "Allow Extra",
      cell: ({ row }) => (
        <Badge variant={row.original.allow_extra ? "default" : "secondary"}>
          {row.original.allow_extra ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedBaggageRule(row.original);
                setIsEditingBaggageRule(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error("Delete functionality not implemented yet")
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Class Price Policy columns
  const classPricePolicyColumns: ColumnDef<ClassPricePolicy>[] = [
    {
      accessorKey: "class_seat.name",
      header: "Class Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.class_seat?.name || "Unknown"}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "class_seat.code",
      header: "Class Code",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.class_seat?.code || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "price_multiplier",
      header: "Price Multiplier (%)",
      cell: ({ row }) => <div>{row.original.price_multiplier}%</div>,
    },
    {
      accessorKey: "fixed_markup",
      header: "Fixed Markup (€)",
      cell: ({ row }) => <div>€{row.original.fixed_markup}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedClassPricePolicy(row.original);
                setIsEditingClassPricePolicy(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error("Delete functionality not implemented yet")
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Class Baggage Policy columns
  const classBaggagePolicyColumns: ColumnDef<ClassBaggagePolicy>[] = [
    {
      accessorKey: "class_.name",
      header: "Class",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.class_?.name || "Unknown"}
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "class_.code",
      header: "Class Code",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.class_?.code || "N/A"}
        </Badge>
      ),
    },
    {
      accessorKey: "baggage.name",
      header: "Baggage Type",
      cell: ({ row }) => <div>{row.original.baggage?.name || "Unknown"}</div>,
    },
    {
      accessorKey: "quantity_included",
      header: "Quantity Included",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.quantity_included}</Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedClassBaggagePolicy(row.original);
                setIsEditingClassBaggagePolicy(true);
              }}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                toast.error("Delete functionality not implemented yet")
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const columnsByView: Record<
    string,
    ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[]
  > = {
    Fleet: fleetColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    Routes: routeColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    Flights: flightColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    "Price Policy": pricePolicyColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    "Baggage Rules": baggageRuleColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    "Class Price Policy": classPricePolicyColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
    "Class Baggage Policy": classBaggagePolicyColumns as ColumnDef<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >[],
  };

  function RegularRow({
    row,
  }: {
    row: Row<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >;
  }) {
    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        className="relative z-0"
      >
        {row.getVisibleCells().map(cell => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  function DraggableRow({
    row,
  }: {
    row: Row<
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    >;
  }) {
    return <RegularRow row={row} />;
  }

  const [data, setData] = React.useState<
    (
      | Aircraft
      | Route
      | Flight
      | PricePolicy
      | BaggageRule
      | ClassPricePolicy
      | ClassBaggagePolicy
    )[]
  >(
    () =>
      (initialData ?? []) as (
        | Aircraft
        | Route
        | Flight
        | PricePolicy
        | BaggageRule
        | ClassPricePolicy
        | ClassBaggagePolicy
      )[]
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(() => {
    if (!Array.isArray(data)) return [];

    return data.map((item, index) => {
      if ("id_aircraft_airline" in item) {
        return String((item as Aircraft).id_aircraft_airline);
      }
      if ("route_code" in item) {
        return String((item as Route).route_code);
      }
      if ("id_class_price_policy" in item) {
        return String((item as ClassPricePolicy).id_class_price_policy);
      }
      if ("id_class_baggage_policy" in item) {
        return String((item as ClassBaggagePolicy).id_class_baggage_policy);
      }
      if ("id_baggage_rules" in item) {
        return String((item as BaggageRule).id_baggage_rules);
      }
      if ("fixed_markup" in item) {
        return String((item as PricePolicy).fixed_markup);
      }
      if ("id_flight" in item) {
        return String((item as Flight).id_flight);
      }
      return String(index);
    });
  }, [data]);

  const table = useReactTable({
    data,
    columns: columnsByView[view] || [],
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
    getRowId: (row, index) => {
      if ("id_aircraft_airline" in row) {
        return String((row as Aircraft).id_aircraft_airline);
      }
      if ("route_code" in row) {
        return String((row as Route).route_code);
      }
      if ("id_class_price_policy" in row) {
        return String((row as ClassPricePolicy).id_class_price_policy);
      }
      if ("id_class_baggage_policy" in row) {
        return String((row as ClassBaggagePolicy).id_class_baggage_policy);
      }
      if ("id_baggage_rules" in row) {
        return String((row as BaggageRule).id_baggage_rules);
      }
      if ("fixed_markup" in row) {
        return String((row as PricePolicy).fixed_markup);
      }
      if ("id_flight" in row) {
        return String((row as Flight).id_flight);
      }
      return String(index);
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over) return;
    if (view !== "Fleet") return;
    if (active && over && String(active.id) !== String(over.id)) {
      setData(data => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  function handleRemoveAircraft(row?: Aircraft): React.MouseEventHandler {
    return async e => {
      e?.stopPropagation?.();
      if (!row || !row.id_aircraft_airline) return;
      try {
        await api.delete(
          `/airline/delete/aircraft/${row.id_aircraft_airline}`,
          { airline_code: row?.airline?.iata_code }
        );
        if (!row?.airline?.iata_code) return;
        const response = await api.get<Aircraft[]>(
          `/airline/${row?.airline?.iata_code}/fleet`
        );
        setData(response ?? []);
        toast.success("Aircraft removed successfully!");
      } catch (error: unknown) {
        console.error(error);
        toast.error("Error removing aircraft");
      }
    };
  }

  async function handleAddAircraft(id_aircraft: number) {
    if (!id_aircraft) return;
    const user = await api
      .get<{ airline_code?: string }>("/users/me")
      .catch(() => null);
    const userIataCode = user?.airline_code ?? null;
    try {
      await api.post(`/airline/add/aircraft/${id_aircraft}`, {
        airline_code: userIataCode,
      });
      if (!userIataCode) return;
      const response = await api.get<Aircraft[]>(
        `/airline/${userIataCode}/fleet`
      );
      setData(response ?? []);
      toast.success("Aircraft added successfully!");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error adding aircraft");
    }
  }

  async function handleCopyAircraft(
    id_from: number | undefined,
    id_to: number | null
  ) {
    if (!id_from || !id_to) return;

    const user = await api
      .get<{ airline_code?: string }>("/users/me")
      .catch(() => null);
    const userIataCode = user?.airline_code ?? null;

    try {
      await api.post(`/airline/aircraft/clone-seatmap`, {
        airline_code: userIataCode,
        source_id: id_from,
        target_id: id_to,
      });
      toast.success("Aircraft copied successfully!");
    } catch (error: unknown) {
      console.error(error);
      toast.error("Error copying aircraft");
    }
  }

  async function handleAddRoute() {
    const user = await api
      .get<{ airline_code?: string }>("/users/me")
      .catch(() => null);
    const userIataCode = user?.airline_code ?? null;
    return userIataCode;
  }

  React.useEffect(() => {
    setData(
      (initialData ?? []) as (
        | Aircraft
        | Route
        | Flight
        | PricePolicy
        | BaggageRule
        | ClassPricePolicy
        | ClassBaggagePolicy
      )[]
    );
    // retrieve aircraft list for adding new aircraft
    const fetchAircraftList = async () => {
      try {
        const user = await api.get<{ airline_code?: string }>("/users/me");
        const userIataCode = user?.airline_code ?? null;
        if (userIataCode) {
          const response = await api.get<AircraftCatalog[]>(`/aircraft/`);
          setAircraftList(response ?? []);
        }
      } catch (error) {
        console.error("Error fetching aircraft list:", error);
      }
    };
    fetchAircraftList();
  }, [initialData]);

  async function handleAddFlight() {
    await api.get<{ airline_code?: string }>("/users/me").catch(() => null);
    // const userIataCode = user?.airline_code ?? null;
  }

  function TableSkeleton() {
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="animate-pulse p-8 flex flex-col gap-4">
          <div className="h-6 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-full mb-2" />
          <div className="h-4 bg-muted rounded w-5/6 mb-2" />
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  const isEmpty = !data || data.length === 0;

  return (
    <>
      <Tabs
        defaultValue="outline"
        className="w-full flex-col justify-start gap-6"
      >
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  ?.getAllColumns()
                  .filter(
                    column =>
                      typeof column.accessorFn !== "undefined" &&
                      column.getCanHide()
                  )
                  .map(column => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={value =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {view === "Fleet" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconPlus />
                    <span className="hidden lg:inline">Add Aircraft</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-64 hide-scrollbar"
                >
                  {Array.isArray(aircraftList) && aircraftList.length > 0 ? (
                    aircraftList.map((aircraft: AircraftCatalog, i) => (
                      <DropdownMenuItem
                        key={i}
                        onClick={() => handleAddAircraft(aircraft?.id_aircraft)}
                      >
                        {aircraft?.name || "Unknown Aircraft"}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No aircraft available
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {view === "Routes" && (
              <Dialog open={isAddRouteOpen} onOpenChange={setIsAddRouteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleAddRoute();
                      setIsAddRouteOpen(true);
                    }}
                  >
                    <IconPlus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Add Route</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 no-scrollbar">
                  <DialogHeader>
                    <DialogTitle>Add New Route</DialogTitle>
                    <DialogDescription>
                      Enter the details for your new route.
                    </DialogDescription>
                  </DialogHeader>
                  <RouteCreationForm onClose={() => setIsAddRouteOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            {view === "Flights" && (
              <Dialog open={isAddFlightOpen} onOpenChange={setIsAddFlightOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleAddFlight();
                      setIsAddFlightOpen(true);
                    }}
                  >
                    <IconPlus className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Add Flight</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Add New Flight</DialogTitle>
                    <DialogDescription>
                      Schedule a new flight.
                    </DialogDescription>
                  </DialogHeader>
                  <FlightCreationForm
                    onClose={() => setIsAddFlightOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
            {view === "Price Policy" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="hidden lg:flex"
                    variant="outline"
                    size="sm"
                  >
                    <IconPlus />
                    <span className="hidden lg:inline">Add Price Policy</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add New Price Policy</DialogTitle>
                    <DialogDescription>
                      Configure pricing rules for your airline.
                    </DialogDescription>
                  </DialogHeader>
                  <PricePolicyCreationForm />
                </DialogContent>
              </Dialog>
            )}
            {view === "Baggage Rules" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="hidden lg:flex"
                    variant="outline"
                    size="sm"
                  >
                    <IconPlus />
                    <span className="hidden lg:inline">Add Baggage Rule</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add New Baggage Rule</DialogTitle>
                    <DialogDescription>
                      Configure baggage rules for your airline.
                    </DialogDescription>
                  </DialogHeader>
                  <BaggageRuleCreationForm />
                </DialogContent>
              </Dialog>
            )}
            {view === "Class Price Policy" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="hidden lg:flex"
                    variant="outline"
                    size="sm"
                  >
                    <IconPlus />
                    <span className="hidden lg:inline">
                      Add Class Price Policy
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add New Class Price Policy</DialogTitle>
                    <DialogDescription>
                      Configure pricing for a seat class.
                    </DialogDescription>
                  </DialogHeader>
                  <ClassPricePolicyCreationForm />
                </DialogContent>
              </Dialog>
            )}
            {view === "Class Baggage Policy" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="hidden lg:flex"
                    variant="outline"
                    size="sm"
                  >
                    <IconPlus />
                    <span className="hidden lg:inline">
                      Add Class Baggage Policy
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="min-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add New Class Baggage Policy</DialogTitle>
                    <DialogDescription>
                      Configure included baggage for a seat class.
                    </DialogDescription>
                  </DialogHeader>
                  <ClassBaggagePolicyCreationForm />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent
          value="outline"
          className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
        >
          {isEmpty ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleDragEnd}
                sensors={sensors}
              >
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => {
                          return (
                            <TableHead key={header.id} colSpan={header.colSpan}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody className="**:data-[slot=table-cell]:first:w-8">
                    {table.getRowModel().rows?.length ? (
                      <SortableContext
                        items={dataIds}
                        strategy={verticalListSortingStrategy}
                      >
                        {table.getRowModel().rows.map(row => (
                          <DraggableRow key={row.index} row={row} />
                        ))}
                      </SortableContext>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columnsByView[view]?.length || 1}
                          className="h-24 text-center"
                        >
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          )}
          <div className="flex items-center justify-between px-4">
            <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
              {table.getFilteredRowModel().rows.length} row(s) inside the table.
            </div>
            <div className="flex w-full items-center gap-8 lg:w-fit">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  Rows per page
                </Label>
                <Select
                  value={String(table.getState().pagination?.pageSize ?? 10)}
                  onValueChange={value => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={String(
                        table.getState().pagination?.pageSize ?? 10
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map(pageSize => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  className="size-8"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight />
                </Button>
                <Button
                  variant="outline"
                  className="hidden size-8 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>SeatMap Setup</DialogTitle>
            <DialogDescription>
              Aircraft: {selectedAircraft?.aircraft?.name || "Unknown"}
            </DialogDescription>
          </DialogHeader>
          <SeatmapCreationForm
            aircraft_code={{
              value: String(selectedAircraft?.id_aircraft_airline ?? ""),
            }}
            airline_code={selectedAircraft?.airline?.iata_code || ""}
            cabin_max_cols={selectedAircraft?.aircraft?.cabin_max_cols || 0}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isCopying} onOpenChange={setIsCopying}>
        <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Copy Aircraft</DialogTitle>
            <DialogDescription>
              Choose on which aircraft copy the selected seatmap
              <Input
                type="text"
                inputMode="numeric"
                min="1"
                max=""
                placeholder="Enter aircraft ID"
                onChange={e => setCopyAircraftId(Number(e.target.value))}
              />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCopying(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleCopyAircraft(
                  selectedAircraft?.id_aircraft_airline,
                  copyAircraftId
                );
                setIsCopying(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Price Policy Dialog */}
      <Dialog
        open={isEditingPricePolicy}
        onOpenChange={setIsEditingPricePolicy}
      >
        <DialogContent className="min-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Price Policy</DialogTitle>
            <DialogDescription>
              Modify the pricing rules for your airline.
            </DialogDescription>
          </DialogHeader>
          <PricePolicyCreationForm
            initialData={selectedPricePolicy}
            isEditMode={true}
            onSuccess={() => {
              setIsEditingPricePolicy(false);
              // Trigger a refresh by updating the data
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Baggage Rule Dialog */}
      <Dialog
        open={isEditingBaggageRule}
        onOpenChange={setIsEditingBaggageRule}
      >
        <DialogContent className="min-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Baggage Rule</DialogTitle>
            <DialogDescription>
              Modify the baggage rules for{" "}
              {selectedBaggageRule?.baggage?.name || "this baggage type"}.
            </DialogDescription>
          </DialogHeader>
          <BaggageRuleCreationForm
            initialData={selectedBaggageRule}
            isEditMode={true}
            onSuccess={() => {
              setIsEditingBaggageRule(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Class Price Policy Dialog */}
      <Dialog
        open={isEditingClassPricePolicy}
        onOpenChange={setIsEditingClassPricePolicy}
      >
        <DialogContent className="min-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Class Price Policy</DialogTitle>
            <DialogDescription>
              Modify the pricing for{" "}
              {selectedClassPricePolicy?.class_seat?.name || "this class"}.
            </DialogDescription>
          </DialogHeader>
          <ClassPricePolicyCreationForm
            initialData={selectedClassPricePolicy}
            isEditMode={true}
            onSuccess={() => {
              setIsEditingClassPricePolicy(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Class Baggage Policy Dialog */}
      <Dialog
        open={isEditingClassBaggagePolicy}
        onOpenChange={setIsEditingClassBaggagePolicy}
      >
        <DialogContent className="min-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Class Baggage Policy</DialogTitle>
            <DialogDescription>
              Modify included baggage for{" "}
              {selectedClassBaggagePolicy?.class_?.name || "this class"}.
            </DialogDescription>
          </DialogHeader>
          <ClassBaggagePolicyCreationForm
            initialData={selectedClassBaggagePolicy}
            isEditMode={true}
            onSuccess={() => {
              setIsEditingClassBaggagePolicy(false);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
