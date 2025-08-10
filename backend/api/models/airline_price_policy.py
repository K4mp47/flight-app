from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float


class Airline_price_policy(Base):
    __tablename__ = "airlines_price_policy"

    airline_code: Mapped[str] = mapped_column(String,ForeignKey("airlines.iata_code"),primary_key=True)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="airline_price_policy")

    fixed_markup: Mapped[int] = mapped_column(Integer, nullable=False)
    price_for_km: Mapped[float] = mapped_column(Float, nullable=False)
    fee_for_stopover:Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Airline_price_policy(airline_code={self.airline_code}, fixed_markup={self.fixed_markup}, price_for_km={self.price_for_km}, fee_for_stopover={self.fee_for_stopover})"

    def to_dict(self):
        return {
            "airline_code": self.airline_code,
            "fixed_markup": self.fixed_markup,
            "price_for_km": self.price_for_km,
            "fee_for_stopover": self.fee_for_stopover,
        }