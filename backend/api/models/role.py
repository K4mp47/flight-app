from .base import Base
from typing import List
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String,DateTime

class Role(Base):
    __tablename__ = "roles"

    id_role : Mapped[int] = mapped_column(Integer, primary_key=True)
    users : Mapped[List["User"]] = relationship(
        back_populates="role",
        cascade="all, delete, delete-orphan"
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Role(id_role={self.id_role}, name={self.name})>"

    def to_dict(self):
        return {
            "id_role": self.id_role,
            "name": self.name,
        }