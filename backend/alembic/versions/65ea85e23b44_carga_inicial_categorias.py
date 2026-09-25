"""carga inicial categorias

Revision ID: 65ea85e23b44
Revises: 675472f859de
Create Date: 2026-09-24 19:52:13.159215

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '65ea85e23b44'
down_revision: Union[str, Sequence[str], None] = '675472f859de'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Carga inicial das categorias."""
    op.bulk_insert(
        sa.table(
            "categorias",
            sa.column("nome", sa.String()),
            sa.column("descricao", sa.Text()),
            sa.column("ativo", sa.Boolean()),
            sa.column("ordem", sa.Integer()),
        ),
        [
            {
                "nome": "Hardware",
                "descricao": "Computadores, notebooks, periféricos e equipamentos.",
                "ativo": True,
                "ordem": 1,
            },
            {
                "nome": "Software",
                "descricao": "Instalação, configuração e problemas em softwares.",
                "ativo": True,
                "ordem": 2,
            },
            {
                "nome": "Rede e Internet",
                "descricao": "Conectividade, rede local, Wi-Fi e acesso à internet.",
                "ativo": True,
                "ordem": 3,
            },
            {
                "nome": "Acesso e Usuários",
                "descricao": "Contas, senhas, permissões e acessos.",
                "ativo": True,
                "ordem": 4,
            },
            {
                "nome": "E-mail",
                "descricao": "Contas, configuração e problemas relacionados a e-mail.",
                "ativo": True,
                "ordem": 5,
            },
            {
                "nome": "Telefonia",
                "descricao": "Ramais, aparelhos e serviços de telefonia.",
                "ativo": True,
                "ordem": 6,
            },
            {
                "nome": "Sistemas",
                "descricao": "Sistemas corporativos e aplicações internas.",
                "ativo": True,
                "ordem": 7,
            },
            {
                "nome": "Impressoras",
                "descricao": "Impressoras, scanners e serviços de impressão.",
                "ativo": True,
                "ordem": 8,
            },
            {
                "nome": "Segurança da Informação",
                "descricao": "Incidentes, alertas e solicitações relacionadas à segurança.",
                "ativo": True,
                "ordem": 9,
            },
            {
                "nome": "Outros",
                "descricao": "Solicitações que não se enquadram nas demais categorias.",
                "ativo": True,
                "ordem": 10,
            },
        ],
    )


def downgrade() -> None:
    """Remove a carga inicial das categorias."""
    op.execute(
        sa.text(
            """
            DELETE FROM categorias
            WHERE nome IN (
                'Hardware',
                'Software',
                'Rede e Internet',
                'Acesso e Usuários',
                'E-mail',
                'Telefonia',
                'Sistemas',
                'Impressoras',
                'Segurança da Informação',
                'Outros'
            )
            """
        )
    )