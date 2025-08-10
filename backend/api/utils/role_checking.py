from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import request, jsonify

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in allowed_roles:
                return jsonify(msg="Access Denied: role not allowed"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def airline_check_param(param_airline_key="airline_code"):

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            token_airline = claims.get("airline_code")

            if not token_airline:
                return jsonify(msg="Access Denied: no airline in token"), 403

            url_airline = kwargs.get(param_airline_key)
            if url_airline != token_airline:
                return jsonify(msg="Access Denied: airline mismatch (URL)"), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def airline_check_body(body_airline_key="airline_code"):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            token_airline = claims.get("airline_code")

            if not token_airline:
                return jsonify(msg="Access Denied: no airline in token"), 403

            json_data = request.get_json(silent=True) or {}
            body_airline = json_data.get(body_airline_key)
            if body_airline != token_airline:
                return jsonify(msg="Access Denied: airline mismatch (BODY)"), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator