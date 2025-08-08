from pydantic import BaseModel, StringConstraints, field_validator, model_validator
from datetime import date
from typing import Annotated, Optional


class Flight_search_schema(BaseModel):
    departure_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    arrival_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    round_trip_flight: bool
    direct_flights: bool
    departure_date_outbound: date
    departure_date_return: Optional[date]

    @field_validator('arrival_airport')
    @classmethod
    def airports_must_be_different(cls, v, info):
        departure_airport = info.data.get('departure_airport')
        if departure_airport and v == departure_airport:
            raise ValueError("departure_airport and arrival_airport must be different")
        return v

    @model_validator(mode="after")
    def validate_dates_and_round_trip(self) -> 'Flight_search_schema':
        if self.departure_date_return:
            if self.departure_date_outbound >= self.departure_date_return:
                raise ValueError("departure_date_outbound must be earlier than departure_date_return")

        if not self.round_trip_flight and self.departure_date_return is not None:
            raise ValueError("departure_date_return must be None for one-way flights")

        return self


