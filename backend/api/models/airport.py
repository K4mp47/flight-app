from typing import List

from . import City, city
from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey

class Airport(Base):
    __tablename__ = "airports"

    iata_code:Mapped[str] = mapped_column(String, primary_key=True)

    id_city: Mapped[int] = mapped_column(ForeignKey("city.id_city"))
    city: Mapped["City"] = relationship("City", back_populates="airports")

    aircraft_airline_position: Mapped[List["Aircraft_airline"]] = relationship(
        back_populates= "current_airport",
        foreign_keys="[Aircraft_airline.current_position]"
    )

    aircraft_airline_flying_towards: Mapped[List["Aircraft_airline"]] = relationship(
        back_populates= "flying_towards_airport",
        foreign_keys="[Aircraft_airline.flying_towards]"
    )


    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Airport(iata_code={self.iata_code}, name={self.name})"

    def to_dict(self):
        return {
            "iata_code": self.iata_code,
            "city": city.to_dict(),
            "name": self.name,
        }