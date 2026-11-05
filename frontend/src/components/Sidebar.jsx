import {
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Users,
  UserRoundCheck,
  Briefcase,
  UserCog,
  ExternalLink,
  Home,
  Settings,
  CreditCard,
  Menu,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/useAuth";

const menuAdmin = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    path: "/agenda",
  },
  {
    label: "Horários",
    icon: Clock3,
    path: "/horarios",
  },
  {
    label: "Clientes",
    icon: Users,
    path: "/clientes",
  },
  {
    label: "Recuperação",
    icon: UserRoundCheck,
    path: "/recuperacao",
  },
  {
    label: "Serviços",
    icon: Briefcase,
    path: "/servicos",
  },
  {
    label: "Profissionais",
    icon: UserCog,
    path: "/profissionais",
  },
  {
    label: "Página de agendamento",
    icon: ExternalLink,
    path: "/pagina-agendamento",
  },
  {
    label: "Configurações",
    icon: Settings,
    path: "/configuracoes",
  },
  {
    label: "Assinatura",
    icon: CreditCard,
    path: "/assinatura",
  },
];

const menuProfissional = [
  { label: "Início", icon: Home, path: "/inicio" },
  { label: "Minha agenda", icon: CalendarDays, path: "/agenda" },
  { label: "Horários", icon: Clock3, path: "/meus-horarios" },
  { label: "Meus clientes", icon: Users, path: "/meus-clientes" },
  {
    label: "Página de agendamento",
    icon: ExternalLink,
    path: "/pagina-agendamento",
  },
];

function Sidebar() {
  const { usuario } = useAuth();
  const menuItems =
    usuario?.role === "PROFISSIONAL" ? menuProfissional : menuAdmin;
  const [aberta, setAberta] = useState(false);
  const sidebarRef = useRef(null);

  // Fechar sidebar mobile ao clicar fora
  useEffect(() => {
    if (!aberta) return undefined;

    function fecharFora(event) {
      if (!sidebarRef.current?.contains(event.target)) {
        setAberta(false);
      }
    }

    function fecharComEscape(event) {
      if (event.key === "Escape") setAberta(false);
    }

    document.addEventListener("pointerdown", fecharFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [aberta]);

  return (
    <>
      {/* Botão hamburguer visível apenas em mobile */}
      <button
        type="button"
        className="sidebar-mobile-toggle"
        aria-label={aberta ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberta}
        onClick={() => setAberta((v) => !v)}
      >
        {aberta ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay escuro em mobile quando sidebar está aberta */}
      {aberta && (
        <div
          className="sidebar-overlay"
          aria-hidden="true"
          onClick={() => setAberta(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar${aberta ? " sidebar-open" : ""}`}
      >
        <div className="sidebar-logo">
          <img className="logo-image" src="/logo.png" alt="Agenda Tech" />
        </div>

        <nav className="sidebar-nav">
          <p className="nav-title">MENU</p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setAberta(false)}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;