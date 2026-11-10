import { ArrowUpRight, Building2, FileText, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { DOCUMENTOS_LEGAIS, VERSAO_LEGAL } from "../legal/dadosEmpresa";

function nomeDoCargo(role) {
  if (role === "ADMIN") return "Administrador";
  if (role === "PROFISSIONAL") return "Profissional";
  return role || "Não informado";
}

function MinhaConta() {
  const { usuario, empresa, empresaErro } = useAuth();
  const nome = usuario?.nome || "Nome não informado";
  const inicial = nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="account-page">
      <header className="account-page-header">
        <p className="account-eyebrow">PERFIL</p>
        <h1>Minha conta</h1>
        <p>Informações da sua conta no Agenda Tech.</p>
      </header>

      <section className="account-card" aria-label="Dados da conta">
        <div className="account-identity">
          <div className="account-avatar" aria-hidden="true">
            {inicial}
          </div>
          <div className="account-identity-content">
            <h2>{nome}</h2>
            {usuario?.email && (
              <p className="account-email">
                <Mail size={15} />
                <a href={`mailto:${usuario.email}`}>{usuario.email}</a>
              </p>
            )}
          </div>
        </div>

        <div className="account-details">
          <div className="account-detail">
            <div className="account-detail-icon">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span>Cargo</span>
              <strong>{nomeDoCargo(usuario?.role)}</strong>
            </div>
          </div>

          <div className="account-detail">
            <div className="account-detail-icon">
              <Building2 size={18} />
            </div>
            <div>
              <span>Empresa</span>
              <strong>
                {empresa?.nome ||
                  (empresaErro ? "Não foi possível carregar" : "Carregando...")}
              </strong>
              {empresaErro && <small role="alert">{empresaErro}</small>}
            </div>
          </div>
        </div>
      </section>

      <section className="account-legal" aria-label="Documentos legais">
        <header className="account-legal-header">
          <div className="account-legal-icon">
            <FileText size={18} />
          </div>

          <div>
            <h2>Documentos legais</h2>
            <p>
              Termos e políticas que regem o uso do Agenda Tech. Versão{" "}
              {VERSAO_LEGAL}.
            </p>
          </div>
        </header>

        <ul className="account-legal-links">
          {DOCUMENTOS_LEGAIS.map((documento) => (
            <li key={documento.chave}>
              <Link to={documento.caminho}>
                <span>
                  <strong>{documento.titulo}</strong>
                  <small>{documento.descricao}</small>
                </span>

                <ArrowUpRight size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default MinhaConta;
