from typing import List
from . import City, city
from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Float


class Airport(Base):
    __tablename__ = "airports"

    iata_code:Mapped[str] = mapped_column(String, primary_key=True)

    id_city: Mapped[int] = mapped_column(ForeignKey("city.id_city"))
    city: Mapped["City"] = relationship("City", back_populates="airports")

    routes_departure: Mapped[List["Route_section"]] = relationship(
        back_populates="departure_airport",
        foreign_keys="[Route_section.code_departure_airport]"
    )

    routes_arrival: Mapped[List["Route_section"]] = relationship(
        back_populates="arrival_airport",
        foreign_keys="[Route_section.code_arrival_airport]"
    )


    name: Mapped[str] = mapped_column(String, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Airport(iata_code={self.iata_code}, name={self.name})"

    def to_dict(self):
        return {
            "iata_code": self.iata_code,
            "city": self.city.to_dict(),
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
        }