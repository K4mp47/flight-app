from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models.passenger import Passenger

def get_passenger_id_by_email(session: Session, email: str) -> int | None:
    stmt = select(Passenger.id_passengers).where(Passenger.email == email)
    result = session.scalar(stmt)
    return result