from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Anexo(Base):
    __tablename__ = "anexos"

    id: Mapped[int] = mapped_column(primary_key=True)

    chamado_id: Mapped[int] = mapped_column(
        ForeignKey("chamados.id", ondelete="CASCADE"),
        nullable=False
    )

    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"),
        nullable=False
    )

    nome_original: Mapped[str] = mapped_column(String(255), nullable=False)

    chave_s3: Mapped[str] = mapped_column(
        String(500), unique=True, nullable=False
    )

    content_type: Mapped[str] = mapped_column(String(150), nullable=False)

    tamanho_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    chamado = relationship("Chamado")
    usuario = relationship("Usuario")