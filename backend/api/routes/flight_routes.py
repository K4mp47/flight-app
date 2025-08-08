from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from ..validations.flight_validation import Flight_search_schema
from ..controllers.flight_controller import Flight_controller
from db import SessionLocal


flight_bp = Blueprint("flight_bp", __name__)

@flight_bp.route("/search", methods=["GET"])
def flight_search():
    session = SessionLocal()
    try:
        data = Flight_search_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    controller =  Flight_controller(session)
    response, status = controller.get_flights(data.departure_airport, data.arrival_airport, data.round_trip_flight, data.direct_flights, data.departure_date_outbound, data.departure_date_return)
    session.close()
    return jsonify(response), status