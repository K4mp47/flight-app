from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from ..validations.flight_validation import Flight_search_schema, Ticket_reservation_schema
from ..controllers.flight_controller import Flight_controller
from ..models.flight import Flight
from ..query.flight_query import get_flight_seat_blocks
from db import SessionLocal


flight_bp = Blueprint("flight_bp", __name__)


@flight_bp.route("/search", methods=["POST"])
def flight_search():
    """
Flight Search
---
tags:
  - Flights
summary: Search for available flights
description: |
  Performs a search for available flights based on origin, destination, travel dates, and other filters.
  Works similarly to Skyscanner but without interline (multi-airline graph-based) search.

  ### Important Notes
  - If `round_trip_flight = false`, then `departure_date_return` **must be null**.
  - If `direct_flights = true`, only routes with **one section** will be returned.
  - Multi-section routes (e.g., `FCO → JFK → MIA`) are treated as a **single block**:
      - Searching for `FCO → JFK` or `JFK → MIA` **will NOT** return that flight.
  - If the aircraft does not have a seat configuration for the class `id_class`,  
    the flight will not appear in results. 
  - Interline search is **not implemented**.

parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      properties:
        departure_airport:
          type: string
          example: "FCO"
        arrival_airport:
          type: string
          example: "MIA"
        round_trip_flight:
          type: boolean
          example: true
        direct_flights:
          type: boolean
          example: false
        departure_date_outbound:
          type: string
          example: "2025-08-10"
        departure_date_return:
          type: string
          nullable: true
          example: "2025-08-21"
        id_class:
          type: integer
          example: 4

responses:
  200:
    description: Flights matching the search criteria
    schema:
      type: object
      properties:
        outbound_flights:
          type: array
          items:
            type: object
            properties:
              airline:
                type: object
                properties:
                  iata_code:
                    type: string
                  name:
                    type: string
              price:
                type: number
                nullable: true
              route_code:
                type: string
              scheduled_arrival_day:
                type: string
              scheduled_departure_day:
                type: string
              sections:
                type: array
                description: Ordered segments of the route
                items:
                  type: object
                  properties:
                    id_airline_routes:
                      type: integer
                    next_id:
                      type: integer
                      nullable: true
                    arrival_time:
                      type: string
                    departure_time:
                      type: string
                    section:
                      type: object
                      properties:
                        code_arrival_airport:
                          type: string
                        code_departure_airport:
                          type: string
                        id_routes_section:
                          type: integer
        return_flights:
          type: array
          nullable: true
          items:
            type: object
            properties:
              airline:
                type: object
                properties:
                  iata_code:
                    type: string
                  name:
                    type: string
              price:
                type: number
              route_code:
                type: string
              scheduled_arrival_day:
                type: string
              scheduled_departure_day:
                type: string
              sections:
                type: array
                items:
                  type: object
                  properties:
                    id_airline_routes:
                      type: integer
                    next_id:
                      type: integer
                      nullable: true
                    arrival_time:
                      type: string
                    departure_time:
                      type: string
                    section:
                      type: object
                      properties:
                        code_arrival_airport:
                          type: string
                        code_departure_airport:
                          type: string
                        id_routes_section:
                          type: integer

  400:
    description: Invalid search parameters
  404:
    description: No flights found for the given search parameters
"""    
    session = SessionLocal()
    try:
        data = Flight_search_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    controller = Flight_controller(session)
    response, status = controller.get_flights(
        data.departure_airport,
        data.arrival_airport,
        data.round_trip_flight,
        data.direct_flights,
        data.departure_date_outbound,
        data.departure_date_return,
        data.id_class,
    )
    session.close()
    return jsonify(response), status


@flight_bp.route("/<int:id_flight>/seats-occupied", methods=["GET"])
def flight_seats_occupied(id_flight: int):
    """
    Get occupied seats for a flight
    ---
    tags:
      - Flights
    summary: Retrieve occupied seats for a specific flight
    description: >
      Returns the list of already occupied seats for the flight's seat map.  

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token  

      Each entry corresponds to a block in the seat map with occupied seats details.

    security:
      - Bearer: []

    parameters:
      - name: id_flight
        in: path
        required: true
        type: integer
        description: ID of the flight
        example: 123

    responses:
      200:
        description: Occupied seats returned successfully
        schema:
          type: array
          items:
            type: object
            properties:
              id_cell_block:
                type: integer
                example: 5
              id_class:
                type: integer
                example: 1
              occupied_seats:
                type: integer
                example: 2
              seats:
                type: array
                items:
                  type: object
                  properties:
                    id_cell:
                      type: integer
                      example: 3
                    x:
                      type: integer
                      example: 2
                    y:
                      type: integer
                      example: 0
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Flight not found

    """
    session = SessionLocal()
    flight = session.get(Flight, id_flight)
    if flight is None:
        return jsonify({"message": f"Flight {id_flight} not found"}), 404

    data = get_flight_seat_blocks(session, id_flight)
    return jsonify(data), 200


@flight_bp.route("/book", methods=["POST"])
def book_flight():
    """
    Book flight tickets
    ---
    tags:
      - Flights
    summary: Book tickets for a flight
    description: >
      Allows a user to purchase tickets for one or more passengers.  

      **Roles allowed:** Any authenticated user  
      **Authorization:** Bearer JWT Token  

      Each ticket includes the seat, optional additional baggage, and passenger details.

       **Legend for key values:**
        - `id_buyer`: ID of the user purchasing the tickets
        - `id_flight`: ID of the flight the user selected
        - `id_seat`: ID of the seat the user selected

    security:
      - Bearer: []

    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            id_buyer:
              type: integer
              description: ID of the user purchasing the tickets
              example: 9
            tickets:
              type: array
              description: List of tickets to purchase
              items:
                type: object
                properties:
                  ticket_info:
                    type: object
                    properties:
                      id_flight:
                        type: integer
                        description: Flight ID (from flight search)
                        example: 21
                      id_seat:
                        type: integer
                        description: Selected seat ID
                        example: 21
                      additional_baggage:
                        type: array
                        description: List of extra baggage for the passenger
                        items:
                          type: object
                          properties:
                            id_baggage:
                              type: integer
                              description: ID of baggage type
                              example: 2
                            count:
                              type: integer
                              description: Number of items of this baggage type
                              example: 2
                  passenger_info:
                    type: object
                    properties:
                      name:
                        type: string
                        example: Niccolò
                      lastname:
                        type: string
                        example: Balini
                      date_birth:
                        type: string
                        format: date
                        example: "1990-05-20"
                      phone_number:
                        type: string
                        example: "+393331234567"
                      email:
                        type: string
                        example: "Hummansafari@gmail.com"
                      passport_number:
                        type: string
                        example: "X1234537"
                      sex:
                        type: string
                        enum: ["M", "F", "Other"]
                        example: "M"

    responses:
      200:
        description: Tickets booked successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Tickets booked successfully"
            tickets:
              type: array
              items:
                type: object
                description: Details of the booked tickets
      400:
        description: Invalid request (seat already taken or missing info)
      401:
        description: Missing or invalid token
      403:
        description: Unauthorized action

    """
    try:
        data = Ticket_reservation_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    try:
        with session.begin():
            controller = Flight_controller(session)
            response, status = controller.book(data.id_buyer, data.tickets)
    except ValueError as e:
        response, status = {"message": str(e)}, 404
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status



