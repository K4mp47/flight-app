from datetime import timedelta

import sqlalchemy
from sqlalchemy import select, or_, and_, true, func
from flask_sqlalchemy.session import Session
from collections import defaultdict, Counter

from sqlalchemy.orm import aliased

from ..models.flight import Flight
from ..models.route import Route
from ..models.route_detail import Route_detail
from ..models.route_section import Route_section
from ..models.aircraft_airlines import Aircraft_airline
from ..models.ticket import Ticket
from ..models.cell import Cell
from ..models.class_seat import Class_seat
from ..models.passenger import Passenger
from ..models.passenger_ticket import Passenger_ticket
from ..models.cabin import Cabin


def check_aircraft_schedule_conflicts(session, aircraft_id, dates_to_check):
    stmt = select(Flight).where(
        Flight.id_aircraft == aircraft_id,
        or_(
            Flight.scheduled_departure_day.in_(dates_to_check),
            Flight.scheduled_arrival_day.in_(dates_to_check)
        )
    )
    existing_flight = session.execute(stmt).scalars().first()
    return existing_flight is not None


def get_routes_assigned_to_aircraft(session: Session, id_aircraft: int) -> list[str] | None:
    stmt = (
        select(Flight.route_code)
        .where(Flight.id_aircraft == id_aircraft)
        .distinct()
    )
    result = session.scalars(stmt).all()
    return result if result else None

def get_flight_for_search(session: Session, departure_airport: str, arrival_airport: str, departure_date, direct_flights, id_class: int):
    # STEP 1: Ottieni tutti i dettagli delle rotte
    stmt = (
        select(
            Route_detail.code_route,
            Route_detail.id_airline_routes,
            Route_detail.id_next,
            Route_section.code_departure_airport,
            Route_section.code_arrival_airport
        )
        .join(Route_section, Route_detail.id_route_section == Route_section.id_routes_section)
    )
    results = session.execute(stmt).all()

    # STEP 2: Raggruppa per code_route
    route_segments = defaultdict(list)
    id_to_segment = {}

    for code_route, id_segment, id_next, dep, arr in results:
        seg = {
            "id": id_segment,
            "next": id_next,
            "from": dep,
            "to": arr
        }
        route_segments[code_route].append(seg)
        id_to_segment[id_segment] = seg

    valid_route_codes = []

    for code, segments in route_segments.items():
        if direct_flights:
            # Caso 1: Solo rotte con 1 segmento e nessun next
            if (
                    len(segments) == 1 and
                    segments[0]["next"] is None and
                    segments[0]["from"] == departure_airport and
                    segments[0]["to"] == arrival_airport
            ):
                valid_route_codes.append(code)
        else:
            # Caso 2: Ricostruisci la catena
            all_ids = {s["id"] for s in segments}
            next_ids = {s["next"] for s in segments if s["next"] is not None}
            start_ids = list(all_ids - next_ids)
            if not start_ids:
                continue  # skip

            current_id = start_ids[0]
            chain = []
            visited = set()

            while current_id and current_id not in visited:
                visited.add(current_id)
                seg = id_to_segment.get(current_id)
                if not seg:
                    break
                chain.append(seg)
                current_id = seg["next"]

            if chain and chain[0]["from"] == departure_airport and chain[-1]["to"] == arrival_airport:
                valid_route_codes.append(code)

    # STEP 3: Trova i voli
    if not valid_route_codes:
        return []

    flights_stmt = (
        select(Flight)
        .where(
            Flight.route_code.in_(valid_route_codes),
            Flight.scheduled_departure_day == departure_date
        )
    )

    flights_stmt = (
        flights_stmt
        .join(Aircraft_airline, Flight.id_aircraft == Aircraft_airline.id_aircraft_airline)
        .join(Cabin, Aircraft_airline.id_aircraft_airline == Cabin.id_aircraft)
        .where(Cabin.id_class == id_class)
        .distinct()
    )

    flights = session.execute(flights_stmt).scalars().all()

    return flights

def get_flight_seat_blocks(session: Session, id_flight: int):
    stmt = (
        select(
            Cabin.id_cabin.label("id_cabin"),
            Cabin.id_class.label("id_class"),
            func.count(Ticket.id_ticket).label("occupied_seats"),
            func.json_agg(
                func.json_build_object(
                    "x", Cell.x,
                    "y", Cell.y,
                    "id_cell", Cell.id_cell
                )
            ).label("seats")
        )
        .select_from(Flight)
        .join(Aircraft_airline, Aircraft_airline.id_aircraft_airline == Flight.id_aircraft)
        .join(Cabin, Cabin.id_aircraft == Aircraft_airline.id_aircraft_airline)
        .join(Cell, and_(Cell.id_cabin == Cabin.id_cabin, Cell.is_seat == true()))
        .join(
            Ticket,
            and_(
                Ticket.id_seat == Cell.id_cell,
                Ticket.id_flight == Flight.id_flight
            )
        )
        .where(Flight.id_flight == id_flight)
        .group_by(Cabin.id_cabin, Cabin.id_class)
        .order_by(Cabin.id_cabin)
    )

    results = session.execute(stmt).all()

    return [
        {
            "id_cabin": row.id_cabin,
            "id_class": row.id_class,
            "occupied_seats": row.occupied_seats,
            "seats": row.seats or []
        }
        for row in results
    ]

def get_aircraft_by_seat_id(session: Session, id_seat: int) -> int | None:
    stmt = (
        select(Cabin.id_aircraft)
        .join(Cell, Cell.id_cabin == Cabin.id_cabin)
        .where(Cell.id_cell == id_seat)
    )
    return session.scalar(stmt)

def get_class_from_seat(session: Session, id_seat: int) -> int | None:
    stmt = (
        select(Cabin.id_class)
        .join(Cell, Cell.id_cabin == Cabin.id_cabin)
        .where(Cell.id_cell == id_seat)
    )
    return session.scalar(stmt)

def get_flights_by_user_id(session: Session, id_user: int):
    stmt = (
        select(Passenger_ticket)
        .where(Passenger_ticket.id_buyer == id_user)
    )

    results = session.execute(stmt).scalars().all()

    output = [pt.to_dict_buy_ticket() for pt in results]

    return output

def get_route_totals(session, route_code, start_date=None, end_date=None):
    stmt = (
        select(
            func.count(Ticket.id_ticket).label("passengers"),
            func.sum(Ticket.price).label("revenue")
        )
        .join(Flight, Ticket.id_flight == Flight.id_flight)
        .where(Flight.route_code == route_code)
    )

    if start_date and end_date:
        stmt = stmt.where(Flight.scheduled_departure_day.between(start_date, end_date))
    elif start_date:
        stmt = stmt.where(Flight.scheduled_departure_day >= start_date)
    elif end_date:
        stmt = stmt.where(Flight.scheduled_departure_day <= end_date)

    result = session.execute(stmt).first()
    return {"passengers": result.passengers or 0, "revenue": result.revenue or 0}

def get_route_class_distribution(session, route_code, start_date=None, end_date=None):
    stmt = (
        select(Ticket.id_seat)
        .join(Flight, Ticket.id_flight == Flight.id_flight)
        .where(Flight.route_code == route_code)
    )

    if start_date and end_date:
        stmt = stmt.where(Flight.scheduled_departure_day.between(start_date, end_date))
    elif start_date:
        stmt = stmt.where(Flight.scheduled_departure_day >= start_date)
    elif end_date:
        stmt = stmt.where(Flight.scheduled_departure_day <= end_date)

    seat_ids = [row.id_seat for row in session.execute(stmt).all()]

    class_ids = [get_class_from_seat(session,seat_id) for seat_id in seat_ids]

    class_names = []
    for class_id in class_ids:
        cls = session.get(Class_seat, class_id)
        if cls:
            class_names.append(cls.name)

    total = len(class_names)
    counter = Counter(class_names)

    distribution = {
        cls: round((count / total) * 100, 2)
        for cls, count in counter.items()
    } if total > 0 else {}

    return distribution

def get_flight_totals(session, id_flight: int):
    stmt = (
        select(
            func.count(Ticket.id_ticket).label("passengers"),
            func.sum(Ticket.price).label("revenue")
        )
        .where(Ticket.id_flight == id_flight)
    )
    result = session.execute(stmt).first()
    return {
        "passengers": result.passengers or 0,
        "revenue": result.revenue or 0
    }

def get_flight_class_distribution(session, id_flight: int):
    stmt = select(Ticket.id_seat).where(Ticket.id_flight == id_flight)
    seat_ids = [row.id_seat for row in session.execute(stmt).all()]

    class_names = []
    for seat_id in seat_ids:
        class_id = get_class_from_seat(session,seat_id)
        cls = session.get(Class_seat, class_id)
        if cls:
            class_names.append(cls.name)

    total = len(class_names)
    counter = Counter(class_names)
    distribution = {
        cls: round((count / total) * 100, 2)
        for cls, count in counter.items()
    } if total > 0 else {}

    return distribution


def get_flights_by_airline(session, airline_code: str):

    stmt = (
        select(
            Flight.id_flight.label("id_flight"),
            Flight.scheduled_departure_day.label("departure_day"),
            Flight.scheduled_arrival_day.label("arrival_day"),
            Route.airline_iata_code.label("airline_iata_code"),
            Route.code.label("route_code"),
            Route_section.code_departure_airport.label("origin"),
            Route_section.code_arrival_airport.label("destination"),
            Route_detail.departure_time.label("departure_time"),
            Route_detail.arrival_time.label("arrival_time"),
            Route.base_price.label("base_price"),
            func.to_char(
                (Route_detail.arrival_time - Route_detail.departure_time),
                "HH24:MI"
            ).label("duration"),
        )
        .join(Route, Flight.route_code == Route.code)
        .join(Route_detail, Route_detail.code_route == Route.code)
        .join(Route_section, Route_detail.id_route_section == Route_section.id_routes_section)
        .where(Route.airline_iata_code == airline_code)
    )

    rows = session.execute(stmt).mappings().all()
    flights = []
    for row in rows:
        r = dict(row)
        if r["departure_time"]:
            r["departure_time"] = r["departure_time"].strftime("%H:%M")

        if r["arrival_time"]:
            r["arrival_time"] = r["arrival_time"].strftime("%H:%M")

        flights.append(r)
    return flights






