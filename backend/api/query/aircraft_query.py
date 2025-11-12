from flask import session
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from flask_sqlalchemy.session import Session
from ..models.aircraft import Aircraft
from ..models.manufacturer import Manufacturer



def all_aircraft(session: Session):
    stmt = select(Aircraft)
    result = session.scalars(stmt).all()
    return [aircraft.to_dict() for aircraft in result]

def all_manufacturer(session: Session):
    stmt = select(Manufacturer)
    result = session.scalars(stmt).all()
    return [manufacturer.to_dict() for manufacturer in result]

def all_aircraft_by_manufacturer(session: Session,manufacturer_id: int):
    stmt = (
        select(Aircraft)
        .options(selectinload(Aircraft.manufacturer))  
        .where(Aircraft.id_manufacturer == manufacturer_id)
    )
    result = session.scalars(stmt).all()
    return [aircraft.to_dict_without_manufacturer() for aircraft in result]



