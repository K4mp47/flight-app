from flask import Blueprint, request, jsonify, session
from pydantic import ValidationError
from db import SessionLocal

from ..models import Route
from ..models.aircraft_airlines import Aircraft_airline
from ..models.airline import Airline
from ..query.flight_query import get_flights_by_airline
from ..query.airline_query import all_airline, get_aircraft_seat_map_JSON, number_seat_aircraft,get_max_economy_seats, get_airline_class_price_policy, get_airline_price_policy
from ..query.route_query import get_all_route_airline, get_route, get_routes_analytics, get_total_revenue_by_airline_and_date
from ..utils.role_checking import role_required, airline_check_param, airline_check_body
from ..validations.airline_validation import *
from ..controllers.airline_controller import Airline_controller

airline_bp = Blueprint("airline_bp", __name__)

@airline_bp.route("/", methods=["GET"])
#@role_required("Admin")
def get_all_airlines():
        """
        Get all airlines
        ---
        tags:
            - Airline
        summary: Return all airlines
        responses:
            200:
                description: Array of airlines
        """
        session = SessionLocal()
        airlines = all_airline(session)
        session.close()
        return jsonify(airlines), 200

@airline_bp.route("/new", methods=["POST"])
#@role_required("Admin")
def new_airline():
        """
        Create a new airline
        ---
        tags:
            - Airline
        summary: Insert a new airline (Admin only)
        requestBody:
            required: true
            content:
                application/json:
                    schema:
                        $ref: '#/components/schemas/AirlineCreate'
        responses:
            200:
                description: Airline inserted
        """
        try:
                data = Airline_schema(**request.get_json())
        except ValidationError as e:
                return jsonify({"message": str(e)}), 400
        session = SessionLocal()
        controller = Airline_controller(session)
        response, status = controller.insert_airline(data.iata_code, data.name)
        session.close()
        return jsonify(response), status

@airline_bp.route("/add/aircraft/<int:id_aircraft>", methods=["POST"])
#@airline_check_body("airline_code")
def new_aircraft(id_aircraft: int):
        """
        
        """
        try:
                data = Airline_aircraft_schema(**request.get_json())
        except ValidationError as e:
                return jsonify({"message": str(e)}), 400
        session = SessionLocal()
        controller = Airline_controller(session)
        response, status = controller.insert_aircraft(data.airline_code,id_aircraft)
        session.close()
        return jsonify(response), status

@airline_bp.route("/<airline_code>/fleet", methods=["GET"])
#@airline_check_param("airline_code")
def get_fleet(airline_code: str):
        """
        
        """
        session = SessionLocal()
        controller = Airline_controller(session)
        response, status = controller.get_airline_fleet(airline_code)
        session.close()
        return jsonify(response), status

@airline_bp.route("/delete/aircraft/<int:id_aircraft_airline>", methods=["DELETE"])
#@airline_check_body("airline_code")
def delete_aircraft(id_aircraft_airline: int):
        """
        
        """
        session = SessionLocal()
        if (session.get(Aircraft_airline, id_aircraft_airline) is None):
                return jsonify({"message": "id_aircraft_airline not found"}), 404
        else:
                data = request.get_json()
                controller = Airline_controller(session)
                response, status = controller.dalete_fleet_aircraft(data.get("airline_code"), id_aircraft_airline)
                session.close()
                return jsonify(response), status



@airline_bp.route("/add/block/aircraft/<int:id_aircraft_airline>", methods=["POST"])
#@airline_check_body("airline_code")
def new_block(id_aircraft_airline: int):
    """
    Add seat block to aircraft
    ---
    tags:
      - Airline
    summary: Insert a block of seats for an aircraft in the airline fleet
    parameters:
      - in: path
        name: id_aircraft_airline
        schema:
          type: integer
        required: true
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/AircraftBlock'
    responses:
      200:
        description: Block inserted successfully
    """
    session = SessionLocal()
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
        return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
        try:
            data = Airline_aircraft_block_schema(**request.get_json())
        except ValidationError as e:
            session.close()
            return jsonify({"message": str(e)}), 400

        try:
            controller = Airline_controller(session)
            response, status = controller.insert_block(
                data.matrix,
                data.id_class,
                id_aircraft_airline
            )
            return jsonify(response), status
        except Exception as e:
            session.rollback()
            return jsonify({"error": str(e)}), 500
        finally:
            session.close()



@airline_bp.route("/<airline_code>/aircraft/<int:id_aircraft_airline>/seat_map", methods=["GET"])
#@airline_check_param("airline_code")
def get_seat_map(airline_code: str, id_aircraft_airline: int):
    """
    Get seat map for aircraft
    ---
    tags:
        - Airline
    
    """
    session = SessionLocal()
    if (session.get(Aircraft_airline, id_aircraft_airline) is None):
            return jsonify({"message": "id_aircraft_airline not found"}), 404
    else:
            seat_map = get_aircraft_seat_map_JSON(session, id_aircraft_airline)
            seats_number = number_seat_aircraft(session, id_aircraft_airline)
            seats_remaining = get_max_economy_seats(session, id_aircraft_airline) - seats_number
            session.close()
            return jsonify(
                    {"additional_seats_remaining": seats_remaining, "seats_number": seats_number, "seat_map": seat_map}), 200


@airline_bp.route("/aircraft/clone-seatmap", methods=["POST"])
#@airline_check_body("airline_code")
def clone_seatmap():
    """
    Clone aircraft seatmap
    ---
    tags:
      - Airline
    summary: Copy seatmap from one aircraft to another
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CloneSeatmap'
    responses:
      201:
        description: Operation successful
    """
    session = SessionLocal()
    try:
        data = Clone_aircraft_seat_map_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.clone_aircraft_seat_map(data.source_id, data.target_id)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status

@airline_bp.route("/add/route", methods=["POST"])
#@airline_check_body("airline_code")
def add_route():
    """
    Add route to airline
    ---
    tags:
      - Airline
    summary: Create a new route for an airline
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/RouteAirlineCreate'
    responses:
      200:
        description: Route created successfully
    """
    session = SessionLocal()
    try:
        data = Route_airline_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.insert_new_route(data.airline_code, data.number_route, data.start_date,data.end_date, data.section, data.delta_for_return_route)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status

@airline_bp.route("/route/<code>/change-deadline", methods=["PUT"])
#@airline_check_body("airline_code")
def change_route_deadline(code: str):
    """
    Change route deadline
    ---
    tags:
        - Airline
    summary: Update the end date for a route
    
    """
    session = SessionLocal()
    try:
            data = Route_deadline_schema(**request.get_json())
    except ValidationError as e:
            session.close()
            return jsonify({"message": str(e)}), 400

    controller = Airline_controller(session)
    response, status = controller.change_deadline(code, data.end_date)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/route", methods=["GET"])
#@airline_check_param("airline_code")
def get_routes(airline_code: str):
        """
        Get routes for airline
        ---
    
        """
        session = SessionLocal()
        if session.get(Airline, airline_code) is None:
                return jsonify({"message": "airline_code not found"}), 404
        routes = get_all_route_airline(session, airline_code)
        session.close()
        return jsonify({"routes": routes}), 200

@airline_bp.route("/<airline_code>/route/<code>/info", methods=["GET"])
#@airline_check_param("airline_code")
def get_route_info(airline_code: str,code: str):
        """
        Get route info
        ---
        tags:
            - Airline
        """
        session = SessionLocal()
        if session.get(Route, code) is None:
                return jsonify({"message": "route not found"}), 404
        route = get_route(session, code)
        session.close()
        return jsonify({"routes": route}), 200

@airline_bp.route("/route/<code>/add-flight", methods=["POST"])
#@airline_check_body("airline_code")
def new_route_flight(code: str):
    """
    Add flights to a route
    ---
    tags:
      - Airline
    summary: Insert flight schedule for a route (Airline-Admin)
    parameters:
      - in: path
        name: code
        schema:
          type: integer
        required: true
        description: Route code
    responses:
        200:   
            description: Flights added successfully
    
    """
    session = SessionLocal()
    try:
        data = Flight_schedule_request_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400

    try:
        with session.begin():
            controller = Airline_controller(session)
            response, status = controller.insert_flight_schedule(code, data.aircraft_id, data.flight_schedule)
    except Exception as e:
        response, status = {"message": str(e)}, 500
    finally:
        session.close()

    return jsonify(response), status

@airline_bp.route("/add-class-price-policy", methods=["POST"])
#@airline_check_body("airline_code")
def new_class_price_policy():
    session = SessionLocal()
    try:
        data = Class_price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.insert_class_price_policy(data.id_class, data.airline_code, data.price_multiplier, data.fixed_markup)
    session.close()
    return jsonify(response), status

@airline_bp.route("/class-price-policy/<int:id_class_price_policy>/modify", methods=["PUT"])
#@airline_check_body("airline_code")
def modify_class_price_policy(id_class_price_policy: int):
    session = SessionLocal()
    try:
        data = Class_price_policy_data_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_class_price_policy(id_class_price_policy, data.price_multiplier,data.fixed_markup)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/class-price-policy/", methods=["GET"])
#@airline_check_param("airline_code")
def get_class_price_policies(airline_code: str):
    session = SessionLocal()
    airline = session.get(Airline, airline_code)
    if airline is None:
        return jsonify({"message": "airline not found"}), 404
    policies = get_airline_class_price_policy(session, airline_code)
    session.close()
    return jsonify({"policies": policies}), 200

@airline_bp.route("/<airline_code>/add/price-policy", methods=["POST"])
#@airline_check_param("airline_code")
def new_price_policy(airline_code: str):
    session = SessionLocal()
    try:
        data = Price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.insert_price_policy(airline_code, data.fixed_markup, data.price_for_km, data.fee_fro_stopover)
    session.close()
    return jsonify(response), status

@airline_bp.route("<airline_code>/price-policy/modify", methods=["PUT"])
#@airline_check_param("airline_code")
def modify_price_policy(airline_code: str):
    session = SessionLocal()
    try:
        data = Price_policy_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_price_policy(airline_code, data.fixed_markup, data.price_for_km, data.fee_fro_stopover)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/price-policy/", methods=["GET"])
#@airline_check_param("airline_code")
def get_price_policies(airline_code: str):
    session = SessionLocal()
    airline = session.get(Airline, airline_code)
    if airline is None:
        return jsonify({"message": "airline not found"}), 404
    policies = get_airline_price_policy(session, airline_code)
    session.close()
    return jsonify({"policies": policies}), 200

@airline_bp.route("/route/<code>/base_price/", methods=["PUT"])
#@airline_check_body("airline_code")
def change_base_price(code: str):
    session = SessionLocal()
    try:
        data = Route_change_price_schema(**request.get_json())
    except ValidationError as e:
        session.close()
        return jsonify({"message": str(e)}), 400
    controller = Airline_controller(session)
    response, status = controller.change_route_base_price(code, data.base_price)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/analytics/route/<code>", methods=["GET"])
#@airline_check_param("airline_code")
def route_analytics(airline_code: str ,code: str):
    try:
        query_params = request.args.to_dict()
        data = Route_analytics_schema(**query_params)
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_route_analytics(airline_code, data.model_dump(),code)
    session.close()
    return jsonify(response), status


@airline_bp.route("/<airline_code>/analytics/flight/<id_flight>", methods=["GET"])
#@airline_check_param("airline_code")
def flight_analytics(airline_code: str,id_flight: int):
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_flight_analytics(id_flight)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/analytics/routes", methods=["GET"])
#@airline_check_param("airline_code")
def get_all_routes_analytics(airline_code: str):
    try:
        query_params = request.args.to_dict()
        data = Routes_analytics_schema(**query_params)
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    analytics = get_routes_analytics(session, airline_code, data.start_date)
    session.close()
    return jsonify({"analytics": analytics}), 200

@airline_bp.route("/<airline_code>/analytics/routes/total_revenue", methods=["GET"])
#@airline_check_param("airline_code")
def get_routes_total_revenue(airline_code: str):
    try:
        query_params = request.args.to_dict()
        data = Routes_analytics_schema(**query_params)
    except ValidationError as e:
        return jsonify({"message": str(e)}), 400
    session = SessionLocal()
    analytics = get_total_revenue_by_airline_and_date(session, airline_code, data.start_date)
    session.close()
    return jsonify({"total_revenue": analytics}), 200

@airline_bp.route("/<airline_code>/flight", methods=["GET"])
#@airline_check_param("airline_code")
def get_airline_flights(airline_code: str):
    """
    Ritorna i voli di una compagnia
    Ruoli -> Airline-Admin
    Authorization: Bearer token_utente
    API che mostra inserendo il codice della compagnia aerea (es AZ, TK ecc...) tutti i voli della compagnia.
    ---
    tags:
       - Airline
    responses:
      200:
        description: Esempio di risposta (un elemento della lista dei voli)
        schema:
          type: object
          properties:
            Route_code:
              type: string
            airline_iata_code:
              type: string
            arrival_day:
              type: string
            arrival_time:
              type: string
            base_price:
              type: number
            departure_day:
              type: string
            departure_time:
              type: string
            destination:
              type: string
            duration:
              type: string
            id_flight:
              type: integer
            origin:
              type: string
        examples:
          application/json:
            Route_code: "AZ9"
            airline_iata_code: "AZ"
            arrival_day: "Thu, 01 Jan 2026 00:00:00 GMT"
            arrival_time: "09:50"
            base_price: 135
            departure_day: "Thu, 01 Jan 2026 00:00:00 GMT"
            departure_time: "08:30"
            destination: "LHR"
            duration: "01:20"
            id_flight: 267
            origin: "VCE"
    """
    session = SessionLocal()
    flights = get_flights_by_airline(session, airline_code)
    session.close()
    return jsonify(flights), 200












