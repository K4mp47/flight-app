from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean


class Cell(Base):
    __tablename__ = 'cells'

    id_cell: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_cell_block: Mapped[int] = mapped_column(ForeignKey("cells_block.id_cell_block"),nullable=False)
    block: Mapped["Cells_block"] = relationship("Cells_block", back_populates='cells')

    x: Mapped[int] = mapped_column(Integer, nullable=False)
    y: Mapped[int] = mapped_column(Integer, nullable=False)
    is_seat: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Cell(id_cell={self.id_cell}, x={self.x}, y={self.y})"

    def to_dict(self):
        return {
            "id_cell": self.id_cell,
            "x": self.x,
            "y": self.y,
            "is_seat": self.is_seat,
        }