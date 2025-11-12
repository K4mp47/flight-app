from pydantic import BaseModel, StringConstraints, PositiveFloat, Field, field_validator, PositiveInt
from typing import Annotated, List, Optional
from datetime import date, timedelta, time
from ..validations.XSS_protection import SafeStr



class Airline_schema(BaseModel):
    iata_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    name: Annotated[SafeStr, StringConstraints(min_length=1)]

class Airline_aircraft_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]

class Airline_aircraft_block_schema(BaseModel):
    matrix: Annotated[List[List[bool]], Field(min_length=1)]
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    id_class: PositiveFloat

    @field_validator("matrix")
    @classmethod
    def validate_matrix(cls, matrix):
        if not matrix or not matrix[0]:
            raise ValueError("The matrix cannot be empty.")

        rows = len(matrix)
        cols = len(matrix[0])

        # Controllo uniformità righe
        for row in matrix:
            if len(row) != cols:
                raise ValueError("All rows must have the same number of columns.")

        # Controllo corridoio continuo
        corridor_found = False
        for col in range(cols):
            if all(matrix[riga][col] is False for riga in range(rows)):
                corridor_found = True
                break

        if not corridor_found:
            raise ValueError("There must be at least one continuous corridor (a column of only 'False')")

        return matrix

class Clone_aircraft_seat_map_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    source_id: PositiveInt
    target_id: PositiveInt

    @field_validator("target_id")
    @classmethod
    def same_id(cls, v: str, values: dict) -> str:
        source_id = values.data.get("source_id")
        if source_id and v == source_id:
            raise ValueError("The IDs must be different.")
        return v


FourDigitInt = Annotated[int, Field(ge=0, le=9999)]

class SectionBase(BaseModel):
    departure_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]
    arrival_airport: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]

class FirstSection_schema(SectionBase):
    departure_time: time
    next_session: Optional["NextSection_schema"] = None

class NextSection_schema(SectionBase):
    waiting_time: Annotated[int, Field(ge=120)]
    next_session: Optional["NextSection_schema"] = None

FirstSection_schema.model_rebuild()
NextSection_schema.model_rebuild()

class Route_airline_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    number_route : FourDigitInt
    start_date: date
    end_date: date
    delta_for_return_route: Annotated[int, Field(ge=120)]
    section: FirstSection_schema

    @field_validator('start_date')
    def check_start_date_in_future(cls, start_date_val):
        today = date.today()
        if start_date_val <= (today + timedelta(days=1)):
            raise ValueError("start_date must be at least one day in the future")
        return start_date_val

    @field_validator('end_date')
    def check_end_date_after_start(cls, end_date_val, info):
        start_date_val = info.data.get('start_date')
        if start_date_val and end_date_val <= start_date_val:
            raise ValueError("end_date must be after start_date")
        return end_date_val

class Route_deadline_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    end_date : date



class Flight_dates(BaseModel):
    outbound: date
    return_: date

    @field_validator('outbound', 'return_', mode='after')
    @classmethod
    def check_not_in_past(cls, v: date):
        if v < date.today():
            raise ValueError("Date cannot be in the past")
        return v

    @field_validator('return_')
    @classmethod
    def check_return_after_outbound(cls, v: date, info):
        outbound = info.data["outbound"]
        if v < outbound:
            raise ValueError("Return date must be after outbound date")
        return v


class Flight_schedule_request_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    aircraft_id: PositiveInt
    flight_schedule: List[Flight_dates]

    @field_validator('flight_schedule')
    @classmethod
    def check_no_duplicates(cls, v: List[Flight_dates]):
        seen = set()
        for fs in v:
            key = (fs.outbound, fs.return_)
            if key in seen:
                raise ValueError("Duplicate flight schedule found")
            seen.add(key)
        return v

class Class_price_policy_schema(BaseModel):
    id_class: PositiveInt
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    price_multiplier: PositiveFloat
    fixed_markup: int

class Class_price_policy_data_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    price_multiplier: Optional[PositiveFloat] = None
    fixed_markup: Optional[int] = None

class Price_policy_schema(BaseModel):
    fixed_markup: Optional[int] = None
    price_for_km: Optional[float] = None
    fee_fro_stopover: Optional[int] = None

class Route_change_price_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    base_price: Optional[int] = None

class Route_analytics_schema(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class Routes_analytics_schema(BaseModel):
    start_date: Optional[date] = None










