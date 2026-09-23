"""carga inicial unidades organizacionais

Revision ID: 12d0fb1b989e
Revises: c9830e5eb844
Create Date: 2026-09-22 16:37:01.423941

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '12d0fb1b989e'
down_revision: Union[str, Sequence[str], None] = 'c9830e5eb844'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Diretor Presidente
    op.execute("""
        INSERT INTO unidades_organizacionais (nome, sigla, tipo, parent_id, ativo)
        VALUES ('Diretor Presidente', 'DPR', 'presidencia', NULL, true);
    """)

    # Diretorias
    op.execute("""
        INSERT INTO unidades_organizacionais (nome, sigla, tipo, parent_id, ativo)
        VALUES
        (
            'Diretoria de Gestão',
            'DGE',
            'diretoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        ),
        (
            'Diretoria de Mobilidade Urbana',
            'DMU',
            'diretoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        );
    """)

    # Núcleos da DGE
    op.execute("""
        INSERT INTO unidades_organizacionais (nome, sigla, tipo, parent_id, ativo)
        VALUES
        (
            'Núcleo Jurídico e Legislativo',
            'NJL',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DGE'),
            true
        ),
        (
            'Núcleo de Administração e Finanças',
            'NAF',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DGE'),
            true
        ),
        (
            'Núcleo de Tecnologia da Informação',
            'NTI',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DGE'),
            true
        );
    """)

    # Núcleos da DMU
    op.execute("""
        INSERT INTO unidades_organizacionais (nome, sigla, tipo, parent_id, ativo)
        VALUES
        (
            'Núcleo de Transporte Público Coletivo',
            'NTC',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DMU'),
            true
        ),
        (
            'Núcleo de Inovação Tecnológica',
            'NIT',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DMU'),
            true
        ),
        (
            'Núcleo Observatório',
            'NOB',
            'nucleo',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DMU'),
            true
        );
    """)

    # Unidades ligadas diretamente à Presidência
    op.execute("""
        INSERT INTO unidades_organizacionais (nome, sigla, tipo, parent_id, ativo)
        VALUES
        (
            'Secretaria',
            'SEC',
            'assessoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        ),
        (
            'Comunicação Social',
            'CSO',
            'assessoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        ),
        (
            'Relações Institucionais',
            'RIT',
            'assessoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        ),
        (
            'Relacionamento',
            'REL',
            'assessoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        ),
        (
            'Estratégia',
            'EST',
            'assessoria',
            (SELECT id FROM unidades_organizacionais WHERE sigla = 'DPR'),
            true
        );
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM unidades_organizacionais
        WHERE sigla IN (
            'NJL', 'NAF', 'NTI',
            'NTC', 'NIT', 'NOB',
            'SEC', 'CSO', 'RIT', 'REL', 'EST',
            'DGE', 'DMU', 'DPR'
        );
    """)