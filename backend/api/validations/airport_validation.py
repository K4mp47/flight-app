from pydantic import BaseModel, StringConstraints, PositiveFloat, Field, field_validator, PositiveInt
from typing import Annotated, Optional
from ..validations.XSS_protection import SafeStr

class Airport_schema(BaseModel):
    iata_code: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    id_city: PositiveInt
    name:Annotated[SafeStr, StringConstraints(min_length=1)]
    latitude: float
    longitude: float

class Airport_modify_schema(BaseModel):
    id_city: Optional[PositiveInt] = None
    name: Optional[Annotated[SafeStr, StringConstraints(min_length=1)]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None