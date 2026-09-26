from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PoliticaSLA(Base):
    __tablename__ = "politicas_sla"

    id: Mapped[int] = mapped_column(primary_key=True)

    prioridade: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
    )

    primeiro_atendimento_minutos: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    resolucao_minutos: Mapped[int] = mapped_column(
        Integer,
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

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )