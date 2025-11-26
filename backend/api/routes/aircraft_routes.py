from flask import Blueprint, request, jsonify, session
from ..query.aircraft_query import all_aircraft, all_aircraft_by_manufacturer
from ..utils.role_checking import role_required
from db import SessionLocal

aircraft_bp = Blueprint("aircraft_bp", __name__)


@aircraft_bp.route("/", methods=["GET"])
#@role_required("Admin", "Airline-Admin")
def get_all_aircraft():
    """
    Get all aircraft
    ---
    tags:
        - Aircraft
    summary: Return all aircraft available in the database
    responses:
        200:
            description: Array of aircraft objects
    """
    session = SessionLocal()
    aircraft = all_aircraft(session)
    return jsonify(aircraft), 200


@aircraft_bp.route("/manufacturer/<int:id_manufacturer>", methods=["GET"])
#@role_required("Admin", "Airline-Admin")
def get_all_aircraft_by_manufacturer(id_manufacturer):
    """
    Get aircraft by manufacturer
    ---
    tags:
        - Aircraft
    summary: Return aircraft filtered by manufacturer id
    parameters:
      - in: path
        name: id_manufacturer
        schema:
          type: integer
        required: true
        description: ID of the manufacturer to filter by
    responses:
        200:
            description: Array of aircraft for the given manufacturer
    """
    session = SessionLocal()
    aircraft = all_aircraft_by_manufacturer(session, id_manufacturer)
    return jsonify(aircraft), 200
