import getpass

from sqlalchemy import select

from app.core.security import gerar_hash_senha
from app.db.session import SessionLocal
from app.models.unidade import UnidadeOrganizacional
from app.models.usuario import Usuario


def main():
    print("\n=== Criação do Administrador do Chamados NTI ===\n")

    nome = input("Nome: ").strip()
    email = input("E-mail: ").strip().lower()
    senha = getpass.getpass("Senha: ")
    confirmar_senha = getpass.getpass("Confirme a senha: ")

    if not nome or not email or not senha:
        print("\nErro: todos os campos são obrigatórios.")
        return

    if senha != confirmar_senha:
        print("\nErro: as senhas não coincidem.")
        return

    if len(senha) < 8:
        print("\nErro: a senha deve possuir pelo menos 8 caracteres.")
        return

    db = SessionLocal()

    try:
        usuario_existente = db.scalar(
            select(Usuario).where(Usuario.email == email)
        )

        if usuario_existente:
            print("\nErro: já existe um usuário com esse e-mail.")
            return

        unidade_nti = db.scalar(
            select(UnidadeOrganizacional).where(
                UnidadeOrganizacional.sigla == "NTI"
            )
        )

        if unidade_nti is None:
            print("\nErro: unidade NTI não encontrada.")
            return

        usuario = Usuario(
            nome=nome,
            email=email,
            senha_hash=gerar_hash_senha(senha),
            perfil="administrador",
            unidade_id=unidade_nti.id,
            ativo=True,
        )

        db.add(usuario)
        db.commit()
        db.refresh(usuario)

        print("\nAdministrador criado com sucesso.")
        print(f"ID: {usuario.id}")
        print(f"Nome: {usuario.nome}")
        print(f"E-mail: {usuario.email}")
        print(f"Unidade: {unidade_nti.sigla}")
        print(f"Perfil: {usuario.perfil}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()