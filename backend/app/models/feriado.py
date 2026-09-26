from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Feriado(Base):
    __tablename__ = "feriados"

    id: Mapped[int] = mapped_column(primary_key=True)

    data: Mapped[date] = mapped_column(
        Date,
        unique=True,
        nullable=False,
    )

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )