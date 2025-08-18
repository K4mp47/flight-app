from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean, Float
from datetime import datetime
from typing import List

class Baggage_role(Base):
    __tablename__ = "baggage_rules"

    id_baggage_rules: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_baggage_type: Mapped[int] = mapped_column(Integer, ForeignKey("baggage.id_baggage"), nullable=False)
    baggage: Mapped["Baggage"] = relationship("Baggage", back_populates="baggage_rules")

    airline_code: Mapped[str] = mapped_column(String,ForeignKey("airlines.iata_code") ,nullable=False)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="baggage_rules")

    max_weight_kg: Mapped[int] = mapped_column(Integer, nullable=True)
    max_length_cm: Mapped[int] = mapped_column(Integer, nullable=False)
    max_width_cm: Mapped[int] = mapped_column(Integer, nullable=False)
    max_height_cm: Mapped[int] = mapped_column(Integer, nullable=False)
    max_linear_cm: Mapped[int] = mapped_column(Integer, nullable=True)
    over_weight_fee: Mapped[float] = mapped_column(Float, nullable=True)
    over_size_fee: Mapped[float] = mapped_column(Float, nullable=False)
    base_price: Mapped[float] = mapped_column(Float, nullable=False)
    allow_extra: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return (
            f"Baggage_role("
            f"id_baggage_rules={self.id_baggage_rules}, "
            f"baggage={self.baggage.to_dict() if self.baggage else None}, "
            f"airline={self.airline.to_dict() if self.airline else None}, "
            f"max_weight_Kg={self.max_weight_kg}, "
            f"max_length_cm={self.max_length_cm}, "
            f"max_width_cm={self.max_width_cm}, "
            f"max_height_cm={self.max_height_cm}, "
            f"max_linear_cm={self.max_linear_cm}, "
            f"over_weight_fee={self.over_weight_fee}, "
            f"over_size_fee={self.over_size_fee}, "
            f"base_price={self.base_price}, "
            f"allow_extra={self.allow_extra}, "
            f"created_at={self.created_at}"
            f")"
        )

    def to_dict(self):
        return {
            "id_baggage_rules": self.id_baggage_rules,
            "baggage": self.baggage.to_dict(),
            "airline": self.airline.to_dict(),
            "max_weight_Kg": self.max_weight_kg,
            "max_length_cm": self.max_length_cm,
            "max_width_cm": self.max_width_cm,
            "max_height_cm": self.max_height_cm,
            "max_linear_cm": self.max_linear_cm,
            "over_weight_fee": self.over_weight_fee,
            "over_size_fee": self.over_size_fee,
            "base_price": self.base_price,
            "allow_extra": self.allow_extra,
        }
