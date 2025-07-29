from flask import session
from sqlalchemy import select
from db import SessionLocal
from sqlalchemy.orm import selectinload

from ..models.aircraft import Aircraft
from ..models.manufacturer import Manufacturer

session = SessionLocal()

def all_aircraft():
    stmt = select(Aircraft)
    result = session.scalars(stmt).all()
    return [aircraft.to_dict() for aircraft in result]

def all_manufacturer():
    stmt = select(Manufacturer)
    result = session.scalars(stmt).all()
    return [manufacturer.to_dict() for manufacturer in result]

def all_aircraft_by_manufacturer(manufacturer_id: int):
    stmt = (
        select(Aircraft)
        .options(selectinload(Aircraft.manufacturer))  # Eager load manufacturer
        .where(Aircraft.id_manufacturer == manufacturer_id)
    )
    result = session.scalars(stmt).all()
    return [aircraft.to_dict_without_manufacturer() for aircraft in result]

