from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey

class Airline(Base):
    __tablename__ = "airlines"

    iata_code: Mapped[str] = mapped_column(String, primary_key=True)

    my_aircraft :Mapped[List["Aircraft_airline"]] = relationship(
        back_populates= "airline",
        cascade="all, delete-orphan"
    )

    routes: Mapped[List["Route"]] = relationship(
        back_populates= "airline",
        cascade="all, delete-orphan"
    )

    name : Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Airline {self.iata_code}, name={self.name}>"

    def to_dict(self):
        return {
            "iata_code": self.iata_code,
            "name": self.name,
        }