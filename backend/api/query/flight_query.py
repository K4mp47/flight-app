from sqlalchemy import select
from flask_sqlalchemy.session import Session
from ..models.flight import Flight

def is_aircraft_available(session: Session,  aircraft_id, date_to_check):
    stmt = select(Flight).where(
        Flight.id_aircraft == aircraft_id,
        Flight.scheduled_departure_day == date_to_check
    )
    existing_flight = session.scalars(stmt).first()
    return existing_flight is None
