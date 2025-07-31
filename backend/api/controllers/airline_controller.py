from sqlalchemy.orm import Session

from ..models.aircraft import Aircraft
from ..models.aircraft_airlines import Aircraft_airline
from ..query.airline_query import get_airline_by_iata_code, insert_airline, get_fleet_by_airline_code, session
from ..query.airport_query import get_airport_by_iata_code

class Airline_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_airline(self,iata_code, name):
        if get_airline_by_iata_code(iata_code):
            return {"message": "airline already exists"}, 400
        else:
            return insert_airline(iata_code, name), 201

    def insert_aircraft(self,airline_code,id_aircraft, current_position):

        airline = get_airline_by_iata_code(airline_code)
        airport = get_airport_by_iata_code(current_position)

        if airport is None or airline is None:
            return {"message": "airport or airline doesn't exist"}, 400

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

            return {"message": "aircraft inserted successfully", "aircraft": new_aircraft.to_dict()}, 201

    def get_airline_fleet(self,iata_code):
        if get_airline_by_iata_code(iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            return get_fleet_by_airline_code(iata_code), 200

    def dalete_fleet_aircraft(self,iata_code,id_aircraft_airline):
        if get_airline_by_iata_code(iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            aircraft = self.session.get(Aircraft_airline, id_aircraft_airline)
            if aircraft:
                self.session.delete(aircraft)
                self.session.commit()
            return {"message": "aircraft deleted from the fleet successfully"}, 200






