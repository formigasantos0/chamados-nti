import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import type { Usuario } from "../types/auth";
import type { Anexo, AnexoDownload } from "../types/anexo";
import api from "../services/api";
import type {
  Chamado,
  HistoricoChamado,
} from "../types/chamado";

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

const transicoesStatus: Record<string, string[]> = {
  aberto: [
    "em_atendimento",
  ],
  em_atendimento: [
    "aguardando_usuario",
    "resolvido",
  ],
  aguardando_usuario: [
    "em_atendimento",
    "resolvido",
  ],
  resolvido: [
    "em_atendimento",
    "fechado",
  ],
  fechado: [],
};

const nomesStatus: Record<string, string> = {
  aberto: "Aberto",
  em_atendimento: "Em atendimento",
  aguardando_usuario: "Aguardando usuário",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

function formatarTamanho(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DetalheChamado() {
  const { chamadoId } = useParams();

  const { usuario } = useAuth();

  const equipeNTI =
    usuario?.perfil === "tecnico" ||
    usuario?.perfil === "administrador";

  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [historico, setHistorico] = useState<HistoricoChamado[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [equipe, setEquipe] = useState<Usuario[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [erroAnexo, setErroAnexo] = useState("");

  const [erro, setErro] = useState("");
  const [erroMensagem, setErroMensagem] = useState("");

  const [atualizando, setAtualizando] = useState(false);
  const [erroAtualizacao, setErroAtualizacao] = useState("");

  const carregarDados = useCallback(async () => {
    if (!chamadoId) {
      setErro("Chamado inválido.");
      setCarregando(false);
      return;
    }

    try {
     const requisicoes = [
  api.get<Chamado>(`/chamados/${chamadoId}`),
  api.get<HistoricoChamado[]>(
    `/chamados/${chamadoId}/historico`,
  ),
  api.get<Anexo[]>(
    `/chamados/${chamadoId}/anexos`,
  ),
] as const;

const [
  responseChamado,
  responseHistorico,
  responseAnexos,
] = await Promise.all(requisicoes);

setChamado(responseChamado.data);
setHistorico(responseHistorico.data);
setAnexos(responseAnexos.data);

if (equipeNTI) {
  const responseEquipe = await api.get<Usuario[]>(
    "/usuarios/equipe-nti",
  );

  setEquipe(responseEquipe.data);
}
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setErro("Chamado não encontrado.");
      } else if (
        isAxiosError(error) &&
        error.response?.status === 403
      ) {
        setErro(
          "Você não possui permissão para acessar este chamado.",
        );
      } else {
        setErro("Não foi possível carregar o chamado.");
      }
    } finally {
      setCarregando(false);
    }
  }, [chamadoId, equipeNTI]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function handleMensagem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!chamadoId || !mensagem.trim()) {
      return;
    }

    setErroMensagem("");
    setEnviandoMensagem(true);

    try {
      await api.post(`/chamados/${chamadoId}/mensagens`, {
        mensagem: mensagem.trim(),
      });

      setMensagem("");

      const response = await api.get<HistoricoChamado[]>(
        `/chamados/${chamadoId}/historico`,
      );

      setHistorico(response.data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.data?.detail) {
        setErroMensagem(String(error.response.data.detail));
      } else {
        setErroMensagem("Não foi possível enviar a mensagem.");
      }
    } finally {
      setEnviandoMensagem(false);
    }

  }

 async function atualizarChamado(
  campo: "status" | "prioridade" | "responsavel_id",
  valor: string | number | null,
) {
  if (!chamadoId) {
    return;
  }

  setAtualizando(true);
  setErroAtualizacao("");

  try {
    const response = await api.patch<Chamado>(
      `/chamados/${chamadoId}`,
      {
        [campo]: valor,
      },
    );

    setChamado(response.data);

    const responseHistorico =
      await api.get<HistoricoChamado[]>(
        `/chamados/${chamadoId}/historico`,
      );

    setHistorico(responseHistorico.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.detail) {
      setErroAtualizacao(
        String(error.response.data.detail),
      );
    } else {
      setErroAtualizacao(
        "Não foi possível atualizar o chamado.",
      );
    }
  } finally {
    setAtualizando(false);
  }
}

  async function handleAnexo(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  if (!chamadoId || !arquivo) {
    return;
  }

  const tamanhoMaximo = 10 * 1024 * 1024;

  if (arquivo.size > tamanhoMaximo) {
    setErroAnexo("O arquivo excede o limite máximo de 10 MB.");
    return;
  }

  const tiposPermitidos = [
    "image/png",
    "image/jpeg",
    "application/pdf",
  ];

  if (!tiposPermitidos.includes(arquivo.type)) {
    setErroAnexo(
      "Tipo de arquivo não permitido. Utilize PNG, JPEG ou PDF.",
    );
    return;
  }

  setEnviandoAnexo(true);
  setErroAnexo("");

  const formData = new FormData();
  formData.append("arquivo", arquivo);

  try {
    await api.post(
      `/chamados/${chamadoId}/anexos`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    const response = await api.get<Anexo[]>(
      `/chamados/${chamadoId}/anexos`,
    );

    setAnexos(response.data);
    setArquivo(null);
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.detail) {
      setErroAnexo(String(error.response.data.detail));
    } else {
      setErroAnexo("Não foi possível enviar o anexo.");
    }
  } finally {
    setEnviandoAnexo(false);
  }
}

async function abrirAnexo(anexoId: number) {
  if (!chamadoId) {
    return;
  }

  setErroAnexo("");

  try {
    const response = await api.get<AnexoDownload>(
      `/chamados/${chamadoId}/anexos/${anexoId}/download`,
    );

    window.open(
      response.data.url,
      "_blank",
      "noopener,noreferrer",
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.data?.detail) {
      setErroAnexo(String(error.response.data.detail));
    } else {
      setErroAnexo("Não foi possível abrir o anexo.");
    }
  }
}

  if (carregando) {
    return <p>Carregando chamado...</p>;
  }

  if (erro) {
    return (
      <section>
        <p role="alert">{erro}</p>
        <Link to="/chamados">Voltar para chamados</Link>
      </section>
    );
  }

  if (!chamado) {
    return null;
  }

  return (
    <section className="detalhe-chamado">
      <Link to="/chamados" className="detalhe-voltar">
        ← Voltar para chamados
      </Link>

      <header className="detalhe-cabecalho">
        <div>
          <span className="detalhe-protocolo">
            {chamado.protocolo}
          </span>

          <h1>{chamado.titulo}</h1>

          <p>
            Aberto em {formatarData(chamado.criado_em)}
          </p>
        </div>

        <div className="detalhe-badges">
          <span className={`badge badge-status-${chamado.status}`}>
            {formatarTexto(chamado.status)}
          </span>

          <span
            className={`badge badge-prioridade-${chamado.prioridade}`}
          >
            {formatarTexto(chamado.prioridade)}
          </span>
        </div>
      </header>

      <div className="detalhe-layout">
          {/* COLUNA PRINCIPAL */}
          <div className="detalhe-principal">
            <section className="detalhe-card">
              <div className="detalhe-card-cabecalho">
                <h2>Descrição</h2>
              </div>

              <div className="detalhe-descricao">
                <p>{chamado.descricao}</p>
              </div>
            </section>

            <section className="detalhe-card anexos-card">
              <div className="detalhe-card-cabecalho">
                <h2>Anexos</h2>
                <p>
                  Arquivos e evidências relacionados ao chamado.
                </p>
              </div>

              <div className="anexos-conteudo">
                <form
                  className="anexo-upload"
                  onSubmit={handleAnexo}
                >
                  <div className="anexo-upload-campo">
                    <label htmlFor="arquivo">
                      Adicionar arquivo
                    </label>

                    <input
                      id="arquivo"
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(event) =>
                        setArquivo(event.target.files?.[0] ?? null)
                      }
                    />

                    <small>
                      PNG, JPG ou PDF. Tamanho máximo: 10 MB.
                    </small>
                  </div>

                  <button
                    type="submit"
                    disabled={!arquivo || enviandoAnexo}
                  >
                    {enviandoAnexo
                      ? "Enviando..."
                      : "Enviar anexo"}
                  </button>
                </form>

                {erroAnexo && (
                  <p className="detalhe-erro" role="alert">
                    {erroAnexo}
                  </p>
                )}

                {anexos.length === 0 ? (
                  <p className="anexos-vazio">
                    Nenhum anexo neste chamado.
                  </p>
                ) : (
                  <div className="anexos-lista">
                    {anexos.map((anexo) => (
                      <article
                        className="anexo-item"
                        key={anexo.id}
                      >
                        <div className="anexo-item-info">
                          <strong>{anexo.nome_original}</strong>

                          <span>
                            {formatarTamanho(anexo.tamanho_bytes)}
                            {" • "}
                            {formatarData(anexo.criado_em)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={() => abrirAnexo(anexo.id)}
                        >
                          Visualizar
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="detalhe-card historico-card">
              <div className="detalhe-card-cabecalho">
                <h2>Histórico</h2>
                <p>
                  Acompanhe as interações e alterações realizadas neste chamado.
                </p>
              </div>

              <div className="historico-conteudo">
                {historico.length === 0 ? (
                  <p className="historico-vazio">
                    Nenhum registro no histórico.
                  </p>
                ) : (
                  <div className="historico-timeline">
                    {historico.map((item) => (
                      <article
                        className="historico-item"
                        key={item.id}
                      >
                        <div className="historico-marcador" />

                        <div className="historico-item-conteudo">
                          <div className="historico-item-cabecalho">
                            <div>
                              <strong>{item.usuario.nome}</strong>

                              <span className="historico-tipo">
                                {formatarTexto(item.tipo)}
                              </span>
                            </div>

                            <time>
                              {formatarData(item.criado_em)}
                            </time>
                          </div>

                          <p>{item.descricao}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

          {chamado.status !== "fechado" && (
            <section className="detalhe-card mensagem-card">
              <div className="detalhe-card-cabecalho">
                <h2>Adicionar mensagem</h2>
                <p>
                  Registre uma nova interação neste chamado.
                </p>
              </div>

              <form
                className="mensagem-form"
                onSubmit={handleMensagem}
              >
                <label htmlFor="mensagem">
                  Mensagem
                </label>

                <textarea
                  id="mensagem"
                  value={mensagem}
                  onChange={(event) =>
                    setMensagem(event.target.value)
                  }
                  maxLength={5000}
                  rows={5}
                  placeholder="Digite sua mensagem..."
                  required
                />

                {erroMensagem && (
                  <p className="detalhe-erro" role="alert">
                    {erroMensagem}
                  </p>
                )}

                <div className="mensagem-acoes">
                  <span>
                    {mensagem.length}/5000
                  </span>

                  <button
                    type="submit"
                    disabled={
                      enviandoMensagem ||
                      !mensagem.trim()
                    }
                  >
                    {enviandoMensagem
                      ? "Enviando..."
                      : "Enviar mensagem"}
                  </button>
                </div>
              </form>
            </section>
          )}

          </div>

          {/* COLUNA LATERAL */}
          <aside className="detalhe-lateral">
            {/* INFORMAÇÕES */}
            <section className="detalhe-card">
              <div className="detalhe-card-cabecalho">
                <h2>Informações</h2>
              </div>

              <dl className="detalhe-info-lista">
                <div>
                  <dt>Solicitante</dt>
                  <dd>{chamado.solicitante.nome}</dd>
                </div>

                <div>
                  <dt>Unidade</dt>
                  <dd>
                    {chamado.unidade.sigla} — {chamado.unidade.nome}
                  </dd>
                </div>

                <div>
                  <dt>Categoria</dt>
                  <dd>{chamado.categoria.nome}</dd>
                </div>

                <div>
                  <dt>Aberto em</dt>
                  <dd>{formatarData(chamado.criado_em)}</dd>
                </div>

                <div>
                  <dt>Última atualização</dt>
                  <dd>{formatarData(chamado.atualizado_em)}</dd>
                </div>
              </dl>
            </section>

            {/* GESTÃO DO CHAMADO */}
            <section className="detalhe-card">
              <div className="detalhe-card-cabecalho">
                <h2>Gestão do chamado</h2>
              </div>

              <div className="detalhe-gestao">
                {/* STATUS */}
                <div>
                  <strong>Status</strong>

                  {equipeNTI ? (
                    <select
                      value={chamado.status}
                      disabled={
                        atualizando ||
                        transicoesStatus[chamado.status]?.length === 0
                      }
                      onChange={(event) =>
                        atualizarChamado(
                          "status",
                          event.target.value,
                        )
                      }
                    >
                      <option value={chamado.status}>
                        {nomesStatus[chamado.status] ??
                          formatarTexto(chamado.status)}
                      </option>

                      {transicoesStatus[chamado.status]?.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {nomesStatus[status] ??
                              formatarTexto(status)}
                          </option>
                        ),
                      )}
                    </select>
                  ) : (
                    <span
                      className={`badge badge-status-${chamado.status}`}
                    >
                      {formatarTexto(chamado.status)}
                    </span>
                  )}
                </div>

                {/* AÇÕES DO WORKFLOW */}
                {equipeNTI && (
                  <div>
                    <strong>Ações</strong>

                    {chamado.status === "aberto" && (
                      <button
                        type="button"
                        disabled={atualizando}
                        onClick={() =>
                          atualizarChamado(
                            "status",
                            "em_atendimento",
                          )
                        }
                      >
                        Iniciar atendimento
                      </button>
                    )}

                    {chamado.status === "em_atendimento" && (
                      <>
                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "aguardando_usuario",
                            )
                          }
                        >
                          Aguardar usuário
                        </button>

                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "resolvido",
                            )
                          }
                        >
                          Resolver
                        </button>
                      </>
                    )}

                    {chamado.status === "aguardando_usuario" && (
                      <>
                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "em_atendimento",
                            )
                          }
                        >
                          Retomar atendimento
                        </button>

                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "resolvido",
                            )
                          }
                        >
                          Resolver
                        </button>
                      </>
                    )}

                    {chamado.status === "resolvido" && (
                      <>
                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "em_atendimento",
                            )
                          }
                        >
                          Reabrir
                        </button>

                        <button
                          type="button"
                          disabled={atualizando}
                          onClick={() =>
                            atualizarChamado(
                              "status",
                              "fechado",
                            )
                          }
                        >
                          Fechar chamado
                        </button>
                      </>
                    )}

                    {chamado.status === "fechado" && (
                      <span>Chamado encerrado</span>
                    )}
                  </div>
                )}

                {/* PRIORIDADE */}
                <div>
                  <strong>Prioridade</strong>

                  {equipeNTI ? (
                    <select
                      value={chamado.prioridade}
                      disabled={atualizando}
                      onChange={(event) =>
                        atualizarChamado(
                          "prioridade",
                          event.target.value,
                        )
                      }
                    >
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  ) : (
                    <span
                      className={`badge badge-prioridade-${chamado.prioridade}`}
                    >
                      {formatarTexto(chamado.prioridade)}
                    </span>
                  )}
                </div>

                {/* RESPONSÁVEL */}
                <div>
                  <strong>Responsável</strong>

                  {equipeNTI ? (
                    <>
                      <select
                        value={chamado.responsavel_id ?? ""}
                        disabled={atualizando}
                        onChange={(event) => {
                          const valor = event.target.value;

                          atualizarChamado(
                            "responsavel_id",
                            valor === ""
                              ? null
                              : Number(valor),
                          );
                        }}
                      >
                        <option value="">Não atribuído</option>

                        {equipe.map((membro) => (
                          <option
                            key={membro.id}
                            value={membro.id}
                          >
                            {membro.nome}
                          </option>
                        ))}
                      </select>

                      {usuario &&
                        chamado.responsavel_id !== usuario.id &&
                        chamado.status !== "fechado" && (
                          <button
                            type="button"
                            disabled={atualizando}
                            onClick={() =>
                              atualizarChamado(
                                "responsavel_id",
                                usuario.id,
                              )
                            }
                          >
                            {atualizando
                              ? "Atualizando..."
                              : "Assumir chamado"}
                          </button>
                        )}
                    </>
                  ) : (
                    <span>
                      {chamado.responsavel
                        ? chamado.responsavel.nome
                        : "Não atribuído"}
                    </span>
                  )}
                </div>

                {erroAtualizacao && (
                  <p role="alert">
                    {erroAtualizacao}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>
  
      
        </section>
  );
}

export default DetalheChamado;