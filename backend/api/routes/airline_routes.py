from flask import Blueprint, request, jsonify, session
from pydantic import ValidationError
from db import SessionLocal

from ..models import Route
from ..models.aircraft_airlines import Aircraft_airline
from ..models.airline import Airline
from ..query.airline_query import all_airline, get_aircraft_seat_map_JSON, number_seat_aircraft,get_max_economy_seats, get_airline_class_price_policy, get_airline_price_policy
from ..query.route_query import get_all_route_airline, get_route
from ..utils.role_checking import role_required, airline_check_param, airline_check_body
from ..validations.airline_validation import *
from ..controllers.airline_controller import Airline_controller

airline_bp = Blueprint("airline_bp", __name__)

@airline_bp.route("/", methods=["GET"])
#@role_required("Admin")
def get_all_airlines():
    session = SessionLocal()
    airlines = all_airline(session)
    session.close()
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
#@airline_check_body("airline_code")
def new_aircraft(id_aircraft: int):
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.insert_aircraft(data.airline_code,id_aircraft)
    session.close()
    return jsonify(response), status

@airline_bp.route("/fleet", methods=["GET"])
#@airline_check_body("airline_code")
def get_fleet():
    airline_code = request.args.get("airline_code")
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_airline_fleet(airline_code)
    session.close()
    return jsonify(response), status

@airline_bp.route("/delete/aircraft/<int:id_aircraft_airline>", methods=["DELETE"])
#@airline_check_body("airline_code")
def delete_aircraft(id_aircraft_airline: int):
    session = SessionLocal()
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
        data = request.get_json()
        controller = Airline_controller(session)
        response, status = controller.dalete_fleet_aircraft(data.get("airline_code"), id_aircraft_airline)
        session.close()
        return jsonify(response), status



@airline_bp.route("/add/block/aircraft/<int:id_aircraft_airline>", methods=["POST"])
#@airline_check_body("airline_code")
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
#@airline_check_body("airline_code")
def get_seat_map(id_aircraft_airline: int):
    session = SessionLocal()
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
        seat_map = get_aircraft_seat_map_JSON(session, id_aircraft_airline)
        seats_number = number_seat_aircraft(session, id_aircraft_airline)
        seats_remaining = get_max_economy_seats(session, id_aircraft_airline) - seats_number
        session.close()
        return jsonify(
            {"additional_seats_remaining": seats_remaining, "seats_number": seats_number, "seat_map": seat_map}), 200


@airline_bp.route("/aircraft/clone-seatmap", methods=["POST"])
#@airline_check_body("airline_code")
def clone_seatmap():
    session = SessionLocal()
    try:
        data = Clone_aircraft_seat_map_schema(**request.get_json())
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
#@airline_check_body("airline_code")
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
#@airline_check_body("airline_code")
def change_route_deadline(code: str):
    session = SessionLocal()
    try:
        data = Route_deadline_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    controller = Airline_controller(session)
    response, status = controller.change_deadline(code, data.end_date)
    session.close()
    return jsonify(response), status

@airline_bp.route("/route/", methods=["GET"])
#@airline_check_body("airline_code")
def get_routes():
    session = SessionLocal()
    data = request.get_json()
    if session.get(Airline, data.get("airline_code")) is None:
        return jsonify({"message": "airline_code not found"}), 404
    routes = get_all_route_airline(session,data.get("airline_code"))
    session.close()
    return jsonify({"routes": routes}), 200

@airline_bp.route("/route/<code>/info", methods=["GET"])
#@airline_check_body("airline_code")
def get_route_info(code: str):
    session = SessionLocal()
    if session.get(Route, code) is None:
        return jsonify({"message": "route not found"}), 404
    route = get_route(session, code)
    session.close()
    return jsonify({"routes": route}), 200

@airline_bp.route("/route/<code>/add-flight", methods=["POST"])
#@airline_check_body("airline_code")
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

@airline_bp.route("/add-class-price-policy", methods=["POST"])
#@airline_check_body("airline_code")
def new_class_price_policy():
    session = SessionLocal()
    try:
        data = Class_price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.insert_class_price_policy(data.id_class, data.airline_code, data.price_multiplier, data.fixed_markup)
    session.close()
    return jsonify(response), status

@airline_bp.route("/class-price-policy/<int:id_class_price_policy>/modify", methods=["PUT"])
#@airline_check_body("airline_code")
def modify_class_price_policy(id_class_price_policy: int):
    session = SessionLocal()
    try:
        data = Class_price_policy_data_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_class_price_policy(id_class_price_policy, data.price_multiplier,data.fixed_markup)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<code>/class-price-policy/", methods=["GET"])
#@airline_check_param("code")
def get_class_price_policies(code: str):
    session = SessionLocal()
    airline = session.get(Airline, code)
    if airline is None:
        return jsonify({"message": "airline not found"}), 404
    policies = get_airline_class_price_policy(session, code)
    session.close()
    return jsonify({"policies": policies}), 200

@airline_bp.route("/<code>/add/price-policy", methods=["POST"])
#@airline_check_param("code")
def new_price_policy(code: str):
    session = SessionLocal()
    try:
        data = Price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.insert_price_policy(code, data.fixed_markup, data.price_for_km, data.fee_fro_stopover)
    session.close()
    return jsonify(response), status

@airline_bp.route("/price-policy/<code>/modify", methods=["PUT"])
#@airline_check_param("code")
def modify_price_policy(code: str):
    session = SessionLocal()
    try:
        data = Price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_price_policy(code, data.fixed_markup, data.price_for_km, data.fee_fro_stopover)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<code>/price-policy/", methods=["GET"])
#@airline_check_param("code")
def get_price_policies(code: str):
    session = SessionLocal()
    airline = session.get(Airline, code)
    if airline is None:
        return jsonify({"message": "airline not found"}), 404
    policies = get_airline_price_policy(session, code)
    session.close()
    return jsonify({"policies": policies}), 200

@airline_bp.route("/route/<code>/base_price/", methods=["PUT"])
#@airline_check_body("airline_code")
def change_base_price(code: str):
    session = SessionLocal()
    try:
        data = Route_change_price_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_route_base_price(code, data.base_price)
    session.close()
    return jsonify(response), status

@airline_bp.route("/analytics/route/<code>", methods=["GET"])
@airline_check_body("airline_code")
def route_analytics(code: str):
    try:
        data = Route_analytics_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_route_analytics(data.model_dump(),code)
    session.close()
    return jsonify(response), status


@airline_bp.route("/analytics/flight/<id_flight>", methods=["GET"])
#@airline_check_body("airline_code")
def flight_analytics(id_flight: int):
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_flight_analytics(id_flight)
    session.close()
    return jsonify(response), status











