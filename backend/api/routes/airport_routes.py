from flask import Blueprint, request, jsonify
from pydantic import ValidationError

from ..controllers.airport_controller import Airport_controller
from ..validations.airport_validation import Airport_schema, Airport_modify_schema
from ..utils.role_checking import role_required

from db import SessionLocal

airport_bp = Blueprint("airports", __name__)


@airport_bp.route("/", methods=["POST"])
#@role_required("Admin")
def create_airport():
    """
    Create a new airport
    ---
    tags:
        - Airports
    summary: Create a new airport (Admin only)
    requestBody:
        required: true
        content:
            application/json:
                schema:
                    $ref: '#/components/schemas/AirportCreate'
    responses:
        200:
            description: Airport created successfully
    """
    session = SessionLocal()
    try:
            data = Airport_schema(**request.get_json())
    except ValidationError as e:
            session.close()
            return jsonify({"message": str(e)}), 400

    controller = Airport_controller(session)
    result, status_code = controller.create_airport(data.model_dump())
    session.close()
    return jsonify(result), status_code



@airport_bp.route("/<string:iata_code>", methods=["GET"])
def get_airport(iata_code):
    """
    Get airport by IATA code
    ---
    tags:
        - Airports
    summary: Retrieve airport information by its IATA code
    
    """
    session = SessionLocal()
    controller = Airport_controller(session)
    result, status_code = controller.get_airport(iata_code)
    session.close()
    return jsonify(result), status_code



@airport_bp.route("/", methods=["GET"])
def get_all_airports():
    """
    Get all airports with pagination
    ---
    tags:
        - Airports
    summary: Retrieve a paginated list of airports
   
    """
    session = SessionLocal()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    controller = Airport_controller(session)
    result, status_code = controller.get_all_airports(page, per_page)
    session.close()
    return jsonify(result), status_code



@airport_bp.route("/city/<int:city_id>", methods=["GET"])
def get_airports_by_city(city_id):
        """
        Get airports by city
        ---
        tags:
            - Airports
        summary: Retrieve airports for a given city id
        
        """
        session = SessionLocal()
        controller = Airport_controller(session)
        result, status_code = controller.get_airports_by_city(city_id)
        session.close()
        return jsonify(result), status_code

@airport_bp.route("/<string:iata_code>", methods=["PUT"])
#@role_required("Admin")
def update_airport(iata_code):
        """
        Update airport
        ---
        tags:
            - Airports
        summary: Update airport details (Admin only)
        
        """
        session = SessionLocal()
        try:
                data = Airport_modify_schema(**request.get_json())
        except ValidationError as e:
                session.close()
                return jsonify({"message": str(e)}), 400

        controller = Airport_controller(session)
        result, status_code = controller.update_airport(iata_code, data.model_dump())
        session.close()
        return jsonify(result), status_code



@airport_bp.route("/<string:iata_code>", methods=["DELETE"])
#@role_required("Admin")
def delete_airport(iata_code):
        """
        Delete airport
        ---
        tags:
            - Airports
        summary: Delete an airport by IATA code (Admin only)
        
        """
        session = SessionLocal()
        controller = Airport_controller(session)
        result, status_code = controller.delete_airport(iata_code)
        session.close()
        return jsonify(result), status_code




@airport_bp.route("/search", methods=["GET"])
def search_airports():
        """
        Search airports by name or IATA code
        ---
        tags:
            - Airports
        summary: Search airports by query string (name or IATA code)
        
        """
        query = request.args.get('q', '')

        if not query:
                return jsonify({"message": "Query parameter 'q' is required"}), 400

        session = SessionLocal()
        controller = Airport_controller(session)
        result, status_code = controller.search_airports(query)
        session.close()
        return jsonify(result), status_code



