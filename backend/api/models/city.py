from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class City(Base):

    __tablename__ = 'city'

    id_city: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_state: Mapped[int] = mapped_column(ForeignKey("states.id_state"))
    state: Mapped["State"] = relationship("State", back_populates="cities")
    airports:Mapped[List["Airport"]] = relationship(
        back_populates="city",
        cascade="all, delete, delete-orphan",
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"City(id_state={self.id_city}, name={self.name})"

    def to_dict(self):
        return {
            "id_city": self.id_city,
            "name": self.name,
        }