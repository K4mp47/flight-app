from flask import Blueprint, request, jsonify
from ..utils.role_checking import role_required
from ..query.aircraft_query import all_manufacturer
from db import SessionLocal

manufacturer_bp = Blueprint("manufacturer_bp", __name__)

@manufacturer_bp.route("/", methods=["GET"])
@role_required("Admin", "Airline-Admin")
def get_all_manufacturer():
        """
        Get All Manufacturers
        ---
        tags:
          - Manufacturers
        summary: Retrieve all aircraft manufacturers
        description: |
          Returns a list of all aircraft manufacturers available in the database.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Admin, Airline-Admin

        security:
          - Bearer: []

        responses:
          200:
            description: List of manufacturers
            schema:
              type: array
              items:
                type: object
                properties:
                  id_manufacturer:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Airbus"

          401:
            description: Missing or invalid authentication token

          403:
            description: User does not have the required role
        """
        session = SessionLocal()
        manufacturer = all_manufacturer(session)
        return jsonify(manufacturer), 200