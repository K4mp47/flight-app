from datetime import datetime
from typing import List

from .base import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime

class Class_seat(Base):

    __tablename__ = 'class'

    id_class : Mapped[int] = mapped_column(Integer,  primary_key=True)

    cabins: Mapped[List["Cabin"]] = relationship(
        "Cabin",
        back_populates="class_seat",
        passive_deletes=True
    )

    class_price_policy : Mapped[List["Class_price_policy"]] = relationship(
        back_populates="class_seat",
        cascade="all, delete-orphan",
    )

    baggage_class_policies: Mapped[List["Class_baggage_policy"]] = relationship(
        back_populates="class_",
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