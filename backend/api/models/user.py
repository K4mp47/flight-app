from .base import Base
#from .role import Role
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, DateTime, ForeignKey

class User(Base):

    __tablename__ = 'users'

    id_user: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    id_role: Mapped[int] = mapped_column(ForeignKey("roles.id_role"), nullable=False)
    role: Mapped["Role"] = relationship("Role", back_populates='users')

    name: Mapped[str] = mapped_column(String, nullable=False)
    lastname: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Role(id_role={self.id_user}, name={self.name}, lastname={self.lastname}, email={self.email})>"