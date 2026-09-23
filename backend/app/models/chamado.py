from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Chamado(Base):
    __tablename__ = "chamados"

    id: Mapped[int] = mapped_column(primary_key=True)

    protocolo: Mapped[str] = mapped_column(
        String(30), unique=True, index=True, nullable=False
    )

    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, nullable=False)

    categoria: Mapped[str] = mapped_column(String(50), nullable=False)

    prioridade: Mapped[str] = mapped_column(
        String(20), default="normal", nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30), default="aberto", nullable=False
    )

    solicitante_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), nullable=False
    )

    unidade_id: Mapped[int] = mapped_column(
    ForeignKey("unidades_organizacionais.id"),
    nullable=False
    )

    responsavel_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True
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

    solicitante = relationship(
        "Usuario",
        foreign_keys=[solicitante_id]
    )

    responsavel = relationship(
        "Usuario",
        foreign_keys=[responsavel_id]
    )

    unidade = relationship(
        "UnidadeOrganizacional"
    )