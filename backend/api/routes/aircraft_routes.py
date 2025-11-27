from flask import Blueprint, request, jsonify, session
from ..query.aircraft_query import all_aircraft, all_aircraft_by_manufacturer
from ..utils.role_checking import role_required
from db import SessionLocal

aircraft_bp = Blueprint("aircraft_bp", __name__)


@aircraft_bp.route("/", methods=["GET"])
#@role_required("Admin", "Airline-Admin")
def get_all_aircraft():
    """
    Get All Aircraft
    ---
    tags:
      - Aircraft
    summary: Retrieve all aircraft available in the database
    description: |
      This endpoint returns all aircraft stored in the system.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Admin, Airline-Admin

    security:
      - Bearer: []

    responses:
      200:
        description: List of aircraft
        schema:
          type: array
          items:
            type: object
            properties:
              id_aircraft:
                type: integer
                example: 1
              name:
                type: string
                example: "A320"
              max_seats:
                type: integer
                example: 180
              cabin_max_cols:
                type: integer
                example: 7
              manufacturer:
                type: object
                properties:
                  id_manufacturer:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Airbus"

      401:
        description: Missing or invalid JWT token

      403:
        description: User does not have the required role
    """
    session = SessionLocal()
    aircraft = all_aircraft(session)
    return jsonify(aircraft), 200


@aircraft_bp.route("/manufacturer/<int:id_manufacturer>", methods=["GET"])
#@role_required("Admin", "Airline-Admin")
def get_all_aircraft_by_manufacturer(id_manufacturer):
    """
    Get Aircraft by Manufacturer
    ---
    tags:
      - Aircraft
    summary: Retrieve aircraft filtered by manufacturer
    description: |
      Returns all aircraft belonging to the specified manufacturer.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Admin, Airline-Admin

    parameters:
      - name: id_manufacturer
        in: path
        type: integer
        required: true
        description: ID of the manufacturer whose aircraft should be retrieved
        example: 1

    security:
      - Bearer: []

    responses:
      200:
        description: List of aircraft from the specified manufacturer
        schema:
          type: array
          items:
            type: object
            properties:
              id_aircraft:
                type: integer
                example: 1
              name:
                type: string
                example: "A320"
              max_economy_seats:
                type: integer
                example: 180

      401:
        description: Missing or invalid authentication token

      403:
        description: User does not have the required role

      404:
        description: Manufacturer not found
    """
    session = SessionLocal()
    aircraft = all_aircraft_by_manufacturer(session, id_manufacturer)
    return jsonify(aircraft), 200
