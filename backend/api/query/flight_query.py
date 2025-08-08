from datetime import timedelta

import sqlalchemy
from sqlalchemy import select, or_, and_, true
from flask_sqlalchemy.session import Session
from collections import defaultdict

from sqlalchemy.orm import aliased

from ..models.flight import Flight
from ..models.route import Route
from ..models.route_detail import Route_detail
from ..models.route_section import Route_section

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

def get_flight_for_search(session: Session, departure_airport: str, arrival_airport: str, departure_date, direct_flights):
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
    flights = session.execute(flights_stmt).scalars().all()

    return flights




