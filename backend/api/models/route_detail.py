from .base import Base
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey, Integer, Time
from typing import List, Optional


class Route_detail(Base):
    __tablename__ = "route_detail"

    id_airline_routes: Mapped[int] = mapped_column(Integer, primary_key=True)

    code_route: Mapped [str] = mapped_column(ForeignKey("routes.code"), nullable=False)
    route : Mapped["Route"] = relationship("Route", back_populates="routes_details")

    id_route_section: Mapped[int] = mapped_column(ForeignKey("routes_section.id_routes_section",ondelete="SET NULL"), nullable=False)
    section: Mapped["Route_section"] = relationship("Route_section", back_populates="routes")

    id_next: Mapped[int|None] = mapped_column(ForeignKey("route_detail.id_airline_routes"), nullable=False)

    next: Mapped[Optional["Route_detail"]] = relationship(
        back_populates="prev",
        remote_side=[id_airline_routes]
    )

    prev: Mapped[Optional["Route_detail"]] = relationship (
        back_populates="next",
        cascade="all, delete-orphan"
    )

    departure_time: Mapped[Time] = mapped_column(Time, nullable=False)
    arrival_time: Mapped[Time] = mapped_column(Time, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Route_detail(id_airline_routes={self.id_airline_routes}, section={self.section.to_dict()}, next={self.next.to_dict()})>"

    def to_dict(self):
        return {
            "id_airline_routes": self.id_airline_routes,
            "route": self.route.to_dict(),
            "section": self.section.to_dict(),
            "next": self.next.to_dict() if self.next else None,
        }

    def to_dict_search(self):
        return {
             "id_airline_routes": self.id_airline_routes,
             "departure_time": self.departure_time.strftime("%H:%M:%S"),
             "arrival_time": self.arrival_time.strftime("%H:%M:%S"),
             "section": self.section.to_dict(),
             "next_id": self.next.id_airline_routes if self.next else None,
        }