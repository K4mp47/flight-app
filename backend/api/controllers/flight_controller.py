from sqlalchemy.orm import Session
from ..models.airport import Airport
from ..query.flight_query import get_flight_for_search

class Flight_controller:

    def __init__(self, session: Session):
        self.session = session

    def get_flights(self, departure_airport_code, arrival_airport_code, round_trip_flight, direct_flights, departure_date_outbound, departure_date_return):
        departure_airport = self.session.get(Airport, departure_airport_code)
        arrival_airport = self.session.get(Airport, arrival_airport_code)

        if departure_airport is None:
            return {"message": "Departure airport not found"}, 404

        if arrival_airport is None:
            return {"message": "Arrival airport not found"}, 404

        data_outbound = [
            flight.to_dict_search() for flight in get_flight_for_search(
                self.session, departure_airport_code, arrival_airport_code, departure_date_outbound, direct_flights
            )
        ]
        data_return = []
        response = {"outbound_flights": data_outbound}

        if round_trip_flight:
            data_return = [
                flight.to_dict_search() for flight in get_flight_for_search(
                    self.session, arrival_airport_code, departure_airport_code, departure_date_return, direct_flights
                )
            ]
            response["return_flights"] = data_return

        return response, 200
