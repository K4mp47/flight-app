from flask import session
from sqlalchemy import select
from db import SessionLocal
from ..models.airport import Airport

def get_airport_by_iata_code(iata_code):
    stmt = select(Airport).filter_by(iata_code=iata_code)
    result = session.execute(stmt).scalar_one_or_none()
    if result:
        return result.to_dict()
    else:
        return None