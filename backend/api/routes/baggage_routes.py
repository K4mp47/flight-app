from db import SessionLocal
from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from ..utils.role_checking import role_required, airline_check_param, airline_check_body
from ..query.baggage_query import get_all_baggage
from ..validations.baggage_validation import Baggage_roles_validation, Baggage_roles_validation_PUT, Baggage_class_policy_schema, Baggage_class_policy_PUT_schema
from ..validations.airline_validation import Airline_aircraft_schema
from ..controllers.baggage_controller import Baggage_controller

baggage_bp = Blueprint("baggage_bp", __name__)

@baggage_bp.route("/", methods=["GET"])
def get_baggage():
    session = SessionLocal()
    result = get_all_baggage(session)
    session.close()
    return jsonify(result), 200

@baggage_bp.route("/rules", methods=["POST"])
@airline_check_body("airline_code")
def add_baggage_rules():
    try:
        data = Baggage_roles_validation(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.insert_baggage_role(data.model_dump())
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/rules", methods=["PUT"])
@airline_check_body("airline_code")
def update_baggage_rules():
    try:
        data = Baggage_roles_validation_PUT(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.update_baggage_role(data.model_dump())
    return jsonify(result), status_code

@baggage_bp.route("/rules", methods=["GET"])
@airline_check_body("airline_code")
def get_baggage_rules():
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.get_baggage_rule(data.airline_code)
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/class-policy", methods=["POST"])
@airline_check_body("airline_code")
def add_baggage_class_policy():
    try:
        data = Baggage_class_policy_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.insert_baggage_class_policy(data.airline_code,data.id_baggage_type, data.id_class, data.quantity_included)
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/class-policy", methods=["PUT"])
@airline_check_body("airline_code")
def update_baggage_class_policy():
    try:
        data = Baggage_class_policy_PUT_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.update_quantity_included(data.id_class_baggage_policy, data.airline_code, data.quantity_included)
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/class-policy", methods=["GET"])
@airline_check_body("airline_code")
def get_baggage_class_policy():
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.get_airline_class_policy(data.airline_code)
    session.close()
    return jsonify(result), status_code



