from . import Aircraft
from .base import Base
from typing import List
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String,DateTime, ForeignKey

class Flight(Base):
    __tablename__ = 'flights'

    id_flight: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_aircraft: Mapped[int] = mapped_column(ForeignKey('aircraft_airlines.id_aircraft_airline'), nullable=False)
    aircraft: Mapped["Aircraft"] = relationship("Aircraft_airline", back_populates="flights")

    route_code: Mapped[str] = mapped_column(ForeignKey('routes.code'), nullable=False)
    route : Mapped["Route"] = relationship("Route", back_populates="flights")

    flight_tickets: Mapped[List["Ticket"]] = relationship(
        back_populates="flight",
        cascade="all, delete-orphan",
    )

    scheduled_departure_day : Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    scheduled_arrival_day : Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def  __repr__(self):
        return f"<Flight {self.id_flight}, aircraft={self.aircraft.to_dict()}, route={self.route.to_dict()}, scheduled_departure_day={self.scheduled_departure_day}, scheduled_arrival_day{self.scheduled_arrival_day}> >"

    def to_dict(self):
        return {
            "id_flight": self.id_flight,
            "aircraft": self.aircraft.to_dict(),
            "route": self.route.to_dict(),
            "scheduled_departure_day": self.scheduled_departure_day,
            "scheduled_arrival_day": self.scheduled_arrival_day,
        }

    def to_dict_search(self):
        return {
            "id_flight": self.id_flight,
            "id_aircraft": self.id_aircraft,
            "route_code": self.route.code,
            "base_price": self.route.base_price,
            "flight_price": self.route.base_price,
            "airline": {
                "iata_code": self.route.airline.iata_code,
                "name": self.route.airline.name
            },
            "scheduled_departure_day": self.scheduled_departure_day.isoformat(),
            "scheduled_arrival_day": self.scheduled_arrival_day.isoformat(),
            "sections": [rd.to_dict_search() for rd in self.route.routes_details],
        }