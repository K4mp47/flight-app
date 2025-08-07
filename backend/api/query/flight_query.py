from sqlalchemy import select, or_
from flask_sqlalchemy.session import Session
from ..models.flight import Flight

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
