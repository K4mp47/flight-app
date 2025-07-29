from sqlalchemy.orm import Session

from ..models.aircraft import Aircraft
from ..models.aircraft_airlines import Aircraft_airline
from ..query.airline_query import get_airline_by_iata_code, insert_airline
from ..query.airport_query import get_airport_by_iata_code

class Airline_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_airline(self,iata_code, name):
        if get_airline_by_iata_code(iata_code) is None:
            return insert_airline(iata_code, name)
        else:
            return {"message": "airline already exists"}, 400

    def insert_aircraft(self,airline_code,id_aircraft, current_position):

        airline = get_airline_by_iata_code(airline_code)
        airport = get_airport_by_iata_code(id_aircraft)

        if airline is None or airport is None:
            return {"message": "airport does not exist"}, 400

        else:
            new_aircraft = Aircraft_airline(
                airline_code = airline_code,
                id_aircraft_model = id_aircraft,
                current_position = current_position,
                flying_towards = None
            )

            self.session.add(new_aircraft)
            self.session.commit()
            self.session.refresh(new_aircraft)

            return {"message": "aircraft inserted successfully", "aircraft": new_aircraft.aircraft.to_dict()}, 201

    def get_airline_fleet(self,iata_code):
        if get_airline_by_iata_code(iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            return get_airline_by_iata_code(iata_code), 200




