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

function PainelNTI() {
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

  const abertos = chamados.filter(
    (chamado) => chamado.status === "aberto",
  ).length;

  const emAtendimento = chamados.filter(
    (chamado) => chamado.status === "em_atendimento",
  ).length;

  const aguardandoUsuario = chamados.filter(
    (chamado) => chamado.status === "aguardando_usuario",
  ).length;

  const resolvidos = chamados.filter(
    (chamado) => chamado.status === "resolvido",
  ).length;

  return (
    <section>
      <header>
        <h1>Painel NTI</h1>
        <p>Gerenciamento dos chamados de suporte.</p>
      </header>

      <section>
        <h2>Resumo</h2>

        <div>
          <p>
            <strong>Total:</strong> {chamados.length}
          </p>

          <p>
            <strong>Abertos:</strong> {abertos}
          </p>

          <p>
            <strong>Em atendimento:</strong> {emAtendimento}
          </p>

          <p>
            <strong>Aguardando usuário:</strong>{" "}
            {aguardandoUsuario}
          </p>

          <p>
            <strong>Resolvidos:</strong> {resolvidos}
          </p>
        </div>
      </section>

      <section>
        <h2>Chamados</h2>

        {chamados.length === 0 ? (
          <p>Nenhum chamado encontrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Protocolo</th>
                <th>Assunto</th>
                <th>Solicitante</th>
                <th>Unidade</th>
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
                  <td>{chamado.solicitante.nome}</td>
                  <td>{chamado.unidade.sigla}</td>

                  <td>
                    {formatarTexto(chamado.prioridade)}
                  </td>

                  <td>{formatarTexto(chamado.status)}</td>

                  <td>
                    {formatarData(chamado.criado_em)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </section>
  );
}

export default PainelNTI;