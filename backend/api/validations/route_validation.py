from pydantic import BaseModel, StringConstraints, PositiveFloat, Field, field_validator, PositiveInt
from typing import Annotated, List

class Route_schema(BaseModel):
    departure_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    arrival_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]

    @field_validator("arrival_airport")
    @classmethod
    def same_id(cls, v: str, values: dict) -> str:
        departure_airport = values.data.get("departure_airport")
        if departure_airport and v == departure_airport:
            raise ValueError("The Iata code for airport must be different.")
        return v