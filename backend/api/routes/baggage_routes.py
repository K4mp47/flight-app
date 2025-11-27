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
    summary: Retrieve all baggage types
    description: Returns a list of all baggage types available in the system.
    responses:
      200:
        description: List of baggage types retrieved successfully
        schema:
          type: array
          items:
            type: object
            properties:
              id_baggage:
                type: integer
                example: 1
              name:
                type: string
                example: "Cabin bag"

    
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
    summary: Add baggage rules for an airline
    description: >
      Adds baggage dimension and weight rules for a specific airline. Only one rule per baggage type is allowed.
      Some fields can be set to null if no changes are needed: max_weight_kg, max_linear_cm, over_weight_fee.

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            id_baggage_type:
              type: integer
              example: 1
            airline_code:
              type: string
              example: "AZ"
            max_weight_kg:
              type: number
              nullable: true
              example: 8
            max_length_cm:
              type: number
              example: 55
            max_width_cm:
              type: number
              example: 40
            max_height_cm:
              type: number
              example: 20
            max_linear_cm:
              type: number
              nullable: true
              example: 115
            over_weight_fee:
              type: number
              nullable: true
              example: 30
            over_size_fee:
              type: number
              example: 50
            base_price:
              type: number
              example: 25
            allow_extra:
              type: boolean
              example: false
    responses:
      200:
        description: Baggage rules added successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Baggage rule added successfully"
      400:
        description: Rule for this baggage type already exists
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required    
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
    summary: Modify baggage rules for an airline
    description: >
      Modifies existing baggage rules for a specific airline. Only the fields that need to be updated should be filled; 
      others can be set to null.

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token

    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            id_baggage_rules:
              type: integer
              example: 2
              description: The ID of the baggage rule to modify (required)
            airline_code:
              type: string
              example: "AZ"
              description: The airline code to which the rule belongs (required)
            max_weight_kg:
              type: number
              nullable: true
              example: 10
            max_length_cm:
              type: number
              nullable: true
              example: null
            max_width_cm:
              type: number
              nullable: true
              example: null
            max_height_cm:
              type: number
              nullable: true
              example: null
            max_linear_cm:
              type: number
              nullable: true
              example: null
            over_weight_fee:
              type: number
              nullable: true
              example: null
            over_size_fee:
              type: number
              nullable: true
              example: 60
            base_price:
              type: number
              nullable: true
              example: 30
            allow_extra:
              type: boolean
              nullable: true
              example: false

    responses:
      200:
        description: Baggage rules updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Baggage rule updated successfully"
      400:
        description: Invalid request data
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Baggage rule not found

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
    summary: Get baggage rules for a specific airline
    description: >
      Retrieves the baggage rules for a given airline. Only users with the Airline-Admin role can access this endpoint.

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token

    parameters:
      - name: airline_code
        in: path
        required: true
        type: string
        description: The IATA airline code (e.g., "AZ")

    responses:
      200:
        description: List of baggage rules retrieved successfully
        schema:
          type: array
          items:
            type: object
            properties:
              id_baggage_rules:
                type: integer
                example: 1
              airline:
                type: object
                properties:
                  iata_code:
                    type: string
                    example: "AZ"
                  name:
                    type: string
                    example: "Alitalia"
              baggage:
                type: object
                properties:
                  id_baggage:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Cabin bag"
              allow_extra:
                type: boolean
                example: false
              base_price:
                type: number
                example: 30.0
              max_weight_kg:
                type: number
                example: 10
              max_length_cm:
                type: number
                example: 55
              max_width_cm:
                type: number
                example: 40
              max_height_cm:
                type: number
                example: 20
              max_linear_cm:
                type: number
                example: 115
              over_weight_fee:
                type: number
                example: 30.0
              over_size_fee:
                type: number
                example: 60.0
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found

    
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
    description: >
      Adds a class-policy for a specific airline. The class-policy defines how many pieces of a certain type of baggage are included in the ticket for a given class (e.g., First class includes 2 checked bags).

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token

    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            airline_code:
              type: string
              description: IATA airline code
              example: "AZ"
            id_baggage_type:
              type: integer
              description: ID of the baggage type (see `/baggage/`)
              example: 3
            id_class:
              type: integer
              description: ID of the class (e.g., Economy, Business)
              example: 4
            quantity_included:
              type: integer
              description: Number of included pieces of baggage for this class
              example: 1
          required:
            - airline_code
            - id_baggage_type
            - id_class
            - quantity_included

    responses:
      200:
        description: Class baggage policy added successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Class baggage policy inserted successfully"
      400:
        description: Policy already exists or invalid data
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required


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
    summary: Update class baggage policy for an airline
    description: >
      Updates the quantity of included baggage for a specific class and baggage type for an airline.

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token

    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            id_class_baggage_policy:
              type: integer
              description: ID of the class baggage policy to modify
              example: 1
            airline_code:
              type: string
              description: IATA airline code
              example: "AZ"
            quantity_included:
              type: integer
              description: Updated number of included pieces of baggage for this class
              example: 1
          required:
            - id_class_baggage_policy
            - airline_code
            - quantity_included

    responses:
      200:
        description: Class baggage policy updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Class baggage policy updated successfully"
      400:
        description: Invalid data
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required

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
    summary: Retrieve class baggage policy for an airline
    description: >
      Returns the list of class baggage policies for a specific airline.  

      **Roles required:** Airline-Admin  
      **Authorization:** Bearer JWT Token  

      If no policies exist, an empty array `[]` is returned.

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        type: string
        description: IATA airline code
        example: "AZ"

    responses:
      200:
        description: List of class baggage policies
        schema:
          type: array
          items:
            type: object
            properties:
              airline:
                type: object
                properties:
                  iata_code:
                    type: string
                    example: "AZ"
                  name:
                    type: string
                    example: "Alitalia"
              baggage:
                type: object
                properties:
                  id_baggage:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Cabin bag"
              class_:
                type: object
                properties:
                  code:
                    type: string
                    example: "Y"
                  id_class:
                    type: integer
                    example: 4
                  name:
                    type: string
                    example: "Economy"
              id_class_baggage_policy:
                type: integer
                example: 1
              quantity_included:
                type: integer
                example: 1
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found
    """
    session = SessionLocal()
    controller = Baggage_controller(session)
    result, status_code = controller.get_airline_class_policy(airline_code)
    session.close()
    return jsonify(result), status_code



