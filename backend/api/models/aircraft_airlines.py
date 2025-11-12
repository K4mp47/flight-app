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

    flights : Mapped[List["Flight"]] = relationship(
        back_populates="aircraft",
        cascade="all, delete-orphan",
    )

    cabins: Mapped[List["Cabin"]] = relationship(
        "Cabin",
        back_populates="aircraft",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Aircraft_airline(airline={self.airline.to_dict()}, aircraft={self.aircraft.to_dict()})"

    def to_dict(self):
        return {
            "id_aircraft_airline": self.id_aircraft_airline,
            "airline": self.airline.to_dict(),
            "aircraft": self.aircraft.to_dict()
        }