from sqlalchemy import select, func
from flask_sqlalchemy.session import Session
from ..models.airport import Airport


def get_airport_by_iata_code(session: Session,iata_code):
    stmt = select(Airport).where(Airport.iata_code == iata_code)
    result = session.scalars(stmt).first()
    return  result

def get_all_airports_paginated(session: Session, page: int = 1, per_page: int = 50):
    """Get all airports with pagination"""
    offset = (page - 1) * per_page
    stmt = select(Airport).offset(offset).limit(per_page)
    result = session.scalars(stmt).all()
    return result


def get_airports_count(session: Session):
    """Get total count of airports"""
    stmt = select(func.count(Airport.iata_code))
    result = session.scalar(stmt)
    return result


def get_airports_by_city_id(session: Session, city_id: int):
    """Get all airports in a specific city"""
    stmt = select(Airport).where(Airport.id_city == city_id)
    result = session.scalars(stmt).all()
    return result


def search_airports_by_name_or_code(session: Session, query: str):
    """Search airports by name or IATA code"""
    stmt = select(Airport).where(
        (Airport.name.ilike(f'%{query}%')) |
        (Airport.iata_code.ilike(f'%{query}%'))
    )
    result = session.scalars(stmt).all()
    return result