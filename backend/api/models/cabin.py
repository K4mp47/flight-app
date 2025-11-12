from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String,DateTime, ForeignKey

class Cabin(Base):

    __tablename__ = 'cabins'

    id_cabin : Mapped[int] = mapped_column(Integer, primary_key=True)

    id_aircraft: Mapped[int] = mapped_column(ForeignKey("aircraft_airlines.id_aircraft_airline", ondelete="CASCADE", onupdate="CASCADE"),nullable=False)
    aircraft: Mapped["Aircraft_airline"] = relationship("Aircraft_airline",back_populates="cabins")

    id_class: Mapped[int] = mapped_column(ForeignKey("class.id_class", ondelete="SET NULL"),nullable=True)
    class_seat: Mapped["Class_seat"] = relationship("Class_seat",back_populates="cabins")

    cells: Mapped[List["Cell"]] = relationship(
        "Cell",
        back_populates="cabin",
        cascade="all, delete-orphan",
        passive_deletes=True
    )

    rows : Mapped[int] = mapped_column(Integer, nullable=False)
    cols : Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Cabin(id_cabin={self.id_cabin}, rows={self.rows}, code={self.cols})"

    def to_dict(self):
        return {
            "id_cabin": self.id_cabin,
            "rows": self.rows,
            "cols": self.cols,
        }