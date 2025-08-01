from sqlalchemy.orm import Session

from ..models.aircraft import Aircraft
from ..models.aircraft_airlines import Aircraft_airline
from ..query.airline_query import get_airline_by_iata_code, insert_airline, get_fleet_by_airline_code, number_seat_aircraft, get_max_economy_seats, get_max_cols_aircraft, insert_block_seat_map
from ..query.airport_query import get_airport_by_iata_code

class Airline_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_airline(self,iata_code, name):
        if get_airline_by_iata_code(self.session,iata_code):
            return {"message": "airline already exists"}, 400
        else:
            return insert_airline(self.session,iata_code, name), 201

    def insert_aircraft(self,airline_code,id_aircraft, current_position):

        airline = get_airline_by_iata_code(self.session,airline_code)
        airport = get_airport_by_iata_code(self.session, current_position)

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
        if get_airline_by_iata_code(self.session,iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            return get_fleet_by_airline_code(self.session,iata_code), 200

    def dalete_fleet_aircraft(self,iata_code,id_aircraft_airline):
        if get_airline_by_iata_code(self.session,iata_code) is None:
            return {"message": "Invalid iata_code"}, 400
        else:
            aircraft = self.session.get(Aircraft_airline, id_aircraft_airline)
            if aircraft:
                self.session.delete(aircraft)
                self.session.commit()
            return {"message": "aircraft deleted from the fleet successfully"}, 200

    def insert_block(self,matrix,proportion_economy_seat,id_class,id_aircraft_airline):

        num_col_seat = 0
        for value in matrix[0]:
            if value == True:
                num_col_seat += proportion_economy_seat
            else:
                num_col_seat += 1
        if get_max_cols_aircraft(self.session,id_aircraft_airline) < num_col_seat:
            return {"message": "The proportion of economy seats is too high"}, 400
        else:

            if get_max_cols_aircraft(self.session,id_aircraft_airline) < len(matrix[0]):
                return {"message": "exceeded the maximum number of columns available"}, 400
            else:

                num_seat_matrix = 0
                for row in matrix:
                    for cell in row:
                        if cell == True:
                            num_seat_matrix += 1

                num_seat_matrix = num_seat_matrix * proportion_economy_seat
                num_seat_aircraft = number_seat_aircraft(self.session,id_aircraft_airline)

                if num_seat_matrix + num_seat_aircraft > get_max_economy_seats(self.session,id_aircraft_airline):
                    return {"message": "exceeded the maximum number of seats available"}, 400
                else:
                    return insert_block_seat_map(self.session,matrix,id_aircraft_airline,id_class,proportion_economy_seat)
















