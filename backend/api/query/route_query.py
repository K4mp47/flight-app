from collections import defaultdict
from datetime import datetime, timedelta, time
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from flask_sqlalchemy.session import Session
from ..models.route_section import Route_section
from ..models.route import Route
from ..models.route_detail import Route_detail

def get_all_routes(session: Session):
    stmt = select(Route_section)
    result = session.scalars(stmt)
    return [route_section.to_dict() for route_section in result]

def get_route_by_airport(session: Session, departure_airport, arrival_airport):
    stmt = (
        select(Route_section)
        .where(
            Route_section.departure_airport == departure_airport,
            Route_section.arrival_airport == arrival_airport
        )
    )
    result = session.scalar(stmt)
    return result

def find_reverse_route(session: Session, code: str)-> str | None:
    original_start = session.scalar(
        select(Route_section.code_departure_airport)
        .join(Route_detail, Route_detail.id_route_section == Route_section.id_routes_section)
        .where(Route_detail.code_route == code)
        .order_by(Route_detail.id_airline_routes.asc())
        .limit(1)
    )

    original_end = session.scalar(
        select(Route_section.code_arrival_airport)
        .join(Route_detail, Route_detail.id_route_section == Route_section.id_routes_section)
        .where(Route_detail.code_route == code)
        .order_by(Route_detail.id_airline_routes.desc())
        .limit(1)
    )

    if not original_start or not original_end:
        return None

    inverse_code = session.scalar(
        select(Route.code)
        .join(Route_detail, Route_detail.code_route == Route.code)
        .join(Route_section, Route_section.id_routes_section == Route_detail.id_route_section)
        .where(
            and_(
                Route_section.code_departure_airport == original_end,
                Route_section.code_arrival_airport == original_start,
                Route.code != code
            )
        )
        .limit(1)
    )

    return inverse_code

def get_all_route_airline(session: Session, airline_code: str):
    stmt = (
        select(
            Route.code,
            Route.start_date,
            Route.end_date,
            Route.created_at,
            Route_detail.id_airline_routes,
            Route_detail.departure_time,
            Route_detail.arrival_time,
            Route_detail.id_next,
            Route_section.code_departure_airport,
            Route_section.code_arrival_airport,
            Route_section.id_routes_section
        )
        .join(Route_detail, Route_detail.code_route == Route.code)
        .join(Route_section, Route_section.id_routes_section == Route_detail.id_route_section)
        .where(Route.airline_iata_code == airline_code)
        .order_by(Route.code, Route_detail.departure_time)
    )

    results = session.execute(stmt).all()

    routes_dict = defaultdict(lambda: {
        "route_code": None,
        "start_date": None,
        "end_date": None,
        "route_created_at": None,
        "details": []
    })

    for row in results:
        route = routes_dict[row.code]

        # Set route-level info only once
        if route["route_code"] is None:
            route["route_code"] = row.code
            route["start_date"] = row.start_date.isoformat()
            route["end_date"] = row.end_date.isoformat()
            route["route_created_at"] = row.created_at.isoformat()

        # Append route details
        route["details"].append({
            "route_detail_id": row.id_airline_routes,
            "departure_time": row.departure_time.strftime("%H:%M:%S") if row.departure_time else None,
            "arrival_time": row.arrival_time.strftime("%H:%M:%S") if row.arrival_time else None,
            "id_next": row.id_next,
            "departure_airport": row.code_departure_airport,
            "arrival_airport": row.code_arrival_airport,
            "route_section_id": row.id_routes_section,
        })

    return list(routes_dict.values())

def get_route(session: Session, route_code: str)-> dict:
    stmt = (
        select(Route_detail)
        .options(joinedload(Route_detail.section))
        .where(Route_detail.code_route == route_code)
    )
    results = session.scalars(stmt).all()

    if not results:
        return {"message": "Route not found"}, 404

    id_map = {r.id_airline_routes: r for r in results}
    id_next_set = {r.id_next for r in results if r.id_next is not None}
    starting_node = next((r for r in results if r.id_airline_routes not in id_next_set), None)

    if not starting_node:
        return {"message": "Invalid route chain"}, 400

    segments = []
    total_duration = timedelta()
    prev_arrival_time = None

    current = starting_node
    while current:
        section = current.section
        dep_time = current.departure_time
        arr_time = current.arrival_time

        duration_segment = datetime.combine(datetime.today(), arr_time) - datetime.combine(datetime.today(), dep_time)
        if duration_segment.total_seconds() < 0:
            duration_segment += timedelta(days=1)


        layover = None
        if prev_arrival_time:
            layover = (datetime.combine(datetime.today(), dep_time) - datetime.combine(datetime.today(),
                                                                                       prev_arrival_time))
            if layover.total_seconds() < 0:
                layover += timedelta(days=1)
        else:
            layover = None

        total_duration += duration_segment
        if layover:
            total_duration += layover

        segments.append({
            "id_airline_routes": current.id_airline_routes,
            "from": section.code_departure_airport,
            "to": section.code_arrival_airport,
            "departure_time": dep_time.strftime("%H:%M"),
            "arrival_time": arr_time.strftime("%H:%M"),
            "layover_minutes": int(layover.total_seconds() / 60) if layover else None
        })

        prev_arrival_time = arr_time
        current = id_map.get(current.id_next)

    total_minutes = int(total_duration.total_seconds() // 60)
    total_hours = total_minutes // 60
    remaining_minutes = total_minutes % 60
    total_duration_str = f"{total_hours:02}:{remaining_minutes:02}"

    return {
        "route_code": route_code,
        "segments": segments,
        "total_duration": total_duration_str
    }