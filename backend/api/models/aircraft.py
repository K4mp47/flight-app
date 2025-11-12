from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey


class Aircraft(Base):
    __tablename__ = "aircraft"

    id_aircraft: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    id_manufacturer: Mapped[int] = mapped_column(ForeignKey("manufacturers.id_manufacturer"), nullable=False)
    manufacturer: Mapped["Manufacturer"] = relationship("Manufacturer", back_populates='aircraft')

    airline_aircraft : Mapped[List["Aircraft_airline"]] = relationship(
        back_populates="aircraft",
    )

    max_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    cruise_speed_kmh: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    cabin_max_cols: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Aircraft(id_aircraft={self.id_aircraft}, name={self.name},max_seats{self.max_seats})>"

    def to_dict(self):
        return {
            "id_aircraft": self.id_aircraft,
            "manufacturer": self.manufacturer.to_dict(),
            "name": self.name,
            "max_seats": self.max_seats,
            "cabin_max_cols": self.cabin_max_cols,
        }

    def to_dict_without_manufacturer(self):
        return {
            "id_aircraft": self.id_aircraft,
            "name": self.name,
            "cabin_max_cols": self.cabin_max_cols,
            "max_seats": self.max_seats,
        }