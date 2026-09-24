import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import api from "../services/api";
import type {
  LoginRequest,
  LoginResponse,
  Usuario,
} from "../types/auth";

interface AuthContextData {
  usuario: Usuario | null;
  autenticado: boolean;
  carregando: boolean;
  login: (dados: LoginRequest) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      setCarregando(false);
      return;
    }

    api
      .get<Usuario>("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUsuario(response.data);
      })
      .catch(() => {
        sessionStorage.removeItem("access_token");
        setUsuario(null);
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  async function login(dados: LoginRequest): Promise<Usuario> {
    const response = await api.post<LoginResponse>("/auth/login", dados);

    const token = response.data.access_token;

    const me = await api.get<Usuario>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    sessionStorage.setItem("access_token", token);
    setUsuario(me.data);

    return me.data;
  }

  function logout() {
    sessionStorage.removeItem("access_token");
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado: usuario !== null,
        carregando,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }

  return context;
}