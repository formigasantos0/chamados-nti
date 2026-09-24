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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/chamados" element={<MeusChamados />} />

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

        <Route
          element={
            <ProtectedRoute
              perfisPermitidos={["tecnico", "administrador"]}
            />
          }
        >
          <Route element={<AppLayout />}>
            <Route path="/nti" element={<PainelNTI />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;