from flask_sqlalchemy.session import Session
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload, selectinload

from ..models.class_price_policy import Class_price_policy
from ..models.airline_price_policy import Airline_price_policy
from ..models.airline import Airline
from ..models.aircraft_airlines import Aircraft_airline
from ..models.cells_block import Cells_block
from ..models.cell import Cell
from ..models.aircraft_composition import Aircraft_composition
from ..models.aircraft import Aircraft
from ..models.class_price_policy import Class_price_policy




def all_airline(session: Session):
    stmt = select(Airline)
    result = session.scalars(stmt).all()
    return [airline.to_dict() for airline in result]

def get_airline_by_iata_code(session: Session,iata_code):
    stmt = select(Airline).where(Airline.iata_code ==iata_code)
    result = session.scalars(stmt).first()
    return result


def insert_airline(session: Session,iata_code, name):
    airline = Airline()
    airline.iata_code = iata_code
    airline.name = name
    session.add(airline)
    session.commit()
    return {"message": "airline inserted", "airline": airline.to_dict()}, 201

def get_fleet_aircraft_by_id(session: Session, id_aircraft_airline: int):
    stmt = select(Aircraft_airline).where(Aircraft_airline.airline_code == id_aircraft_airline)
    result = session.execute(stmt).scalars().first()
    return result

def get_fleet_by_airline_code(session: Session,airline_code: str):
    stmt = select(Aircraft_airline).where(Aircraft_airline.airline_code == airline_code)
    result = session.execute(stmt).scalars().all()
    return [aircraft_airline.to_dict() for aircraft_airline in result]

def number_seat_aircraft(session: Session,id_aircraft_airline: int) -> int:
    stmt = (
        select(func.sum(Aircraft_composition.proportion_economy_seat))
        .select_from(Cell)
        .join(Aircraft_composition, Aircraft_composition.id_cell_block == Cell.id_cell_block)
        .where(
            Aircraft_composition.id_aircraft_airline == id_aircraft_airline,
            Cell.is_seat == True
        )
    )

    result = session.scalar(stmt)
    return result or 0

def get_max_economy_seats(session: Session,id_aircraft_airline: int) -> int:
    stmt = (
        select(Aircraft.max_economy_seats)
        .join(Aircraft_airline, Aircraft.id_aircraft == Aircraft_airline.id_aircraft_model)
        .where(Aircraft_airline.id_aircraft_airline == id_aircraft_airline)
    )
    return session.scalar(stmt)

def get_max_cols_aircraft(session: Session,id_aircraft_airline: int) -> int:
    stmt = (
        select(Aircraft.cabin_max_cols)
        .join(Aircraft_airline, Aircraft.id_aircraft == Aircraft_airline.id_aircraft_model)
        .where(Aircraft_airline.id_aircraft_airline == id_aircraft_airline)
    )
    return session.scalar(stmt)

def aircraft_exists_composition(session: Session, id_aircraft_airline: int)-> bool:
    stmt = (
        select(Aircraft_composition.id_cell_block)
        .where(Aircraft_composition.id_aircraft_airline == id_aircraft_airline)
        .limit(1)
    )
    return session.execute(stmt).first() is not None



def insert_block_seat_map(session: Session, matrix: list[list[bool]], id_aircraft_airline: int, id_class: int, proportion_economy_seat: float):
    rows = len(matrix)
    cols = len(matrix[0])

    try:
        new_block = Cells_block(rows=rows, cols=cols)
        session.add(new_block)
        session.flush()

        cells = []
        for y, row in enumerate(matrix):
            for x, is_seat in enumerate(row):
                cells.append(Cell(
                    id_cell_block=new_block.id_cell_block,
                    x=x,
                    y=y,
                    is_seat=is_seat
                ))
        session.add_all(cells)

        comp = Aircraft_composition(
            id_cell_block=new_block.id_cell_block,
            id_aircraft_airline=id_aircraft_airline,
            id_class=id_class,
            proportion_economy_seat=proportion_economy_seat
        )
        session.add(comp)

        session.commit()
        return {"message": "Block inserted successfully"}, 201

    except Exception as e:
        session.rollback()
        return {"message": str(e)}, 500

def get_aircraft_seat_map(session: Session, id_aircraft_airline: int):
    stmt = (
        select(Cells_block)
        .join(Aircraft_composition)
        .where(Aircraft_composition.id_aircraft_airline == id_aircraft_airline)
        .options(
            joinedload(Cells_block.cells),
            joinedload(Cells_block.aircraft_compositions)
        )
    )
    return session.execute(stmt).unique().scalars().all()



def get_aircraft_seat_map_JSON(session: Session, id_aircraft_airline: int):
    stmt = (
        select(Cells_block)
        .join(Aircraft_composition)
        .where(Aircraft_composition.id_aircraft_airline == id_aircraft_airline)
        .options(
            joinedload(Cells_block.cells),
            joinedload(Cells_block.aircraft_compositions).joinedload(Aircraft_composition.class_block)
        )
    )

    result = session.execute(stmt).unique().scalars().all()

    seat_map = []
    for block in result:
        composition = block.aircraft_compositions[0]
        seat_map.append({
            "id_cell_block": block.id_cell_block,
            "rows": block.rows,
            "cols": block.cols,
            "id_class": composition.id_class,
            "class_name": composition.class_block.name,
            "proportion_economy_seat": composition.proportion_economy_seat,
            "cells": [
                {
                    "id_cell": cell.id_cell,
                    "x": cell.x,
                    "y": cell.y,
                    "is_seat": cell.is_seat
                }
                for cell in block.cells
            ]
        })

    return seat_map

def delete_aircraft_composition(session: Session, id_aircraft_airline: int):
    stmt = (
        select(Aircraft_composition)
        .where(Aircraft_composition.id_aircraft_airline == id_aircraft_airline)
        .options(joinedload(Aircraft_composition.cell_block).joinedload(Cells_block.cells))
    )
    compositions = session.execute(stmt).unique().scalars().all()

    for comp in compositions:
        session.delete(comp)
        if comp.cell_block:
            session.delete(comp.cell_block)

def get_airline_class_price_policy(session: Session, airline_code: str):
    stmt = (
        select(Class_price_policy)
        .where(Class_price_policy.airline_code == airline_code)
    )
    result = session.scalars(stmt)
    return [class_price_policy.to_dict() for class_price_policy in result]

def get_airline_price_policy(session: Session, airline_code: str):
    stmt = (
        select(Airline_price_policy)
        .where(Airline_price_policy.airline_code == airline_code)
    )
    result = session.scalars(stmt)
    return [price_policy.to_dict() for price_policy in result]

def get_airline_class_multiplier(session: Session, airline_code: str, id_class: int):
    stmt = (
        select(
            Class_price_policy.price_multiplier,
            Class_price_policy.fixed_markup
        )
        .where(
            Class_price_policy.airline_code == airline_code,
            Class_price_policy.id_class == id_class
        )
    )
    return session.execute(stmt).first()




