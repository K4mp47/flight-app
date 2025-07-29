from flask import Blueprint, request, jsonify
from ..query.aircraft_query import all_aircraft, all_aircraft_by_manufacturer
from ..utils.role_checking import role_required

aircraft_bp = Blueprint("aircraft_bp", __name__)


@aircraft_bp.route("/", methods=["GET"])
@role_required("Admin", "Airline-Admin")
def get_all_aircraft():
    aircraft = all_aircraft()
    return jsonify(aircraft), 200


@aircraft_bp.route("/manufacturer/<int:id_manufacturer>", methods=["GET"])
@role_required("Admin", "Airline-Admin")
def get_all_aircraft_by_manufacturer(id_manufacturer):
    aircraft = all_aircraft_by_manufacturer(id_manufacturer)
    return jsonify(aircraft), 200


