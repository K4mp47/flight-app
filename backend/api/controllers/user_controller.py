from flask import jsonify

from ..models.user import User
from ..models.role import Role
from ..utils.blacklist import blacklisted_tokens
from ..query.user_query import get_user_by_email
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt
from datetime import datetime, timedelta

class User_controller:

    def __init__(self, session: Session):
        self.session = session


    def register_user(self, data:dict):
        if get_user_by_email(data['email']):
            return {"message": "Email already registered"}, 400

        hashed_password = generate_password_hash(data['password'])

        new_user = User(
            name=data['name'],
            lastname=data['lastname'],
            email=data['email'],
            password=hashed_password,
            id_role=2
        )

        self.session.add(new_user)
        self.session.commit()
        self.session.refresh(new_user)

        user = get_user_by_email(data['email'])
        access_token = create_access_token(identity=str(user.id_user), additional_claims={"role": user.role.name})
        return {"message": "User registered", "access_token": access_token}, 201

    def login_user(self, email:str, password:str):
        user = self.session.query(User).filter_by(email=email).first()
        if (not user) or (not check_password_hash(user.password, password)):
            return {"message": "Email or Password wrong"}, 400

        access_token = create_access_token(identity=str(user.id_user),additional_claims={"role": user.role.name})
        return {"access_token": access_token}, 200

    def get_profile(self,id):
        user = self.session.query(User).filter_by(id_user=id).first()
        if not user:
            return {"message": "User not found"}, 404

        return {
            "name": user.name,
            "lastname": user.lastname,
            "email": user.email
        }, 200

    def change_role(self,id,new_role):
        user = self.session.query(User).filter_by(id_user=id).first()
        if not user:
            return {"message": "User not found"}, 404
        role = self.session.query(Role).filter_by(name=new_role).first()
        user.id_role = role.id_role
        self.session.commit()
        return {"message": "Role changed"}, 200







