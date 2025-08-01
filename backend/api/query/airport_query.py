from sqlalchemy import select
from flask_sqlalchemy.session import Session
from ..models.airport import Airport


def get_airport_by_iata_code(session: Session,iata_code):
    stmt = select(Airport).where(Airport.iata_code == iata_code)
    result = session.scalars(stmt).first()
    return  result