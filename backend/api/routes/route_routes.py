from flask import Blueprint, request, jsonify
from ..utils.role_checking import role_required
from ..controllers.route_controller import Route_controller
from ..validations.route_validation import Route_schema
from ..query.route_query import get_all_routes
from pydantic import ValidationError
from db import SessionLocal

route_bp = Blueprint("route_bp", __name__)

@route_bp.route("/", methods=["GET"])
def get_routes():
        """
        Get all routes
        ---
        tags:
            - Routes
        summary: Return all available routes
        responses:
            200:
                description: Array of routes
        """
        session = SessionLocal()
        result = get_all_routes(session)
        return jsonify(result), 200


@route_bp.route("/add", methods=["POST"])
#@role_required("Admin", "Airline-Admin")
def new_route():
        """
        Create a new route
        ---
        tags:
          - Routes
        summary: Insert a new route segment
        description: |
          Creates a new **route segment** between two airports.

          **Note:**  
          This API only creates route *segments*.  
          It does **not** create airline-specific routes.  
          It is primarily used for internal setup, not by the frontend.

          **Authorization required:** Bearer JWT  
          **Allowed roles:** Admin, Airline-Admin

        security:
          - Bearer: []

        parameters:
          - name: body
            in: body
            required: true
            schema:
              type: object
              required:
                - departure_airport
                - arrival_airport
              properties:
                departure_airport:
                    type: string
                    example: "IST"
                arrival_airport:
                    type: string
                    example: "HND"
        responses:
          "200":
            description: Route segment successfully inserted
            schema:
              type: object
              properties:
                message:
                    type: string
                    example: "route inserted successfully"
            route:
              type: object
              properties:
                id_routes_section:
                  type: integer
                  example: 2
                code_departure_airport:
                  type: string
                  example: "IST"
                code_arrival_airport:
                  type: string
                  example: "HND"
            "400":
                description: Invalid input data
            "401":
                description: Missing or invalid token
            "403":
                description: Access denied — Admin or Airline-Admin role required
        """
        session = SessionLocal()
        try:
                data = Route_schema(**request.get_json())
        except ValidationError as e:
                return jsonify({"message": str(e)}), 400
        controller = Route_controller(session)
        response, status = controller.add_route(data.departure_airport, data.arrival_airport)
        session.close()
        return jsonify(response), status





