from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Integer
from typing import List

class Route(Base):
    __tablename__ = "routes"

    code: Mapped[str] = mapped_column(String, primary_key=True)

    airline_iata_code: Mapped[str] = mapped_column(ForeignKey("airlines.iata_code"), nullable=False)
    airline : Mapped["Airline"] = relationship("Airline", back_populates="routes")

    flights: Mapped[List["Flight"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan"
    )

    routes_details: Mapped[List["Route_detail"]] = relationship(
        back_populates="route",
        cascade="all, delete-orphan"
    )

    base_price: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    is_outbound: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def  __repr__(self):
        return f"<Route {self.code}, airline_iata_code={self.airline_iata_code}, start_date={self.start_date}, end_date={self.end_date}>"

    def to_dict(self):
        return {
            "code": self.code,
            "airline_iata_code": self.airline_iata_code,
            "base_price": self.base_price,
            "start_date": self.start_date,
            "end_date": self.end_date,
        }

