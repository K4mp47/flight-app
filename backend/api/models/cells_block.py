from .base import Base
from datetime import datetime
from typing import List
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String,DateTime, ForeignKey

class Cells_block(Base):

    __tablename__ = 'cells_block'

    id_cell_block : Mapped[int] = mapped_column(Integer, primary_key=True)

    aircraft_compositions : Mapped[List["Aircraft_composition"]] = relationship(
        back_populates="cell_block",
        cascade="all, delete, delete-orphan",
    )

    cells: Mapped[List["Cell"]] = relationship(
        back_populates="block",
        cascade="all, delete-orphan",
    )

    rows : Mapped[int] = mapped_column(Integer, nullable=False)
    cols : Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Cells_block(id_cell_block={self.id_cell_block}, rows={self.rows}, code={self.cols})"

    def to_dict(self):
        return {
            "id_cell_block": self.id_cell_block,
            "rows": self.rows,
            "cols": self.cols,
        }