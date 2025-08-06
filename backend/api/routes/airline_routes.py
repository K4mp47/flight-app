from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from db import SessionLocal

from ..models import Route
from ..models.aircraft_airlines import Aircraft_airline
from ..models.airline import Airline
from ..query.airline_query import all_airline, get_aircraft_seat_map_JSON, number_seat_aircraft,get_max_economy_seats, get_fleet_aircraft_by_id
from ..query.route_query import get_all_route_airline, get_route
from ..utils.role_checking import role_required
from ..validations.airline_validation import *
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
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
        data = request.get_json()
        controller = Airline_controller(session)
        response, status = controller.dalete_fleet_aircraft(data.get("airline_code"), id_aircraft_airline)
        return jsonify(response), status



@airline_bp.route("/add/block/aircraft/<int:id_aircraft_airline>", methods=["POST"])
#@role_required("Airline-Admin")
def new_block(id_aircraft_airline: int):
    session = SessionLocal()
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
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
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
        seat_map = get_aircraft_seat_map_JSON(session, id_aircraft_airline)
        seats_number = number_seat_aircraft(session, id_aircraft_airline)
        seats_remaining = get_max_economy_seats(session, id_aircraft_airline) - seats_number
        return jsonify(
            {"additional_seats_remaining": seats_remaining, "seats_number": seats_number, "seat_map": seat_map}), 200


@airline_bp.route("/aircraft/clone-seatmap", methods=["POST"])
#@role_required("Airline-Admin")
def clone_seatmap():
    session = SessionLocal()
    try:
        data = Clone_aircraft_seat_mao_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.clone_aircraft_seat_map(data.source_id, data.target_id)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status

@airline_bp.route("/add/route", methods=["POST"])
#@role_required("Airline-Admin")
def add_route():
    session = SessionLocal()
    try:
        data = Route_airline_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.insert_new_route(data.airline_code, data.number_route, data.start_date,data.end_date, data.section, data.delta_for_return_route)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status

@airline_bp.route("/route/<code>/change-deadline", methods=["PUT"])
#@role_required("Airline-Admin")
def change_route_deadline(code: str):
    session = SessionLocal()
    try:
        data = Route_deadline_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    controller = Airline_controller(session)
    response, status = controller.change_deadline(code, data.end_date)

    return jsonify(response), status

@airline_bp.route("/route/", methods=["GET"])
#@role_required("Airline-Admin")
def get_routes():
    session = SessionLocal()
    data = request.get_json()
    if session.get(Airline, data.get("airline_code")) is None:
        return jsonify({"message": "airline_code not found"}), 404
    routes = get_all_route_airline(session,data.get("airline_code"))
    return jsonify({"routes": routes}), 200

@airline_bp.route("/route/<code>/info", methods=["GET"])
def get_route_info(code: str):
    session = SessionLocal()
    if session.get(Route, code) is None:
        return jsonify({"message": "route not found"}), 404
    route = get_route(session, code)
    return jsonify({"routes": route}), 200

@airline_bp.route("/route/<code>/add-flight", methods=["POST"])
#@role_required("Airline-Admin")
def new_route_flight(code: str):
    session = SessionLocal()
    try:
        data = Flight_schedule_request_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.insert_flight_schedule(code, data.aircraft_id, data.flight_schedule)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status




