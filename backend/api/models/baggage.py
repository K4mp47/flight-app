from .base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer,String, DateTime, ForeignKey, Boolean
from datetime import datetime
from typing import List

class Baggage(Base):
    __tablename__ = "baggage"

    id_baggage: Mapped[int] = mapped_column(Integer, primary_key=True)

    baggage_rules: Mapped[List["Baggage_role"]] = relationship(
        back_populates="baggage",
        cascade="all, delete-orphan",
    )

    baggage_class_policies: Mapped[List["Class_baggage_policy"]] = relationship(
        back_populates="baggage",
    )

    additional_baggage: Mapped[List["Additional_baggage"]] = relationship(
        back_populates="baggage",
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Baggage(id_baggage={self.id_baggage}, name={self.name})"

    def to_dict(self):
        return {
            "id_baggage": self.id_baggage,
            "name": self.name,
        }