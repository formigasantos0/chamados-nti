from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class UnidadeOrganizacional(Base):
    __tablename__ = "unidades_organizacionais"

    id: Mapped[int] = mapped_column(primary_key=True)

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    sigla: Mapped[str] = mapped_column(
        String(10),
        unique=True,
        index=True,
        nullable=False
    )

    tipo: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("unidades_organizacionais.id"),
        nullable=True
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )

    parent: Mapped["UnidadeOrganizacional | None"] = relationship(
        remote_side="UnidadeOrganizacional.id",
        back_populates="filhos"
    )

    filhos: Mapped[list["UnidadeOrganizacional"]] = relationship(
        back_populates="parent"
    )