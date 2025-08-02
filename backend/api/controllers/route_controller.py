from sqlalchemy.orm import Session
from ..query.airport_query import get_airport_by_iata_code
from ..models.route_section import Route_section


class Route_controller:

    def __init__(self, session: Session):
        self.session = session

    def add_route(self, departure_airport, arrival_airport):
        if get_airport_by_iata_code(self.session, departure_airport) is None or get_airport_by_iata_code(self.session, arrival_airport) is None:
            return {"message": "departure_airport or arrival_airport not found"}, 404
        else:
            new_route_section = Route_section(
                code_departure_airport = departure_airport,
                code_arrival_airport = arrival_airport,
            )

            self.session.add(new_route_section)
            self.session.commit()
            self.session.refresh(new_route_section)

            return {"message": "route inserted successfully", "route": new_route_section.to_dict()}, 201

