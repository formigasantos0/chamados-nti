import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import type { Chamado } from "../types/chamado";

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function MeusChamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarChamados() {
      try {
        const response = await api.get<Chamado[]>("/chamados/");
        setChamados(response.data);
      } catch {
        setErro("Não foi possível carregar os chamados.");
      } finally {
        setCarregando(false);
      }
    }

    carregarChamados();
  }, []);

  if (carregando) {
    return <p>Carregando chamados...</p>;
  }

  if (erro) {
    return <p role="alert">{erro}</p>;
  }

  const totalChamados = chamados.length;

  const chamadosEmAndamento = chamados.filter(
    (chamado) =>
      chamado.status !== "resolvido" &&
      chamado.status !== "fechado",
  ).length;

  const chamadosConcluidos = chamados.filter(
    (chamado) =>
      chamado.status === "resolvido" ||
      chamado.status === "fechado",
  ).length;

  return (
  <section className="meus-chamados">
    <header className="pagina-cabecalho meus-chamados-cabecalho">
      <div>
        <span className="pagina-eyebrow">
          Atendimento
        </span>

        <h1>Meus chamados</h1>

        <p>
          Acompanhe suas solicitações de suporte e consulte
          o andamento dos atendimentos.
        </p>
      </div>

      <Link
        to="/chamados/novo"
        className="botao-link-primario"
      >
        + Novo chamado
      </Link>
    </header>

    <div className="meus-chamados-resumo">
      <article className="resumo-card">
        <span>Total</span>
        <strong>{totalChamados}</strong>
        <small>Chamados registrados</small>
      </article>

      <article className="resumo-card">
        <span>Em andamento</span>
        <strong>{chamadosEmAndamento}</strong>
        <small>Aguardando conclusão</small>
      </article>

      <article className="resumo-card">
        <span>Concluídos</span>
        <strong>{chamadosConcluidos}</strong>
        <small>Resolvidos ou fechados</small>
      </article>
    </div>

    <section className="meus-chamados-card">
      <div className="meus-chamados-card-cabecalho">
        <div>
          <h2>Solicitações</h2>

          <p>
            Histórico das suas solicitações de suporte.
          </p>
        </div>

        <span>
          {totalChamados}{" "}
          {totalChamados === 1 ? "chamado" : "chamados"}
        </span>
      </div>

      {chamados.length === 0 ? (
        <div className="meus-chamados-vazio">
          <h3>Nenhum chamado encontrado</h3>

          <p>
            Você ainda não possui solicitações registradas.
          </p>

          <Link
            to="/chamados/novo"
            className="botao-link-primario"
          >
            Abrir primeiro chamado
          </Link>
        </div>
      ) : (
        <div className="tabela-container meus-chamados-tabela-container">
          <table className="chamados-tabela">
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Assunto</th>
                <th>Categoria</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th>Aberto em</th>
              </tr>
            </thead>

            <tbody>
              {chamados.map((chamado) => (
                <tr key={chamado.id}>
                  <td>
                    <Link
                      className="protocolo-link"
                      to={`/chamados/${chamado.id}`}
                    >
                      {chamado.protocolo}
                    </Link>
                  </td>

                  <td className="coluna-assunto">
                    {chamado.titulo}
                  </td>

                  <td>{chamado.categoria.nome}</td>

                  <td>
                    <span
                      className={`badge badge-prioridade-${chamado.prioridade}`}
                    >
                      {formatarTexto(chamado.prioridade)}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge badge-status-${chamado.status}`}
                    >
                      {formatarTexto(chamado.status)}
                    </span>
                  </td>

                  <td className="coluna-data">
                    {formatarData(chamado.criado_em)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </section>
);
}

export default MeusChamados;