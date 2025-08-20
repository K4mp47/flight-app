from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from db import SessionLocal
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from ..controllers.airline_controller import Airline_controller
from ..utils.blacklist import blacklisted_tokens
from ..utils.role_checking import role_required
from ..controllers.user_controller import User_controller
from ..query.user_query import all_users
from ..validations.user_validation import User_Register_Schema, User_login_Schema, User_new_role_Schema
from ..validations.airline_validation import Airline_aircraft_schema

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/", methods=["GET"])
@role_required("Admin")
def get_all_users():
    session = SessionLocal()
    users = all_users(session)
    session.close()
    return jsonify(users), 200



@user_bp.route("/login", methods=["POST"])
def login():
   try:
       data = User_login_Schema(**request.get_json())
   except ValidationError as e:
        return jsonify({"error": str(e)}), 400
   session = SessionLocal()
   controller = User_controller(session)
   response, status = controller.login_user(data.email, data.pwd)
   session.close()
   return jsonify(response), status


@user_bp.route("/register", methods=["POST"])
def register():
    try:
        data = User_Register_Schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400

    session = SessionLocal()
    controller = User_controller(session)
    response, status = controller.register_user({
        'name': data.name,
        'lastname': data.lastname,
        'email': data.email,
        'password': data.pwd,
    })
    session.close()
    return jsonify(response), status

@user_bp.route("/me", methods=["GET"])
@jwt_required()
def profile():
    id = get_jwt_identity()
    session = SessionLocal()
    controller = User_controller(session)
    id = int(id)
    response, status = controller.get_profile(id)
    session.close()
    return jsonify(response), status

@user_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    jti = get_jwt()["jti"]
    blacklisted_tokens.add(jti)
    return jsonify(msg="Logout successful"), 200

@user_bp.route("/<int:user_id>/change-role", methods=["PUT"])
@role_required("Admin")
def change_role(user_id):
    try:
        data = User_new_role_Schema(**request.get_json())
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = User_controller(session)
    response, status = controller.change_role(user_id, data.new_role)
    session.close()
    return jsonify(response), status

@user_bp.route("/<int:user_id>/add-airline", methods=["PUT"])
@role_required("Admin")
def add_airline(user_id):
    session = SessionLocal()
    try:
        data = Airline_aircraft_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = User_controller(session)
    response, status = controller.set_user_airline(user_id, data.airline_code)
    session.close()
    return jsonify(response), status

@user_bp.route("/flights", methods=["GET"])
@jwt_required()
def get_flights():
    session = SessionLocal()
    id = get_jwt_identity()
    controller = User_controller(session)
    response, status = controller.get_user_flights(id)
    session.close()
    return jsonify(response), status








