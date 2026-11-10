import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { VERSAO_LEGAL } from "../legal/dadosEmpresa";

function Cadastro() {
  const navigate = useNavigate();
  const { cadastro, autenticado, usuario } = useAuth();
  const [empresa, setEmpresa] = useState({
    nome: "",
    slug: "",
    telefone: "",
    email: "",
  });
  const [admin, setAdmin] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aceite, setAceite] = useState(false);

  if (autenticado) {
    return (
      <Navigate
        to={
          usuario?.role === "PROFISSIONAL"
            ? "/inicio"
            : usuario?.role === "ADMIN"
              ? "/assinatura"
              : "/dashboard"
        }
        replace
      />
    );
  }

  function atualizarEmpresa(event) {
    const { name, value } = event.target;
    setEmpresa((atual) => ({ ...atual, [name]: value }));
  }

  function atualizarAdmin(event) {
    const { name, value } = event.target;
    setAdmin((atual) => ({ ...atual, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (
      !empresa.nome.trim() ||
      !empresa.slug.trim() ||
      !empresa.telefone.trim() ||
      !empresa.email.trim() ||
      !admin.nome.trim() ||
      !admin.email.trim() ||
      !admin.senha ||
      !admin.confirmarSenha
    ) {
      setErro("Preencha todos os campos para continuar.");
      return;
    }

    if (admin.senha !== admin.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (!aceite) {
      setErro(
        "Para criar a conta é necessário aceitar os Termos de Uso e a Política de Privacidade.",
      );
      return;
    }

    try {
      setCarregando(true);
      await cadastro({
        empresa: {
          nome: empresa.nome.trim(),
          slug: empresa.slug.trim(),
          telefone: empresa.telefone.trim(),
          email: empresa.email.trim(),
        },
        admin: {
          nome: admin.nome.trim(),
          email: admin.email.trim(),
          senha: admin.senha,
        },
        aceite: {
          termos: true,
          privacidade: true,
          versao: VERSAO_LEGAL,
        },
      });

      navigate("/assinatura", { replace: true });
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível criar sua conta. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <img className="login-logo-image" src="/logo.png" alt="Agenda Tech" />
      </div>

      <main className="signup-container">
        <section className="login-card signup-card">
          <header className="login-header">
            <p className="login-eyebrow">COMECE POR AQUI</p>
            <h2>Seu negócio, mais organizado.</h2>
            <p>Cadastre sua empresa e crie seu acesso. Em seguida, ative o plano para liberar o sistema.</p>
          </header>

          <form onSubmit={handleSubmit} className="signup-form">
            <fieldset className="signup-fieldset">
              <legend>EMPRESA</legend>
              <div className="signup-fields">
                <div className="form-group signup-field-full">
                  <label htmlFor="empresa-nome">Nome da empresa</label>
                  <input
                    id="empresa-nome"
                    name="nome"
                    value={empresa.nome}
                    onChange={atualizarEmpresa}
                    placeholder="Studio Teste"
                    autoComplete="organization"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="empresa-slug">Slug</label>
                  <input
                    id="empresa-slug"
                    name="slug"
                    value={empresa.slug}
                    onChange={atualizarEmpresa}
                    placeholder="studio-teste"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="empresa-telefone">Telefone</label>
                  <input
                    id="empresa-telefone"
                    name="telefone"
                    type="tel"
                    value={empresa.telefone}
                    onChange={atualizarEmpresa}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="form-group signup-field-full">
                  <label htmlFor="empresa-email">E-mail da empresa</label>
                  <input
                    id="empresa-email"
                    name="email"
                    type="email"
                    value={empresa.email}
                    onChange={atualizarEmpresa}
                    placeholder="contato@empresa.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="signup-fieldset">
              <legend>ADMINISTRADOR</legend>
              <div className="signup-fields">
                <div className="form-group signup-field-full">
                  <label htmlFor="admin-nome">Nome</label>
                  <input
                    id="admin-nome"
                    name="nome"
                    value={admin.nome}
                    onChange={atualizarAdmin}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="form-group signup-field-full">
                  <label htmlFor="admin-email">E-mail</label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    value={admin.email}
                    onChange={atualizarAdmin}
                    placeholder="voce@empresa.com"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-senha">Senha</label>
                  <input
                    id="admin-senha"
                    name="senha"
                    type="password"
                    value={admin.senha}
                    onChange={atualizarAdmin}
                    placeholder="Crie uma senha"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin-confirmar-senha">Confirmar senha</label>
                  <input
                    id="admin-confirmar-senha"
                    name="confirmarSenha"
                    type="password"
                    value={admin.confirmarSenha}
                    onChange={atualizarAdmin}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </fieldset>

            <label className="signup-legal">
              <input
                type="checkbox"
                checked={aceite}
                onChange={(event) => setAceite(event.target.checked)}
                required
              />

              <span>
                Declaro que li e aceito os{" "}
                <Link to="/termos" target="_blank" rel="noreferrer">
                  Termos de Uso
                </Link>
                , a{" "}
                <Link to="/privacidade" target="_blank" rel="noreferrer">
                  Política de Privacidade
                </Link>{" "}
                e a{" "}
                <Link to="/cookies" target="_blank" rel="noreferrer">
                  Política de Cookies
                </Link>
                . Declaro também que sou maior de 18 anos e que tenho poderes
                para representar a empresa cadastrada.
              </span>
            </label>

            {erro && (
              <div className="login-error" role="alert">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? "Criando conta..." : "Começar agora"}
              {!carregando && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="signup-footer">
            <span>Já tenho uma conta</span>
            <span aria-hidden="true">→</span>
            <Link to="/login">Entrar</Link>
          </div>
        </section>
      </main>

      <div className="login-bottom login-bottom-legal">
        <span>© 2026 Agenda Tech</span>

        <nav className="login-legal-links" aria-label="Documentos legais">
          <Link to="/termos">Termos de Uso</Link>
          <Link to="/privacidade">Privacidade</Link>
          <Link to="/cookies">Cookies</Link>
          <Link to="/cancelamento">Cancelamento</Link>
        </nav>
      </div>
    </div>
  );
}

export default Cadastro;
