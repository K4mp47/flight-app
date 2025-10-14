from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float
from typing import List

class Passenger_ticket(Base):
    __tablename__ = "passenger_tickets"

    id_passenger_tickets: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_buyer: Mapped[int] = mapped_column( ForeignKey("users.id_user", ondelete="SET NULL"), nullable=False)
    buyer: Mapped["User"] = relationship("User", back_populates="tickets")

    id_ticket: Mapped[int] = mapped_column(ForeignKey("tickets.id_ticket", ondelete="CASCADE"), nullable=False)
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="passenger_tickets")

    id_passenger: Mapped[int] = mapped_column(ForeignKey("passengers.id_passengers", ondelete="SET NULL"), nullable=False)
    passenger: Mapped["Passenger"] = relationship("Passenger", back_populates="passenger_tickets")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Passenger_ticket(id_passenger_ticket={self.id_passenger_tickets}, buyer={self.buyer.to_dict()}, ticket={self.ticket.to_dict()}, passenger={self.passenger.to_dict()})>"

    def to_dict(self):
        return {
            "id_passenger_ticket": self.id_passenger_tickets,
            "buyer": self.buyer.to_dict(),
            "ticket": self.ticket.to_dict(),
            "passenger": self.passenger.to_dict(),
        }

    def to_dict_buy_ticket(self):
        return {
            "id_passenger_ticket": self.id_passenger_tickets,
            "id_buyer": self.id_buyer,
            "ticket": self.ticket.to_dict(),
            "passenger": self.passenger.to_dict(),
        }