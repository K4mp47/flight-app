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
    session = SessionLocal()
    try:
        data = Flight_search_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    controller =  Flight_controller(session)
    response, status = controller.get_flights(data.departure_airport, data.arrival_airport, data.round_trip_flight, data.direct_flights, data.departure_date_outbound, data.departure_date_return, data.id_class)
    session.close()
    return jsonify(response), status

@flight_bp.route("/<int:id_flight>/seats-occupied", methods=["GET"])
def flight_seats_occupied(id_flight: int):
    session = SessionLocal()
    flight = session.get(Flight, id_flight)
    if flight is None:
        return jsonify({"message": f"Flight {id_flight} not found"}), 404

    data = get_flight_seat_blocks(session, id_flight)
    return jsonify(data), 200

@flight_bp.route("/book", methods=["POST"])
def book_flight():
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



