import bleach
from pydantic import BaseModel, StringConstraints, field_validator, model_validator, PositiveInt, EmailStr
from datetime import date
from enum import Enum
from typing import Annotated, Optional, List
from ..validations.XSS_protection import SafeStr




class Flight_search_schema(BaseModel):
    departure_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    arrival_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    round_trip_flight: bool
    direct_flights: bool
    departure_date_outbound: date
    departure_date_return: Optional[date]
    id_class: PositiveInt

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

class Additional_baggage(BaseModel):
    id_baggage: PositiveInt
    count: PositiveInt

class Ticket_info(BaseModel):
    id_flight: PositiveInt
    id_seat: PositiveInt
    additional_baggage: List[Additional_baggage] = []


class SexEnum(str, Enum):
    MALE = "M"
    FEMALE = "F"

class Passenger_info(BaseModel):
    name:Annotated[SafeStr, StringConstraints(min_length=1)]
    lastname:Annotated[SafeStr, StringConstraints(min_length=1)]
    date_birth: date
    phone_number:Annotated[SafeStr, StringConstraints(min_length=1)]
    email: EmailStr
    passport_number:Annotated[SafeStr, StringConstraints(min_length=6, max_length=12, pattern=r"^[A-Za-z0-9]+$")]
    sex: SexEnum

    @field_validator("email")
    @classmethod
    def sanitize_email(cls, v: EmailStr) -> EmailStr:
        clean = bleach.clean(str(v), tags=[], strip=True)
        return clean

class Ticket(BaseModel):
    ticket_info: Ticket_info
    passenger_info: Passenger_info

class Ticket_reservation_schema(BaseModel):
    id_buyer: PositiveInt
    tickets: List[Ticket]


