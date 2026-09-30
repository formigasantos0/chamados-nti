import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";

import api from "../services/api";

interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  criado_em: string;
  atualizado_em: string;
}

interface CategoriaFormulario {
  nome: string;
  descricao: string;
  ordem: string;
}

const formularioInicial: CategoriaFormulario = {
  nome: "",
  descricao: "",
  ordem: "0",
};

function AdministrarCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [categoriaEmEdicao, setCategoriaEmEdicao] =
    useState<Categoria | null>(null);

  const [formulario, setFormulario] =
    useState<CategoriaFormulario>(formularioInicial);

  async function carregarCategorias() {
    try {
      setCarregando(true);
      setErro("");

      const response =
        await api.get<Categoria[]>("/categorias/admin");

      setCategorias(response.data);
    } catch {
      setErro("Não foi possível carregar as categorias.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  function abrirNovaCategoria() {
    setCategoriaEmEdicao(null);
    setFormulario(formularioInicial);
    setErro("");
    setMensagem("");
    setExibirFormulario(true);
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEmEdicao(categoria);

    setFormulario({
      nome: categoria.nome,
      descricao: categoria.descricao ?? "",
      ordem: String(categoria.ordem),
    });

    setErro("");
    setMensagem("");
    setExibirFormulario(true);
  }

  function cancelarFormulario() {
    setCategoriaEmEdicao(null);
    setFormulario(formularioInicial);
    setErro("");
    setExibirFormulario(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    const nome = formulario.nome.trim();
    const descricao = formulario.descricao.trim();
    const ordem = Number(formulario.ordem);

    if (nome.length < 2) {
      setErro("Informe um nome com pelo menos 2 caracteres.");
      return;
    }

    if (!Number.isInteger(ordem) || ordem < 0) {
      setErro("A ordem deve ser um número inteiro igual ou maior que zero.");
      return;
    }

    const dados = {
      nome,
      descricao: descricao || null,
      ordem,
    };

    try {
      setSalvando(true);

      if (categoriaEmEdicao) {
        await api.patch(
          `/categorias/${categoriaEmEdicao.id}`,
          dados,
        );

        setMensagem("Categoria atualizada com sucesso.");
      } else {
        await api.post("/categorias/", dados);

        setMensagem("Categoria criada com sucesso.");
      }

      setCategoriaEmEdicao(null);
      setFormulario(formularioInicial);
      setExibirFormulario(false);

      await carregarCategorias();
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.detail) {
        setErro(String(error.response.data.detail));
      } else {
        setErro("Não foi possível salvar a categoria.");
      }
    } finally {
      setSalvando(false);
    }
  }

    async function alterarStatus(categoria: Categoria) {
        const acao = categoria.ativo ? "desativar" : "ativar";

        const confirmado = window.confirm(
            `Deseja realmente ${acao} a categoria "${categoria.nome}"?`,
        );

        if (!confirmado) {
            return;
        }

        try {
            setErro("");
            setMensagem("");

            await api.patch(`/categorias/${categoria.id}`, {
            ativo: !categoria.ativo,
            });

            setMensagem(
            categoria.ativo
                ? "Categoria desativada com sucesso."
                : "Categoria ativada com sucesso.",
            );

            await carregarCategorias();
        } catch (error) {
            if (isAxiosError(error) && error.response?.data?.detail) {
            setErro(String(error.response.data.detail));
            } else {
            setErro("Não foi possível alterar o status da categoria.");
    }
  }
}

  return (
  <section className="admin-categorias">
    <header className="pagina-cabecalho admin-pagina-cabecalho">
      <div>
        <span className="pagina-eyebrow">
          Administração
        </span>

        <h1>Categorias</h1>

        <p>
          Gerencie as categorias disponíveis para classificação
          e abertura dos chamados.
        </p>
      </div>

      {!exibirFormulario && (
        <button
          type="button"
          onClick={abrirNovaCategoria}
        >
          + Nova categoria
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

    {exibirFormulario && (
      <form
        className="admin-formulario form-card"
        onSubmit={handleSubmit}
      >
        <div className="form-card-cabecalho">
          <div>
            <h2>
              {categoriaEmEdicao
                ? "Editar categoria"
                : "Nova categoria"}
            </h2>

            <p>
              {categoriaEmEdicao
                ? "Atualize as informações desta categoria."
                : "Cadastre uma nova categoria para classificação dos chamados."}
            </p>
          </div>
        </div>

        <div className="admin-categoria-form-conteudo">
          <div className="form-campo">
            <label htmlFor="nome">
              Nome
              <span aria-hidden="true">*</span>
            </label>

            <input
              id="nome"
              type="text"
              value={formulario.nome}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  nome: event.target.value,
                })
              }
              minLength={2}
              maxLength={100}
              placeholder="Ex.: Rede e Internet"
              required
            />
          </div>

          <div className="form-campo form-campo-ordem">
            <label htmlFor="ordem">
              Ordem
              <span aria-hidden="true">*</span>
            </label>

            <input
              id="ordem"
              type="number"
              min="0"
              step="1"
              value={formulario.ordem}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  ordem: event.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-campo admin-categoria-descricao">
            <label htmlFor="descricao">
              Descrição
            </label>

            <textarea
              id="descricao"
              value={formulario.descricao}
              onChange={(event) =>
                setFormulario({
                  ...formulario,
                  descricao: event.target.value,
                })
              }
              rows={4}
              placeholder="Descreva quando esta categoria deve ser utilizada."
            />
          </div>
        </div>

        <div className="form-acoes">
          <button
            type="button"
            className="btn-secundario"
            onClick={cancelarFormulario}
            disabled={salvando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : categoriaEmEdicao
                ? "Salvar alterações"
                : "Cadastrar categoria"}
          </button>
        </div>
      </form>
    )}

    {carregando ? (
      <div className="admin-estado">
        Carregando categorias...
      </div>
    ) : categorias.length === 0 ? (
      <div className="admin-vazio">
        <h3>Nenhuma categoria cadastrada</h3>

        <p>
          Cadastre uma categoria para começar a classificar
          os chamados.
        </p>

        {!exibirFormulario && (
          <button
            type="button"
            onClick={abrirNovaCategoria}
          >
            + Nova categoria
          </button>
        )}
      </div>
    ) : (
      <div className="tabela-container">
        <table className="chamados-tabela">
          <thead>
            <tr>
              <th>Ordem</th>
              <th>Categoria</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria.id}>
                <td className="categoria-ordem">
                  {categoria.ordem}
                </td>

                <td>
                  <strong>{categoria.nome}</strong>
                </td>

                <td className="categoria-descricao">
                  {categoria.descricao || "—"}
                </td>

                <td>
                  <span
                    className={
                      categoria.ativo
                        ? "status-usuario status-ativo"
                        : "status-usuario status-inativo"
                    }
                  >
                    {categoria.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>

                <td>
                  <div className="acoes-usuario">
                    <button
                      type="button"
                      onClick={() =>
                        abrirEdicao(categoria)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        alterarStatus(categoria)
                      }
                    >
                      {categoria.ativo
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

export default AdministrarCategorias;