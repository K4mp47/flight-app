from sqlalchemy.orm import Session
from ..models.user import User
from ..models.airport import Airport
from ..models.ticket import Ticket
from ..models.flight import Flight
from ..models.baggage import Baggage
from ..models.passenger import Passenger
from ..models.additional_baggage import Additional_baggage
from ..models.passenger_ticket import Passenger_ticket
from ..query.flight_query import get_flight_for_search, get_aircraft_by_seat_id, get_class_from_seat, get_flight_seat_blocks
from ..query.airline_query import get_airline_class_multiplier
from ..query.baggage_query import get_baggage_role_by_type_airline
from ..query.passenger_query import get_passenger_id_by_email

class Flight_controller:

    def __init__(self, session: Session):
        self.session = session

    def flights_price_policy(self,flights, id_class):
        for flight in flights:
            airline_code = flight["airline"]["iata_code"]
            policy = get_airline_class_multiplier(self.session, airline_code, id_class)
            if policy:
                multiplier = policy[0]
                markup = policy[1]
                flight["flight_price"] *= multiplier
                flight["flight_price"] += markup


    def get_flights(self, departure_airport_code, arrival_airport_code, round_trip_flight, direct_flights, departure_date_outbound, departure_date_return, id_class):
        departure_airport = self.session.get(Airport, departure_airport_code)
        arrival_airport = self.session.get(Airport, arrival_airport_code)

        if departure_airport is None:
            return {"message": "Departure airport not found"}, 404

        if arrival_airport is None:
            return {"message": "Arrival airport not found"}, 404

        data_outbound = [
            flight.to_dict_search() for flight in get_flight_for_search(
                self.session, departure_airport_code, arrival_airport_code, departure_date_outbound, direct_flights, id_class
            )
        ]

        self.flights_price_policy(data_outbound, id_class)

        data_return = []
        response = {"outbound_flights": data_outbound}

        if round_trip_flight:
            data_return = [
                flight.to_dict_search() for flight in get_flight_for_search(
                    self.session, arrival_airport_code, departure_airport_code, departure_date_return, direct_flights, id_class
                )
            ]
            self.flights_price_policy(data_return, id_class)
            response["return_flights"] = data_return

        return response, 200


    def book(self, id_buyer: int, tickets):
        buyer = self.session.get(User, id_buyer)
        if buyer is None:
            raise ValueError("User not found")

        for ticket in tickets:
            flight = self.session.get(Flight, ticket.ticket_info.id_flight)
            if flight is None:
                raise ValueError("Flight not found")

            id_aircraft = get_aircraft_by_seat_id(self.session, ticket.ticket_info.id_seat)
            if id_aircraft is None:
                raise ValueError("Seat not found")

            if id_aircraft != flight.id_aircraft:
                raise ValueError("The selected seat does not belong to the selected flight")

            occupied_seats = get_flight_seat_blocks(self.session, ticket.ticket_info.id_flight)
            for block in occupied_seats:
                for seat in block["seats"]:
                    if seat["id_cell"] == ticket.ticket_info.id_seat:
                        raise ValueError(f"Seat {ticket.ticket_info.id_seat} is already occupied")

            id_class = get_class_from_seat(self.session, ticket.ticket_info.id_seat)
            policy = get_airline_class_multiplier(self.session, flight.route.airline_iata_code, id_class)
            price = flight.route.base_price
            if policy:
                multiplier = policy[0]
                markup = policy[1]
                price *= multiplier
                price += markup

            new_ticket = Ticket(
                id_flight = flight.id_flight,
                id_seat = ticket.ticket_info.id_seat,
                price = price,
            )

            self.session.add(new_ticket)
            self.session.flush()

            for baggage_ in ticket.ticket_info.additional_baggage:
                baggage = self.session.get(Baggage, baggage_.id_baggage)
                if baggage is None:
                    raise ValueError("Baggage not found")

                roles = get_baggage_role_by_type_airline(self.session, baggage_.id_baggage, flight.route.airline_iata_code)

                if roles is None:
                    raise ValueError("Baggage role not found")

                if roles.allow_extra != True:
                    raise ValueError("You cannot purchase this type of baggage.")

                price += baggage_.count * roles.base_price

                new_additional_baggage = Additional_baggage(
                    id_ticket = new_ticket.id_ticket,
                    id_baggage = baggage_.id_baggage,
                    count = baggage_.count,
                )

                self.session.add(new_additional_baggage)
                self.session.flush()

            new_ticket.price = price
            id_passenger = get_passenger_id_by_email(self.session, ticket.passenger_info.email)
            if id_passenger is None:
                new_passenger = Passenger(
                    name = ticket.passenger_info.name,
                    lastname = ticket.passenger_info.lastname,
                    date_birth = ticket.passenger_info.date_birth,
                    phone_number = ticket.passenger_info.phone_number,
                    email = ticket.passenger_info.email,
                    passport_number = ticket.passenger_info.passport_number,
                    sex = ticket.passenger_info.sex
                )

                self.session.add(new_passenger)
                self.session.flush()
                id_passenger = new_passenger.id_passengers

            new_passenger_ticket = Passenger_ticket(
                id_buyer = id_buyer,
                id_ticket = new_ticket.id_ticket,
                id_passenger = id_passenger
            )

            self.session.add(new_passenger_ticket)
            self.session.flush()

        return {"message": "The tickets have been successfully purchased."}, 200




