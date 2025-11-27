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
    """
    Get All Users
    ---
    tags:
      - Users
    summary: Returns a list of all users in the database
    description: |
      Retrieves all registered users.

      **Authorization required:** Bearer JWT Token  
      **Required Role:** Admin

    security:
      - Bearer: []

    responses:
      200:
        description: List of users successfully retrieved
        schema:
          type: array
          items:
            type: object
            properties:
              id_user:
                type: integer
                example: 2
              name:
                type: string
                example: "Mario"
              lastname:
                type: string
                example: "Rossi"
              email:
                type: string
                example: "mario.rossi@example.com"
              role:
                type: object
                properties:
                  id_role:
                    type: integer
                    example: 1
                  name:
                    type: string
                    example: "Admin"

      401:
        description: Missing or invalid token

      403:
        description: User does not have the required Admin role
    """
    session = SessionLocal()
    users = all_users(session)
    session.close()
    return jsonify(users), 200


@user_bp.route("/login", methods=["POST"])
def login():
    """
    User Login
    ---
    tags:
      - Users
    summary: Authenticate a user and return a JWT access token
    description: Login using email and password.
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - pwd
          properties:
            email:
              type: string
              example: "Zoro.Roronoa@gmail.com"
            pwd:
              type: string
              example: "Password123!"
    responses:
      200:
        description: Successfully authenticated. Returns JWT token.
        schema:
          type: object
          properties:
            access_token:
              type: string
              example: "eyJh..."
      400:
        description: Invalid credentials
    """
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
    """
    Register a new user
    ---
    tags:
      - Users
    summary: Create a new user and return an authentication token
    description: >
      This API creates a new user in the database and returns a JWT token
      if the registration is successful.

      **Password Requirements:**
      - At least 8 characters  
      - At least one uppercase letter  
      - At least one digit  
      - At least one special character  
    parameters:
      - in: body
        name: body
        required: true
        description: User registration data
        schema:
          type: object
          required:
            - name
            - lastname
            - email
            - pwd
            - pwd2
          properties:
            name:
              type: string
              example: "Rufy"
            lastname:
              type: string
              example: "Monkey D."
            email:
              type: string
              example: "Monkey.D.Rufy@gmail.com"
            pwd:
              type: string
              example: "Password123!"
            pwd2:
              type: string
              example: "Password123!"
    responses:
      200:
        description: Successful registration
        schema:
          type: object
          properties:
            access_token:
              type: string
              description: JWT access token
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            message:
              type: string
              example: "User registered"
      400:
        description: Invalid input (password mismatch, invalid email, weak password)
      409:
        description: Email already registered
    """
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
    """
    Get Current User Info
    ---
    tags:
      - Users
    summary: Get authenticated user's info
    description: Returns user profile. Requires Bearer JWT token.
    security:
      - Bearer: []

    responses:
      200:
        description: User profile successfully retrieved
        schema:
          type: object
          properties:
            email:
              type: string
              example: "Sanji.Vinsmoke@gmail.com"
            lastname:
              type: string
              example: "Vinsmoke"
            name:
              type: string
              example: "Sanji"

      404:
        description: User not found
    """
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
    """
    User Logout
    ---
    tags:
      - Users
    summary: Logout the authenticated user
    description: |
      Invalidates the JWT token provided in the Authorization header.

      **Authorization required:** Bearer JWT Token
    security:
      - Bearer: []

    responses:
      200:
        description: Logout successful
        schema:
          type: object
          properties:
            msg:
              type: string
              example: "Logout successful"
    """
    jti = get_jwt()["jti"]
    blacklisted_tokens.add(jti)
    return jsonify(msg="Logout successful"), 200


@user_bp.route("/<int:user_id>/change-role", methods=["PUT"])
@role_required("Admin")
def change_role(user_id):
    """
    Change User Role
    ---
    tags:
      - Users
    summary: Change the role of a specific user
    description: |
      Modifies the role of the target user.

      **Authorization required:** Bearer JWT Token  
      **Required Role:** Admin  

      **Allowed roles:**
      - Admin
      - User
      - Airline-Admin

    parameters:
      - name: user_id
        in: path
        type: integer
        required: true
        description: ID of the user to modify
        example: 123

      - name: body
        in: body
        required: true
        description: JSON body containing the new role
        schema:
          type: object
          required:
            - new_role
          properties:
            new_role:
              type: string
              enum: ["Admin", "User", "Airline-Admin"]
              example: "Airline-Admin"

    security:
      - Bearer: []

    responses:
      200:
        description: Role successfully changed
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Role changed"

      400:
        description: Invalid role or malformed request

      401:
        description: Missing or invalid authentication token

      403:
        description: User does not have Admin privileges

      404:
        description: User not found
    """
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
    """
Assign Airline to User
---
tags:
  - Users
summary: Assign an airline to an Airline-Admin user
description: |
  This API assigns an airline to a user who already has the **Airline-Admin** role.  
  Once assigned, the user will be able to manage **only that airline**.

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Admin

consumes:
  - application/json

security:
  - Bearer: []

parameters:
  - in: path
    name: user_id
    required: true
    type: integer
    description: ID of the user to update

  - in: body
    name: body
    required: true
    schema:
      type: object
      properties:
        airline_code:
          type: string
          example: "AZ"
          description: IATA airline code to assign

responses:
  200:
    description: Airline successfully assigned to user
    schema:
      type: object
      properties:
        message:
          type: string
          example: "airline assigned to the user"

  400:
    description: Invalid payload or user is not Airline-Admin
  401:
    description: Missing or invalid token
  403:
    description: Admin role required
  404:
    description: User not found
"""

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
    """
    Get user flights
    ---
    tags:
      - Users
    summary: Retrieve all flights purchased by the authenticated user
    description: >
      Returns the list of all tickets purchased by the logged-in user, including passenger details, flight details, and the final ticket price.  

      **Authorization required:** Bearer JWT Token  

      **Note:** The price to display is `price` from the ticket object, not the flight `base_price`.

    security:
      - Bearer: []

    responses:
      200:
        description: List of purchased flights
        schema:
          type: array
          items:
            type: object
            properties:
              id_buyer:
                type: integer
                description: ID of the user who purchased the ticket
                example: 9
              id_passenger_ticket:
                type: integer
                description: ID of the passenger-ticket relation
                example: 1
              passenger:
                type: object
                properties:
                  id_passengers:
                    type: integer
                    example: 3
                  name:
                    type: string
                    example: "Mario"
                  lastname:
                    type: string
                    example: "Rossi"
                  date_birth:
                    type: string
                    format: date-time
                    example: "1990-05-20T00:00:00Z"
                  phone_number:
                    type: string
                    example: "+393331234567"
                  email:
                    type: string
                    example: "mario.rossi@example.com"
                  passport_number:
                    type: string
                    example: "X1234567"
              ticket:
                type: object
                properties:
                  id_ticket:
                    type: integer
                    example: 8
                  price:
                    type: number
                    format: float
                    description: Final ticket price to display
                    example: 180.0
                  flight:
                    type: object
                    properties:
                      id_flight:
                        type: integer
                        example: 21
                      id_aircraft:
                        type: integer
                        example: 4
                      route_code:
                        type: string
                        example: "AZ5"
                      base_price:
                        type: number
                        format: float
                        description: Base flight price (not to display)
                        example: 80.0
                      scheduled_departure_day:
                        type: string
                        format: date
                        example: "2025-08-15"
                      scheduled_arrival_day:
                        type: string
                        format: date
                        example: "2025-08-15"
                      airline:
                        type: object
                        properties:
                          iata_code:
                            type: string
                            example: "AZ"
                          name:
                            type: string
                            example: "Alitalia"
                      sections:
                        type: array
                        items:
                          type: object
                          properties:
                            id_airline_routes:
                              type: integer
                              example: 20
                            departure_time:
                              type: string
                              example: "09:00:00"
                            arrival_time:
                              type: string
                              example: "14:30:00"
                            next_id:
                              type: integer
                              nullable: true
                              example: null
                            section:
                              type: object
                              properties:
                                id_routes_section:
                                  type: integer
                                  example: 20
                                code_departure_airport:
                                  type: string
                                  example: "FCO"
                                code_arrival_airport:
                                  type: string
                                  example: "TAS"

      401:
        description: Missing or invalid token
      403:
        description: Unauthorized
    """
    session = SessionLocal()
    id = get_jwt_identity()
    controller = User_controller(session)
    response, status = controller.get_user_flights(id)
    session.close()
    return jsonify(response), status








