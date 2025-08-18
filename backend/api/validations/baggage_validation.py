from pydantic import BaseModel, StringConstraints, PositiveFloat, Field, field_validator, PositiveInt
from typing import Annotated, Optional
from ..validations.XSS_protection import SafeStr

class Baggage_roles_validation(BaseModel):
    id_baggage_type: PositiveInt
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    max_weight_kg: Optional[PositiveInt] = None
    max_length_cm: PositiveInt
    max_width_cm: PositiveInt
    max_height_cm: PositiveInt
    max_linear_cm: Optional[PositiveInt] = None
    over_weight_fee: Optional[PositiveInt] = None
    over_size_fee: PositiveInt
    base_price: PositiveInt
    allow_extra: bool

class Baggage_roles_validation_PUT(BaseModel):
    id_baggage_rules: PositiveInt
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    max_weight_kg: Optional[PositiveInt] = None
    max_length_cm: Optional[PositiveInt] = None
    max_width_cm: Optional[PositiveInt] = None
    max_height_cm: Optional[PositiveInt] = None
    max_linear_cm: Optional[PositiveInt] = None
    over_weight_fee: Optional[PositiveInt] = None
    over_size_fee: Optional[PositiveInt] = None
    base_price: Optional[PositiveInt] = None
    allow_extra: Optional[bool] = None

class Baggage_class_policy_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    id_baggage_type: PositiveInt
    id_class: PositiveInt
    quantity_included: Annotated[int, Field(ge=0)]

class Baggage_class_policy_PUT_schema(BaseModel):
    id_class_baggage_policy: PositiveInt
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    quantity_included: Annotated[int, Field(ge=0)]

