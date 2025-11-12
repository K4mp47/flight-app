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
from ..models.class_price_policy import Class_price_policy
from ..models.airline_price_policy import Airline_price_policy
from ..query.airline_query import *
from ..query.airport_query import get_airport_by_iata_code
from ..query.route_query import get_route_by_airport, find_reverse_route, get_route
from ..query.flight_query import get_routes_assigned_to_aircraft, check_aircraft_schedule_conflicts,get_route_totals, get_route_class_distribution, get_flight_totals, get_flight_class_distribution
from ..utils.geo import *


class Airline_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_airline(self,iata_code, name):
        if get_airline_by_iata_code(self.session,iata_code):
            return {"message": "airline already exists"}, 400
        else:
            return insert_airline(self.session,iata_code, name), 201

    def insert_aircraft(self,airline_code,id_aircraft):

        airline = get_airline_by_iata_code(self.session,airline_code)

        new_aircraft = Aircraft_airline(
            airline_code=airline_code,
            id_aircraft_model=id_aircraft
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

    def insert_block(self,matrix,id_class,id_aircraft_airline):

        if (self.session.get(Class_seat, id_class) is None):
            return {"message": "id_class not found"}, 404
        else:
            num_col_seat = 0
            for value in matrix[0]:
                num_col_seat += 1

            aircraft_max_cols = get_max_cols_aircraft(self.session, id_aircraft_airline)

            if aircraft_max_cols < num_col_seat:
                return {"message": "The proportion of economy seats is too high"}, 400
            else:

                if aircraft_max_cols < len(matrix[0]):
                    return {"message": "exceeded the maximum number of columns available"}, 400
                else:
                    num_seat_matrix = 0
                    for row in matrix:
                        for cell in row:
                            if cell == True:
                                num_seat_matrix += 1

                    num_seat_aircraft = number_seat_aircraft(self.session, id_aircraft_airline)

                    if num_seat_matrix + num_seat_aircraft > get_max_economy_seats(self.session, id_aircraft_airline):
                        return {"message": "exceeded the maximum number of seats available"}, 400
                    else:
                        return insert_block_seat_map(self.session, matrix, id_aircraft_airline, id_class)



    def clone_aircraft_seat_map(self, source_id, target_id):
        
        source_aircraft = self.session.get(Aircraft_airline, source_id)
        target_aircraft = self.session.get(Aircraft_airline, target_id)
        if source_aircraft is None or target_aircraft is None:
            return {"message": "source_id or target_id not found"}, 404
        
        source_model = self.session.get(Aircraft, source_aircraft.id_aircraft_model)
        target_model = self.session.get(Aircraft, target_aircraft.id_aircraft_model)
        if source_model is None or target_model is None:
            return {"message": "Aircraft model not found"}, 404

        if source_model.cabin_max_cols != target_model.cabin_max_cols:
            return {
                "message": (
                    f"Incompatible aircraft cabin layout: "
                    f"source cols={source_model.cabin_max_cols}, "
                    f"target cols={target_model.cabin_max_cols}"
                )
            }, 400


        num_seat_aircraft = number_seat_aircraft(self.session, source_id)
        if num_seat_aircraft > target_model.max_seats:
            return {
                "message": (
                    f"Source aircraft has {num_seat_aircraft} seats, "
                    f"which exceeds target aircraft max_seats={target_model.max_seats}"
                )
            }, 400

        source_cabins = get_aircraft_seat_map(self.session, source_id)
        if not source_cabins:
            return {"message": "No cabins found for source_id"}, 404

        try:
            if aircraft_exists_composition(self.session, target_id):
                delete_aircraft_composition(self.session, target_id)

            new_cabins = []

            for source_cabin in source_cabins:
                new_cabin = Cabin(
                    rows=source_cabin.rows,
                    cols=source_cabin.cols,
                    id_aircraft=target_id,
                    id_class=source_cabin.id_class  
                )
                self.session.add(new_cabin)
                self.session.flush()  

                for cell in source_cabin.cells:
                    new_cell = Cell(
                        id_cabin=new_cabin.id_cabin,
                        x=cell.x,
                        y=cell.y,
                        is_seat=cell.is_seat
                    )
                    self.session.add(new_cell)

                new_cabins.append(new_cabin)

            self.session.commit()

            return {"message": f"Operation successful, {len(new_cabins)} copied blocks"}, 201

        except Exception as e:
            self.session.rollback()
            return {"message": f"Clone failed: {str(e)}"}, 500



    def insert_new_route(self,airline_code, number_route, start_date, end_date, section, delta_for_return_route):
        name_route = airline_code + str(number_route)

        if self.session.get(Route, name_route) is not None:
            return {"message": "route already present in the database"}, 400

        price_policy = self.session.get(Airline_price_policy, airline_code)

        if price_policy is None:
            return {"message": "Before adding a route, add a price policy"}, 400

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
            is_outbound= True,
            base_price=1,
            start_date=start_date,
            end_date=end_date,
        )
        route_return = Route(
            code=name_route_return,
            airline_iata_code=airline_code,
            is_outbound=False,
            base_price=1,
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

        #tot_km and num_stopover used to calculate the base price of the route based on pricing policies
        tot_km = 0
        num_stopover = -1

        while current_section:
            num_stopover += 1
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
            tot_km = tot_km + distance

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

        # price calculation
        price = tot_km * price_policy.price_for_km
        price = price + price_policy.fixed_markup
        price = price + (price_policy.fee_for_stopover * num_stopover)
        price = int(price)

        route_main.base_price = price
        route_return.base_price = price

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

    def insert_flight_schedule(self, route_code, aircraft_id, flight_schedule):

        route = self.session.get(Route, route_code)

        if route is None:
            return {"message": "Route outbound not found"}, 404

        if route.is_outbound == False:
            return {"message": "To enter flights, select the outbound route, NOT the return route."}, 400

        return_route_code = find_reverse_route(self.session, route_code)
        if return_route_code is None:
            return {"message": "Route return not found"}, 404

        if self.session.get(Aircraft_airline, aircraft_id) is None:
            return {"message": "Aircraft not found"}, 404

        for schedule in flight_schedule:
            if schedule.outbound < route.start_date or schedule.outbound > route.end_date:
                return {
                    "message": f"Outbound date {schedule.outbound} is outside the route validity period ({route.start_date} to {route.end_date})"
                }, 400
            if schedule.return_ < route.start_date or schedule.return_ > route.end_date:
                return {
                    "message": f"Return date {schedule.return_} is outside the route validity period ({route.start_date} to {route.end_date})"
                }, 400

        assigned_routes = get_routes_assigned_to_aircraft(self.session, aircraft_id)
        expected_routes = {route_code, return_route_code}

        if assigned_routes:
            assigned_routes_set = set(assigned_routes)
            if assigned_routes_set != expected_routes:
                return {
                    "message": f"Aircraft already assigned to different routes: {assigned_routes}"
                }, 400

        data_route_outbound = get_route(self.session, route_code)
        data_route_return = get_route(self.session, return_route_code)

        # OUTBOUND
        first_segment_outbound = data_route_outbound["segments"][0]
        dep_time_str_outbound = first_segment_outbound["departure_time"]
        dur_str_outbound = data_route_outbound["total_duration"]

        dep_hour_out, dep_min_out = map(int, dep_time_str_outbound.split(":"))
        dur_hour_out, dur_min_out = map(int, dur_str_outbound.split(":"))
        dur_outbound = timedelta(hours=dur_hour_out, minutes=dur_min_out)

        # RETURN
        first_segment_return = data_route_return["segments"][0]
        dep_time_str_return = first_segment_return["departure_time"]
        dur_str_return = data_route_return["total_duration"]

        dep_hour_ret, dep_min_ret = map(int, dep_time_str_return.split(":"))
        dur_hour_ret, dur_min_ret = map(int, dur_str_return.split(":"))
        dur_return = timedelta(hours=dur_hour_ret, minutes=dur_min_ret)

        arrival_dates = []

        for schedule in flight_schedule:
            # OUTBOUND
            full_dep_out = datetime.combine(schedule.outbound, datetime.min.time()).replace(hour=dep_hour_out,
                                                                                            minute=dep_min_out)
            arr_out = full_dep_out + dur_outbound

            # RETURN
            full_dep_ret = datetime.combine(schedule.return_, datetime.min.time()).replace(hour=dep_hour_ret,
                                                                                           minute=dep_min_ret)
            arr_ret = full_dep_ret + dur_return

            arrival_dates.append({
                "outbound_departure": schedule.outbound,
                "outbound_arrival": arr_out.date(),
                "return_departure": schedule.return_,
                "return_arrival": arr_ret.date()
            })

        for ad in arrival_dates:
            dates_to_check = [
                ad["outbound_departure"],
                ad["outbound_arrival"],
                ad["return_departure"],
                ad["return_arrival"]
            ]

            if check_aircraft_schedule_conflicts(self.session, aircraft_id, dates_to_check):
                return {
                    "message": f"Aircraft already scheduled for a flight on one of these dates: {dates_to_check}"
                }, 400

        flights_to_insert = []
        for ad in arrival_dates:
            # Flights outbound
            flights_to_insert.append(Flight(
                id_aircraft=aircraft_id,
                route_code=route_code,
                scheduled_departure_day=ad["outbound_departure"],
                scheduled_arrival_day=ad["outbound_arrival"]
            ))
            # Flights return
            flights_to_insert.append(Flight(
                id_aircraft=aircraft_id,
                route_code=return_route_code,
                scheduled_departure_day=ad["return_departure"],
                scheduled_arrival_day=ad["return_arrival"]
            ))
        self.session.add_all(flights_to_insert)
        self.session.commit()

        return {
            "message": "Flight schedule successfully inserted",
            "flights": arrival_dates
        }, 201

    def insert_class_price_policy(self, id_class, airline_code, price_multiplier, fixed_markup):
        class_ = self.session.get(Class_seat, id_class)

        if class_ is None:
            return {"message": "Class not found"}, 404

        airline = self.session.get(Airline, airline_code)

        if airline is None:
            return {"message": "Airline not found"}, 404

        new_class_price_policy = Class_price_policy(
            id_class = id_class,
            airline_code = airline_code,
            price_multiplier = price_multiplier,
            fixed_markup = fixed_markup
        )

        self.session.add(new_class_price_policy)
        self.session.commit()
        self.session.refresh(new_class_price_policy)

        return {"message": "class price policy inserted successfully", "aircraft": new_class_price_policy.to_dict()}, 201

    def change_class_price_policy(self,id_class_price_policy,price_multiplier, fixed_markup):
        class_price_policy = self.session.get(Class_price_policy, id_class_price_policy)

        if class_price_policy is None:
            return {"message": "Class price policy not found"}, 404

        if price_multiplier is not None or fixed_markup is not None:

            if price_multiplier is not None:
                class_price_policy.price_multiplier = price_multiplier

            if fixed_markup is not None:
                class_price_policy.fixed_markup = fixed_markup

            self.session.commit()

        return {"message": "class price policy has been successfully modified."}, 201

    def insert_price_policy(self, airline_code, fixed_markup, price_for_km, fee_for_stopover):
        airline = self.session.get(Airline, airline_code)
        if airline is None:
            return {"message": "Airline not found"}, 404

        if fixed_markup is None or price_for_km is None or fee_for_stopover is None:
            return {"message": "fixed_markup and price_for_km and fee_for_stopover, they must not be none"}, 400

        new_airline_price_policy = Airline_price_policy(
            airline_code = airline_code,
            fixed_markup = fixed_markup,
            price_for_km = price_for_km,
            fee_for_stopover = fee_for_stopover
        )

        self.session.add(new_airline_price_policy)
        self.session.commit()
        self.session.refresh(new_airline_price_policy)

        return {"message": "price policy inserted successfully",
                "aircraft": new_airline_price_policy.to_dict()}, 201

    def change_price_policy(self,airline_code, fixed_markup, price_for_km, fee_for_stopover):
        airline_price_policy = self.session.get(Airline_price_policy, airline_code)

        if airline_price_policy is None:
            return {"message": "price policy not found"}, 404

        if fixed_markup is not None or price_for_km is not None or fee_for_stopover is not None:

            if fixed_markup is not None:
                airline_price_policy.fixed_markup = fixed_markup

            if price_for_km is not None:
                airline_price_policy.price_for_km = price_for_km

            if fee_for_stopover is not None:
                airline_price_policy.fee_for_stopover = fee_for_stopover

            self.session.commit()

        return {"message": "price policy has been successfully modified."}, 201

    def change_route_base_price(self, route_code, base_price):
        route = self.session.get(Route, route_code)

        if route is None:
            return {"message": "route not found"}, 404

        route.base_price = base_price
        self.session.commit()
        return {"message": "route base price has been successfully modified."}, 201

    def get_route_analytics(self,airline_code: str, data: dict, route_code: str):
        route = self.session.get(Route, route_code)
        if route is None or route.airline_iata_code != airline_code:
            return {"message": "route not found"}, 404

        start_date = data.get("start_date")
        end_date = data.get("end_date")

        totals = get_route_totals(self.session, route_code, start_date, end_date)
        class_distribution = get_route_class_distribution(self.session, route_code, start_date, end_date)

        return {
            "route_code": route_code,
            "passengers": totals["passengers"],
            "revenue": totals["revenue"],
            "class_distribution": class_distribution
        }, 200

    def get_flight_analytics(self,id_flight: int):
        flight = self.session.get(Flight, id_flight)
        if flight is None :
            return {"message": "flight not found"}, 404

        route_code = flight.route_code
        route = self.session.get(Route, route_code)
        if route is None:
            return {"message": "flight not found"}, 404

        totals = get_flight_totals(self.session, id_flight)
        class_distribution = get_flight_class_distribution(self.session, id_flight)

        return {
            "id_flight": id_flight,
            "route_code": route_code,
            "scheduled_departure_day": str(flight.scheduled_departure_day),
            "scheduled_arrival_day": str(flight.scheduled_arrival_day),
            "passengers": totals["passengers"],
            "revenue": totals["revenue"],
            "class_distribution": class_distribution
        }, 200



























