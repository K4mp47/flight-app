from ..models.user import User
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

class User_controller:

    def __init__(self, session: Session):
        self.session = session

    def register_user(self, data:dict):
        if self.session.query(User).filter(User.email == data['email']).first():
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

        return {"message": "User registered"}, 201

    def login_user(self, email:str, password:str):
        user = self.session.query(User).filter_by(email=email).first()

        if (not user) or (not check_password_hash(user.password, password)):
            return {"message": "Email or Password wrong"}, 400

        access_token = create_access_token(identity=user.id_user)
        return {"access_token": access_token}, 200





