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
  const [arquivo, setArquivo] = useState<File | null>(null);

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
      prioridade: "normal",
    };

    try {
  const response = await api.post<Chamado>("/chamados/", dados);

  const chamadoCriado = response.data;

  if (arquivo) {
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);

      await api.post(
        `/chamados/${chamadoCriado.id}/anexos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
    } catch {
      navigate(`/chamados/${chamadoCriado.id}`, {
        state: {
          aviso:
            "Chamado aberto com sucesso, mas não foi possível enviar o anexo. Você pode anexá-lo novamente nesta página.",
        },
      });
      return;
    }
  }

  navigate(`/chamados/${chamadoCriado.id}`);
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
  <section className="novo-chamado">
    <header className="pagina-cabecalho">
      <div>
        <span className="pagina-eyebrow">Atendimento</span>

        <h1>Novo chamado</h1>

        <p>
          Registre uma nova solicitação para o Núcleo de Tecnologia
          da Informação.
        </p>
      </div>
    </header>

    <form
      className="novo-chamado-form"
      onSubmit={handleSubmit}
    >
      <section className="form-card">
        <div className="form-card-cabecalho">
          <div>
            <h2>Dados do chamado</h2>

            <p>
              Informe os dados necessários para que a equipe de NTI
              possa analisar sua solicitação.
            </p>
          </div>
        </div>

        <div className="form-card-conteudo">
          <div className="form-campo">
            <label htmlFor="titulo">
              Assunto
              <span aria-hidden="true">*</span>
            </label>

            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(event) =>
                setTitulo(event.target.value)
              }
              minLength={3}
              maxLength={200}
              placeholder="Ex.: Não consigo acessar a internet"
              required
            />

            <small>
              Descreva resumidamente o motivo do chamado.
            </small>
          </div>

          
            <div className="form-campo">
              <label htmlFor="categoria">
                Categoria
                <span aria-hidden="true">*</span>
              </label>

              <select
                id="categoria"
                value={categoriaId}
                onChange={(event) =>
                  setCategoriaId(event.target.value)
                }
                disabled={carregandoCategorias}
                required
              >
                <option value="">
                  {carregandoCategorias
                    ? "Carregando categorias..."
                    : "Selecione uma categoria"}
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.id}
                  >
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <small>
                Selecione a área relacionada à solicitação.
              </small>
            </div>

          <div className="form-campo">
            <label htmlFor="descricao">
              Descrição
              <span aria-hidden="true">*</span>
            </label>

            <textarea
              id="descricao"
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
              minLength={5}
              maxLength={5000}
              rows={8}
              placeholder="Descreva o problema, quando começou, mensagens de erro e outras informações que possam ajudar no atendimento."
              required
            />

            <div className="form-campo-rodape">
              <small>
                Forneça o máximo de informações relevantes possível.
              </small>

              <span>{descricao.length}/5000</span>
            </div>
          </div>

          <div className="form-campo">
            <label htmlFor="arquivo">
              Anexo
            </label>

            <input
              id="arquivo"
              type="file"
              onChange={(event) =>
                setArquivo(event.target.files?.[0] ?? null)
              }
            />

            <small>
              Opcional. Anexe uma imagem ou arquivo que possa ajudar a equipe de NTI
              a identificar o problema.
            </small>
          </div>

          {erro && (
            <div
              className="form-alerta form-alerta-erro"
              role="alert"
            >
              {erro}
            </div>
          )}
        </div>

        <footer className="form-acoes">
          <button
            type="button"
            className="btn-secundario"
            onClick={() => navigate("/chamados")}
            disabled={enviando}
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={enviando || carregandoCategorias}
          >
            {enviando
              ? "Abrindo chamado..."
              : "Abrir chamado"}
          </button>
        </footer>
      </section>
    </form>
  </section>
);

}

export default NovoChamado;