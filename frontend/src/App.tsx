import "./App.css";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import MeusChamados from "./pages/MeusChamados";
import NovoChamado from "./pages/NovoChamado";
import PainelNTI from "./pages/PainelNTI";
import DetalheChamado from "./pages/DetalheChamado";
import AdministrarCategorias from "./pages/AdministrarCategorias";
import AdministrarUsuarios from "./pages/AdministrarUsuarios";
import AdministrarUnidades from "./pages/AdministrarUnidades";
import AdministrarSLA from "./pages/AdministrarSLA";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota inicial */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Rota pública */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Usuários autenticados */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/chamados"
              element={<MeusChamados />}
            />

            <Route
              path="/chamados/novo"
              element={<NovoChamado />}
            />

            <Route
              path="/chamados/:chamadoId"
              element={<DetalheChamado />}
            />
          </Route>
        </Route>

        {/* Equipe NTI */}
        <Route
          element={
            <ProtectedRoute
              perfisPermitidos={[
                "tecnico",
                "administrador",
              ]}
            />
          }
        >
          <Route element={<AppLayout />}>
            <Route
              path="/nti"
              element={<PainelNTI />}
            />
          </Route>
        </Route>

        {/* Administração */}
        <Route
          element={
            <ProtectedRoute
              perfisPermitidos={["administrador"]}
            />
          }
        >
          <Route element={<AppLayout />}>
            <Route
              path="/admin/usuarios"
              element={<AdministrarUsuarios />}
            />

            <Route
              path="/admin/unidades"
              element={<AdministrarUnidades />}
            />

            <Route
              path="/admin/categorias"
              element={<AdministrarCategorias />}
            />

            <Route
              path="/admin/sla"
              element={<AdministrarSLA />}
            />
          </Route>
        </Route>

        {/* Rota inexistente */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;