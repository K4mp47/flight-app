from datetime import datetime
from typing import List

from .base import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime

class Class_seat(Base):

    __tablename__ = 'class'

    id_class : Mapped[int] = mapped_column(Integer,  primary_key=True)

    aircraft_compositions : Mapped[List["Aircraft_composition"]] = relationship(
        back_populates="class_block"
    )

    class_price_policy : Mapped[List["Class_price_policy"]] = relationship(
        back_populates="class_seat",
        cascade="all, delete-orphan",
    )

    name : Mapped[str] = mapped_column(String, nullable=False)
    code : Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Country(id_country={self.id_class}, name={self.name}, code={self.code})"

    def to_dict(self):
        return {
            "id_class": self.id_class,
            "name": self.name,
            "code": self.code,
        }