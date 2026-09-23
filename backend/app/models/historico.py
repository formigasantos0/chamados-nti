from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class HistoricoChamado(Base):
    __tablename__ = "historicos_chamados"

    id: Mapped[int] = mapped_column(primary_key=True)

    chamado_id: Mapped[int] = mapped_column(
        ForeignKey("chamados.id", ondelete="CASCADE"),
        nullable=False
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    tipo: Mapped[str] = mapped_column(String(50), nullable=False)

    descricao: Mapped[str] = mapped_column(Text, nullable=False)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    chamado = relationship("Chamado")
    usuario = relationship("Usuario")