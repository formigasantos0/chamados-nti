import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import type { Chamado, ChamadoCriar } from "../types/chamado";

function NovoChamado() {
  const navigate = useNavigate();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] =
    useState<ChamadoCriar["prioridade"]>("normal");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setEnviando(true);

    const dados: ChamadoCriar = {
      titulo,
      descricao,
      categoria,
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
          <input
            id="categoria"
            type="text"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
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

        <button type="submit" disabled={enviando}>
          {enviando ? "Abrindo chamado..." : "Abrir chamado"}
        </button>
      </form>
    </section>
  );
}

export default NovoChamado;