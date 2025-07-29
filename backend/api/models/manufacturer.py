from typing import List
from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime

class Manufacturer(Base):
    __tablename__ = 'manufacturers'

    id_manufacturer: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    aircraft:Mapped[List["Aircraft"]] = relationship(
        back_populates="manufacturer",
        cascade="all, delete-orphan"
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Manufacturer(id_manufacturer={self.id_manufacturer}, name={self.name})>"

    def to_dict(self):
        return {
            "id_manufacturer": self.id_manufacturer,
            "name": self.name,
        }