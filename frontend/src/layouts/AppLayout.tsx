import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

function AppLayout() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const equipeNTI =
    usuario?.perfil === "tecnico" ||
    usuario?.perfil === "administrador";

  return (
    <div>
      <header>
        <div>
          <strong>Chamados NTI</strong>

          <nav>
            <Link to="/chamados">Meus Chamados</Link>
            <Link to="/chamados/novo">Novo Chamado</Link>

            {equipeNTI && (
              <Link to="/nti">Painel NTI</Link>
            )}
          </nav>
        </div>

        <div>
          <span>{usuario?.nome}</span>
          <button type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;