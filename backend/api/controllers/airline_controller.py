from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from ..models import Route_section
from ..models.aircraft import Aircraft
from ..models.aircraft_airlines import Aircraft_airline
from ..models.class_seat import Class_seat
from ..models.route import Route
from ..models.airport import Airport
from ..models.route_detail import Route_detail
from ..models.flight import Flight
from ..query.airline_query import *
from ..query.airport_query import get_airport_by_iata_code
from ..query.route_query import get_route_by_airport, find_reverse_route, get_route
from ..query.flight_query import is_aircraft_available
from ..utils.geo import *

class Airline_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_airline(self,iata_code, name):
        if get_airline_by_iata_code(self.session,iata_code):
            return {"message": "airline already exists"}, 400
        else:
            return insert_airline(self.session,iata_code, name), 201

    def insert_aircraft(self,airline_code,id_aircraft, current_position):

        airline = get_airline_by_iata_code(self.session,airline_code)
        airport = get_airport_by_iata_code(self.session, current_position)

        if airport is None or airline is None:
            return {"message": "airport or airline doesn't exist"}, 400

        else:
            new_aircraft = Aircraft_airline(
                airline_code = airline_code,
                id_aircraft_model = id_aircraft,
                current_position = current_position,
                flying_towards = None
            )


            self.session.add(new_aircraft)
            self.session.commit()
            self.session.refresh(new_aircraft)

            return {"message": "aircraft inserted successfully", "aircraft": new_aircraft.to_dict()}, 201

    def get_airline_fleet(self,iata_code):
        if get_airline_by_iata_code(self.session,iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            return get_fleet_by_airline_code(self.session,iata_code), 200

    def dalete_fleet_aircraft(self,iata_code,id_aircraft_airline):
        if get_airline_by_iata_code(self.session,iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            aircraft = self.session.get(Aircraft_airline, id_aircraft_airline)
            if aircraft:
                self.session.delete(aircraft)
                self.session.commit()
            return {"message": "aircraft deleted from the fleet successfully"}, 200

    def insert_block(self,matrix,proportion_economy_seat,id_class,id_aircraft_airline):

        if (self.session.get(Class_seat, id_class) is None):
            return {"message": "id_class not found"}, 404
        else:
            num_col_seat = 0
            for value in matrix[0]:
                if value == True:
                    num_col_seat += proportion_economy_seat
                else:
                    num_col_seat += 1
            if get_max_cols_aircraft(self.session, id_aircraft_airline) < num_col_seat:
                return {"message": "The proportion of economy seats is too high"}, 400
            else:

                if get_max_cols_aircraft(self.session, id_aircraft_airline) < len(matrix[0]):
                    return {"message": "exceeded the maximum number of columns available"}, 400
                else:

                    num_seat_matrix = 0
                    for row in matrix:
                        for cell in row:
                            if cell == True:
                                num_seat_matrix += 1

                    num_seat_matrix = num_seat_matrix * proportion_economy_seat
                    num_seat_aircraft = number_seat_aircraft(self.session, id_aircraft_airline)

                    if num_seat_matrix + num_seat_aircraft > get_max_economy_seats(self.session, id_aircraft_airline):
                        return {"message": "exceeded the maximum number of seats available"}, 400
                    else:
                        return insert_block_seat_map(self.session, matrix, id_aircraft_airline, id_class,
                                                     proportion_economy_seat)



    def clone_aircraft_seat_map(self, id_source_id, target_id):
        if (self.session.get(Aircraft_airline, id_source_id) is None or
                self.session.get(Aircraft_airline, target_id) is None):
            return {"message": "id_source_id or target_id not found"}, 404

        source_blocks = get_aircraft_seat_map(self.session, id_source_id)
        if not source_blocks:
            return {"message": "No block found for source_id"}, 404

        try:
            if aircraft_exists_composition(self.session, target_id):
                delete_aircraft_composition(self.session, target_id)

            new_blocks = []

            for source_block in source_blocks:
                new_block = Cells_block(
                    rows=source_block.rows,
                    cols=source_block.cols
                )
                self.session.add(new_block)
                self.session.flush()

                for cell in source_block.cells:
                    self.session.add(Cell(
                        x=cell.x,
                        y=cell.y,
                        is_seat=cell.is_seat,
                        id_cell_block=new_block.id_cell_block
                    ))

                composition = source_block.aircraft_compositions[0]
                self.session.add(Aircraft_composition(
                    id_cell_block=new_block.id_cell_block,
                    id_aircraft_airline=target_id,
                    id_class=composition.id_class,
                    proportion_economy_seat=composition.proportion_economy_seat
                ))

                new_blocks.append(new_block)

            self.session.commit()

            return {"message": f"Operation successful, {len(new_blocks)} copied blocks"}, 201

        except Exception as e:
            self.session.rollback()
            return {"message": f"Clone failed: {str(e)}"}, 500



    def insert_new_route(self,airline_code, number_route, start_date, end_date, section, delta_for_return_route):
        name_route = airline_code + str(number_route)

        if self.session.get(Route, name_route) is not None:
            return {"message": "route already present in the database"}, 400

        name_route_return = ""

        if self.session.get(Route, airline_code + str(number_route + 1)) is None:
            name_route_return = airline_code + str(number_route + 1)
        elif self.session.get(Route, airline_code + str(number_route - 1)) is None:
            name_route_return = airline_code + str(number_route - 1)
        else:
            return {"message": "The number chosen for the route is free, but the number for the return route is busy."}, 400

        route_main = Route(
            code=name_route,
            airline_iata_code=airline_code,
            start_date=start_date,
            end_date=end_date
        )
        route_return = Route(
            code=name_route_return,
            airline_iata_code=airline_code,
            start_date=start_date,
            end_date=end_date
        )

        self.session.add_all([route_main, route_return])
        self.session.flush()

        prev_detail = None
        outbound_sections = []
        final_arrival_time = None

        dummy_date = datetime(2025, 1, 1)
        current_section = section
        first_departure_time = section.departure_time  # only in first segment

        current_departure_dt = datetime.combine(dummy_date, first_departure_time)
        waiting_minutes = 0

        while current_section:
            outbound_sections.append(current_section)

            dep_airport = self.session.get(Airport, current_section.departure_airport)
            arr_airport = self.session.get(Airport, current_section.arrival_airport)

            if not dep_airport or not arr_airport:
                raise ValueError("Airport not found")

            route_section = get_route_by_airport(self.session, dep_airport, arr_airport)

            if route_section is None:
                route_section = Route_section(
                    code_departure_airport=dep_airport.iata_code,
                    code_arrival_airport=arr_airport.iata_code
                )
                self.session.add(route_section)
                self.session.flush()

            distance = haversine(
                dep_airport.latitude, dep_airport.longitude,
                arr_airport.latitude, arr_airport.longitude
            )

            departure_time = current_departure_dt.time()
            arrival_time = calculate_arrival_time(departure_time.strftime("%H:%M"), distance)
            final_arrival_time = arrival_time

            new_route_detail = Route_detail(
                code_route=name_route,
                id_route_section=route_section.id_routes_section,
                departure_time=departure_time,
                arrival_time=arrival_time
            )
            self.session.add(new_route_detail)
            self.session.flush()

            if prev_detail:
                prev_detail.id_next = new_route_detail.id_airline_routes
                self.session.flush()

            prev_detail = new_route_detail

            if current_section.next_session:
                arr_dt = datetime.combine(dummy_date, arrival_time)
                waiting_minutes = current_section.next_session.waiting_time
                current_departure_dt = arr_dt + timedelta(minutes=waiting_minutes)

            current_section = current_section.next_session

        # return route

        prev_detail = None
        next_departure_dt = datetime.combine(dummy_date, final_arrival_time) + timedelta(minutes=delta_for_return_route)

        for section in reversed(outbound_sections):
            dep_airport = self.session.get(Airport, section.arrival_airport)
            arr_airport = self.session.get(Airport, section.departure_airport)

            route_section = get_route_by_airport(self.session, dep_airport, arr_airport)

            if route_section is None:
                route_section = Route_section(
                    code_departure_airport=dep_airport.iata_code,
                    code_arrival_airport=arr_airport.iata_code
                )
                self.session.add(route_section)
                self.session.flush()

            distance = haversine(
                dep_airport.latitude, dep_airport.longitude,
                arr_airport.latitude, arr_airport.longitude
            )

            departure_time = next_departure_dt.time()
            arrival_time = calculate_arrival_time(departure_time.strftime("%H:%M"), distance)

            new_detail = Route_detail(
                code_route=name_route_return,
                id_route_section=route_section.id_routes_section,
                departure_time=departure_time,
                arrival_time=arrival_time
            )
            self.session.add(new_detail)
            self.session.flush()

            if prev_detail:
                prev_detail.id_next = new_detail.id_airline_routes
                self.session.flush()

            prev_detail = new_detail
            next_departure_dt = datetime.combine(dummy_date, arrival_time) + timedelta(minutes=waiting_minutes)

        return {"message": f"Route {name_route} and return {name_route_return} created successfully"}, 201

    def change_deadline(self, code, end_date):
        route = self.session.get(Route, code)
        if route is None:
            return {"message": "Route not found"}, 404

        if end_date < date.today():
            return {"message": "End date cannot be before today"}, 400

        if end_date < route.end_date:
            return {"message": "the new date must be later than the old one"}, 400

        route.end_date = end_date

        inverse_code = find_reverse_route(self.session, code)
        if inverse_code:
            inverse_route = self.session.get(Route, inverse_code)
            if inverse_route:
                inverse_route.end_date = end_date

        self.session.commit()

        return {"message": "End date updated successfully"}, 200

    def parse_duration(duration_str):
        hours, minutes = map(int, duration_str.split(":"))
        return timedelta(hours=hours, minutes=minutes)


    def insert_flight_schedule(self, route_code, aircraft_id, flight_schedule):

        if self.session.get(Route, route_code) is None:
            return {"message": "Route outbound not found"}, 404

        return_route_code = find_reverse_route(self.session, route_code)
        if return_route_code is None:
            return {"message": "Route return not found"}, 404

        if self.session.get(Aircraft_airline, aircraft_id) is None:
            return {"message": "Aircraft not found"}, 404

        data_route_outbound = get_route(self.session, route_code)
        data_route_return = get_route(self.session, return_route_code)

        total_duration_outbound = self.parse_duration(data_route_outbound["routes"]["total_duration"])
        total_duration_return = self.parse_duration(data_route_return["routes"]["total_duration"])

        flight_schedules = flight_schedule.get("flight_schedule", [])

        for fs in flight_schedules:
            try:
                dep_out = datetime.strptime(fs["departure_date_outbound"], "%Y-%m-%d").date()
                dep_in = datetime.strptime(fs["departure_date_inbound"], "%Y-%m-%d").date()
            except (ValueError, KeyError):
                raise ValueError("Invalid or missing date format in flight_schedule. Use YYYY-MM-DD.")

            # Calcola orario di partenza e arrivo outbound
            first_outbound_dep_time = datetime.strptime(
                data_route_outbound["routes"]["segments"][0]["departure_time"], "%H:%M"
            ).time()
            dt_outbound_departure = datetime.combine(dep_out, first_outbound_dep_time)
            dt_outbound_arrival = dt_outbound_departure + total_duration_outbound

            # Controllo che inbound date sia coerente con arrivo outbound
            if dt_outbound_arrival.date() != dep_in:
                raise ValueError(
                    f"Invalid inbound date for outbound on {dep_out}. "
                    f"Expected arrival: {dt_outbound_arrival.date()}, got: {dep_in}"
                )

            # Calcola orario di partenza e arrivo ritorno
            first_return_dep_time = datetime.strptime(
                data_route_return["routes"]["segments"][0]["departure_time"], "%H:%M"
            ).time()
            dt_return_departure = datetime.combine(dep_in, first_return_dep_time)
            dt_return_arrival = dt_return_departure + total_duration_return

            # Controlla disponibilità aereo sulle date outbound e inbound
            if not is_aircraft_available(self.session, aircraft_id, dep_out):
                raise ValueError(f"Aircraft already assigned to another flight on {dep_out}")

            if not is_aircraft_available(self.session, aircraft_id, dep_in):
                raise ValueError(f"Aircraft already assigned to another flight on {dep_in}")

            # Aggiungi i voli (andata e ritorno)
            outbound_flight = Flight(
                id_aircraft=aircraft_id,
                route_code=route_code,
                scheduled_departure_day=dep_out,
                scheduled_arrival_day=dt_outbound_arrival.date(),
            )
            return_flight = Flight(
                id_aircraft=aircraft_id,
                route_code=return_route_code,
                scheduled_departure_day=dep_in,
                scheduled_arrival_day=dt_return_arrival.date(),
            )

            self.session.add(outbound_flight)
            self.session.add(return_flight)

        # Commit viene gestito all'esterno nella route
        return {"message": "Flight schedule inserted successfully"}, 201








