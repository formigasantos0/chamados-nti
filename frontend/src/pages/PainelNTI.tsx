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
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroUnidade, setFiltroUnidade] = useState("");
  const [somenteSemResponsavel, setSomenteSemResponsavel] =
  useState(false);

  const [pesquisa, setPesquisa] = useState("");
  const [ordenacao, setOrdenacao] = useState("mais_recentes");

  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 5;

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
  const categorias = Array.from(
  new Map(
    chamados.map((chamado) => [
      chamado.categoria.id,
      chamado.categoria,
    ]),
  ).values(),
).sort((a, b) => a.nome.localeCompare(b.nome));

const responsaveis = Array.from(
  new Map(
    chamados
      .filter((chamado) => chamado.responsavel)
      .map((chamado) => [
        chamado.responsavel!.id,
        chamado.responsavel!,
      ]),
  ).values(),
).sort((a, b) => a.nome.localeCompare(b.nome));

const unidades = Array.from(
  new Map(
    chamados.map((chamado) => [
      chamado.unidade.id,
      chamado.unidade,
    ]),
  ).values(),
).sort((a, b) => a.nome.localeCompare(b.nome));

const chamadosFiltrados = chamados.filter((chamado) => {
  const termoPesquisa = pesquisa.trim().toLowerCase();

  if (termoPesquisa) {
    const correspondePesquisa =
      chamado.protocolo.toLowerCase().includes(termoPesquisa) ||
      chamado.titulo.toLowerCase().includes(termoPesquisa) ||
      chamado.solicitante.nome.toLowerCase().includes(termoPesquisa);

    if (!correspondePesquisa) {
      return false;
    }
  }
  if (
    filtroStatus &&
    chamado.status !== filtroStatus
  ) {
    return false;
  }

  if (
    filtroPrioridade &&
    chamado.prioridade !== filtroPrioridade
  ) {
    return false;
  }

  if (
    filtroCategoria &&
    chamado.categoria.id !== Number(filtroCategoria)
  ) {
    return false;
  }

  if (
    filtroResponsavel &&
    chamado.responsavel_id !== Number(filtroResponsavel)
  ) {
    return false;
  }

  if (
    filtroUnidade &&
    chamado.unidade.id !== Number(filtroUnidade)
  ) {
    return false;
  }

  if (
    somenteSemResponsavel &&
    chamado.responsavel_id !== null
  ) {
    return false;
  }

  return true;
});

const chamadosOrdenados = [...chamadosFiltrados].sort((a, b) => {
  switch (ordenacao) {
    case "mais_antigos":
      return (
        new Date(a.criado_em).getTime() -
        new Date(b.criado_em).getTime()
      );

    case "prioridade":
      const pesoPrioridade: Record<string, number> = {
        urgente: 4,
        alta: 3,
        normal: 2,
        baixa: 1,
      };

      return (
        (pesoPrioridade[b.prioridade] ?? 0) -
        (pesoPrioridade[a.prioridade] ?? 0)
      );

    case "mais_recentes":
    default:
      return (
        new Date(b.criado_em).getTime() -
        new Date(a.criado_em).getTime()
      );
  }
});

const totalPaginas = Math.max(
  1,
  Math.ceil(chamadosOrdenados.length / ITENS_POR_PAGINA),
);

const inicioPagina =
  (paginaAtual - 1) * ITENS_POR_PAGINA;

const chamadosPaginados = chamadosOrdenados.slice(
  inicioPagina,
  inicioPagina + ITENS_POR_PAGINA,
);

useEffect(() => {
  if (paginaAtual > totalPaginas) {
    setPaginaAtual(totalPaginas);
  }
}, [paginaAtual, totalPaginas]);

function limparFiltros() {
  setFiltroStatus("");
  setFiltroPrioridade("");
  setFiltroCategoria("");
  setFiltroResponsavel("");
  setFiltroUnidade("");
  setSomenteSemResponsavel(false);
  setPesquisa("");
}


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

    <section className="painel-secao painel-chamados">
      <div className="secao-titulo">
        <div>
          <h2>Chamados</h2>
          <p>Lista completa dos chamados registrados.</p>
        </div>
        <span className="total-chamados">
          {chamadosFiltrados.length} de {chamados.length}
        </span>
      </div>

      <div className="painel-filtros">
            <input
              type="search"
              value={pesquisa}
              placeholder="Buscar protocolo, assunto ou solicitante..."
              aria-label="Pesquisar chamados"
              onChange={(event) =>
                setPesquisa(event.target.value)
              }
            />
            <select
              value={filtroStatus}
              onChange={(event) =>
                setFiltroStatus(event.target.value)
              }
            >
              <option value="">Todos os status</option>
              <option value="aberto">Aberto</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="aguardando_usuario">
                Aguardando usuário
              </option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>

            <select
              value={filtroPrioridade}
              onChange={(event) =>
                setFiltroPrioridade(event.target.value)
              }
            >
              <option value="">Todas as prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>

            <select
              value={filtroCategoria}
              onChange={(event) =>
                setFiltroCategoria(event.target.value)
              }
            >
              <option value="">Todas as categorias</option>

              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>

            <select
              value={filtroResponsavel}
              onChange={(event) => {
                setFiltroResponsavel(event.target.value);

                if (event.target.value) {
                  setSomenteSemResponsavel(false);
                }
              }}
            >
              <option value="">Todos os responsáveis</option>

              {responsaveis.map((responsavel) => (
                <option
                  key={responsavel.id}
                  value={responsavel.id}
                >
                  {responsavel.nome}
                </option>
              ))}
            </select>

            <select
              value={filtroUnidade}
              onChange={(event) =>
                setFiltroUnidade(event.target.value)
              }
            >
              <option value="">Todas as unidades</option>

              {unidades.map((unidade) => (
                <option
                  key={unidade.id}
                  value={unidade.id}
                >
                  {unidade.sigla} — {unidade.nome}
                </option>
              ))}
            </select>

            <label>
              <input
                type="checkbox"
                checked={somenteSemResponsavel}
                onChange={(event) => {
                  setSomenteSemResponsavel(
                    event.target.checked,
                  );

                  if (event.target.checked) {
                    setFiltroResponsavel("");
                  }
                }}
              />

              Sem responsável
            </label>
            <select
              value={ordenacao}
              onChange={(event) =>
                setOrdenacao(event.target.value)
              }
            >
              <option value="mais_recentes">
                Mais recentes primeiro
              </option>

              <option value="mais_antigos">
                Mais antigos primeiro
              </option>

              <option value="prioridade">
                Maior prioridade primeiro
              </option>
            </select>
            <button
              type="button"
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          </div>

      {chamadosFiltrados.length === 0 ? (
  <div className="painel-card">
    <p>Nenhum chamado encontrado.</p>
  </div>
) : (
  <>
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
            <th>Responsável</th>
            <th>SLA</th>
            <th>Aberto em</th>
          </tr>
        </thead>

        <tbody>
          {chamadosPaginados.map((chamado) => (
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

              <td>
                {chamado.responsavel?.nome ?? "Não atribuído"}
              </td>
              <td>
                {chamado.sla ? (
                  <span
                    className={`badge badge-sla-${chamado.sla.resolucao.situacao}`}
                    title={`SLA consumido: ${chamado.sla.resolucao.percentual_consumido}%`}
                  >
                    {formatarTexto(
                      chamado.sla.resolucao.situacao,
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {formatarData(chamado.criado_em)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div className="paginacao">
      <button
        type="button"
        disabled={paginaAtual === 1}
        onClick={() =>
          setPaginaAtual((pagina) => pagina - 1)
        }
      >
        Anterior
      </button>

      <span>
        Página {paginaAtual} de {totalPaginas}
      </span>

      <button
        type="button"
        disabled={paginaAtual === totalPaginas}
        onClick={() =>
          setPaginaAtual((pagina) => pagina + 1)
        }
      >
        Próxima
      </button>
    </div>
  </>
)}
  </section>
  </main>
);
}

export default PainelNTI;