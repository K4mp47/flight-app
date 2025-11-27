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
  summary: Create a new airport
  description: Allows an Admin to insert a new airport into the database.
  security:
    - Bearer: []
  parameters:
    - in: body
      name: body
      required: true
      schema:
        type: object
        properties:
          iata_code:
            type: string
            example: "RKV"
          id_city:
            type: integer
            example: 308
          name:
            type: string
            example: "Aeroporto Internazionale di Keflavik"
          latitude:
            type: number
            format: float
            example: 63.9850
          longitude:
            type: number
            format: float
            example: -22.5924
  responses:
    200:
      description: Airport created successfully
      schema:
        type: object
        properties:
          airport:
            type: object
            properties:
              iata_code:
                type: string
                example: "RKV"
              name:
                type: string
                example: "Aeroporto Internazionale di Keflavik"
              latitude:
                type: number
                format: float
                example: 63.985
              longitude:
                type: number
                format: float
                example: -22.5924
              city:
                type: object
                properties:
                  id_city:
                    type: integer
                    example: 308
                  name:
                    type: string
                    example: "Reykjavik"
          message:
            type: string
            example: "Airport created successfully"
    401:
      description: Missing or invalid token
    403:
      description: Admin role required

    
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
summary: Get information about a specific airport
description: |
  Returns detailed information for a given airport identified by its IATA code.

parameters:
  - name: iata_code
    in: path
    required: true
    type: string
    description: IATA code of the airport (e.g., "VCE")

responses:
  200:
    description: Airport information retrieved successfully
    schema:
      type: object
      properties:
        airport:
          type: object
          properties:
            iata_code:
              type: string
              example: "VCE"
            name:
              type: string
              example: "Marco Polo International Airport"
            latitude:
              type: number
              format: float
              example: 45.505
            longitude:
              type: number
              format: float
              example: 12.3433
            city:
              type: object
              properties:
                id_city:
                  type: integer
                  example: 605
                name:
                  type: string
                  example: "Venice"
  401:
    description: Missing or invalid token
  403:
    description: Role not authorized
  404:
    description: Airport not found

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
summary: Get all airports
description: |
  Returns a list of all airports in the database, including city, IATA code, latitude, and longitude.

security:
  - Bearer: []

responses:
  200:
    description: List of airports retrieved successfully
    schema:
      type: object
      properties:
        airports:
          type: array
          items:
            type: object
            properties:
              iata_code:
                type: string
                example: "AAN"
              name:
                type: string
                example: "Al Ain Airport"
              latitude:
                type: number
                format: float
                example: 24.25
              longitude:
                type: number
                format: float
                example: 55.75
              city:
                type: object
                properties:
                  id_city:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Ayn al Faydah"
  401:
    description: Missing or invalid token
  403:
    description: Role not authorized

   
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
  summary: Get airports by city ID
  description: Returns a list of airports located in the given city.
  security:
    - Bearer: []
  parameters:
    - name: city_id
      in: path
      required: true
      type: integer
      description: ID of the city
  responses:
    200:
      description: Airports retrieved successfully
      schema:
        type: object
        properties:
          airports:
            type: array
            items:
              type: object
              properties:
                iata_code:
                  type: string
                  example: "VCE"
                name:
                  type: string
                  example: "Marco Polo International Airport"
                latitude:
                  type: number
                  format: float
                  example: 45.505
                longitude:
                  type: number
                  format: float
                  example: 12.3433
                city:
                  type: object
                  properties:
                    id_city:
                      type: integer
                      example: 605
                    name:
                      type: string
                      example: "Venice"
    401:
      description: Missing or invalid token
    403:
      description: Role not authorized
        
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
  summary: Update an existing airport
  description: Allows an Admin to modify the airport information. Fields set to `null` will not be updated.
  security:
    - Bearer: []
  parameters:
    - name: iata_code
      in: path
      type: string
      required: true
      description: IATA code of the airport to update
      example: "RKV"
    - in: body
      name: body
      required: true
      schema:
        type: object
        properties:
          id_city:
            type: integer
            nullable: true
            example: null
          name:
            type: string
            example: "Aeroporto Internazionale di Keflavik"
          latitude:
            type: number
            format: float
            nullable: true
            example: null
          longitude:
            type: number
            format: float
            nullable: true
            example: null
  responses:
    200:
      description: Airport updated successfully
      schema:
        type: object
        properties:
          airport:
            type: object
            properties:
              iata_code:
                type: string
                example: "RKV"
              name:
                type: string
                example: "Aeroporto Internazionale di Keflavik"
              latitude:
                type: number
                format: float
                example: 63.985
              longitude:
                type: number
                format: float
                example: -22.5924
              city:
                type: object
                properties:
                  id_city:
                    type: integer
                    example: 308
                  name:
                    type: string
                    example: "Reykjavik"
          message:
            type: string
            example: "Airport updated successfully"
    401:
      description: Missing or invalid token
    403:
      description: Admin role required
    404:
      description: Airport not found

        
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
  summary: Delete an airport
  description: Allows an Admin to delete an airport from the database.
  security:
    - Bearer: []
  parameters:
    - name: iata_code
      in: path
      type: string
      required: true
      description: IATA code of the airport to delete
      example: "RKV"
  responses:
    200:
      description: Airport deleted successfully
      schema:
        type: object
        properties:
          message:
            type: string
            example: "Airport deleted successfully"
    401:
      description: Missing or invalid token
    403:
      description: Admin role required
    404:
      description: Airport not found

        
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
  summary: Search airports by name or IATA code
  description: Returns a list of airports matching the provided search query, which can be either the airport name or IATA code.
  parameters:
    - name: q
      in: query
      type: string
      required: true
      description: Search query (airport name or IATA code)
      example: "VCE"
  responses:
    200:
      description: List of airports matching the search
      schema:
        type: object
        properties:
          airports:
            type: array
            items:
              type: object
              properties:
                city:
                  type: object
                  properties:
                    id_city:
                      type: integer
                      example: 605
                    name:
                      type: string
                      example: "Venice"
                iata_code:
                  type: string
                  example: "VCE"
                latitude:
                  type: number
                  format: float
                  example: 45.505
                longitude:
                  type: number
                  format: float
                  example: 12.3433
                name:
                  type: string
                  example: "Marco Polo International Airport"
    404:
      description: No airports found matching the query

        
        
        """
        query = request.args.get('q', '')

        if not query:
                return jsonify({"message": "Query parameter 'q' is required"}), 400

        session = SessionLocal()
        controller = Airport_controller(session)
        result, status_code = controller.search_airports(query)
        session.close()
        return jsonify(result), status_code



