import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import type { PerfilUsuario } from "../types/auth";

interface ProtectedRouteProps {
  perfisPermitidos?: PerfilUsuario[];
}

function ProtectedRoute({ perfisPermitidos }: ProtectedRouteProps) {
  const { usuario, autenticado, carregando } = useAuth();

  if (carregando) {
    return <p>Carregando...</p>;
  }

  if (!autenticado || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (
    perfisPermitidos &&
    !perfisPermitidos.includes(usuario.perfil)
  ) {
    return <Navigate to="/chamados" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;