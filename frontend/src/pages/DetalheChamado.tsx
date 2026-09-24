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
    <section>
      <Link to="/chamados">← Voltar para chamados</Link>

      <header>
        <p>{chamado.protocolo}</p>
        <h1>{chamado.titulo}</h1>
      </header>

      <div>
        <div>
          <strong>Status:</strong>{" "}

           {equipeNTI ? (
             <select
                value={chamado.status}
                disabled={atualizando}
                onChange={(event) =>
                  atualizarChamado("status", event.target.value)
                }
              >
                <option value="aberto">Aberto</option>
                <option value="em_atendimento">Em atendimento</option>
                <option value="aguardando_usuario">
                   Aguardando usuário
                </option>
                <option value="resolvido">Resolvido</option>
                <option value="fechado">Fechado</option>
              </select>
            ) : (
              formatarTexto(chamado.status)
            )}
          </div>

        <div>
          <strong>Prioridade:</strong>{" "}

          {equipeNTI ? (
            <select
              value={chamado.prioridade}
              disabled={atualizando}
              onChange={(event) =>
                atualizarChamado("prioridade", event.target.value)
            }
         >
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        ) : (
           formatarTexto(chamado.prioridade)
          )}
        </div>

        <div>
          <strong>Responsável:</strong>{" "}

          {equipeNTI ? (
            <select
              value={chamado.responsavel_id ?? ""}
              disabled={atualizando}
              onChange={(event) => {
                const valor = event.target.value;

                atualizarChamado(
                  "responsavel_id",
                  valor === "" ? null : Number(valor),
                );
              }}
            >
              <option value="">Não atribuído</option>

              {equipe.map((membro) => (
                <option key={membro.id} value={membro.id}>
                  {membro.nome}
                </option>
              ))}
            </select>
          ) : (
            chamado.responsavel
              ? chamado.responsavel.nome
              : "Não atribuído"
          )}
      </div>

        {erroAtualizacao && (
          <p role="alert">{erroAtualizacao}</p>
        )}

        <p>
          <strong>Categoria:</strong> {chamado.categoria}
        </p>

        <p>
          <strong>Solicitante:</strong>{" "}
          {chamado.solicitante.nome}
        </p>

        <p>
          <strong>Unidade:</strong>{" "}
          {chamado.unidade.sigla} — {chamado.unidade.nome}
        </p>

        <p>
          <strong>Aberto em:</strong>{" "}
          {formatarData(chamado.criado_em)}
        </p>

        <p>
          <strong>Última atualização:</strong>{" "}
          {formatarData(chamado.atualizado_em)}
        </p>
      </div>

      <div>
        <h2>Descrição</h2>
        <p>{chamado.descricao}</p>
      </div>

      <section>
        <h2>Anexos</h2>

        <form onSubmit={handleAnexo}>
          <div>
            <label htmlFor="arquivo">
              Adicionar anexo
            </label>

            <input
              id="arquivo"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(event) =>
                setArquivo(event.target.files?.[0] ?? null)
              }
            />
          </div>

          <p>
            PNG, JPG ou PDF. Tamanho máximo: 10 MB.
          </p>

          {erroAnexo && (
            <p role="alert">{erroAnexo}</p>
          )}

          <button
            type="submit"
            disabled={!arquivo || enviandoAnexo}
          >
            {enviandoAnexo ? "Enviando..." : "Enviar anexo"}
          </button>
        </form>

        {anexos.length === 0 ? (
          <p>Nenhum anexo neste chamado.</p>
        ) : (
          <div>
            {anexos.map((anexo) => (
              <article key={anexo.id}>
                <p>
                  <strong>{anexo.nome_original}</strong>
                </p>

                <p>
                  {formatarTamanho(anexo.tamanho_bytes)}
                  {" — "}
                  {formatarData(anexo.criado_em)}
                </p>

                <button
                  type="button"
                  onClick={() => abrirAnexo(anexo.id)}
                >
                  Visualizar anexo
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Histórico</h2>

        {historico.length === 0 ? (
          <p>Nenhum registro no histórico.</p>
        ) : (
          <div>
            {historico.map((item) => (
              <article key={item.id}>
                <p>
                  <strong>{item.usuario.nome}</strong>
                  {" — "}
                  {formatarData(item.criado_em)}
                </p>

                <p>{item.descricao}</p>

                <small>{formatarTexto(item.tipo)}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      {chamado.status !== "fechado" && (
        <section>
          <h2>Adicionar mensagem</h2>

          <form onSubmit={handleMensagem}>
            <div>
              <label htmlFor="mensagem">Mensagem</label>

              <textarea
                id="mensagem"
                value={mensagem}
                onChange={(event) =>
                  setMensagem(event.target.value)
                }
                maxLength={5000}
                rows={5}
                required
              />
            </div>

            {erroMensagem && (
              <p role="alert">{erroMensagem}</p>
            )}

            <button
              type="submit"
              disabled={enviandoMensagem}
            >
              {enviandoMensagem
                ? "Enviando..."
                : "Enviar mensagem"}
            </button>
          </form>
        </section>
      )}
    </section>
  );
}

export default DetalheChamado;