from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class Aircraft_airline(Base):

    __tablename__ = "aircraft_airlines"

    id_aircraft_airline : Mapped[int] = mapped_column(Integer, primary_key=True)

    airline_code : Mapped[str] = mapped_column(ForeignKey("airlines.iata_code"), nullable=False)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="my_aircraft")

    id_aircraft_model : Mapped[int] = mapped_column(ForeignKey("aircraft.id_aircraft"), nullable=False)
    aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="airline_aircraft")

    current_position: Mapped[str|None] = mapped_column(ForeignKey("airports.iata_code", ondelete="SET NULL"), nullable=True)
    current_airport: Mapped["Airport"] = relationship("Airport", foreign_keys=[current_position], back_populates="aircraft_airline_position")

    flying_towards: Mapped[str|None] = mapped_column(ForeignKey("airports.iata_code", ondelete="SET NULL"), nullable=True)
    flying_towards_airport: Mapped["Airport"] = relationship("Airport", foreign_keys=[flying_towards],  back_populates="aircraft_airline_flying_towards")

    aircraft_compositions: Mapped[List["Aircraft_composition"]] = relationship(
        back_populates="aircraft",
        cascade="all, delete-orphan"
    )

    flights : Mapped[List["Flight"]] = relationship(
        back_populates="aircraft",
        cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Aircraft_airline(airline={self.airline.to_dict()}, aircraft={self.aircraft.to_dict()}, current_position={self.current_airport.to_dict()}, flying_towards={self.flying_towards_airport.to_dict()})"

    def to_dict(self):
        return {
            "id_aircraft_airline": self.id_aircraft_airline,
            "airline": self.airline.to_dict(),
            "aircraft": self.aircraft.to_dict(),
            "current_position": self.current_position,
            "flying_towards": self.flying_towards,
        }