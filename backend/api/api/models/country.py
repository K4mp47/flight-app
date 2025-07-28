from .base import Base
from typing import List
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String,DateTime

class Country(Base):
    __tablename__ = "countries"

    id_country : Mapped[int] = mapped_column(Integer, primary_key=True)
    states : Mapped[List["State"]] = relationship(
        back_populates="country",
        cascade="all, delete, delete-orphan",
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return  f"Country(id_country={self.id_country}, name={self.name})"