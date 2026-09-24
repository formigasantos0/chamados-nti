from uuid import uuid4

import boto3
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_usuario_atual
from app.core.config import settings
from app.db.session import get_db
from app.models.anexo import Anexo
from app.models.chamado import Chamado
from app.models.usuario import Usuario
from app.schemas.anexo import AnexoDownloadResponse, AnexoResponse


router = APIRouter(
    prefix="/chamados",
    tags=["Anexos"],
)

TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024  # 10 MB

TIPOS_PERMITIDOS = {
    "image/png",
    "image/jpeg",
    "application/pdf",
}

s3_client = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)

@router.post(
    "/{chamado_id}/anexos",
    response_model=AnexoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def enviar_anexo(
    chamado_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para acessar este chamado",
        )

    if arquivo.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de arquivo não permitido. Utilize PNG, JPEG ou PDF.",
        )

    conteudo = await arquivo.read()

    if len(conteudo) > TAMANHO_MAXIMO_ANEXO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo excede o limite máximo de 10 MB.",
        )

    if len(conteudo) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O arquivo está vazio.",
        )

    extensoes = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "application/pdf": ".pdf",
    }

    extensao = extensoes[arquivo.content_type]
    chave_s3 = f"chamados/{chamado_id}/{uuid4()}{extensao}"

    try:
        s3_client.put_object(
            Bucket=settings.s3_bucket_name,
            Key=chave_s3,
            Body=conteudo,
            ContentType=arquivo.content_type,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível armazenar o anexo no S3.",
        )

    anexo = Anexo(
        chamado_id=chamado.id,
        usuario_id=usuario.id,
        nome_original=arquivo.filename or "arquivo",
        chave_s3=chave_s3,
        content_type=arquivo.content_type,
        tamanho_bytes=len(conteudo),
    )

    try:
        db.add(anexo)
        db.commit()
        db.refresh(anexo)
    except Exception:
        db.rollback()

        try:
            s3_client.delete_object(
                Bucket=settings.s3_bucket_name,
                Key=chave_s3,
            )
        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Não foi possível registrar o anexo.",
        )

    return anexo


@router.get(
    "/{chamado_id}/anexos",
    response_model=list[AnexoResponse],
)
def listar_anexos(
    chamado_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para acessar este chamado",
        )

    anexos = db.scalars(
        select(Anexo)
        .where(Anexo.chamado_id == chamado_id)
        .order_by(Anexo.criado_em.asc())
    ).all()

    return anexos

@router.get(
    "/{chamado_id}/anexos/{anexo_id}/download",
    response_model=AnexoDownloadResponse,
)
def obter_download_anexo(
    chamado_id: int,
    anexo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_usuario_atual),
):
    chamado = db.get(Chamado, chamado_id)

    if chamado is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chamado não encontrado",
        )

    if (
        usuario.perfil not in {"tecnico", "administrador"}
        and chamado.solicitante_id != usuario.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não possui permissão para acessar este chamado",
        )

    anexo = db.scalar(
        select(Anexo).where(
            Anexo.id == anexo_id,
            Anexo.chamado_id == chamado_id,
        )
    )

    if anexo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anexo não encontrado",
        )

    expiracao = 60

    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": settings.s3_bucket_name,
                "Key": anexo.chave_s3,
                "ResponseContentDisposition": (
                    f'inline; filename="{anexo.nome_original}"'
                ),
                "ResponseContentType": anexo.content_type,
            },
            ExpiresIn=expiracao,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível gerar o acesso ao anexo.",
        )

    return AnexoDownloadResponse(
        url=url,
        expira_em_segundos=expiracao,
    )