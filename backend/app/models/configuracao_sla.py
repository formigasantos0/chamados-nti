from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, String, Time, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ConfiguracaoSLA(Base):
    __tablename__ = "configuracao_sla"

    id: Mapped[int] = mapped_column(primary_key=True)

    timezone: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="America/Sao_Paulo",
    )

    hora_inicio: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    hora_fim: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    segunda: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    terca: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quarta: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quinta: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sexta: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sabado: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    domingo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )