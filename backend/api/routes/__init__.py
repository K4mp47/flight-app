from .user_routes import user_bp
from .aircraft_routes import aircraft_bp
from .manufacturer_routes import manufacturer_bp
from .airline_routes import airline_bp
from .route_routes import route_bp

def register_routes(app):
    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(aircraft_bp, url_prefix="/aircraft")
    app.register_blueprint(manufacturer_bp, url_prefix="/manufacturer")
    app.register_blueprint(airline_bp, url_prefix="/airline")
    app.register_blueprint(route_bp, url_prefix="/route")