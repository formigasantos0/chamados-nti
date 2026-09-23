"""adiciona unidade aos chamados

Revision ID: a00fa857552e
Revises: 12d0fb1b989e
Create Date: 2026-09-22 18:21:54.968328

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a00fa857552e'
down_revision: Union[str, Sequence[str], None] = '12d0fb1b989e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'chamados',
        sa.Column(
            'unidade_id',
            sa.Integer(),
            nullable=False
        )
    )

    op.create_foreign_key(
        'fk_chamados_unidade_id',
        'chamados',
        'unidades_organizacionais',
        ['unidade_id'],
        ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_constraint(
        'fk_chamados_unidade_id',
        'chamados',
        type_='foreignkey'
    )

    op.drop_column(
        'chamados',
        'unidade_id'
    )