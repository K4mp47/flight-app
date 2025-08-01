from pydantic import BaseModel, StringConstraints, PositiveFloat, Field, field_validator, PositiveInt
from typing import Annotated, List



class Airline_schema(BaseModel):
    iata_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    name: Annotated[str, StringConstraints(min_length=1)]

class Airline_aircraft_schema(BaseModel):
    airline_code: Annotated[str, StringConstraints(min_length=2, max_length=2, pattern=r'^[A-Z0-9]{2}$')]
    current_position: Annotated[str, StringConstraints(min_length=3, max_length=3, pattern=r'^[A-Z]{3}$')]

class Airline_aircraft_block_schema(BaseModel):
    matrix: Annotated[List[List[bool]], Field(min_length=1)]
    proportion_economy_seat: PositiveFloat
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

class Clone_aircraft_seat_mao_schema(BaseModel):
    source_id: PositiveInt
    target_id: PositiveInt

    @field_validator("target_id")
    @classmethod
    def same_id(cls, v: str, values: dict) -> str:
        source_id = values.data.get("source_id")
        if source_id and v == source_id:
            raise ValueError("The IDs must be different.")
        return v






