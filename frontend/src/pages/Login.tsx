import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import logoNtu from "../assets/logo-ntu-branca.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setEnviando(true);

    try {
      const usuario = await login({
        email,
        senha,
      });

      if (
        usuario.perfil === "tecnico" ||
        usuario.perfil === "administrador"
      ) {
        navigate("/nti");
      } else {
        navigate("/chamados");
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setErro("E-mail ou senha inválidos.");
      } else {
        setErro("Não foi possível acessar o sistema. Tente novamente.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
  <main className="login-page">
    <section className="login-brand">
      <div className="login-brand-conteudo">
        <img
          src={logoNtu}
          alt="NTU"
          className="login-logo"
        />

        <div className="login-brand-texto">
          <span className="login-brand-eyebrow">
            Núcleo de Tecnologia e Informação
          </span>

          <h1>
            Atendimento de TI
            <br />
            simples e organizado.
          </h1>

          <p>
            Registre solicitações, acompanhe atendimentos
            e mantenha todo o histórico de suporte em um
            único lugar.
          </p>
        </div>

        <div className="login-brand-rodape">
          Sistema de Chamados NTI
        </div>
      </div>
    </section>

    <section className="login-area">
      <div className="login-card">
        <div className="login-card-cabecalho">
          <span className="pagina-eyebrow">
            Acesso ao sistema
          </span>

          <h2>Bem-vindo</h2>

          <p>
            Entre com sua conta institucional para continuar.
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-campo">
            <label htmlFor="email">
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              autoComplete="email"
              placeholder="seu.email@ntu.org.br"
              required
              autoFocus
            />
          </div>

          <div className="form-campo">
            <label htmlFor="senha">
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) =>
                setSenha(event.target.value)
              }
              autoComplete="current-password"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {erro && (
            <div
              className="form-alerta form-alerta-erro login-erro"
              role="alert"
            >
              {erro}
            </div>
          )}

          <button
            className="login-submit"
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? "Entrando..."
              : "Entrar no sistema"}
          </button>
        </form>

        <div className="login-card-rodape">
          Acesso restrito a colaboradores autorizados.
        </div>
      </div>
    </section>
  </main>
);
}

export default Login;