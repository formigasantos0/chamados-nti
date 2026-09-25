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
    <section>
      <header>
        <h1>Administração de Categorias</h1>

        <p>
          Gerencie as categorias disponíveis para abertura de chamados.
        </p>
      </header>

      {!exibirFormulario && (
        <button type="button" onClick={abrirNovaCategoria}>
          Nova categoria
        </button>
      )}

      {exibirFormulario && (
        <form onSubmit={handleSubmit}>
          <h2>
            {categoriaEmEdicao
              ? "Editar categoria"
              : "Nova categoria"}
          </h2>

          <div>
            <label htmlFor="nome">Nome</label>

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
              required
            />
          </div>

          <div>
            <label htmlFor="descricao">Descrição</label>

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
            />
          </div>

          <div>
            <label htmlFor="ordem">Ordem</label>

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

          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={cancelarFormulario}
            disabled={salvando}
          >
            Cancelar
          </button>
        </form>
      )}

      {erro && <p role="alert">{erro}</p>}
      {mensagem && <p>{mensagem}</p>}

      {carregando && <p>Carregando categorias...</p>}

      {!carregando && !erro && (
        <>
          <table>
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
                  <td>{categoria.ordem}</td>
                  <td>{categoria.nome}</td>
                  <td>{categoria.descricao || "—"}</td>
                  <td>
                    {categoria.ativo ? "Ativa" : "Inativa"}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => abrirEdicao(categoria)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => alterarStatus(categoria)}
                    >
                      {categoria.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categorias.length === 0 && (
            <p>Nenhuma categoria cadastrada.</p>
          )}
        </>
      )}
    </section>
  );
}

export default AdministrarCategorias;