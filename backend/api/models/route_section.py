from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer
from typing import List

class Route_section(Base):

    __tablename__ = "routes_section"

    id_routes_section: Mapped[int] = mapped_column(Integer, primary_key=True)

    code_departure_airport: Mapped[str] = mapped_column(ForeignKey("airports.iata_code",ondelete="SET NULL"), nullable=False)
    departure_airport: Mapped["Airport"] = relationship("Airport",foreign_keys=[code_departure_airport], back_populates="routes_departure")

    code_arrival_airport: Mapped[str] = mapped_column(ForeignKey("airports.iata_code", ondelete="SET NULL"),nullable=False)
    arrival_airport: Mapped["Airport"] = relationship("Airport",foreign_keys=[code_arrival_airport], back_populates="routes_arrival")

    routes : Mapped[List["Route_detail"]] = relationship (
        back_populates="section"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Route_section(id_routes_section={self.id_routes_section}, code_departure_airport={self.code_departure_airport}, code_arrival_airport={self.code_arrival_airport})"

    def to_dict(self):
        return {
            "id_routes_section": self.id_routes_section,
            "code_departure_airport": self.code_departure_airport,
            "code_arrival_airport": self.code_arrival_airport,
        }

