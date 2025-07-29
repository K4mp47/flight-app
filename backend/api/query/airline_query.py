from flask import session
from sqlalchemy import select
from db import SessionLocal
from ..models.airline import Airline
from ..models.aircraft_airlines import Aircraft_airline

session = SessionLocal()

def all_airline():
    stmt = select(Airline)
    result = session.scalars(stmt).all()
    return [airline.to_dict() for airline in result]

def get_airline_by_iata_code(iata_code):
    stmt = select(Airline).filter_by(iata_code=iata_code)
    result = session.execute(stmt).scalar_one_or_none()
    if result:
        return result.to_dict()
    else:
        return None

def insert_airline(iata_code, name):
    airline = Airline()
    airline.iata_code = iata_code
    airline.name = name
    session.add(airline)
    session.commit()
    return {"message": "airline inserted", "airline": airline.to_dict()}, 201

def get_fleet_by_airline_code(airline_code: str):
    stmt = select(Aircraft_airline).where(Aircraft_airline.airline_code == airline_code)
    result = session.execute(stmt).scalars().all()
    return [aircraft.to_dict() for aircraft in result]