from flask import Flask
from flask_cors import CORS
from config import Config
from api.routes import register_routes
from sqlalchemy.orm import sessionmaker
from api.models import *
from flask_jwt_extended import JWTManager
from api.utils.blacklist import blacklisted_tokens
from flasgger import Swagger


def create_app():
    app = Flask(__name__)
    # Basic OpenAPI template to expose bearerAuth and API info in Swagger UI
    template = {
        
        "info": {
            "title": "Flight App API",
            "version": "1.0",
            "description": "API for managing airlines, flights, bookings and related resources",
        },
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "security": [{"bearerAuth": []}],
    }
    swagger = Swagger(app, template=template)
    app.config.from_object(Config)
    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])
    register_routes(app)
    jwt = JWTManager(app)

    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload["jti"]
        return jti in blacklisted_tokens

    return app

if __name__ == "__main__":
    app = create_app()
    app.run()
