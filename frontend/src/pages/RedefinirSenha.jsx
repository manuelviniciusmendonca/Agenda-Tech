import { useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function RedefinirSenha() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!senha || !confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setCarregando(true);
      await api.post("/auth/reset-password", {
        token,
        senha,
      });
      setSucesso(true);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível redefinir sua senha. O link pode ter expirado. Solicite um novo link.",
      );
    } finally {
      setCarregando(false);
    }
  }

  if (sucesso) {
    return (
      <div className="login-page">
        <div className="login-brand">
          <img className="login-logo-image" src="/logo.png" alt="Agenda Tech" />
        </div>

        <div className="login-container">
          <div className="login-card">
            <header className="login-header">
              <p className="login-eyebrow">SENHA REDEFINIDA</p>
              <h2>Tudo pronto!</h2>
              <p>
                Sua senha foi redefinida com sucesso. Você já pode entrar no
                Agenda Tech.
              </p>
            </header>

            <button
              type="button"
              className="login-button"
              onClick={() => navigate("/login")}
            >
              Ir para login
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="login-bottom">
          <span>© 2026 Agenda Tech</span>
          <span>Gestão inteligente para negócios de atendimento.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <img className="login-logo-image" src="/logo.png" alt="Agenda Tech" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <header className="login-header">
            <p className="login-eyebrow">REDEFINIÇÃO DE SENHA</p>
            <h2>Crie sua nova senha</h2>
            <p>
              Digite sua nova senha para continuar acessando sua conta.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="senha">Nova senha</label>
              <div className="password-input">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={
                    mostrarSenha ? "Ocultar senha" : "Mostrar senha"
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

            <div className="form-group">
              <label htmlFor="confirmarSenha">Confirmar nova senha</label>
              <div className="password-input">
                <input
                  id="confirmarSenha"
                  type={mostrarConfirmar ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  aria-label={
                    mostrarConfirmar ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {mostrarConfirmar ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

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
              {carregando ? "Redefinindo..." : "Redefinir senha"}
              {!carregando && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-footer">
            <span>Link expirou ou inválido?</span>
            <button
              type="button"
              onClick={() => navigate("/esqueci-senha")}
            >
              Solicitar novo link
            </button>
          </div>
        </div>
      </div>

      <div className="login-bottom">
        <span>© 2026 Agenda Tech</span>
        <span>Gestão inteligente para negócios de atendimento.</span>
      </div>
    </div>
  );
}

export default RedefinirSenha;
