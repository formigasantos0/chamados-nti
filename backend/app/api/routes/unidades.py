from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_admin_atual, get_usuario_atual
from app.db.session import get_db
from app.models.unidade import UnidadeOrganizacional
from app.models.usuario import Usuario
from app.schemas.unidade import (
    UnidadeAtualizar,
    UnidadeCriar,
    UnidadeResponse,
)
from app.schemas.usuario import UnidadeResumo


router = APIRouter(
    prefix="/unidades",
    tags=["Unidades Organizacionais"],
)

def validar_hierarquia(
    db: Session,
    unidade_id: int,
    parent_id: int | None,
) -> None:
    if parent_id is None:
        return

    if parent_id == unidade_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uma unidade não pode ser superior a si mesma",
        )

    atual = db.get(UnidadeOrganizacional, parent_id)

    while atual is not None:
        if atual.id == unidade_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A hierarquia informada criaria um ciclo entre unidades",
            )

        if atual.parent_id is None:
            break

        atual = db.get(
            UnidadeOrganizacional,
            atual.parent_id,
        )


@router.get("/", response_model=list[UnidadeResumo])
def listar_unidades(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    unidades = db.scalars(
        select(UnidadeOrganizacional)
        .where(UnidadeOrganizacional.ativo.is_(True))
        .order_by(UnidadeOrganizacional.nome)
    ).all()

    return unidades

@router.get(
    "/admin",
    response_model=list[UnidadeResponse],
)
def listar_unidades_administracao(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    unidades = db.scalars(
        select(UnidadeOrganizacional)
        .order_by(UnidadeOrganizacional.nome)
    ).all()

    return unidades


@router.post(
    "/admin",
    response_model=UnidadeResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_unidade(
    dados: UnidadeCriar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    sigla = dados.sigla.strip().upper()
    nome = dados.nome.strip()

    unidade_existente = db.scalar(
        select(UnidadeOrganizacional).where(
            UnidadeOrganizacional.sigla == sigla
        )
    )

    if unidade_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma unidade com esta sigla",
        )

    if dados.parent_id is not None:
        parent = db.get(
            UnidadeOrganizacional,
            dados.parent_id,
        )

        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unidade superior não encontrada",
            )

        if not parent.ativo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A unidade superior está inativa",
            )

    unidade = UnidadeOrganizacional(
        nome=nome,
        sigla=sigla,
        tipo=dados.tipo,
        parent_id=dados.parent_id,
        ativo=True,
    )

    db.add(unidade)
    db.commit()
    db.refresh(unidade)

    return unidade


@router.patch(
    "/admin/{unidade_id}",
    response_model=UnidadeResponse,
)
def atualizar_unidade(
    unidade_id: int,
    dados: UnidadeAtualizar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    unidade = db.get(
        UnidadeOrganizacional,
        unidade_id,
    )

    if unidade is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidade não encontrada",
        )

    if dados.nome is not None:
        unidade.nome = dados.nome.strip()

    if dados.sigla is not None:
        sigla = dados.sigla.strip().upper()

        unidade_existente = db.scalar(
            select(UnidadeOrganizacional).where(
                UnidadeOrganizacional.sigla == sigla,
                UnidadeOrganizacional.id != unidade_id,
            )
        )

        if unidade_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma unidade com esta sigla",
            )

        unidade.sigla = sigla

    if dados.tipo is not None:
        unidade.tipo = dados.tipo

    if "parent_id" in dados.model_fields_set:
        validar_hierarquia(
            db=db,
            unidade_id=unidade_id,
            parent_id=dados.parent_id,
        )

        if dados.parent_id is not None:
            parent = db.get(
                UnidadeOrganizacional,
                dados.parent_id,
            )

            if parent is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unidade superior não encontrada",
                )

            if not parent.ativo:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A unidade superior está inativa",
                )

        unidade.parent_id = dados.parent_id

    if dados.ativo is not None:
        if dados.ativo is False and unidade.ativo is True:
            usuario_ativo = db.scalar(
                select(Usuario.id)
                .where(
                    Usuario.unidade_id == unidade_id,
                    Usuario.ativo.is_(True),
                )
                .limit(1)
            )

            if usuario_ativo is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Não é possível desativar a unidade "
                        "porque existem usuários ativos vinculados a ela"
                    ),
                )

            unidade_filha_ativa = db.scalar(
                select(UnidadeOrganizacional.id)
                .where(
                    UnidadeOrganizacional.parent_id == unidade_id,
                    UnidadeOrganizacional.ativo.is_(True),
                )
                .limit(1)
            )

            if unidade_filha_ativa is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Não é possível desativar a unidade "
                        "porque existem unidades ativas vinculadas a ela"
                    ),
                )

        unidade.ativo = dados.ativo

    db.commit()
    db.refresh(unidade)

    return unidade