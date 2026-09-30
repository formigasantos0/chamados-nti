import { useEffect, useState } from "react";
import { AxiosError } from "axios";

import api from "../services/api";

type PoliticaSLA = {
  id: number;
  prioridade: string;
  primeiro_atendimento_minutos: number;
  resolucao_minutos: number;
  ativo: boolean;
};

type ConfiguracaoSLA = {
  id: number;
  timezone: string;
  hora_inicio: string;
  hora_fim: string;
  segunda: boolean;
  terca: boolean;
  quarta: boolean;
  quinta: boolean;
  sexta: boolean;
  sabado: boolean;
  domingo: boolean;
};

type Feriado = {
  id: number;
  data: string;
  nome: string;
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

  return (
    axiosError.response?.data?.detail ??
    mensagemPadrao
  );
}

const nomesPrioridades: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

const diasSemana = [
  ["segunda", "Segunda"],
  ["terca", "Terça"],
  ["quarta", "Quarta"],
  ["quinta", "Quinta"],
  ["sexta", "Sexta"],
  ["sabado", "Sábado"],
  ["domingo", "Domingo"],
] as const;

function AdministrarSLA() {
  const [politicas, setPoliticas] = useState<PoliticaSLA[]>([]);
  const [configuracao, setConfiguracao] =
    useState<ConfiguracaoSLA | null>(null);
  const [feriados, setFeriados] = useState<Feriado[]>([]);

  const [novaData, setNovaData] = useState("");
  const [novoNome, setNovoNome] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      const [
        respostaPoliticas,
        respostaConfiguracao,
        respostaFeriados,
      ] = await Promise.all([
        api.get<PoliticaSLA[]>("/sla/politicas"),
        api.get<ConfiguracaoSLA>("/sla/configuracao"),
        api.get<Feriado[]>("/sla/feriados"),
      ]);

      setPoliticas(respostaPoliticas.data);
      setConfiguracao(respostaConfiguracao.data);
      setFeriados(respostaFeriados.data);
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          "Não foi possível carregar as configurações de SLA.",
        ),
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function alterarPolitica(
    politicaId: number,
    campo:
      | "primeiro_atendimento_minutos"
      | "resolucao_minutos",
    valor: number,
  ) {
    setPoliticas((estadoAtual) =>
      estadoAtual.map((politica) =>
        politica.id === politicaId
          ? {
              ...politica,
              [campo]: valor,
            }
          : politica,
      ),
    );
  }

  async function salvarPolitica(
    politica: PoliticaSLA,
  ) {
    setMensagem("");
    setErro("");

    try {
      const resposta = await api.patch<PoliticaSLA>(
        `/sla/politicas/${politica.id}`,
        {
          primeiro_atendimento_minutos:
            politica.primeiro_atendimento_minutos,
          resolucao_minutos:
            politica.resolucao_minutos,
          ativo: politica.ativo,
        },
      );

      setPoliticas((estadoAtual) =>
        estadoAtual.map((item) =>
          item.id === politica.id
            ? resposta.data
            : item,
        ),
      );

      setMensagem(
        `SLA da prioridade ${
          nomesPrioridades[politica.prioridade] ??
          politica.prioridade
        } atualizado.`,
      );
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          "Não foi possível atualizar a política de SLA.",
        ),
      );
    }
  }

  function alterarConfiguracao<
    K extends keyof ConfiguracaoSLA,
  >(
    campo: K,
    valor: ConfiguracaoSLA[K],
  ) {
    setConfiguracao((estadoAtual) => {
      if (!estadoAtual) {
        return estadoAtual;
      }

      return {
        ...estadoAtual,
        [campo]: valor,
      };
    });
  }

  async function salvarConfiguracao() {
    if (!configuracao) {
      return;
    }

    setMensagem("");
    setErro("");

    try {
      const resposta =
        await api.patch<ConfiguracaoSLA>(
          "/sla/configuracao",
          {
            timezone: configuracao.timezone,
            hora_inicio: configuracao.hora_inicio,
            hora_fim: configuracao.hora_fim,
            segunda: configuracao.segunda,
            terca: configuracao.terca,
            quarta: configuracao.quarta,
            quinta: configuracao.quinta,
            sexta: configuracao.sexta,
            sabado: configuracao.sabado,
            domingo: configuracao.domingo,
          },
        );

      setConfiguracao(resposta.data);
      setMensagem(
        "Calendário de SLA atualizado com sucesso.",
      );
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          "Não foi possível atualizar o calendário de SLA.",
        ),
      );
    }
  }

  async function criarFeriado(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMensagem("");
    setErro("");

    if (!novaData || !novoNome.trim()) {
      setErro("Informe a data e o nome do feriado.");
      return;
    }

    try {
      const resposta = await api.post<Feriado>(
        "/sla/feriados",
        {
          data: novaData,
          nome: novoNome.trim(),
        },
      );

      setFeriados((estadoAtual) =>
        [...estadoAtual, resposta.data].sort(
          (a, b) =>
            a.data.localeCompare(b.data),
        ),
      );

      setNovaData("");
      setNovoNome("");
      setMensagem("Feriado cadastrado com sucesso.");
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          "Não foi possível cadastrar o feriado.",
        ),
      );
    }
  }

  async function alterarStatusFeriado(
    feriado: Feriado,
  ) {
    setMensagem("");
    setErro("");

    try {
      const resposta = await api.patch<Feriado>(
        `/sla/feriados/${feriado.id}`,
        {
          ativo: !feriado.ativo,
        },
      );

      setFeriados((estadoAtual) =>
        estadoAtual.map((item) =>
          item.id === feriado.id
            ? resposta.data
            : item,
        ),
      );

      setMensagem(
        resposta.data.ativo
          ? "Feriado ativado."
          : "Feriado desativado.",
      );
    } catch (erro) {
      setErro(
        obterMensagemErro(
          erro,
          "Não foi possível alterar o feriado.",
        ),
      );
    }
  }

  if (carregando) {
    return <p>Carregando configurações de SLA...</p>;
  }

  return (
  <section className="admin-sla">
    <header className="pagina-cabecalho">
      <div>
        <span className="pagina-eyebrow">
          Administração
        </span>

        <h1>SLA</h1>

        <p>
          Configure os prazos, o calendário operacional e os
          feriados utilizados no cálculo do nível de serviço.
        </p>
      </div>
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

    {/* POLÍTICAS DE SLA */}
    <section className="sla-card">
      <div className="sla-card-cabecalho">
        <div>
          <h2>Políticas de SLA</h2>

          <p>
            Defina os prazos de primeiro atendimento e resolução
            para cada nível de prioridade.
          </p>
        </div>
      </div>

      <div className="tabela-container sla-tabela-container">
        <table className="chamados-tabela sla-tabela">
          <thead>
            <tr>
              <th>Prioridade</th>
              <th>Primeiro atendimento</th>
              <th>Resolução</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {politicas.map((politica) => (
              <tr key={politica.id}>
                <td>
                  <span
                    className={`badge badge-prioridade-${politica.prioridade}`}
                  >
                    {nomesPrioridades[politica.prioridade] ??
                      politica.prioridade}
                  </span>
                </td>

                <td>
                  <div className="sla-campo-minutos">
                    <input
                      type="number"
                      min="1"
                      value={
                        politica.primeiro_atendimento_minutos
                      }
                      onChange={(event) =>
                        alterarPolitica(
                          politica.id,
                          "primeiro_atendimento_minutos",
                          Number(event.target.value),
                        )
                      }
                    />

                    <span>min</span>
                  </div>
                </td>

                <td>
                  <div className="sla-campo-minutos">
                    <input
                      type="number"
                      min="1"
                      value={politica.resolucao_minutos}
                      onChange={(event) =>
                        alterarPolitica(
                          politica.id,
                          "resolucao_minutos",
                          Number(event.target.value),
                        )
                      }
                    />

                    <span>min</span>
                  </div>
                </td>

                <td>
                  <label className="sla-checkbox-status">
                    <input
                      type="checkbox"
                      checked={politica.ativo}
                      onChange={(event) =>
                        setPoliticas((estadoAtual) =>
                          estadoAtual.map((item) =>
                            item.id === politica.id
                              ? {
                                  ...item,
                                  ativo:
                                    event.target.checked,
                                }
                              : item,
                          ),
                        )
                      }
                    />

                    <span>
                      {politica.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </label>
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() =>
                      salvarPolitica(politica)
                    }
                  >
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sla-legenda">
        Os prazos são contabilizados em minutos úteis conforme
        o calendário configurado abaixo.
      </div>
    </section>

    {/* CALENDÁRIO */}
    {configuracao && (
      <section className="sla-card">
        <div className="sla-card-cabecalho">
          <div>
            <h2>Calendário de atendimento</h2>

            <p>
              Configure os dias e horários considerados úteis
              para o cálculo dos SLAs.
            </p>
          </div>
        </div>

        <div className="sla-calendario-conteudo">
          <div className="sla-calendario-grid">
            <div className="form-campo">
              <label htmlFor="sla-timezone">
                Fuso horário
              </label>

              <input
                id="sla-timezone"
                type="text"
                value={configuracao.timezone}
                onChange={(event) =>
                  alterarConfiguracao(
                    "timezone",
                    event.target.value,
                  )
                }
              />

              <small>
                Ex.: America/Sao_Paulo
              </small>
            </div>

            <div className="form-campo">
              <label htmlFor="sla-inicio">
                Início do expediente
              </label>

              <input
                id="sla-inicio"
                type="time"
                value={configuracao.hora_inicio.slice(0, 5)}
                onChange={(event) =>
                  alterarConfiguracao(
                    "hora_inicio",
                    event.target.value,
                  )
                }
              />
            </div>

            <div className="form-campo">
              <label htmlFor="sla-fim">
                Fim do expediente
              </label>

              <input
                id="sla-fim"
                type="time"
                value={configuracao.hora_fim.slice(0, 5)}
                onChange={(event) =>
                  alterarConfiguracao(
                    "hora_fim",
                    event.target.value,
                  )
                }
              />
            </div>
          </div>

          <div className="sla-dias">
            <span className="sla-subtitulo">
              Dias úteis
            </span>

            <div className="sla-dias-grid">
              {diasSemana.map(([campo, nome]) => (
                <label
                  className="sla-dia"
                  key={campo}
                >
                  <input
                    type="checkbox"
                    checked={configuracao[campo]}
                    onChange={(event) =>
                      alterarConfiguracao(
                        campo,
                        event.target.checked,
                      )
                    }
                  />

                  <span>{nome}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="form-acoes">
          <button
            type="button"
            onClick={salvarConfiguracao}
          >
            Salvar calendário
          </button>
        </div>
      </section>
    )}

    {/* FERIADOS */}
    <section className="sla-card">
      <div className="sla-card-cabecalho">
        <div>
          <h2>Feriados</h2>

          <p>
            Cadastre datas que não devem ser contabilizadas
            como período útil no cálculo dos SLAs.
          </p>
        </div>
      </div>

      <form
        className="sla-feriado-form"
        onSubmit={criarFeriado}
      >
        <div className="form-campo">
          <label htmlFor="feriado-data">
            Data
          </label>

          <input
            id="feriado-data"
            type="date"
            value={novaData}
            onChange={(event) =>
              setNovaData(event.target.value)
            }
            required
          />
        </div>

        <div className="form-campo sla-feriado-nome">
          <label htmlFor="feriado-nome">
            Nome do feriado
          </label>

          <input
            id="feriado-nome"
            type="text"
            value={novoNome}
            onChange={(event) =>
              setNovoNome(event.target.value)
            }
            placeholder="Ex.: Natal"
            required
          />
        </div>

        <button type="submit">
          + Cadastrar feriado
        </button>
      </form>

      <div className="tabela-container sla-tabela-container">
        <table className="chamados-tabela">
          <thead>
            <tr>
              <th>Data</th>
              <th>Feriado</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {feriados.length === 0 ? (
              <tr>
                <td
                  className="sla-tabela-vazia"
                  colSpan={4}
                >
                  Nenhum feriado cadastrado.
                </td>
              </tr>
            ) : (
              feriados.map((feriado) => (
                <tr key={feriado.id}>
                  <td className="coluna-data">
                    {new Date(
                      `${feriado.data}T00:00:00`,
                    ).toLocaleDateString("pt-BR")}
                  </td>

                  <td>
                    <strong>{feriado.nome}</strong>
                  </td>

                  <td>
                    <span
                      className={
                        feriado.ativo
                          ? "status-usuario status-ativo"
                          : "status-usuario status-inativo"
                      }
                    >
                      {feriado.ativo
                        ? "Ativo"
                        : "Inativo"}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        alterarStatusFeriado(feriado)
                      }
                    >
                      {feriado.ativo
                        ? "Desativar"
                        : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  </section>
);
}

export default AdministrarSLA;