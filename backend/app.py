from flask import Flask
from flask_cors import CORS
from config import Config
from api.routes import register_routes
from sqlalchemy.orm import sessionmaker
from api.models import *
from flask_jwt_extended import JWTManager
from api.utils.blacklist import blacklisted_tokens


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app, origins="http://localhost:3000")
    register_routes(app)
    jwt = JWTManager(app)

    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return jti in blacklisted_tokens

    return app

if __name__ == "__main__":
    app = create_app()
    app.run()
