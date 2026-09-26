import { useEffect, useState } from "react";

import api from "../services/api";

type UnidadeResumo = {
  id: number;
  nome: string;
  sigla: string;
};

type Usuario = {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  unidade_id: number;
  unidade: UnidadeResumo;
};

function formatarPerfil(perfil: string) {
  const perfis: Record<string, string> = {
    usuario: "Usuário",
    tecnico: "Técnico",
    administrador: "Administrador",
  };

  return perfis[perfil] ?? perfil;
}

function AdministrarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [unidades, setUnidades] = useState<UnidadeResumo[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(
    null,
  );

  const [usuarioSenha, setUsuarioSenha] = useState<Usuario | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [redefinindoSenha, setRedefinindoSenha] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [perfil, setPerfil] = useState("usuario");

  useEffect(() => {
    async function carregarDados() {
      try {
        const [usuariosResponse, unidadesResponse] =
          await Promise.all([
            api.get<Usuario[]>("/usuarios/"),
            api.get<UnidadeResumo[]>("/unidades/"),
          ]);

        setUsuarios(usuariosResponse.data);
        setUnidades(unidadesResponse.data);
      } catch {
        setErro("Não foi possível carregar os dados administrativos.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  function limparFormulario() {
    setNome("");
    setEmail("");
    setSenha("");
    setUnidadeId("");
    setPerfil("usuario");
    setUsuarioEmEdicao(null);
  }

  function abrirNovoUsuario() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEmEdicao(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha("");
    setUnidadeId(String(usuario.unidade_id));
    setPerfil(usuario.perfil);

    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  async function alterarStatusUsuario(usuario: Usuario) {
  const novoStatus = !usuario.ativo;

  const confirmar = window.confirm(
    novoStatus
      ? `Deseja ativar o usuário "${usuario.nome}"?`
      : `Deseja desativar o usuário "${usuario.nome}"?`,
  );

  if (!confirmar) {
    return;
  }

  setErro("");
  setMensagem("");

  try {
    const response = await api.patch<Usuario>(
      `/usuarios/${usuario.id}`,
      {
        ativo: novoStatus,
      },
    );

    setUsuarios((usuariosAtuais) =>
      usuariosAtuais.map((item) =>
        item.id === response.data.id
          ? response.data
          : item,
      ),
    );

    setMensagem(
      novoStatus
        ? "Usuário ativado com sucesso."
        : "Usuário desativado com sucesso.",
    );
  } catch {
    setErro(
      novoStatus
        ? "Não foi possível ativar o usuário."
        : "Não foi possível desativar o usuário.",
    );
  }
}

async function handleRedefinirSenha(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!usuarioSenha) {
    return;
  }

  setRedefinindoSenha(true);
  setErro("");
  setMensagem("");

  try {
    await api.post(
      `/usuarios/${usuarioSenha.id}/redefinir-senha`,
      {
        senha: novaSenha,
      },
    );

    setMensagem(
      `Senha de "${usuarioSenha.nome}" redefinida com sucesso.`,
    );

    setUsuarioSenha(null);
    setNovaSenha("");
  } catch {
    setErro("Não foi possível redefinir a senha.");
  } finally {
    setRedefinindoSenha(false);
  }
}

  function cancelarFormulario() {
    limparFormulario();
    setErro("");
    setMostrarFormulario(false);
  }

  async function handleSalvarUsuario(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      if (usuarioEmEdicao) {
        const response = await api.patch<Usuario>(
          `/usuarios/${usuarioEmEdicao.id}`,
          {
            nome,
            email,
            unidade_id: Number(unidadeId),
            perfil,
          },
        );

        setUsuarios((usuariosAtuais) =>
          usuariosAtuais
            .map((usuario) =>
              usuario.id === response.data.id
                ? response.data
                : usuario,
            )
            .sort((a, b) =>
              a.nome.localeCompare(b.nome, "pt-BR"),
            ),
        );

        setMensagem("Usuário atualizado com sucesso.");
      } else {
        const response = await api.post<Usuario>(
          "/usuarios/",
          {
            nome,
            email,
            senha,
            unidade_id: Number(unidadeId),
            perfil,
          },
        );

        setUsuarios((usuariosAtuais) =>
          [...usuariosAtuais, response.data].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR"),
          ),
        );

        setMensagem("Usuário cadastrado com sucesso.");
      }

      limparFormulario();
      setMostrarFormulario(false);
    } catch {
      setErro(
        usuarioEmEdicao
          ? "Não foi possível atualizar o usuário."
          : "Não foi possível cadastrar o usuário.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return <p>Carregando usuários...</p>;
  }

  return (
    <section className="admin-usuarios">
      <header className="admin-cabecalho">
        <div>
          <h1>Administração de Usuários</h1>
          <p>
            Gerencie os usuários e os acessos ao sistema de chamados.
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            className="botao-primario"
            onClick={abrirNovoUsuario}
          >
            + Novo usuário
          </button>
        )}
      </header>

      {erro && (
        <p role="alert" className="mensagem mensagem-erro">
          {erro}
        </p>
      )}

      {mensagem && (
        <p role="status" className="mensagem mensagem-sucesso">
          {mensagem}
        </p>
      )}

      {usuarioSenha && (
        <form
          className="admin-formulario"
          onSubmit={handleRedefinirSenha}>
            <h2>Redefinir senha</h2>

            <p>
            Usuário: <strong>{usuarioSenha.nome}</strong>
            </p>

            <div>
            <label htmlFor="nova-senha">
                Nova senha
            </label>

            <input
                id="nova-senha"
                type="password"
                value={novaSenha}
                onChange={(event) =>
                setNovaSenha(event.target.value)
                }
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
            />
            </div>

            <div className="form-acoes">
            <button
                type="submit"
                disabled={redefinindoSenha}
            >
                {redefinindoSenha
                ? "Redefinindo..."
                : "Redefinir senha"}
            </button>

            <button
                type="button"
                disabled={redefinindoSenha}
                onClick={() => {
                setUsuarioSenha(null);
                setNovaSenha("");
                }}
            >
                Cancelar
            </button>
            </div>
        </form>
        )}

      {mostrarFormulario && (
        <form 
        className="admin-formulario"
        onSubmit={handleSalvarUsuario}>
          <h2>
            {usuarioEmEdicao
              ? "Editar usuário"
              : "Novo usuário"}
          </h2>

          <div>
            <label htmlFor="usuario-nome">
              Nome
            </label>

            <input
              id="usuario-nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              minLength={3}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label htmlFor="usuario-email">
              E-mail
            </label>

            <input
              id="usuario-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </div>

          {!usuarioEmEdicao && (
            <div>
              <label htmlFor="usuario-senha">
                Senha inicial
              </label>

              <input
                id="usuario-senha"
                type="password"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="usuario-unidade">
              Unidade
            </label>

            <select
              id="usuario-unidade"
              value={unidadeId}
              onChange={(event) =>
                setUnidadeId(event.target.value)
              }
              required
            >
              <option value="">
                Selecione...
              </option>

              {unidades.map((unidade) => (
                <option
                  key={unidade.id}
                  value={unidade.id}
                >
                  {unidade.sigla} — {unidade.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="usuario-perfil">
              Perfil
            </label>

            <select
              id="usuario-perfil"
              value={perfil}
              onChange={(event) =>
                setPerfil(event.target.value)
              }
            >
              <option value="usuario">
                Usuário
              </option>

              <option value="tecnico">
                Técnico
              </option>

              <option value="administrador">
                Administrador
              </option>
            </select>
          </div>

          <div className="form-acoes">
            <button
              type="submit"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : usuarioEmEdicao
                  ? "Salvar alterações"
                  : "Cadastrar usuário"}
            </button>

            <button
              type="button"
              onClick={cancelarFormulario}
              disabled={salvando}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {usuarios.length === 0 ? (
        <p>Nenhum usuário cadastrado.</p>
      ) : (
        <div className="tabela-container">
          <table className="chamados-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Unidade</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>

                  <td>
                    {usuario.unidade.sigla}
                  </td>

                  <td>
                    {formatarPerfil(usuario.perfil)}
                  </td>

                  <td>
                    <span
                      className={
                        usuario.ativo
                          ? "status-usuario status-ativo"
                          : "status-usuario status-inativo"
                      }
                    >
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                 <td>
                    <div className="acoes-usuario">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(usuario)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => alterarStatusUsuario(usuario)}
                      >
                        {usuario.ativo ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUsuarioSenha(usuario);
                          setNovaSenha("");
                          setErro("");
                          setMensagem("");
                        }}
                      >
                        Redefinir senha
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdministrarUsuarios;