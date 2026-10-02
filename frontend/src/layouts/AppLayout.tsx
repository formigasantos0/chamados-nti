import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import logoNTU from "../assets/logo-ntu-branca.png";

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

  const administrador =
    usuario?.perfil === "administrador";

  function linkClass({
    isActive,
  }: {
    isActive: boolean;
  }) {
    return isActive
      ? "app-menu-link ativo"
      : "app-menu-link";
  }

  function formatarPerfil(perfil?: string) {
    if (perfil === "administrador") {
      return "Administrador";
    }

    if (perfil === "tecnico") {
      return "Técnico NTI";
    }

    return "Usuário";
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
       <div className="app-brand">
          <img
            src={logoNTU}
            alt="NTU"
            className="app-brand-logo"
          />

          <span className="app-brand-subtitulo">
            Service Desk
          </span>
        </div>

        <nav className="app-menu">
          <div className="app-menu-grupo">
            <span className="app-menu-titulo">
              Atendimento
            </span>

            <NavLink
              to="/chamados"
              end
              className={linkClass}
            >
              Meus chamados
            </NavLink>

            <NavLink
              to="/chamados/novo"
              className={linkClass}
            >
              Novo chamado
            </NavLink>
          </div>

          {equipeNTI && (
            <div className="app-menu-grupo">
              <span className="app-menu-titulo">
                Gestão NTI
              </span>

              <NavLink
                to="/nti"
                className={linkClass}
              >
                Painel NTI
              </NavLink>
            </div>
          )}

          {administrador && (
            <div className="app-menu-grupo">
              <span className="app-menu-titulo">
                Administração
              </span>

              <NavLink
                to="/admin/usuarios"
                className={linkClass}
              >
                Usuários
              </NavLink>

              <NavLink
                to="/admin/unidades"
                className={linkClass}
              >
                Unidades
              </NavLink>

              <NavLink
                to="/admin/categorias"
                className={linkClass}
              >
                Categorias
              </NavLink>

              <NavLink
                to="/admin/sla"
                className={linkClass}
              >
                SLA
              </NavLink>
            </div>
          )}
        </nav>

        <div className="app-sidebar-rodape">
          <button
            type="button"
            className="app-logout"
            onClick={handleLogout}
          >
            Sair do sistema
          </button>
        </div>
      </aside>

      <div className="app-area">
        <header className="app-header">
          <div>
            <strong>Sistema de Chamados</strong>
            <span>
              Núcleo de Tecnologia da Informação
            </span>
          </div>

          <div className="app-usuario">
            <div className="app-avatar">
              {usuario?.nome
                ?.trim()
                .charAt(0)
                .toUpperCase() ?? "U"}
            </div>

            <div className="app-usuario-info">
              <strong>
                {usuario?.nome}
              </strong>

              <span>
                {formatarPerfil(usuario?.perfil)}
              </span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;