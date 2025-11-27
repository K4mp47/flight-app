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
        Get All Airlines
        ---
        tags:
          - Airline
        summary: Retrieve all airlines in the database
        description: |
          Returns a list of all airlines available in the system.
          
          **Authorization required:** Bearer JWT Token
          **Allowed roles:**
          - Admin
        security:
          - Bearer: []
        responses:
          200:
            description: List of airlines
            schema:
              type: array
              items:
                type: object
                properties:
                  iata_code:
                    type: string
                    example: "AZ"
                  name:
                    type: string
                    example: "ITA Airways"
          401:
            description: Missing or invalid authentication token
          403:
            description: User does not have the required Admin role
        """
        session = SessionLocal()
        airlines = all_airline(session)
        session.close()
        return jsonify(airlines), 200

@airline_bp.route("/new", methods=["POST"])
#@role_required("Admin")
def new_airline():
    """
    Insert New Airline
    ---
    tags:
      - Airline
    summary: Add a new airline to the database
    description: |
      Inserts a new airline record.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Admin  

      **Constraints:** `iata_code` must be exactly 2 characters.

    security:
      - Bearer: []

    parameters:
      - name: body
        in: body
        required: true
        description: JSON body with airline info
        schema:
          type: object
          required:
            - iata_code
            - name
          properties:
            iata_code:
              type: string
              minLength: 2
              maxLength: 2
              example: "S9"
            name:
              type: string
              example: "Straw-hats Airline"

    responses:
      200:
        description: Airline successfully inserted
        content:
          application/json:
            schema:
              type: object
              properties:
                airline:
                  type: object
                  properties:
                    iata_code:
                      type: string
                      example: "S9"
                    name:
                      type: string
                      example: "Straw-hats Airline"
                message:
                  type: string
                  example: "airline inserted"

      400:
        description: Invalid input (e.g., iata_code not 2 characters)

      401:
        description: Missing or invalid JWT token

      403:
        description: User does not have Admin privileges
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
        Add Aircraft to Airline Fleet
        ---
        tags:
          - Airline
        summary: Add an aircraft to an airline's fleet
        description: |
          Associates an existing aircraft with a specific airline.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Airline-Admin

        parameters:
          - name: id_aircraft
            in: path
            type: integer
            required: true
            description: ID of the aircraft to add
            example: 1

          - name: body
            in: body
            required: true
            description: JSON body with the airline IATA code
            schema:
              type: object
              required:
                - airline_code
              properties:
                airline_code:
                  type: string
                  example: "AZ"

        security:
          - Bearer: []

        responses:
          200:
            description: Aircraft successfully added to airline
            schema:
              type: object
              properties:
                aircraft:
                  type: object
                  properties:
                    aircraft:
                      type: object
                      properties:
                        id_aircraft:
                          type: integer
                          example: 1
                        name:
                          type: string
                          example: "A320"
                        double_deck:
                          type: boolean
                          example: false
                        max_economy_seats:
                          type: integer
                          example: 180
                        manufacturer:
                          type: object
                          properties:
                            id_manufacturer:
                              type: integer
                              example: 1
                            name:
                              type: string
                              example: "Airbus"
                    airline:
                      type: object
                      properties:
                        iata_code:
                          type: string
                          example: "AZ"
                        name:
                          type: string
                          example: "Alitalia"
                    id_aircraft_airline:
                      type: integer
                      example: 5
                message:
                  type: string
                  example: "aircraft inserted successfully"

          400:
            description: Invalid request (e.g., airline not found)

          401:
            description: Missing or invalid JWT token

          403:
            description: User does not have Airline-Admin privileges


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
        Get Airline Fleet
        ---
        tags:
          - Airline
        summary: Retrieve all aircraft in a specific airline's fleet
        description: |
          Returns all aircraft associated with the airline identified by `airline_code`.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Airline-Admin

        parameters:
          - name: airline_code
            in: path
            type: string
            required: true
            description: IATA code of the airline
            example: "AZ"

        security:
          - Bearer: []

        responses:
          200:
            description: List of aircraft in the airline's fleet
            schema:
              type: array
              items:
                type: object
                properties:
                  aircraft:
                    type: object
                    properties:
                      id_aircraft:
                        type: integer
                        example: 7
                      name:
                        type: string
                        example: "A350-1000"
                      double_deck:
                        type: boolean
                        example: false
                      max_economy_seats:
                        type: integer
                        example: 480
                      manufacturer:
                        type: object
                        properties:
                          id_manufacturer:
                            type: integer
                            example: 1
                          name:
                            type: string
                            example: "Airbus"
                  airline:
                    type: object
                    properties:
                      iata_code:
                        type: string
                        example: "AZ"
                      name:
                        type: string
                        example: "Alitalia"
                  id_aircraft_airline:
                    type: integer
                    example: 1

          401:
            description: Missing or invalid JWT token

          403:
            description: User does not have Airline-Admin privileges

          404:
            description: Airline not found
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
        Delete Aircraft from Airline Fleet
        ---
        tags:
          - Airline
        summary: Remove an aircraft from an airline's fleet
        description: |
          Deletes the specified aircraft from the airline's fleet.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Airline-Admin

        parameters:
          - name: id_aircraft_airline
            in: path
            type: integer
            required: true
            description: ID of the aircraft in the airline fleet
            example: 2

          - name: body
            in: body
            required: true
            description: JSON body with the airline IATA code
            schema:
              type: object
              required:
                - airline_code
              properties:
                airline_code:
                  type: string
                  example: "AZ"

        security:
          - Bearer: []

        responses:
          200:
            description: Aircraft successfully deleted from fleet
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "aircraft deleted from the fleet successfully"

          400:
            description: Invalid request (e.g., aircraft not in fleet)

          401:
            description: Missing or invalid JWT token

          403:
            description: User does not have Airline-Admin privileges

          404:
            description: Airline or aircraft not found
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
        Add Seat Block to Aircraft
        ---
        tags:
          - Airline
        summary: Create a block of seats for a specific aircraft
        description: |
          Creates a block of seats in an aircraft for a specific airline and class.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Airline-Admin

          **Rules for constructing the matrix:**
          1. Each row must have exactly `cabin_max_cols` elements (includes seats and aisles).  
             - Example: A321 has `cabin_max_cols = 7` -> seat-seat-seat-aisle-seat-seat-seat
          2. Each `true` represents a seat, `false` represents an aisle.  
          3. The total number of seats in all blocks of the aircraft **cannot exceed `max_economy_seats`**.  
             - Example: A321 has `max_economy_seats = 244`
          4. Multiple blocks can be created, but the sum of all `true` values across blocks must stay <= `max_economy_seats`.
          5. Rows can be unlimited as long as the total seats do not exceed `max_economy_seats`.

          **Validation logic summary:**
          - Check each row length == `cabin_max_cols`
          - Count total `true` in new matrix + existing blocks <= `max_economy_seats`
          - Raise error if rules are violated

        parameters:
          - name: id_aircraft_airline
            in: path
            type: integer
            required: true
            description: ID of the aircraft in the airline's fleet
            example: 3

          - name: body
            in: body
            required: true
            description: JSON body with seat block information
            schema:
              type: object
              required:
                - matrix
                - airline_code
                - id_class
              properties:
                matrix:
                  type: array
                  description: 2D array representing rows (true=seat, false=aisle)
                  items:
                    type: array
                    items:
                      type: boolean
                  example:
                    [
                      [true, true, true, false, true, true, true],
                      [true, true, true, false, true, true, true]
                    ]
                airline_code:
                  type: string
                  example: "AZ"
                id_class:
                  type: integer
                  example: 4

        security:
          - Bearer: []

        responses:
          200:
            description: Block inserted successfully
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Block inserted successfully"

          400:
            description: Invalid block (columns mismatch or exceeds max seats)

          401:
            description: Missing or invalid JWT token

          403:
            description: User does not have Airline-Admin privileges

          404:
            description: Aircraft or airline not found

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
        Get Seat Map of Aircraft
        ---
        tags:
          - Airline
        summary: Retrieve the seat map of a specific aircraft in an airline's fleet
        description: |
          Returns the complete seat map for the aircraft identified by `id_aircraft_airline` for a given airline.

          **Authorization required:** Bearer JWT Token  
          **Allowed roles:** Airline-Admin

          **Seat map structure:**
          - `additional_seats_remaining`: Number of seats that can still be added to aircraft
          - `seats_number`: Total number of seats currently in the aircraft
          - `seat_map`: List of seat blocks by class
            - `class_name`: Name of the class (e.g., First, Economy)
            - `id_class`: Class ID
            - `id_cell_block`: ID of the block
            - `rows`: Number of rows in the block
            - `cols`: Number of columns per row
            - `cells`: List of individual cells
              - `id_cell`: Unique cell ID
              - `is_seat`: True if cell is a seat, False if aisle
              - `x`: Column index
              - `y`: Row index


        parameters:
          - name: airline_code
            in: path
            type: string
            required: true
            description: IATA code of the airline
            example: "AZ"

          - name: id_aircraft_airline
            in: path
            type: integer
            required: true
            description: ID of the aircraft in the airline's fleet
            example: 3

        security:
          - Bearer: []

        responses:
          200:
            description: Seat map successfully retrieved
            schema:
              type: object
              properties:
                additional_seats_remaining:
                  type: integer
                  example: 40
                seats_number:
                  type: integer
                  example: 140
                seat_map:
                  type: array
                  items:
                    type: object
                    properties:
                      class_name:
                        type: string
                        example: "First"
                      id_class:
                        type: integer
                        example: 1
                      id_cell_block:
                        type: integer
                        example: 5
                      rows:
                        type: integer
                        example: 5
                      cols:
                        type: integer
                        example: 3
                      cells:
                        type: array
                        items:
                          type: object
                          properties:
                            id_cell:
                              type: integer
                              example: 1
                            is_seat:
                              type: boolean
                              example: true
                            x:
                              type: integer
                              example: 0
                            y:
                              type: integer
                              example: 0

          401:
            description: Missing or invalid JWT token

          403:
            description: User does not have Airline-Admin privileges

          404:
            description: Aircraft or airline not found

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
    Clone Seat Map from One Aircraft to Another
    ---
    tags:
      - Airline
    summary: Copy seat blocks and positions from a source aircraft to a target aircraft
    description: |
      Copies the seat map configuration from a source aircraft (A) to a target aircraft (B) 
      for the same airline.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

      **Important notes:**
      1. If the target aircraft already has a seat map configuration, it will be deleted and replaced with the source's seat map.
      2. This operation may take some time because the database does not have indices yet.  
         Example: deleting 150 records took 12.24 sec.
      3. Ensure `source_id` and `target_id` are valid aircraft IDs in the same airline.

    parameters:
      - name: body
        in: body
        required: true
        description: JSON body with airline code and aircraft IDs
        schema:
          type: object
          required:
            - airline_code
            - source_id
            - target_id
          properties:
            airline_code:
              type: string
              example: "AZ"
            source_id:
              type: integer
              description: ID of the source aircraft (to copy from)
              example: 4
            target_id:
              type: integer
              description: ID of the target aircraft (to copy to)
              example: 3

    security:
      - Bearer: []

    responses:
      201:
        description: Seat map cloned successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Operation successful 3 copied blocks"

      400:
        description: Invalid request (e.g., invalid aircraft IDs or airline)

      401:
        description: Missing or invalid JWT token

      403:
        description: User does not have Airline-Admin privileges

      404:
        description: Source or target aircraft not found

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
    Create Airline Route (Direct or Multi-Segment)
    ---
    tags:
      - Airline
    summary: Create a new airline route (including automatic return route)
    description: |
      Creates a new **airline route** for the specified airline.  
      Supports both:
      
      - **Direct routes**  
      - **Multi-segment routes with layovers** (recursive structure)

      **Authorization required:** Bearer JWT  
      **Allowed roles:** Airline-Admin

      ### IMPORTANT BUSINESS RULES

      #### 1. **number_route**
      - Combined with airline code → forms route code.  
        Example: airline `"AZ"` + number_route `1` → **AZ1**
      - Must be between **1 and 9999**.

      #### 2. **Dates**
      - `start_date` → contract start  
      - `end_date` → contract end  

      #### 3. **Return Route**
      - The system automatically creates the **return route**.
      - Return route code is always **number_route + 1**.
        Example:  
        - Outbound: `AZ1930`  
        - Return:   `AZ1931`
      - Error is returned if a paired number cannot be used.

      #### 4. **Return Route Departure Time**
      - Return departure_time = **arrival_time(outbound) + delta_for_return_route (minutes)**

      #### 5. **Price Policy Requirement**
      - You must populate the *price policy table* before calling this API  

      #### 6. **Route Section Structure**
      Each route is made of:
      - A first segment with `departure_time`
      - Optional *layovers* using `waiting_time`

      #### 7. **Layover Rules**
      - Layovers use `waiting_time` (minutes), not departure_time.
      - **waiting_time must be ≥ 120 minutes**
      - Layover chain continues until: `"next_session": null`.

    security:
      - Bearer: []

    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - airline_code
            - number_route
            - start_date
            - end_date
            - delta_for_return_route
            - section
          properties:
            airline_code:
              type: string
              example: "AZ"
            number_route:
              type: integer
              example: 1
            start_date:
              type: string
              example: "2025-08-10"
            end_date:
              type: string
              example: "2025-08-12"
            base_price:
              type: number
              example: 10
            delta_for_return_route:
              type: integer
              example: 120
            section:
              type: object
              description: First segment + optional layovers
              required:
                - departure_airport
                - arrival_airport
              properties:
                departure_time:
                  type: string
                  nullable: true
                  example: "09:00"
                waiting_time:
                  type: integer
                  nullable: true
                  example: null
                departure_airport:
                  type: string
                  example: "FCO"
                arrival_airport:
                  type: string
                  example: "GYD"
                next_session:
                  type: object
                  nullable: true
                  description: Recursively defines layovers
                  example: null

    responses:
      200:
        description: Route successfully created
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Route AZ1 and return AZ2 created successfully"

      400:
        description: Invalid data or rule violation
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required

    x-code-samples:
      - lang: Direct Route Example (JSON Body)
        source: |
          {
            "airline_code": "AZ",
            "number_route": 1,
            "start_date": "2025-08-10",
            "end_date": "2025-08-12",
            "base_price": 10,
            "delta_for_return_route": 120,
            "section": {
              "departure_time": "09:00",
              "departure_airport": "FCO",
              "arrival_airport": "GYD",
              "next_session": null
            }
          }

      - lang: Multi-Segment Example (JSON Body)
        source: |
          {
            "airline_code": "AZ",
            "number_route": 1930,
            "start_date": "2025-08-10",
            "end_date": "2025-08-12",
            "delta_for_return_route": 780,
            "section": {
              "departure_time": "08:30",
              "departure_airport": "FCO",
              "arrival_airport": "JFK",
              "next_session": {
                "waiting_time": 180,
                "departure_airport": "JFK",
                "arrival_airport": "MIA",
                "next_session": null
              }
            }
          }
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
    Update Route Contract End Date
    ---
    tags:
      - Airline
    summary: Update end_date for a route (and its reverse route if present)
    description: |
      Updates the **contract end date** of a route identified by its route code.

      **Authorization required:** Bearer JWT  
      **Allowed roles:** Airline-Admin

      ### IMPORTANT BUSINESS RULES

      - You may pass **either** the outbound or return route code — it makes no difference.
      - If the route has a **reverse route**, its end_date is **updated automatically**.
      - If the airline_code does not match the route’s airline, an error is returned.

    security:
      - Bearer: []

    parameters:
      - name: code
        in: path
        required: true
        type: string
        description: The route code to update (e.g., AZ1930 or AZ1931)

      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - airline_code
            - end_date
          properties:
            airline_code:
              type: string
              example: "AZ"
            end_date:
              type: string
              description: New end date for the contract
              example: "2027-09-12"

    responses:
      200:
        description: End date updated successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "End date updated successfully"

      400:
        description: Invalid data or rule violation
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Route not found

    x-code-samples:
      - lang: JSON Body Example
        source: |
          {
            "airline_code": "AZ",
            "end_date": "2027-09-12"
          }
    
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
        Get All Routes of an Airline
        ---
        tags:
          - Airline
        summary: Retrieve all routes for a specific airline
        description: |
          Returns the list of **all active and inactive routes** belonging to an airline.

          **Authorization required:** Bearer JWT  
          **Allowed roles:** Airline-Admin

          Returned routes include:
            - Route code  
            - Contract start and end date  
            - Creation timestamp  
            - All route segments (“details”), including:
            - Departure / arrival airports  
            - Departure / arrival times  
            - Segment chain (`id_next`)  
            - Route section IDs  

        security:
          - Bearer: []

        parameters:
          - name: airline_code
            in: path
            required: true
            type: string
            description: The IATA airline code (e.g., "AZ")

        responses:
          200:
            description: List of routes retrieved successfully
            schema:
              type: object
              properties:
                routes:
                  type: array
                  items:
                    type: object
                    properties:
                      route_code:
                        type: string
                      start_date:
                        type: string
                      end_date:
                        type: string
                      route_created_at:
                        type: string
                      details:
                        type: array
                        description: The ordered list of route segments
                        items:
                          type: object
                          properties:
                            route_section_id:
                              type: integer
                            route_detail_id:
                              type: integer
                            departure_airport:
                              type: string
                            arrival_airport:
                              type: string
                            departure_time:
                              type: string
                            arrival_time:
                              type: string
                            id_next:
                              type: integer
                              nullable: true

          401:
            description: Missing or invalid token
          403:
            description: Airline-Admin role required
          404:
            description: Airline not found

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
        Get Route Information
        ---
        tags:
          - Airline
        summary: Retrieve detailed information about a specific airline route
        description: |
          Returns detailed information about a route identified by its route code.

          **Authorization required:** Bearer JWT  
          **Allowed roles:** Airline-Admin

          The response includes:
            - Route code  
            - Ordered list of segments  
            - For each segment:
              - Departure/arrival airports  
              - Departure/arrival times  
              - Layover duration (if applicable)  
              - Segment ID  
            - Total flight duration (all segments combined)

        security:
          - Bearer: []

        parameters:
          - name: airline_code
            in: path
            required: true
            type: string
            description: The airline’s IATA code (e.g., "AZ")

          - name: code
            in: path
            required: true
            type: string
            description: The route code (e.g., "AZ1931")

        responses:
          200:
            description: Route information retrieved successfully
            schema:
              type: object
              properties:
                routes:
                  type: object
                  properties:
                    route_code:
                      type: string
                    total_duration:
                      type: string
                      description: Total flight duration in HH:MM format
                    segments:
                      type: array
                      description: Chronological list of flight segments
                      items:
                        type: object
                        properties:
                          id_airline_routes:
                            type: integer
                          from:
                            type: string
                          to:
                            type: string
                          departure_time:
                            type: string
                          arrival_time:
                            type: string
                          layover_minutes:
                            type: integer
                            nullable: true

          401:
            description: Missing or invalid token
          403:
            description: Airline-Admin role required
          404:
            description: Route not found
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
Add Flights to a Route
---
tags:
  - Airline
summary: Add scheduled flight instances to a specific airline route
description: |
  Inserts scheduled flights (outbound and return) for a given airline route.

  You must always call this API on the **outbound route** (the one where `is_outbound = True`).  
  The system will automatically find its corresponding return route.

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

  ### Scheduling Logic
  - `aircraft_id` is the aircraft assigned to both the outbound and return flights.
  - An aircraft can be assigned **only to one route pair** (outbound + return).
  - Each entry in `flight_schedule` contains:
      - `outbound`: the date of departure for the outbound flight
      - `return_`: the date of departure for the return flight  
  - Arrival dates are fully calculated by the backend based on route duration.
  - Dates **must be within the contract window** (`start_date` → `end_date`).
  - The return flight **must depart after the arrival time** of the outbound flight.
  - You cannot schedule flights outside route duration constraints.

security:
  - Bearer: []

parameters:
  - name: code
    in: path
    required: true
    type: string
    description: The route code (e.g., "AZ1")

  - name: body
    in: body
    required: true
    schema:
      type: object
      required:
        - airline_code
        - aircraft_id
        - flight_schedule
      properties:
        airline_code:
          type: string
          example: "AZ"
        aircraft_id:
          type: integer
          example: 4
        flight_schedule:
          type: array
          description: |
            List of scheduled flight dates.  
            Each entry represents one outbound and one return flight.
          items:
            type: object
            properties:
              outbound:
                type: string
                example: "2025-08-10"
              return_:
                type: string
                example: "2025-08-10"



responses:
  200:
    description: Flight schedule successfully inserted
    schema:
      type: object
      properties:
        message:
          type: string
        flights:
          type: array
          items:
            type: object
            properties:
              outbound_departure:
                type: string
              outbound_arrival:
                type: string
              return_departure:
                type: string
              return_arrival:
                type: string

  400:
    description: Invalid schedule or aircraft assignment
  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  404:
    description: Route or aircraft not found
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
    """
Add Class Price Policy
---
tags:
  - Airline
summary: Define pricing rules for a specific seat class
description: |
  This API creates the **pricing policy** for a seat class of an airline.  
  For example, First Class might be more expensive than Economy, and these rules define how much more.

  The final ticket price is influenced by:
  - **price_multiplier** → percentage markup applied based on the class  
  - **fixed_markup** → fixed additional cost for that class  

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

consumes:
  - application/json

security:
  - Bearer: []

parameters:
  - in: body
    name: body
    required: true
    schema:
      type: object
      required:
        - id_class
        - airline_code
        - price_multiplier
        - fixed_markup
      properties:
        id_class:
          type: integer
          example: 1
          description: ID of the class (e.g., 1 = First, 2 = Business...)
        airline_code:
          type: string
          example: "AZ"
          description: IATA airline code
        price_multiplier:
          type: number
          example: 20
          description: Percentage added to ticket base price for this class
        fixed_markup:
          type: number
          example: 10
          description: Fixed base surcharge for the class

responses:
  201:
    description: Pricing policy successfully created
    schema:
      type: object
      properties:
        message:
          type: string
          example: "Class price policy added successfully"

  400:
    description: Invalid request body
  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  409:
    description: Policy for this class already exists
"""

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
    """
Modify Class Price Policy
---
tags:
  - Airline
summary: Update the pricing policy for a seat class
description: |
  This API updates the **price_multiplier** and/or **fixed_markup** of an existing class price policy.  
  You may update **one** or **both** values.

  If you want to keep one of the values unchanged, simply set it to `null`.

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

consumes:
  - application/json

security:
  - Bearer: []

parameters:
  - name: id_class_price_policy
    in: path
    required: true
    type: integer
    description: The ID of the class price policy to update

  - in: body
    name: body
    required: true
    schema:
      type: object
      required:
        - airline_code
      properties:
        airline_code:
          type: string
          example: "AZ"
          description: IATA airline code that owns the policy
        price_multiplier:
          type: number
          nullable: true
          example: 20
          description: |
            Percentage markup for this class.  
            Set to `null` to keep existing value unchanged.
        fixed_markup:
          type: number
          nullable: true
          example: 10
          description: |
            Fixed price addition for this class.  
            Set to `null` to keep existing value unchanged.

responses:
  200:
    description: Price policy updated successfully
    schema:
      type: object
      properties:
        message:
          type: string
          example: "Class price policy updated successfully"

  400:
    description: Invalid values or missing parameters
  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  404:
    description: Class price policy not found
"""

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
    """
Get Class Price Policies of an Airline
---
tags:
  - Airline
summary: Retrieve all class price policies for a specific airline
description: |
  Returns the list of **class-price-policy** configurations for the given airline.  
  Each policy includes information about the seat class, the fixed markup, and the price multiplier.

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

security:
  - Bearer: []

parameters:
  - name: airline_code
    in: path
    required: true
    type: string
    description: The IATA airline code (e.g., "AZ")

responses:
  200:
    description: Class price policies retrieved successfully
    schema:
      type: object
      properties:
        policies:
          type: array
          items:
            type: object
            properties:
              airline_code:
                type: string
                example: "AZ"
              class_seat:
                type: object
                properties:
                  id_class:
                    type: integer
                    example: 4
                  code:
                    type: string
                    example: "Y"
                  name:
                    type: string
                    example: "Economy"
              price_multiplier:
                type: number
                example: 1
              fixed_markup:
                type: number
                example: 0

  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  404:
    description: Airline not found or no policies available
"""

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
    """
    Add Price Policy to an Airline
    ---
    tags:
      - Airline
    summary: Add a price policy to an airline
    description: |
      Creates a **price policy** for the specified airline.
      This policy is used to automatically calculate the **base ticket price**.

      **Authorization required:** Bearer JWT
      **Allowed roles:** Airline-Admin

      The base ticket price is computed with the formula:
      base_price = fixed_markup + (total_km * price_for_km) + (stopovers * fee_for_stopover)

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        type: string
        description: IATA code of the airline (e.g., "AZ")

      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - fixed_markup
            - price_for_km
            - fee_for_stopover
          properties:
            fixed_markup:
              type: number
              example: 10
            price_for_km:
              type: number
              example: 0.05
            fee_for_stopover:
              type: number
              example: 20

    responses:
      201:
        description: Price policy successfully added
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Price policy added successfully"

      400:
        description: Invalid or missing data
      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found
    """
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
    """
Modify price policy to an airline
---
tags:
  - Airline
summary: Modify an airline's price policy
description: |
  Updates the **price policy** of the specified airline.  
  If a value should remain unchanged, set it to `null`.  

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

security:
  - Bearer: []

parameters:
  - name: airline_code
    in: path
    required: true
    type: string
    description: IATA airline code (e.g., "AZ")

  - name: body
    in: body
    required: true
    schema:
      type: object
      properties:
        fixed_markup:
          type: number
          nullable: true
          example: null
          description: Base ticket price
        price_for_km:
          type: number
          nullable: true
          example: 0.05
          description: Multiplier per km
        fee_for_stopover:
          type: number
          nullable: true
          example: 5
          description: Additional fee per stopover

responses:
  200:
    description: Price policy updated successfully
    content:
      application/json:
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Price policy updated successfully"

  400:
    description: Invalid or missing data
  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  404:
    description: Airline not found

    """
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
    """
Get price policy to an airline
---
tags:
  - Airline
summary: Get the price policy of an airline
description: |
  Returns the **price policy** of the specified airline.

  **Authorization required:** Bearer JWT  
  **Allowed roles:** Airline-Admin

security:
  - Bearer: []

parameters:
  - name: airline_code
    in: path
    required: true
    type: string
    description: IATA airline code (e.g., "AZ")

responses:
  200:
    description: Price policy retrieved successfully
    schema:
      type: object
      properties:
        policies:
          type: array
          items:
            type: object
            properties:
              airline_code:
                type: string
                example: "AZ"
              fixed_markup:
                type: number
                example: 20
              price_for_km:
                type: number
                example: 0.2
              fee_for_stopover:
                type: number
                example: 25
  401:
    description: Missing or invalid token
  403:
    description: Airline-Admin role required
  404:
    description: Airline not found

    """
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
    """
  Put base price
  ---
  tags:
    - Airline 
  summary: Modify the base price of a route
  description: Update the base price for a specific route. Only Airline-Admin role can perform this action.
  parameters:
    - name: route_code
      in: path
      type: string
      required: true
      description: Route code (e.g., "TK1930")
    - name: body
      in: body
      required: true
      schema:
        type: object
        properties:
          airline_code:
            type: string
            example: "TK"
            description: IATA code of the airline
          base_price:
            type: number
            format: float
            example: 250
            description: New base price for the route
  security:
    - Bearer: []
  responses:
    200:
      description: Route base price successfully modified
      schema:
        type: object
        properties:
          message:
            type: string
            example: "route base price has been successfully modified."
    401:
      description: Missing or invalid token
    403:
      description: Airline-Admin role required
    404:
      description: Route not found

    """
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
    """
    Airline route analytics
    ---
    tags:
      - Airline
    summary: Retrieve analytics for a specific route
    description: >
      Returns analytics data for a given airline route, including passenger distribution per class, total passengers, and revenue.
      
      Optional query parameters `start_date` and `end_date` can be used to filter analytics over a specific time range.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        schema:
          type: string
        description: IATA code of the airline (e.g., "AZ")
      - name: code
        in: path
        required: true
        schema:
          type: string
        description: Code of the route (e.g., "AZ5")
      - name: start_date
        in: query
        required: false
        schema:
          type: string
          format: date
        description: Start date for the analytics range (YYYY-MM-DD)
      - name: end_date
        in: query
        required: false
        schema:
          type: string
          format: date
        description: End date for the analytics range (YYYY-MM-DD)

    responses:
      200:
        description: Route analytics retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                route_code:
                  type: string
                  example: "AZ5"
                passengers:
                  type: integer
                  example: 4
                revenue:
                  type: number
                  format: float
                  example: 420.0
                class_distribution:
                  type: object
                  description: Percentage of tickets sold per class
                  additionalProperties:
                    type: number
                    format: float
                  example:
                    Economy: 50.0
                    First: 50.0

      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Route not found

    """
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
    """
    Airline flight analytics
    ---
    tags:
      - Airline
    summary: Retrieve analytics for a specific flight
    description: >
      Returns analytics data for a given flight, including passenger distribution per class, total passengers, revenue, and flight schedule.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        schema:
          type: string
        description: IATA code of the airline (e.g., "AZ")
      - name: id_flight
        in: path
        required: true
        schema:
          type: integer
        description: Flight ID

    responses:
      200:
        description: Flight analytics retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                id_flight:
                  type: string
                  example: "21"
                route_code:
                  type: string
                  example: "AZ5"
                scheduled_departure_day:
                  type: string
                  format: date
                  example: "2025-08-15"
                scheduled_arrival_day:
                  type: string
                  format: date
                  example: "2025-08-15"
                passengers:
                  type: integer
                  example: 4
                revenue:
                  type: number
                  format: float
                  example: 420.0
                class_distribution:
                  type: object
                  description: Percentage of tickets sold per class
                  additionalProperties:
                    type: number
                    format: float
                  example:
                    Economy: 50.0
                    First: 50.0

      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Flight not found

    """
    session = SessionLocal()
    controller = Airline_controller(session)
    response, status = controller.get_flight_analytics(id_flight)
    session.close()
    return jsonify(response), status

@airline_bp.route("/<airline_code>/analytics/routes", methods=["GET"])
#@airline_check_param("airline_code")
def get_all_routes_analytics(airline_code: str):
    """
    Airline analytics routes
    ---
    tags:
      - Airline
    summary: Retrieve analytics for all routes of an airline
    description: >
      Returns the number of tickets sold and total revenue for each route of a given airline.  
      Optionally, a `start_date` can be specified to limit analytics to tickets sold after a given date.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        schema:
          type: string
        description: IATA code of the airline (e.g., "AZ")
      - name: start_date
        in: query
        required: false
        schema:
          type: string
          format: date
          nullable: true
        description: Optional start date to filter tickets sold. Use null or omit to consider all tickets.

    responses:
      200:
        description: Analytics per route retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                analytics:
                  type: array
                  items:
                    type: object
                    properties:
                      route_code:
                        type: string
                        example: "TK1930"
                      total_tickets:
                        type: integer
                        example: 2
                      total_revenue:
                        type: number
                        format: float
                        example: 550.0

      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found

    """
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
    """
    Airline total revenue
    ---
    tags:
      - Airline
    summary: Retrieve total revenue for all flights of an airline
    description: >
      Returns the total revenue of a given airline by summing all tickets purchased across all flights and routes.  
      Optionally, a `start_date` can be specified to consider only tickets sold after a given date.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        schema:
          type: string
        description: IATA code of the airline (e.g., "AZ")
      - name: start_date
        in: query
        required: false
        schema:
          type: string
          format: date
          nullable: true
        description: Optional start date to filter tickets sold. Use null or omit to consider all tickets.

    responses:
      200:
        description: Total revenue retrieved successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                total_revenue:
                  type: number
                  format: float
                  example: 580.0

      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found

    """
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
    Get all airline's flights
    ---
    tags:
      - Airline
    summary: Retrieve all flights of a specific airline
    description: >
      Returns all flights belonging to the specified airline.

      **Authorization required:** Bearer JWT Token  
      **Allowed roles:** Airline-Admin

    security:
      - Bearer: []

    parameters:
      - name: airline_code
        in: path
        required: true
        schema:
          type: string
        description: IATA code of the airline (e.g., "AZ")

    responses:
      200:
        description: List of flights retrieved successfully
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  route_code:
                    type: string
                    example: "AZ9"
                  airline_iata_code:
                    type: string
                    example: "AZ"
                  arrival_day:
                    type: string
                    format: date-time
                    example: "Thu, 01 Jan 2026 00:00:00 GMT"
                  arrival_time:
                    type: string
                    example: "09:50"
                  base_price:
                    type: number
                    format: float
                    example: 135
                  departure_day:
                    type: string
                    format: date-time
                    example: "Thu, 01 Jan 2026 00:00:00 GMT"
                  departure_time:
                    type: string
                    example: "08:30"
                  destination:
                    type: string
                    example: "LHR"
                  duration:
                    type: string
                    example: "01:20"
                  id_flight:
                    type: integer
                    example: 267
                  origin:
                    type: string
                    example: "VCE"

      401:
        description: Missing or invalid token
      403:
        description: Airline-Admin role required
      404:
        description: Airline not found

    """
    session = SessionLocal()
    flights = get_flights_by_airline(session, airline_code)
    session.close()
    return jsonify(flights), 200












