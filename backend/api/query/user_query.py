from flask import session
from sqlalchemy import select
from ..models.user import User
from db import SessionLocal

session = SessionLocal()

def all_users():
    stmt  = select(User)
    result = session.scalars(stmt).all()
    return [user.to_dict() for user in result]

def get_user_by_email(email):
    stmt = select(User).where(User.email == email)
    user = session.scalars(stmt).first()
    return user
