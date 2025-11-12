from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float
from typing import List

class Ticket(Base):
    __tablename__ = "tickets"

    id_ticket: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_flight: Mapped[int] = mapped_column(ForeignKey("flights.id_flight"))
    flight:Mapped["Flight"] = relationship("Flight", back_populates="flight_tickets")

    id_seat: Mapped[int] = mapped_column(ForeignKey("cells.id_cell"),nullable=True)
    seat: Mapped["Cell"] = relationship("Cell", back_populates="tickets")

    passenger_tickets: Mapped[List["Passenger_ticket"]] = relationship(
        back_populates="ticket",
        passive_deletes=True,
    )

    additional_baggage: Mapped[List["Additional_baggage"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
    )

    price: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Ticket(id_ticket={self.id_ticket}, flight={self.flight.to_dict()}, seat={self.seat.to_dict()}, price={self.price})"

    def to_dict(self):
        return {
           "id_ticket": self.id_ticket,
            "flight": self.flight.to_dict_search(),
            "price": self.price
        }