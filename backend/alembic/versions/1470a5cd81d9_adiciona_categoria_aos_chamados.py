"""adiciona categoria aos chamados

Revision ID: 1470a5cd81d9
Revises: 65ea85e23b44
Create Date: 2026-09-24 21:59:50.223153

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1470a5cd81d9'
down_revision: Union[str, Sequence[str], None] = '65ea85e23b44'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Adiciona categoria_id e migra os chamados existentes."""

    op.add_column(
        "chamados",
        sa.Column(
            "categoria_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_foreign_key(
        "fk_chamados_categoria_id_categorias",
        "chamados",
        "categorias",
        ["categoria_id"],
        ["id"],
    )

    # Relaciona categorias textuais existentes com a nova tabela.
    op.execute(
        sa.text(
            """
            UPDATE chamados AS c
            SET categoria_id = cat.id
            FROM categorias AS cat
            WHERE LOWER(TRIM(c.categoria)) = LOWER(TRIM(cat.nome))
            """
        )
    )

    # Mapeia valores antigos que não correspondem
    # diretamente aos nomes das novas categorias.
    op.execute(
        sa.text(
            """
            UPDATE chamados
            SET categoria_id = (
                SELECT id
                FROM categorias
                WHERE nome = 'Rede e Internet'
            )
            WHERE LOWER(TRIM(categoria)) = 'rede'
              AND categoria_id IS NULL
            """
        )
    )

    op.execute(
        sa.text(
            """
            UPDATE chamados
            SET categoria_id = (
                SELECT id
                FROM categorias
                WHERE nome = 'Outros'
            )
            WHERE LOWER(TRIM(categoria)) = 'string'
              AND categoria_id IS NULL
            """
        )
    )


def downgrade() -> None:
    """Remove a relação com categorias."""

    op.drop_constraint(
        "fk_chamados_categoria_id_categorias",
        "chamados",
        type_="foreignkey",
    )

    op.drop_column(
        "chamados",
        "categoria_id",
    )