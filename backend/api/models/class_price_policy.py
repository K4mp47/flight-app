from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float

class Class_price_policy(Base):
    __tablename__ = "class_price_policy"

    id_class_price_policy: Mapped[int] = mapped_column(Integer, primary_key=True)

    id_class: Mapped[int] = mapped_column(Integer, ForeignKey("class.id_class"), nullable=False)
    class_seat: Mapped["Class_seat"] = relationship("Class_seat", back_populates="class_price_policy")

    airline_code: Mapped[str] = mapped_column(String,ForeignKey("airlines.iata_code"), nullable=False)
    airline: Mapped["Airline"] = relationship("Airline", back_populates="class_price_policy")

    price_multiplier: Mapped[float] = mapped_column(Float, nullable=False)
    fixed_markup: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"Class_price_policy(id_class={self.id_class}, airline_code={self.airline_code}, price_multiplier={self.price_multiplier}, fixed_markup{self.fixed_markup}, created_at={self.created_at})"

    def to_dict(self):
        return {
            "class_seat": self.class_seat.to_dict(),
            "airline_code": self.airline_code,
            "price_multiplier": self.price_multiplier,
            "fixed_markup": self.fixed_markup,
        }