import { useEffect, useRef, useState } from "react";
import {
  AtSign,
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  LoaderCircle,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

function PaginaAgendamento() {
  const { empresa, usuario } = useAuth();
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState("");
  const [profissionalId, setProfissionalId] = useState(null);
  const timerCopiaRef = useRef(null);

  const isProfissional = usuario?.role === "PROFISSIONAL";

  useEffect(() => {
    if (!isProfissional) return undefined;

    let ativo = true;
    const controller = new AbortController();

    async function carregarProfissional() {
      try {
        const response = await api.get("/profissionais", {
          signal: controller.signal,
        });
        const lista = Array.isArray(response.data) ? response.data : [];
        const meu =
          lista.find((item) => item.usuario_id === usuario?.usuario_id) ||
          lista[0];

        if (ativo && meu) {
          setProfissionalId(meu.id);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Não foi possível carregar o perfil do profissional:", error);
      }
    }

    void carregarProfissional();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [isProfissional, usuario?.usuario_id]);

  useEffect(
    () => () => {
      window.clearTimeout(timerCopiaRef.current);
    },
    [],
  );

  if (!empresa) {
    return (
      <div className="page-content">
        <div className="pa-loading" role="status">
          <LoaderCircle size={20} className="pa-spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  const linkBase = `${window.location.origin}/agendar/${empresa.slug}`;
  const linkPublico =
    isProfissional && profissionalId
      ? `${linkBase}?profissional=${profissionalId}`
      : linkBase;

  const mensagemWhatsApp = `Olá! Faça seu agendamento online conosco pelo link:\n${linkPublico}`;
  const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsApp)}`;

  async function copiarLink() {
    setErroCopia("");
    try {
      await navigator.clipboard.writeText(linkPublico);
      setCopiado(true);
      window.clearTimeout(timerCopiaRef.current);
      timerCopiaRef.current = window.setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErroCopia("Não foi possível copiar automaticamente. Selecione e copie o link manualmente.");
    }
  }

  return (
    <div className="page-content pa-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            {isProfissional ? "AGENDA PÚBLICA" : "AGENDAMENTO ONLINE"}
          </p>
          <h1>Página de agendamento</h1>
          <p className="page-description">
            {isProfissional
              ? "Compartilhe seu link para que clientes agendem diretamente com você."
              : `Compartilhe o link público de ${empresa.nome || "sua empresa"} para receber agendamentos.`}
          </p>
        </div>
      </header>

      <div className="pa-grid">

        {/* ── Card principal — link ── */}
        <section className="pa-card">
          <div className="pa-card-header">
            <div className="pa-card-icon">
              <Link2 size={17} />
            </div>
            <div>
              <h2 className="pa-card-title">Seu link de agendamento</h2>
              <p className="pa-card-desc">
                Clientes acessam diretamente pelo navegador, sem aplicativo ou cadastro.
              </p>
            </div>
          </div>

          <div className="pa-link-group">
            <label className="pa-label" htmlFor="url-agendamento">
              Link público
            </label>
            <div className="pa-link-row">
              <input
                id="url-agendamento"
                type="url"
                value={linkPublico}
                readOnly
                onFocus={(e) => e.target.select()}
                aria-describedby="pa-link-hint"
              />
              <button
                type="button"
                onClick={copiarLink}
                className={`pa-copy-btn${copiado ? " pa-copy-btn-done" : ""}`}
              >
                {copiado ? <Check size={15} /> : <Copy size={15} />}
                <span>{copiado ? "Copiado" : "Copiar"}</span>
              </button>
            </div>
            {erroCopia && (
              <p className="pa-copy-error" role="alert">{erroCopia}</p>
            )}
            <p className="pa-hint" id="pa-link-hint">
              O link é único para {isProfissional ? "você" : "sua empresa"}. Qualquer alteração no slug das configurações irá atualizá-lo.
            </p>
          </div>

          <div className="pa-actions">
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="pa-btn-whatsapp"
            >
              <MessageCircle size={15} />
              Compartilhar pelo WhatsApp
            </a>
            <a
              href={linkPublico}
              target="_blank"
              rel="noopener noreferrer"
              className="pa-btn-open"
            >
              <ExternalLink size={15} />
              Visualizar página
            </a>
          </div>
        </section>

        {/* ── Card lateral — canais ── */}
        <aside className="pa-card pa-tips-card">
          <h3 className="pa-tips-title">Onde divulgar</h3>
          <p className="pa-tips-intro">
            Cole o link nos seus canais para receber agendamentos sem precisar atender manualmente.
          </p>

          <ul className="pa-tips-list">
            <li>
              <div className="pa-tip-icon">
                <AtSign size={15} />
              </div>
              <div>
                <strong>Bio do Instagram</strong>
                <p>Adicione o link na bio do perfil para converter seguidores em clientes.</p>
              </div>
            </li>
            <li>
              <div className="pa-tip-icon">
                <Phone size={15} />
              </div>
              <div>
                <strong>WhatsApp Business</strong>
                <p>Configure o link na mensagem de ausência para atender fora do expediente.</p>
              </div>
            </li>
            <li>
              <div className="pa-tip-icon">
                <Globe size={15} />
              </div>
              <div>
                <strong>Google Meu Negócio</strong>
                <p>Cadastre como link de agendamento na sua ficha do Google.</p>
              </div>
            </li>
          </ul>
        </aside>

      </div>
    </div>
  );
}

export default PaginaAgendamento;
