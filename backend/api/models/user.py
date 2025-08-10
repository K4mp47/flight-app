from typing import List

from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class User(Base):

    __tablename__ = 'users'

    id_user: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    id_role: Mapped[int] = mapped_column(ForeignKey("roles.id_role"), nullable=False)
    role: Mapped["Role"] = relationship("Role", back_populates='users')

    airline_code: Mapped[str] = mapped_column(ForeignKey("airlines.iata_code"), nullable=True)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="users")

    tickets: Mapped[List["Passenger_ticket"]] = relationship(
        back_populates= "buyer"
    )

    name: Mapped[str] = mapped_column(String, nullable=False)
    lastname: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Role(id_role={self.id_user}, name={self.name}, lastname={self.lastname}, email={self.email})>"

    def to_dict(self):
        return {
            "id_user": self.id_user,
            "role": self.role.to_dict(),
            "name": self.name,
            "lastname": self.lastname,
            "email": self.email,
        }