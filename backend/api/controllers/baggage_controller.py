from flask import session
from sqlalchemy.orm import Session
from ..models.airline import Airline
from ..models.baggage import Baggage
from ..models.baggage_role import Baggage_role
from ..models.class_baggage_policy import Class_baggage_policy
from ..query.baggage_query import get_baggage_role_by_type_airline, get_baggage_role_by_airline, exist_baggage_class_policy, get_baggage_class_policy_by_airline_code

class Baggage_controller:

    def __init__(self, session: Session):
        self.session = session

    def insert_baggage_role(self, data: dict):

        baggage = self.session.get(Baggage, data["id_baggage_type"])
        if baggage is None:
            return {"message": "Baggage not found"}, 404

        airline = self.session.get(Airline, data["airline_code"])
        if airline is None:
            return {"message": "Airline not found"}, 404

        baggage_role = get_baggage_role_by_type_airline(self.session, data["id_baggage_type"], data["airline_code"])

        if baggage_role:
            return {"message": "Baggage rules are already in place."}, 400

        new_baggage_role = Baggage_role(
            id_baggage_type = data["id_baggage_type"],
            airline_code = data["airline_code"],
            max_weight_kg = data["max_weight_kg"],
            max_length_cm = data["max_length_cm"],
            max_width_cm = data["max_width_cm"],
            max_height_cm = data["max_height_cm"],
            max_linear_cm = data["max_linear_cm"],
            over_weight_fee = data["over_weight_fee"],
            over_size_fee = data["over_size_fee"],
            base_price = data["base_price"],
            allow_extra = data["allow_extra"],
        )

        self.session.add(new_baggage_role)
        self.session.commit()
        self.session.refresh(new_baggage_role)

        return {"message": "Baggage role inserted"}, 200

    def update_baggage_role(self, data: dict):

        role = self.session.get(Baggage_role, data["id_baggage_rules"])

        if role is None:
            return {"message": "Baggage roles not found"}, 404

        if role.airline_code != data["airline_code"]:
            return {"message": "Baggage roles not found"}, 404

        if data["max_weight_kg"] is not None:
            role.max_weight_kg = data["max_weight_kg"]

        if data["max_length_cm"] is not None:
            role.max_length_cm = data["max_length_cm"]

        if data["max_width_cm"] is not None:
            role.max_width_cm = data["max_width_cm"]

        if data["max_height_cm"] is not None:
            role.max_height_cm = data["max_height_cm"]

        if data["max_linear_cm"] is not None:
            role.max_linear_cm = data["max_linear_cm"]

        if data["over_weight_fee"] is not None:
            role.over_weight_fee = data["over_weight_fee"]

        if data["over_size_fee"] is not None:
            role.over_size_fee = data["over_size_fee"]

        if data["base_price"] is not None:
            role.base_price = data["base_price"]

        if data["allow_extra"] is not None:
            role.allow_extra = data["allow_extra"]

        self.session.commit()

        return {"message": "Baggage role updated"}, 201

    def get_baggage_rule(self, airline_code: str):

        airline = self.session.get(Airline, airline_code)

        if airline is None:
            return {"message": "Airline not found"}, 404

        result = get_baggage_role_by_airline(self.session, airline_code)

        return result, 200

    def insert_baggage_class_policy(self, airline_code: str, id_baggage_type: int, id_class: int, quantity_included: int):

        airline = self.session.get(Airline, airline_code)

        if airline is None:
            return {"message": "Airline not found"}, 404

        if exist_baggage_class_policy(self.session,id_baggage_type, airline_code, id_class):
            return {"message": "Baggage class policy already exists"}, 400


        new_baggage_class_policy = Class_baggage_policy(
            airline_code = airline_code,
            id_baggage_type = id_baggage_type,
            id_class = id_class,
            quantity_included = quantity_included,
        )

        self.session.add(new_baggage_class_policy)
        self.session.commit()
        self.session.refresh(new_baggage_class_policy)

        return {"message": "Baggage class policy inserted"}, 200


    def update_quantity_included(self, id_class_baggage_policy: int, airline_code: str, quantity_included: int):

        airline = self.session.get(Airline, airline_code)

        if airline is None:
            return {"message": "Airline not found"}, 404

        baggage_class_policy = self.session.get(Class_baggage_policy, id_class_baggage_policy)

        if baggage_class_policy is None or baggage_class_policy.airline_code != airline_code:
            return {"message": "Class baggage policy not found"}, 404

        baggage_class_policy.quantity_included = quantity_included

        self.session.commit()
        return {"message": "quantity included update"}, 201


    def get_airline_class_policy(self, airline_code: str):

        airline = self.session.get(Airline, airline_code)

        if airline is None:
            return {"message": "Airline not found"}, 404

        result = get_baggage_class_policy_by_airline_code(self.session, airline_code)
        return result, 200









