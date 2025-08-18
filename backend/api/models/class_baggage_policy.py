from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer,String, DateTime, ForeignKey, Boolean
from datetime import datetime
from typing import List

class Class_baggage_policy(Base):
    __tablename__ = "class_baggage_policy"

    id_class_baggage_policy: Mapped[int] = mapped_column(Integer, primary_key=True)

    airline_code: Mapped[str] = mapped_column(String, ForeignKey("airlines.iata_code"), nullable=False)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="baggage_class_policies")

    id_baggage_type: Mapped[int] = mapped_column(Integer, ForeignKey("baggage.id_baggage"), nullable=False)
    baggage: Mapped["Baggage"] = relationship("Baggage", back_populates="baggage_class_policies")

    id_class: Mapped[int] = mapped_column(Integer, ForeignKey("class.id_class"), nullable=False)
    class_ : Mapped["Class_seat"] = relationship("Class_seat", back_populates="baggage_class_policies")

    quantity_included: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return (
            f"BaggageClassPolicy("
            f"airline={self.airline.to_dict() if self.airline else None}, "
            f"baggage={self.baggage.to_dict() if self.baggage else None}, "
            f"class_={self.class_.to_dict() if self.class_ else None}, "
            f"quantity_included={self.quantity_included}, "
            f"created_at={self.created_at}"
            f")"
        )

    def to_dict(self):
        return {
            "id_class_baggage_policy": self.id_class_baggage_policy,
            "airline": self.airline.to_dict(),
            "baggage": self.baggage.to_dict(),
            "class_": self.class_.to_dict(),
            "quantity_included": self.quantity_included,
        }