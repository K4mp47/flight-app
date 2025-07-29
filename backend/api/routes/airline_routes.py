from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from db import SessionLocal
from ..query.airline_query import all_airline, get_airline_by_iata_code, get_fleet_by_airline_code
from ..query.user_query import session
from ..utils.role_checking import role_required
from ..validations.airline_validation import Airline_schema, Airline_aircraft_schema
from ..controllers.airline_controller import Airline_controller

airline_bp = Blueprint("airline_bp", __name__)

@airline_bp.route("/", methods=["GET"])
@role_required("Admin")
def get_all_airlines():
    airlines = all_airline()
    return jsonify(airlines), 200

@airline_bp.route("/new", methods=["POST"])
@role_required("Admin")
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
@role_required("Airline-Admin")
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

#ROUTE CHE NON FUNZIONA PER MOMENTO NON USARE
@airline_bp.route("/fleet", methods=["GET"])
#@role_required("Airline-Admin")
def get_fleet():
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_airline_fleet(request.args.get("airline_code"))
    session.close()
    return jsonify(response), status




