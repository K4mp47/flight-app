from . import City
from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class Airport(Base):
    __tablename__ = "airports"

    iata_code:Mapped[str] = mapped_column(String, primary_key=True)
    id_city: Mapped[int] = mapped_column(ForeignKey("city.id_city"))
    city: Mapped["City"] = relationship("City", back_populates="airports")
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Airport(iata_code={self.iata_code}, name={self.name})"