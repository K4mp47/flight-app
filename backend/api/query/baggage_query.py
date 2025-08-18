from sqlalchemy import select, func
from flask_sqlalchemy.session import Session
from ..models.baggage import Baggage
from ..models.baggage_role import Baggage_role
from ..models.class_baggage_policy import Class_baggage_policy

def get_all_baggage(session: Session):
    stmt = select(Baggage)
    result = session.scalars(stmt).all()
    return [baggage.to_dict() for baggage in result]

def get_baggage_role_by_type_airline(session: Session, baggage_type, airline_code):
    stmt = select(Baggage_role).where(Baggage_role.id_baggage_type == baggage_type, Baggage_role.airline_code == airline_code)
    result = session.scalars(stmt).first()
    return result

def get_baggage_role_by_airline(session: Session, airline_code):
    stmt = select(Baggage_role).where(Baggage_role.airline_code == airline_code)
    result = session.scalars(stmt).all()
    return [baggage_role.to_dict() for baggage_role in result]

def exist_baggage_class_policy(session: Session, id_baggage_type, airline_code, id_class):
    stmt = select(Class_baggage_policy).where(Class_baggage_policy.id_baggage_type == id_baggage_type,
                                      Class_baggage_policy.airline_code == airline_code,
                                      Class_baggage_policy.id_class == id_class)
    result = session.scalars(stmt).first()
    return result

def get_baggage_class_policy_by_airline_code(session: Session, airline_code):
    stmt = select(Class_baggage_policy).where(Class_baggage_policy.airline_code == airline_code)
    result = session.scalars(stmt).all()
    return [class_baggage_policy.to_dict() for class_baggage_policy in result]

