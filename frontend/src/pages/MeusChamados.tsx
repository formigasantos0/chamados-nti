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

  return (
    <section>
      <header>
        <div>
          <h1>Meus Chamados</h1>
          <p>Acompanhe suas solicitações de suporte.</p>
        </div>

        <Link to="/chamados/novo">Abrir chamado</Link>
      </header>

      {chamados.length === 0 ? (
        <div>
          <p>Você ainda não possui chamados.</p>
          <Link to="/chamados/novo">Abrir primeiro chamado</Link>
        </div>
      ) : (
        <table>
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
                  <Link to={`/chamados/${chamado.id}`}>
                    {chamado.protocolo}
                  </Link>
                </td>
                <td>{chamado.titulo}</td>
                <td>{chamado.categoria}</td>
                <td>{formatarTexto(chamado.prioridade)}</td>
                <td>{formatarTexto(chamado.status)}</td>
                <td>{formatarData(chamado.criado_em)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default MeusChamados;