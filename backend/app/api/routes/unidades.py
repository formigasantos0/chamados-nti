from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_usuario_atual
from app.db.session import get_db
from app.models.unidade import UnidadeOrganizacional
from app.models.usuario import Usuario
from app.schemas.usuario import UnidadeResumo


router = APIRouter(
    prefix="/unidades",
    tags=["Unidades Organizacionais"],
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