from sqlalchemy import select
from db import SessionLocal
from ..models.airport import Airport

session = SessionLocal()

def get_airport_by_iata_code(iata_code):
    stmt = select(Airport).where(Airport.iata_code == iata_code)
    result = session.scalars(stmt).first()
    return  result