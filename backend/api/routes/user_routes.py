from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from db import SessionLocal
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..utils.blacklist import blacklisted_tokens
from ..utils.role_checking import role_required
from ..controllers.user_controller import User_controller
from ..query.user_query import all_users
from ..validations.user_validation import User_Register_Schema, User_login_Schema, User_new_role_Schema

user_bp = Blueprint("user_bp", __name__)


@user_bp.route("/", methods=["GET"])
@role_required("Admin")
def get_all_users():
    session = SessionLocal()
    users = all_users(session)
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







