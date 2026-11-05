import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  UserRound,
} from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import RouteErrorBoundary from "../components/RouteErrorBoundary";
import { useAuth } from "../context/useAuth";

function nomeDoCargo(role) {
  if (role === "ADMIN") return "Administrador";
  if (role === "PROFISSIONAL") return "Profissional";
  return role || "Cargo não informado";
}

function DashboardLayout() {
  const { usuario, empresa, empresaErro, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [confirmacaoLogoutAberta, setConfirmacaoLogoutAberta] =
    useState(false);
  const menuRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!menuAberto) return undefined;

    function fecharMenuFora(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuAberto(false);
      }
    }

    function fecharMenuComEscape(event) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }

    document.addEventListener("pointerdown", fecharMenuFora);
    document.addEventListener("keydown", fecharMenuComEscape);

    return () => {
      document.removeEventListener("pointerdown", fecharMenuFora);
      document.removeEventListener("keydown", fecharMenuComEscape);
    };
  }, [menuAberto]);

  // Fechar modal de logout com Escape e travar foco dentro do modal
  useEffect(() => {
    if (!confirmacaoLogoutAberta) return undefined;

    // Mover o foco para o modal ao abrir
    modalRef.current?.focus();

    function fecharComEscape(event) {
      if (event.key === "Escape") {
        setConfirmacaoLogoutAberta(false);
      }
    }

    function travarFoco(event) {
      if (!modalRef.current) return;
      const focaveis = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (event.key === "Tab") {
        if (event.shiftKey) {
          if (document.activeElement === primeiro) {
            event.preventDefault();
            ultimo.focus();
          }
        } else if (document.activeElement === ultimo) {
          event.preventDefault();
          primeiro.focus();
        }
      }
    }

    document.addEventListener("keydown", fecharComEscape);
    document.addEventListener("keydown", travarFoco);

    return () => {
      document.removeEventListener("keydown", fecharComEscape);
      document.removeEventListener("keydown", travarFoco);
    };
  }, [confirmacaoLogoutAberta]);

  function confirmarLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const nomeUsuario = usuario?.nome || usuario?.email || "";
  const inicialUsuario = nomeUsuario.trim().charAt(0).toUpperCase() || "?";
  const nomeEmpresa = empresa?.nome || (
    empresaErro ? "Empresa indisponível" : "Carregando empresa..."
  );

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar..."
            />
          </div>

          <div className="topbar-right">
            <button
              type="button"
              className="notification-button"
              aria-label="Notificações"
            >
              <Bell size={19} />
              <span className="notification-dot"></span>
            </button>

            <div className="account-menu" ref={menuRef}>
              <button
                type="button"
                className="user-profile"
                onClick={() => setMenuAberto((aberto) => !aberto)}
                aria-expanded={menuAberto}
                aria-haspopup="menu"
              >
                <div className="user-avatar">{inicialUsuario}</div>

                <div className="user-info">
                  <strong>{nomeUsuario}</strong>
                  <span>{nomeEmpresa}</span>
                  <span className="user-role">
                    {nomeDoCargo(usuario?.role)}
                  </span>
                </div>

                <ChevronDown size={16} aria-hidden="true" />
              </button>

              {menuAberto && (
                <div className="account-dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAberto(false);
                      navigate("/minha-conta");
                    }}
                  >
                    <UserRound size={17} />
                    Minha conta
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="account-logout"
                    onClick={() => {
                      setMenuAberto(false);
                      setConfirmacaoLogoutAberta(true);
                    }}
                  >
                    <LogOut size={17} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="page-content">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </section>
      </main>

      {confirmacaoLogoutAberta && (
        <div
          className="logout-modal-overlay"
          onClick={() => setConfirmacaoLogoutAberta(false)}
        >
          <section
            ref={modalRef}
            className="logout-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            aria-describedby="logout-modal-description"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-modal-icon">
              <LogOut size={20} />
            </div>
            <h2 id="logout-modal-title">Sair da conta?</h2>
            <p id="logout-modal-description">
              Você será desconectado do Agenda Tech.
            </p>
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-cancel"
                onClick={() => setConfirmacaoLogoutAberta(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="logout-confirm"
                onClick={confirmarLogout}
              >
                Sair
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;