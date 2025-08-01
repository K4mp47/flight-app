from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from db import SessionLocal
from ..query.airline_query import all_airline, get_aircraft_seat_map, number_seat_aircraft,get_max_economy_seats, get_fleet_aircraft_by_id
from ..utils.role_checking import role_required
from ..validations.airline_validation import Airline_schema, Airline_aircraft_schema, Airline_aircraft_block_schema, Clone_aircraft_seat_mao_schema
from ..controllers.airline_controller import Airline_controller

airline_bp = Blueprint("airline_bp", __name__)

@airline_bp.route("/", methods=["GET"])
#@role_required("Admin")
def get_all_airlines():
    session = SessionLocal()
    airlines = all_airline(session)
    return jsonify(airlines), 200

@airline_bp.route("/new", methods=["POST"])
#@role_required("Admin")
def new_airline():
    try:
        data = Airline_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.insert_airline(data.iata_code, data.name)
    session.close()
    return jsonify(response), status

@airline_bp.route("/add/aircraft/<int:id_aircraft>", methods=["POST"])
#@role_required("Airline-Admin")
def new_aircraft(id_aircraft: int):
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.insert_aircraft(data.airline_code,id_aircraft, data.current_position)
    session.close()
    return jsonify(response), status

@airline_bp.route("/fleet", methods=["GET"])
#@role_required("Airline-Admin")
def get_fleet():
    data = request.get_json()
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_airline_fleet(data.get("airline_code"))
    session.close()
    return jsonify(response), status

@airline_bp.route("/delete/aircraft/<int:id_aircraft_airline>", methods=["DELETE"])
#@role_required("Airline-Admin")
def delete_aircraft(id_aircraft_airline: int):
    session = SessionLocal()
    data = request.get_json()
    controller = Airline_controller(session)
    response, status = controller.dalete_fleet_aircraft(data.get("airline_code"), id_aircraft_airline)
    return jsonify(response), status

@airline_bp.route("/add/block/aircraft/<int:id_aircraft_airline>", methods=["POST"])
#@role_required("Airline-Admin")
def new_block(id_aircraft_airline: int):
    session = SessionLocal()
    try:
        data = Airline_aircraft_block_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    try:
        controller = Airline_controller(session)
        response, status = controller.insert_block(
            data.matrix,
            data.proportion_economy_seat,
            data.id_class,
            id_aircraft_airline
        )
        return jsonify(response), status
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        session.close()

@airline_bp.route("/aircraft/<int:id_aircraft_airline>/seat_map", methods=["GET"])
#@role_required("Airline-Admin")
def get_seat_map(id_aircraft_airline: int):
    session = SessionLocal()
    seat_map = get_aircraft_seat_map(session, id_aircraft_airline)
    seats_number = number_seat_aircraft(session, id_aircraft_airline)
    seats_remaining = get_max_economy_seats(session, id_aircraft_airline) - seats_number
    return jsonify({"additional_seats_remaining": seats_remaining, "seats_number":seats_number, "seat_map": seat_map}), 200

@airline_bp.route("/aircraft/clone-seatmap", methods=["POST"])
#@role_required("Airline-Admin")
def clone_seatmap():
    session = SessionLocal()
    try:
        data = Clone_aircraft_seat_mao_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    return {"Dario Moccia"}, 200










