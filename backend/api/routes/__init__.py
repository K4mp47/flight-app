from .user_routes import user_bp
from .aircraft_routes import aircraft_bp
from .manufacturer_routes import manufacturer_bp
from .airline_routes import airline_bp
from .route_routes import route_bp
from .flight_routes import flight_bp
from .airport_routes import airport_bp
from .baggage_routes import baggage_bp


def register_routes(app):
    app.register_blueprint(user_bp, url_prefix="/users")
    app.register_blueprint(aircraft_bp, url_prefix="/aircraft")
    app.register_blueprint(manufacturer_bp, url_prefix="/manufacturer")
    app.register_blueprint(airline_bp, url_prefix="/airline")
    app.register_blueprint(route_bp, url_prefix="/route")
    app.register_blueprint(flight_bp, url_prefix="/flight")
    app.register_blueprint(airport_bp, url_prefix="/airports")
    app.register_blueprint(baggage_bp, url_prefix="/baggage")