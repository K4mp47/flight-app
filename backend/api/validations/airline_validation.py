from pydantic import BaseModel, StringConstraints
from typing import Annotated


class Airline_schema(BaseModel):
    iata_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    name: Annotated[str, StringConstraints(min_length=1)]

class Airline_aircraft_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    current_position: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]