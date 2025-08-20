from .base import Base
from .enum import SexEnum
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float, Boolean, Enum
from typing import List

class Passenger(Base):
    __tablename__ = "passengers"

    id_passengers: Mapped[int] = mapped_column(Integer, primary_key=True)

    passenger_tickets: Mapped[List["Passenger_ticket"]] = relationship(
        back_populates="passenger",
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    lastname: Mapped[str] = mapped_column(String, nullable=False)
    date_birth: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    phone_number: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    passport_number: Mapped[str] = mapped_column(String, nullable=False)
    sex: Mapped[SexEnum] = mapped_column(Enum(SexEnum, name="sex_enum"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Passenger(id_passengers={self.id_passengers}, name={self.name}, lastname={self.lastname}, email={self.email}, date_birth={self.date_birth}, phone_number={self.phone_number}, passport_number={self.passport_number}, sex={self.sex})>"

    def to_dict(self):
        return {
            "id_passengers": self.id_passengers,
            "name": self.name,
            "lastname": self.lastname,
            "date_birth": self.date_birth,
            "phone_number": self.phone_number,
            "email": self.email,
            "passport_number": self.passport_number,
        }