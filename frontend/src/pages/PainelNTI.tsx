import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";
import type { Chamado } from "../types/chamado";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardResumo = {
  total: number;
  abertos: number;
  em_atendimento: number;
  aguardando_usuario: number;
  resolvidos: number;
  fechados: number;
  urgentes: number;
  sem_responsavel: number;
};

type MetricaItem = {
  nome: string;
  quantidade: number;
};

type DashboardMetricas = {
  por_status: MetricaItem[];
  por_prioridade: MetricaItem[];
  por_categoria: MetricaItem[];
  por_responsavel: MetricaItem[];
};

type SLAIndicador = {
  dentro_do_prazo: number;
  proximo_do_vencimento: number;
  cumprido: number;
  violado: number;
};

type DashboardSLA = {
  primeiro_atendimento: SLAIndicador;
  resolucao: SLAIndicador;
};

const CORES_STATUS: Record<string, string> = {
  aberto: "#3b82f6",
  em_atendimento: "#8b5cf6",
  aguardando_usuario: "#f59e0b",
  resolvido: "#22c55e",
  fechado: "#64748b",
};

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
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [metricas, setMetricas] =
    useState<DashboardMetricas | null>(null);
  const [sla, setSla] = useState<DashboardSLA | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarPainel() {
      try {
        const [
          chamadosResponse,
          resumoResponse,
          metricasResponse,
          slaResponse,
        ] = await Promise.all([
          api.get<Chamado[]>("/chamados/"),
          api.get<DashboardResumo>("/dashboard/resumo"),
          api.get<DashboardMetricas>("/dashboard/metricas"),
          api.get<DashboardSLA>("/dashboard/sla"),
        ]);

        setChamados(chamadosResponse.data);
        setResumo(resumoResponse.data);
        setMetricas(metricasResponse.data);
        setSla(slaResponse.data);
      } catch {
        setErro("Não foi possível carregar o painel NTI.");
      } finally {
        setCarregando(false);
      }
    }

    carregarPainel();
  }, []);

  if (carregando) {
    return <p>Carregando painel NTI...</p>;
  }

  if (erro) {
    return <p role="alert">{erro}</p>;
  }

  return (
  <main className="painel-nti">
    <header className="painel-cabecalho">
      <div>
        <h1>Painel NTI</h1>
        <p>Visão geral da operação de suporte.</p>
      </div>
    </header>

    {resumo && (
      <section className="painel-secao">
        <div className="secao-titulo">
          <div>
            <h2>Visão geral</h2>
            <p>Acompanhamento atual dos chamados.</p>
          </div>

          <span className="total-chamados">
            {resumo.total} chamados
          </span>
        </div>

        <div className="resumo-grid">
          <article className="resumo-card">
            <span>Abertos</span>
            <strong>{resumo.abertos}</strong>
          </article>

          <article className="resumo-card">
            <span>Em atendimento</span>
            <strong>{resumo.em_atendimento}</strong>
          </article>

          <article className="resumo-card">
            <span>Aguardando usuário</span>
            <strong>{resumo.aguardando_usuario}</strong>
          </article>

          <article className="resumo-card">
            <span>Urgentes</span>
            <strong>{resumo.urgentes}</strong>
          </article>

          <article className="resumo-card">
            <span>Sem responsável</span>
            <strong>{resumo.sem_responsavel}</strong>
          </article>
        </div>
      </section>
    )}

    {sla && (
      <section className="painel-secao">
        <div className="secao-titulo">
          <div>
            <h2>SLA</h2>
            <p>Acompanhamento dos prazos de atendimento.</p>
          </div>
        </div>

        <div className="sla-grid">
          <article className="painel-card">
            <div className="card-cabecalho">
              <div>
                <span className="card-label">SLA</span>
                <h3>Primeiro atendimento</h3>
              </div>
            </div>

            <div className="sla-lista">
              <div className="sla-item">
                <span className="sla-status sla-ok" />
                <span>Dentro do prazo</span>
                <strong>
                  {sla.primeiro_atendimento.dentro_do_prazo}
                </strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-alerta" />
                <span>Próximo do vencimento</span>
                <strong>
                  {sla.primeiro_atendimento.proximo_do_vencimento}
                </strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-cumprido" />
                <span>Cumpridos</span>
                <strong>
                  {sla.primeiro_atendimento.cumprido}
                </strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-violado" />
                <span>Violados</span>
                <strong>
                  {sla.primeiro_atendimento.violado}
                </strong>
              </div>
            </div>
          </article>

          <article className="painel-card">
            <div className="card-cabecalho">
              <div>
                <span className="card-label">SLA</span>
                <h3>Resolução</h3>
              </div>
            </div>

            <div className="sla-lista">
              <div className="sla-item">
                <span className="sla-status sla-ok" />
                <span>Dentro do prazo</span>
                <strong>{sla.resolucao.dentro_do_prazo}</strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-alerta" />
                <span>Próximo do vencimento</span>
                <strong>
                  {sla.resolucao.proximo_do_vencimento}
                </strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-cumprido" />
                <span>Cumpridos</span>
                <strong>{sla.resolucao.cumprido}</strong>
              </div>

              <div className="sla-item">
                <span className="sla-status sla-violado" />
                <span>Violados</span>
                <strong>{sla.resolucao.violado}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>
    )}

    {metricas && (
      <section className="painel-secao">
        <div className="secao-titulo">
          <div>
            <h2>Indicadores</h2>
            <p>Distribuição dos chamados registrados.</p>
          </div>
        </div>

        <div className="indicadores-grid">
          <article className="painel-card">
            <h3>Por prioridade</h3>

            <div className="metrica-lista">
              {metricas.por_prioridade.map((item) => (
                <div className="metrica-item" key={item.nome}>
                  <span>{formatarTexto(item.nome)}</span>
                  <strong>{item.quantidade}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="painel-card">
            <h3>Por categoria</h3>

            <div className="metrica-lista">
              {metricas.por_categoria.map((item) => (
                <div className="metrica-item" key={item.nome}>
                  <span>{item.nome}</span>
                  <strong>{item.quantidade}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="painel-card">
            <h3>Por responsável</h3>

            <div className="metrica-lista">
              {metricas.por_responsavel.map((item) => (
                <div className="metrica-item" key={item.nome}>
                  <span>{item.nome}</span>
                  <strong>{item.quantidade}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="painel-card">
            <h3>Por status</h3>

            <div className="metrica-lista">
              {metricas.por_status.map((item) => (
                <div className="metrica-item" key={item.nome}>
                  <span>{formatarTexto(item.nome)}</span>
                  <strong>{item.quantidade}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="graficos-grid">
  <article className="painel-card grafico-card">
    <h3>Chamados por categoria</h3>

    <div className="grafico-container">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={metricas.por_categoria}
          layout="vertical"
          margin={{
            top: 10,
            right: 20,
            bottom: 10,
            left: 20,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
          />

          <XAxis
            type="number"
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="nome"
            width={120}
          />

          <Tooltip />

          <Bar
            dataKey="quantidade"
            name="Chamados"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </article>

  <article className="painel-card grafico-card">
    <h3>Chamados por status</h3>

    <div className="grafico-container">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={metricas.por_status}
            dataKey="quantidade"
            nameKey="nome"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={2}
          >
            {metricas.por_status.map((item) => (
              <Cell
                key={item.nome}
                fill={
                  CORES_STATUS[item.nome] ??
                  "#94a3b8"
                }
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(valor) => [
              valor,
              "Chamados",
            ]}
            labelFormatter={(label) =>
              formatarTexto(String(label))
            }
          />

          <Legend
            formatter={(valor) =>
              formatarTexto(String(valor))
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </article>
</div>
      </section>
    )}

    <section className="painel-secao">
      <div className="secao-titulo">
        <div>
          <h2>Chamados</h2>
          <p>Lista completa dos chamados registrados.</p>
        </div>
      </div>

      {chamados.length === 0 ? (
        <div className="painel-card">
          <p>Nenhum chamado encontrado.</p>
        </div>
      ) : (
        <div className="tabela-container">
          <table className="chamados-tabela">
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

                  <td>
                    {formatarTexto(chamado.status)}
                  </td>

                  <td>{formatarData(chamado.criado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </main>
);
}

export default PainelNTI;