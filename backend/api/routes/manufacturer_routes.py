from flask import Blueprint, request, jsonify
from ..utils.role_checking import role_required
from ..query.aircraft_query import all_manufacturer
from db import SessionLocal

manufacturer_bp = Blueprint("manufacturer_bp", __name__)

@manufacturer_bp.route("/", methods=["GET"])
@role_required("Admin", "Airline-Admin")
def get_all_manufacturer():
    session = SessionLocal()
    manufacturer = all_manufacturer(session)
    return jsonify(manufacturer), 200