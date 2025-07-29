import re
from enum import Enum
from typing import Annotated

from pydantic import BaseModel, EmailStr, validator, constr, StringConstraints


class User_login_Schema(BaseModel):
    email: EmailStr
    pwd: Annotated[str, StringConstraints(min_length=8)]


class User_Register_Schema(BaseModel):
    name:Annotated[str, StringConstraints(min_length=1)]
    lastname:Annotated[str, StringConstraints(min_length=1)]
    email:EmailStr
    pwd:Annotated[str, StringConstraints(min_length=8)]
    pwd2:Annotated[str, StringConstraints(min_length=8)]

    @validator('pwd')
    def password_complexity(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('The password must contain at least one uppercase letter.')
        if not re.search(r'[0-9]', v):
            raise ValueError('The password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('The password must contain at least one special character.')
        return v

    @validator("pwd2")
    def passwords_match(cls, v, values):
        if 'pwd' in values and v != values['pwd']:
            raise ValueError("Passwords don't match")
        return v

class User_role(str, Enum):
    admin = "Admin"
    user = "User"
    airline_admin = "Airline-Admin"

class User_new_role_Schema(BaseModel):
    new_role: User_role


