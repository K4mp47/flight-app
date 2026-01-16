from sqlalchemy import select, func, case, or_
from sqlalchemy.orm import joinedload
from flask_sqlalchemy.session import Session
from ..models.airport import Airport
from ..models.city import City


def get_airport_by_iata_code(session: Session,iata_code):
    stmt = select(Airport).where(Airport.iata_code == iata_code)
    result = session.scalars(stmt).first()
    return  result

def get_all_airports_paginated(session: Session, page: int = 1, per_page: int = 50):
    """Get all airports with pagination"""
    offset = (page - 1) * per_page
    stmt = select(Airport).options(joinedload(Airport.city)).offset(offset).limit(per_page)
    result = session.scalars(stmt).all()
    return result

def get_all_airports_without_pagination(session: Session):
    """Get all airports without pagination"""
    stmt = select(Airport).options(joinedload(Airport.city))
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


def search_airports_by_name_or_code(session: Session, query: str, limit: int = 20):
    """Search airports by name, IATA code, or city name with optimized matching"""
    query_upper = query.upper()
    
    # Get city IDs that match the query
    matching_city_ids_stmt = select(City.id_city).where(City.name.ilike(f'%{query}%'))
    matching_city_ids = session.execute(matching_city_ids_stmt).scalars().all()
    
    # Build the main query
    conditions = [
        Airport.name.ilike(f'%{query}%'),
        Airport.iata_code.ilike(f'%{query}%')
    ]
    
    # Add city condition if we found matching cities
    if matching_city_ids:
        conditions.append(Airport.id_city.in_(matching_city_ids))
    
    stmt = (
        select(Airport)
        .where(or_(*conditions))
        .order_by(
            # Exact IATA match first (highest priority)
            case(
                (Airport.iata_code == query_upper, 1),
                else_=2
            ),
            # Then starts-with matches
            case(
                (Airport.name.ilike(f'{query}%'), 1),
                (Airport.iata_code.ilike(f'{query}%'), 1),
                else_=2
            ),
            # Finally alphabetical by airport name
            Airport.name
        )
        .limit(limit)
    )
    
    result = session.scalars(stmt).all()
    
    # Eagerly load city for each airport
    for airport in result:
        _ = airport.city
    
    return result
    
    result = session.scalars(stmt).all()
    
    # Eagerly load city for each airport
    for airport in result:
        _ = airport.city
    
    return result