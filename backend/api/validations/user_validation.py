import bleach
import re
from enum import Enum
from typing import Annotated
from ..validations.XSS_protection import SafeStr

from pydantic import BaseModel, EmailStr, field_validator, StringConstraints


class User_login_Schema(BaseModel):
    email: EmailStr
    pwd: Annotated[SafeStr, StringConstraints(min_length=8)]

    @field_validator("email")
    @classmethod
    def sanitize_email(cls, v: EmailStr) -> EmailStr:
        clean = bleach.clean(str(v), tags=[], strip=True)
        return clean


class User_Register_Schema(BaseModel):
    name:Annotated[SafeStr, StringConstraints(min_length=1)]
    lastname:Annotated[SafeStr, StringConstraints(min_length=1)]
    email:EmailStr
    pwd:Annotated[SafeStr, StringConstraints(min_length=8)]
    pwd2:Annotated[SafeStr, StringConstraints(min_length=8)]

    @field_validator("email")
    @classmethod
    def sanitize_email(cls, v: EmailStr) -> EmailStr:
        clean = bleach.clean(str(v), tags=[], strip=True)
        return clean

    @field_validator("pwd")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Z]', v):
            raise ValueError('The password must contain at least one uppercase letter.')
        if not re.search(r'[0-9]', v):
            raise ValueError('The password must contain at least one number.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('The password must contain at least one special character.')
        return v

    @field_validator("pwd2")
    @classmethod
    def passwords_match(cls, v: str, values: dict) -> str:
        pwd = values.data.get("pwd")
        if pwd and v != pwd:
            raise ValueError("Passwords don't match")
        return v

class User_role(str, Enum):
    admin = "Admin"
    user = "User"
    airline_admin = "Airline-Admin"

class User_new_role_Schema(BaseModel):
    new_role: User_role


