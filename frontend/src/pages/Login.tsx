import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

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
    <main>
      <section>
        <h1>Chamados NTI</h1>
        <p>Entre com sua conta para acessar o sistema.</p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {erro && <p role="alert">{erro}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;