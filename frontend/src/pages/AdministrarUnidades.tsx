import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import api from "../services/api";

type TipoUnidade =
  | "assessoria"
  | "diretoria"
  | "nucleo"
  | "presidencia";

type Unidade = {
  id: number;
  nome: string;
  sigla: string;
  tipo: TipoUnidade;
  parent_id: number | null;
  ativo: boolean;
};

type ErroAPI = {
  detail?: string;
};

function obterMensagemErro(
  erro: unknown,
  mensagemPadrao: string,
) {
  const axiosError = erro as AxiosError<ErroAPI>;

  return axiosError.response?.data?.detail ?? mensagemPadrao;
}

function formatarTipo(tipo: TipoUnidade) {
  const tipos: Record<TipoUnidade, string> = {
    assessoria: "Assessoria",
    diretoria: "Diretoria",
    nucleo: "Núcleo",
    presidencia: "Presidência",
  };

  return tipos[tipo];
}

function AdministrarUnidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [unidadeEmEdicao, setUnidadeEmEdicao] =
    useState<Unidade | null>(null);

  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [tipo, setTipo] = useState<TipoUnidade>("nucleo");
  const [parentId, setParentId] = useState("");

  useEffect(() => {
    async function carregarUnidades() {
      try {
        const response =
          await api.get<Unidade[]>("/unidades/admin");

        setUnidades(response.data);
      } catch {
        setErro(
          "Não foi possível carregar as unidades organizacionais.",
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarUnidades();
  }, []);

  function limparFormulario() {
    setNome("");
    setSigla("");
    setTipo("nucleo");
    setParentId("");
    setUnidadeEmEdicao(null);
  }

  function abrirNovaUnidade() {
    limparFormulario();
    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function abrirEdicao(unidade: Unidade) {
    setUnidadeEmEdicao(unidade);
    setNome(unidade.nome);
    setSigla(unidade.sigla);
    setTipo(unidade.tipo);
    setParentId(
      unidade.parent_id !== null
        ? String(unidade.parent_id)
        : "",
    );

    setErro("");
    setMensagem("");
    setMostrarFormulario(true);
  }

  function cancelarFormulario() {
    limparFormulario();
    setErro("");
    setMostrarFormulario(false);
  }

  async function handleSalvarUnidade(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSalvando(true);
    setErro("");
    setMensagem("");

    const dados = {
      nome,
      sigla,
      tipo,
      parent_id: parentId ? Number(parentId) : null,
    };

    try {
      if (unidadeEmEdicao) {
        const response = await api.patch<Unidade>(
          `/unidades/admin/${unidadeEmEdicao.id}`,
          dados,
        );

        setUnidades((unidadesAtuais) =>
          unidadesAtuais
            .map((unidade) =>
              unidade.id === response.data.id
                ? response.data
                : unidade,
            )
            .sort((a, b) =>
              a.nome.localeCompare(b.nome, "pt-BR"),
            ),
        );

        setMensagem("Unidade atualizada com sucesso.");
      } else {
        const response = await api.post<Unidade>(
          "/unidades/admin",
          dados,
        );

        setUnidades((unidadesAtuais) =>
          [...unidadesAtuais, response.data].sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR"),
          ),
        );

        setMensagem("Unidade cadastrada com sucesso.");
      }

      limparFormulario();
      setMostrarFormulario(false);
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          unidadeEmEdicao
            ? "Não foi possível atualizar a unidade."
            : "Não foi possível cadastrar a unidade.",
        ),
      );
    
    } finally {
          setSalvando(false);
        }
}

  async function alterarStatusUnidade(unidade: Unidade) {
    const novoStatus = !unidade.ativo;

    const confirmar = window.confirm(
      novoStatus
        ? `Deseja ativar a unidade "${unidade.nome}"?`
        : `Deseja desativar a unidade "${unidade.nome}"?`,
    );

    if (!confirmar) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const response = await api.patch<Unidade>(
        `/unidades/admin/${unidade.id}`,
        {
          ativo: novoStatus,
        },
      );

      setUnidades((unidadesAtuais) =>
        unidadesAtuais.map((item) =>
          item.id === response.data.id
            ? response.data
            : item,
        ),
      );

      setMensagem(
        novoStatus
          ? "Unidade ativada com sucesso."
          : "Unidade desativada com sucesso.",
      );
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          novoStatus
            ? "Não foi possível ativar a unidade."
            : "Não foi possível desativar a unidade.",
        ),
      );
    }
  }

  function obterUnidadeSuperior(parentId: number | null) {
    if (parentId === null) {
      return "—";
    }

    const unidadeSuperior = unidades.find(
      (unidade) => unidade.id === parentId,
    );

    if (!unidadeSuperior) {
      return "—";
    }

    return `${unidadeSuperior.sigla} — ${unidadeSuperior.nome}`;
  }

  if (carregando) {
    return <p>Carregando unidades...</p>;
  }

  return (
    <section className="admin-unidades">
      <header className="pagina-cabecalho admin-pagina-cabecalho">
        <div>
          <span className="pagina-eyebrow">
            Administração
          </span>

          <h1>Unidades</h1>

          <p>
            Gerencie a estrutura organizacional utilizada pelo
            Sistema de Chamados.
          </p>
        </div>

        {!mostrarFormulario && (
          <button
            type="button"
            onClick={abrirNovaUnidade}
          >
            + Nova unidade
          </button>
        )}
      </header>

      {erro && (
        <div
          className="form-alerta form-alerta-erro admin-alerta"
          role="alert"
        >
          {erro}
        </div>
      )}

      {mensagem && (
        <div
          className="form-alerta form-alerta-sucesso admin-alerta"
          role="status"
        >
          {mensagem}
        </div>
      )}

      {mostrarFormulario && (
        <form
          className="admin-formulario form-card"
          onSubmit={handleSalvarUnidade}
        >
          <div className="form-card-cabecalho">
            <div>
              <h2>
                {unidadeEmEdicao
                  ? "Editar unidade"
                  : "Nova unidade"}
              </h2>

              <p>
                {unidadeEmEdicao
                  ? "Atualize os dados e a posição desta unidade na estrutura organizacional."
                  : "Cadastre uma nova unidade na estrutura organizacional."}
              </p>
            </div>
          </div>

          <div className="admin-form-conteudo">

          <div>
            <label htmlFor="unidade-nome">Nome</label>

            <input
              id="unidade-nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div>
            <label htmlFor="unidade-sigla">Sigla</label>

            <input
              id="unidade-sigla"
              type="text"
              value={sigla}
              onChange={(event) =>
                setSigla(event.target.value.toUpperCase())
              }
              minLength={2}
              maxLength={10}
              required
            />
          </div>

          <div>
            <label htmlFor="unidade-tipo">Tipo</label>

            <select
              id="unidade-tipo"
              value={tipo}
              onChange={(event) =>
                setTipo(event.target.value as TipoUnidade)
              }
            >
              <option value="assessoria">Assessoria</option>
              <option value="diretoria">Diretoria</option>
              <option value="nucleo">Núcleo</option>
              <option value="presidencia">Presidência</option>
            </select>
          </div>

          <div>
            <label htmlFor="unidade-superior">
              Unidade superior
            </label>

            <select
              id="unidade-superior"
              value={parentId}
              onChange={(event) =>
                setParentId(event.target.value)
              }
            >
              <option value="">Nenhuma</option>

              {unidades
                .filter(
                  (unidade) =>
                    unidade.ativo &&
                    unidade.id !== unidadeEmEdicao?.id,
                )
                .map((unidade) => (
                  <option
                    key={unidade.id}
                    value={unidade.id}
                  >
                    {unidade.sigla} — {unidade.nome}
                  </option>
                ))}
            </select>
          </div>

          </div>
          {/* fecha admin-form-conteudo */}

          <div className="form-acoes">
            <button
              type="submit"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : unidadeEmEdicao
                  ? "Salvar alterações"
                  : "Cadastrar unidade"}
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

      {unidades.length === 0 ? (
        <p>Nenhuma unidade cadastrada.</p>
      ) : (
        <div className="tabela-container">
          <table className="chamados-tabela">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Sigla</th>
                <th>Tipo</th>
                <th>Unidade superior</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {unidades.map((unidade) => (
                <tr key={unidade.id}>
                  <td>{unidade.nome}</td>
                  <td>{unidade.sigla}</td>
                  <td>{formatarTipo(unidade.tipo)}</td>
                  <td>
                    {obterUnidadeSuperior(
                      unidade.parent_id,
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        unidade.ativo
                          ? "status-usuario status-ativo"
                          : "status-usuario status-inativo"
                      }
                    >
                      {unidade.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>

                  <td>
                    <div className="acoes-usuario">
                      <button
                        type="button"
                        onClick={() =>
                          abrirEdicao(unidade)
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          alterarStatusUnidade(unidade)
                        }
                      >
                        {unidade.ativo
                          ? "Desativar"
                          : "Ativar"}
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

export default AdministrarUnidades;