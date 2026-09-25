from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import get_admin_atual, get_usuario_atual
from app.db.session import get_db
from app.models.categoria import Categoria
from app.models.usuario import Usuario
from app.schemas.categoria import (
    CategoriaAtualizar,
    CategoriaCriar,
    CategoriaResponse,
)


router = APIRouter(
    prefix="/categorias",
    tags=["Categorias"],
)


@router.get(
    "/",
    response_model=list[CategoriaResponse],
)
def listar_categorias(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    categorias = db.scalars(
        select(Categoria)
        .where(Categoria.ativo.is_(True))
        .order_by(Categoria.ordem, Categoria.nome)
    ).all()

    return categorias


@router.post(
    "/",
    response_model=CategoriaResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_categoria(
    dados: CategoriaCriar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    categoria = Categoria(
        nome=dados.nome.strip(),
        descricao=dados.descricao.strip()
        if dados.descricao
        else None,
        ordem=dados.ordem,
        ativo=True,
    )

    try:
        db.add(categoria)
        db.commit()
        db.refresh(categoria)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma categoria com esse nome.",
        )

    return categoria
@router.get("/admin", response_model=list[CategoriaResponse])
def listar_categorias_admin(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    categorias = db.scalars(
        select(Categoria)
        .order_by(Categoria.ordem, Categoria.nome)
    ).all()

    return categorias

@router.patch(
    "/{categoria_id}",
    response_model=CategoriaResponse,
)
def atualizar_categoria(
    categoria_id: int,
    dados: CategoriaAtualizar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(get_admin_atual),
):
    categoria = db.get(Categoria, categoria_id)

    if categoria is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada.",
        )

    campos = dados.model_fields_set

    if "nome" in campos and dados.nome is not None:
        categoria.nome = dados.nome.strip()

    if "descricao" in campos:
        categoria.descricao = (
            dados.descricao.strip()
            if dados.descricao
            else None
        )

    if "ativo" in campos and dados.ativo is not None:
        categoria.ativo = dados.ativo

    if "ordem" in campos and dados.ordem is not None:
        categoria.ordem = dados.ordem

    try:
        db.commit()
        db.refresh(categoria)
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma categoria com esse nome.",
        )

    return categoria