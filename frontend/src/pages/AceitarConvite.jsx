import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function AceitarConvite() {
  const { token } = useParams();
  const { logout } = useAuth();
  const [convite, setConvite] = useState(null);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aceito, setAceito] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/convites/validar/${encodeURIComponent(token || "")}`, {
        signal: controller.signal,
      })
      .then((response) => {
        if (!controller.signal.aborted) setConvite(response.data.convite);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setErro(
            error.response?.data?.mensagem ||
              "Este convite não está disponível.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [token]);

  async function aceitarConvite(event) {
    event.preventDefault();
    setErro("");

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    try {
      setSalvando(true);
      await api.post("/convites/aceitar", { token, senha });
      setAceito(true);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível concluir o convite.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <img className="login-logo-image" src="/logo.png" alt="Agenda Tech" />
      </div>

      <div className="login-container">
        <section className="login-card invite-accept-card">
          <div className="login-header">
            <p className="login-eyebrow">ACESSO À EQUIPE</p>
            <h2>{aceito ? "Conta criada." : "Aceitar convite"}</h2>
            {carregando ? (
              <p>Validando seu convite...</p>
            ) : convite ? (
              <p>
                {aceito
                  ? `Sua conta de profissional para ${convite.empresa_nome} está pronta.`
                  : `Olá, ${convite.profissional_nome}. Defina uma senha para acessar ${convite.empresa_nome}.`}
              </p>
            ) : (
              <p>{erro || "Este convite não está disponível."}</p>
            )}
          </div>

          {aceito ? (
            <div className="invite-accepted">
              <CheckCircle2 size={26} />
              <Link to="/login" replace onClick={logout} className="login-button">
                Ir para o login <ArrowRight size={17} />
              </Link>
            </div>
          ) : convite ? (
            <form className="login-form" onSubmit={aceitarConvite}>
              <div className="form-group">
                <label htmlFor="invite-email">E-mail</label>
                <input id="invite-email" value={convite.email} readOnly />
              </div>
              <div className="form-group">
                <label htmlFor="invite-password">Criar senha</label>
                <input
                  id="invite-password"
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="invite-password-confirm">Confirmar senha</label>
                <input
                  id="invite-password-confirm"
                  type="password"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {erro && <div className="login-error" role="alert">{erro}</div>}
              <button type="submit" className="login-button" disabled={salvando}>
                {salvando ? "Criando conta..." : "Criar conta"}
                {!salvando && <ArrowRight size={17} />}
              </button>
            </form>
          ) : (
            !carregando && (
              <div className="invite-accepted">
                <Link to="/login" replace onClick={logout}>
                  Voltar para o login
                </Link>
              </div>
            )
          )}
        </section>
      </div>
    </div>
  );
}

export default AceitarConvite;
