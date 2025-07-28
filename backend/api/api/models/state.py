from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class State(Base):

    __tablename__ = "states"

    id_state: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_country: Mapped[int] = mapped_column(ForeignKey("countries.id_country"), nullable=False)
    country: Mapped["Country"] = relationship("Country", back_populates='states')
    cities: Mapped[List["City"]] = relationship(
        back_populates="state",
        cascade="all, delete-orphan",
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return  f"State(id_state={self.id_state}, name={self.name})"