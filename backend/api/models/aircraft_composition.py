from datetime import datetime

from .base import Base
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey, Float


class Aircraft_composition(Base):
    __tablename__ = "aircraft_composition"

    id_cell_block: Mapped[int] = mapped_column(ForeignKey("cells_block.id_cell_block"), primary_key=True)
    cell_block: Mapped["Cells_block"] = relationship("Cells_block", back_populates="aircraft_compositions")

    id_aircraft_airline: Mapped[int] = mapped_column(ForeignKey("aircraft_airlines.id_aircraft_airline"), primary_key=True)
    aircraft: Mapped["Aircraft_airline"] = relationship("Aircraft_airline", back_populates="aircraft_compositions")

    id_class: Mapped[int] = mapped_column(ForeignKey("class.id_class"))
    class_block: Mapped["Class_seat"] = relationship("Class_seat", back_populates="aircraft_compositions")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Aircraft_composition(id_cell_block={self.id_cell_block}, id_aircraft_airline={self.id_aircraft_airline}, id_class={self.id_class})"

    def to_dict(self):
        return {
            "cell_block": self.cell_block.to_dict(),
            "id_aircraft_airline": self.id_aircraft_airline,
            "id_class": self.class_block.name,
        }