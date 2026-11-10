import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login, autenticado, usuario, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (autenticado && usuario && !email) {
    const destino = usuario.role === "PROFISSIONAL" ? "/inicio" : "/dashboard";
    return (
      <div className="login-page">
        <div className="login-brand">
          <img className="login-logo-image" src="/logo.png" alt="Agenda Tech" />
        </div>

        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <p className="login-eyebrow">SESSÃO ATIVA</p>
              <h2>Você já está conectado.</h2>
              <p>
                Conta atual: <strong>{usuario.nome}</strong> (
                {usuario.role === "PROFISSIONAL" ? "Profissional" : "Administrador"}).
              </p>
            </div>

            <button
              type="button"
              className="login-button"
              onClick={() => navigate(destino, { replace: true })}
            >
              Continuar para o painel
              <ArrowRight size={18} />
            </button>

            <div className="login-footer">
              <span>Quer entrar com outra conta?</span>
              <button type="button" onClick={logout}>
                Sair e trocar de conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");

    if (!email || !senha) {
      setErro("Preencha seu e-mail e sua senha.");
      return;
    }

    try {
      setCarregando(true);

      const usuarioAutenticado = await login(email, senha);
      const destino = usuarioAutenticado?.role === "PROFISSIONAL" ? "/inicio" : "/dashboard";
      navigate(destino, { replace: true });
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível entrar. Verifique seus dados.",
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

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <p className="login-eyebrow">ÁREA RESTRITA</p>

            <h2>Bem-vindo de volta.</h2>

            <p>
              Entre na sua conta para acessar sua agenda e acompanhar
              seus clientes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">E-mail</label>

              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="senha">Senha</label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => navigate("/esqueci-senha")}
                >
                  Esqueci minha senha
                </button>
              </div>

              <div className="password-input">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={
                    mostrarSenha
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {mostrarSenha ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {erro && (
              <div className="login-error">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}

              {!carregando && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-footer">
            <span>Ainda não possui uma conta?</span>

            <button
              type="button"
              onClick={() => navigate("/cadastro")}
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>

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

export default Login;