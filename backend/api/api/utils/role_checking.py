from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from flask import jsonify

def role_required(required_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role != required_role:
                return jsonify(msg="Access Denied: role not allowed"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator