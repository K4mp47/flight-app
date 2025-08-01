from flask_sqlalchemy.session import Session
from sqlalchemy import select
from ..models.user import User


def all_users(session: Session):
    stmt  = select(User)
    result = session.scalars(stmt).all()
    return [user.to_dict() for user in result]

def get_user_by_email(session: Session,email):
    stmt = select(User).where(User.email == email)
    user = session.scalars(stmt).first()
    return user
