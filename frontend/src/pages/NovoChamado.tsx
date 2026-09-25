import { useEffect, useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import type { Chamado, ChamadoCriar } from "../types/chamado";

interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
}

function NovoChamado() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);

  const [prioridade, setPrioridade] =
    useState<ChamadoCriar["prioridade"]>("normal");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarCategorias() {
      try {
        const response = await api.get<Categoria[]>("/categorias/");
        setCategorias(response.data);
      } catch {
        setErro("Não foi possível carregar as categorias.");
      } finally {
        setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    const categoriaIdNumerico = Number(categoriaId);

    if (!categoriaIdNumerico) {
      setErro("Selecione uma categoria.");
      return;
    }

    setEnviando(true);

    const dados: ChamadoCriar = {
      titulo,
      descricao,
      categoria_id: categoriaIdNumerico,
      prioridade,
    };

    try {
      await api.post<Chamado>("/chamados/", dados);

      navigate("/chamados");
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.detail) {
        setErro(String(error.response.data.detail));
      } else {
        setErro("Não foi possível abrir o chamado.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <header>
        <h1>Novo Chamado</h1>
        <p>Descreva sua solicitação para a equipe de NTI.</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="titulo">Assunto</label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            minLength={3}
            maxLength={200}
            required
          />
        </div>

        <div>
          <label htmlFor="categoria">Categoria</label>

          <select
            id="categoria"
            value={categoriaId}
            onChange={(event) => setCategoriaId(event.target.value)}
            disabled={carregandoCategorias}
            required
          >
            <option value="">
              {carregandoCategorias
                ? "Carregando categorias..."
                : "Selecione uma categoria"}
            </option>

            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="prioridade">Prioridade</label>

          <select
            id="prioridade"
            value={prioridade}
            onChange={(event) =>
              setPrioridade(
                event.target.value as ChamadoCriar["prioridade"],
              )
            }
          >
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div>
          <label htmlFor="descricao">Descrição</label>

          <textarea
            id="descricao"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            minLength={5}
            rows={8}
            required
          />
        </div>

        {erro && <p role="alert">{erro}</p>}

        <button
          type="submit"
          disabled={enviando || carregandoCategorias}
        >
          {enviando ? "Abrindo chamado..." : "Abrir chamado"}
        </button>
      </form>
    </section>
  );
}

export default NovoChamado;