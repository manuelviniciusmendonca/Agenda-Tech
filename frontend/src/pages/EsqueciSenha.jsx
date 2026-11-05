import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function EsqueciSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSucesso(false);

    if (!email.trim()) {
      setErro("Preencha seu e-mail.");
      return;
    }

    try {
      setCarregando(true);
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });
      setSucesso(true);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível processar sua solicitação. Tente novamente.",
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
          <header className="login-header">
            <p className="login-eyebrow">RECUPERAÇÃO DE SENHA</p>
            <h2>Esqueceu sua senha?</h2>
            <p>
              Informe seu e-mail para receber um link de recuperação.
            </p>
          </header>

          {sucesso ? (
            <div className="login-success">
              <p>
                Se esse e-mail estiver cadastrado, você receberá um link para
                redefinir sua senha.
              </p>
              <div className="login-aviso-spam" role="alert">
                Não encontrou o e-mail? Verifique a sua <strong>caixa de spam</strong>{" "}
                (ou lixo eletrônico) antes de solicitar novamente.
              </div>
              <button
                type="button"
                className="login-button"
                onClick={() => navigate("/login")}
              >
                Voltar para login
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
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
                {carregando ? "Enviando..." : "Enviar link de recuperação"}
                {!carregando && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          <div className="login-footer">
            <span>Lembrou sua senha?</span>
            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Voltar para login
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

export default EsqueciSenha;
