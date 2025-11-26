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
    """
    Get baggage types
    ---
    tags:
        - Baggage
    summary: Return all baggage types available
    responses:
        200:
            description: Array of baggage types
    """
    session = SessionLocal()
    result = get_all_baggage(session)
    session.close()
    return jsonify(result), 200

@baggage_bp.route("/rules", methods=["POST"])
#@airline_check_body("airline_code")
def add_baggage_rules():
    """
    Add baggage rules
    ---
    tags:
        - Baggage
    summary: Insert baggage size/weight rules for an airline
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/BaggageRule'
    responses:
        200:
            description: Rule inserted successfully
    """
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
#@airline_check_body("airline_code")
def update_baggage_rules():
    """
    Update baggage rules
    ---
    tags:
        - Baggage
    summary: Update existing baggage rules for an airline
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/BaggageRuleUpdate'
    responses:
        200:
            description: Rule updated successfully
    """
    try:
            data = Baggage_roles_validation_PUT(**request.get_json())
    except ValidationError as e:
            return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.update_baggage_role(data.model_dump())
    return jsonify(result), status_code

@baggage_bp.route("/<airline_code>/rules", methods=["GET"])
#@airline_check_param("airline_code")
def get_baggage_rules(airline_code:str):
    """
    Get baggage rules for an airline
    ---
    tags:
        - Baggage
    summary: Retrieve baggage rules for the specified airline
    
    """
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.get_baggage_rule(airline_code)
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/class-policy", methods=["POST"])
#@airline_check_body("airline_code")
def add_baggage_class_policy():
    """
    Add baggage class policy
    ---
    tags:
        - Baggage
    summary: Add class baggage policy for an airline
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/BaggageClassPolicy'
    responses:
        200:
            description: Policy added successfully
    """
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
#@airline_check_body("airline_code")
def update_baggage_class_policy():
    """
    Update baggage class policy
    ---
    tags:
        - Baggage
    summary: Update class baggage policy
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/BaggageClassPolicyUpdate'
    responses:
        200:
            description: Policy updated successfully
    """
    try:
            data = Baggage_class_policy_PUT_schema(**request.get_json())
    except ValidationError as e:
            return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.update_quantity_included(data.id_class_baggage_policy, data.airline_code, data.quantity_included)
    session.close()
    return jsonify(result), status_code

@baggage_bp.route("/<airline_code>/class-policy", methods=["GET"])
#@airline_check_param("airline_code")
def get_baggage_class_policy(airline_code: str):
    """
    Get baggage class policies for an airline
    ---
    tags:
        - Baggage
    summary: Retrieve baggage class policies for the specified airline
   
    """
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.get_airline_class_policy(airline_code)
    session.close()
    return jsonify(result), status_code



