from .user_routes import user_bp
from .aircraft_routes import aircraft_bp
from .manufacturer_routes import manufacturer_bp

def register_routes(app):
    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(aircraft_bp, url_prefix="/aircraft")
    app.register_blueprint(manufacturer_bp, url_prefix="/manufacturer")