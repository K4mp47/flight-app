from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey

class Additional_baggage(Base):
    __tablename__ = "additional_baggage"

    id_ticket: Mapped[int] = mapped_column(ForeignKey("tickets.id_ticket"), primary_key=True)
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="additional_baggage")

    id_baggage: Mapped[int] = mapped_column(ForeignKey("baggage.id_baggage"),primary_key=True)
    baggage: Mapped["Baggage"] = relationship("Baggage", back_populates="additional_baggage")

    count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Additional_baggage(id_ticket={self.id_ticket}, id_baggage={self.id_baggage}, count={self.count})"

    def to_dict(self):
        return {
            "ticket": self.ticket.to_dict(),
            "baggage": self.baggage.to_dict(),
            "count": self.count,
        }