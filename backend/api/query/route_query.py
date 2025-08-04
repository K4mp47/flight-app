from collections import defaultdict

from sqlalchemy import select, and_
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