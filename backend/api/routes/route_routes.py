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
    session = SessionLocal()
    result = get_all_routes(session)
    return jsonify(result), 200


@route_bp.route("/add", methods=["POST"])
@role_required("Admin", "Airline-Admin")
def new_route():
    session = SessionLocal()
    try:
        data = Route_schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    controller = Route_controller(session)
    response, status = controller.add_route(data.departure_airport, data.arrival_airport)
    session.close()
    return jsonify(response), status





