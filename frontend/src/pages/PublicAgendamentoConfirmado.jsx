import { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarCheck2,
  CalendarX2,
  Check,
  Clock,
  Copy,
  DollarSign,
  Link2,
  Loader,
  MapPin,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatarData(data) {
  if (!data) return "—";
  const valor = String(data).slice(0, 10);
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarDataCurta(data) {
  if (!data) return "—";
  const valor = String(data).slice(0, 10);
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarPreco(valor) {
  const preco = Number(valor);
  if (!Number.isFinite(preco)) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);
}

// ─── Mapeamento de status ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
  AGENDADO: {
    texto: "Aguardando confirmação",
    descricao: "A empresa irá confirmar em breve.",
    cor: "pending",
  },
  CONFIRMADO: {
    texto: "Confirmado",
    descricao: "Seu atendimento está confirmado.",
    cor: "confirmed",
  },
  CONCLUIDO: {
    texto: "Atendimento concluído",
    descricao: "Este atendimento já foi realizado.",
    cor: "done",
  },
  CANCELADO: {
    texto: "Cancelado",
    descricao: "Este agendamento foi cancelado.",
    cor: "cancelled",
  },
  FALTOU: {
    texto: "Não compareceu",
    descricao: "O cliente não compareceu ao atendimento.",
    cor: "cancelled",
  },
};

// ─── Loading ──────────────────────────────────────────────────────────────────

function Carregando() {
  return (
    <div className="conf-page">
      <div className="conf-loading" role="status" aria-label="Carregando">
        <div className="conf-loading-icon">
          <Loader size={24} className="conf-spin" />
        </div>
        <p>Carregando os detalhes do seu agendamento…</p>
      </div>
    </div>
  );
}

// ─── Erro / não encontrado ────────────────────────────────────────────────────

function PaginaErro({ slug, mensagem }) {
  return (
    <div className="conf-page">
      <div className="conf-shell">
        <div className="conf-not-found">
          <div className="conf-not-found-icon">
            <CalendarX2 size={32} />
          </div>
          <p className="conf-eyebrow">AGENDA TECH</p>
          <h1>Agendamento não encontrado</h1>
          <p>
            {mensagem || "Não foi possível localizar este agendamento. O link pode ter expirado."}
          </p>
          <Link to={`/agendar/${slug}`} className="conf-action-primary">
            Fazer um novo agendamento
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PublicAgendamentoConfirmado() {
  const { slug, token } = useParams();
  const [agendamento, setAgendamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const response = await api.get(
          `/public/empresa/${slug}/agendamentos/${token}`,
        );
        if (ativo) setAgendamento(response.data);
      } catch (error) {
        if (!ativo) return;
        setErro(
          error.response?.status === 404
            ? "Agendamento não encontrado ou o link não é mais válido."
            : "Não foi possível carregar os dados do agendamento.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, [slug, token]);

  if (carregando) return <Carregando />;
  if (erro || !agendamento) return <PaginaErro slug={slug} mensagem={erro} />;

  // ── Dados derivados ──────────────────────────────────────────────────────────
  const statusInfo = STATUS_CONFIG[agendamento.status] ?? {
    texto: "Solicitação recebida",
    descricao: "",
    cor: "pending",
  };

  const estaAtivo =
    agendamento.status === "AGENDADO" || agendamento.status === "CONFIRMADO";
  const aguardando = agendamento.status === "AGENDADO";
  const cancelado =
    agendamento.status === "CANCELADO" || agendamento.status === "FALTOU";

  const empresaNome =
    agendamento.empresa_nome ?? agendamento.empresa?.nome ?? "Empresa";
  const servicoNome =
    agendamento.servico_nome ?? agendamento.servico?.nome ?? "Serviço";
  const profissionalNome =
    agendamento.profissional_nome ?? agendamento.profissional?.nome ?? "Profissional";
  const clienteNome =
    agendamento.cliente_nome ?? agendamento.cliente?.nome;
  const empresaEndereco =
    agendamento.empresa_endereco ?? agendamento.empresa?.endereco;
  const horaInicio = agendamento.hora_inicio?.slice(0, 5);
  const horaFim = agendamento.hora_fim?.slice(0, 5);
  const valor = formatarPreco(
    agendamento.valor ?? agendamento.servico?.preco ?? agendamento.servico_preco,
  );

  // ── Link de acesso ao agendamento ──────────────────────────────────────────
  const linkGerenciamento = `${window.location.origin}/agendar/${slug}/agendamento/${token}`;

  function copiarComSelecao() {
    const campo = document.createElement("textarea");
    campo.value = linkGerenciamento;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.top = "-1000px";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.focus();
    campo.select();

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      document.body.removeChild(campo);
    }
  }

  async function copiarLink() {
    let copiou = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(linkGerenciamento);
        copiou = true;
      }
    } catch {
      // Sem permissão de clipboard: cai no fallback de seleção abaixo.
    }

    if (!copiou) copiou = copiarComSelecao();

    if (copiou) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
      return;
    }

    window.prompt("Copie o link do seu agendamento:", linkGerenciamento);
  }

  return (
    <div className="conf-page">
      <div className="conf-shell">

        {/* ── Hero ── */}
        <header className="conf-hero">
          {/* Ícone central animado */}
          <div className={`conf-hero-mark conf-hero-mark-${statusInfo.cor}`}>
            {cancelado ? (
              <CalendarX2 size={30} strokeWidth={2} />
            ) : aguardando ? (
              <Clock size={30} strokeWidth={2} />
            ) : (
              <Check size={30} strokeWidth={2.5} />
            )}
          </div>

          {/* Status pill */}
          <div className={`conf-status-pill conf-status-pill-${statusInfo.cor}`}>
            <span className="conf-status-dot" />
            {statusInfo.texto}
          </div>

          <h1 className="conf-hero-title">
            {cancelado
              ? "Agendamento cancelado"
              : aguardando
              ? "Tudo certo!"
              : "Agendamento confirmado"}
          </h1>

          <p className="conf-hero-subtitle">
            {cancelado
              ? statusInfo.descricao
              : aguardando
              ? `Sua solicitação para ${empresaNome} foi recebida. Confira os detalhes abaixo.`
              : `Seu atendimento em ${empresaNome} está confirmado.`}
          </p>
        </header>

        {/* ── Card principal ── */}
        <section className="conf-card" aria-label="Detalhes do agendamento">

          {/* Cabeçalho do card */}
          <div className="conf-card-top">
            <div className="conf-card-company-icon" aria-hidden="true">
              <CalendarCheck2 size={20} />
            </div>
            <div className="conf-card-company-info">
              <span className="conf-eyebrow">SEU ATENDIMENTO</span>
              <strong className="conf-card-company-name">{empresaNome}</strong>
            </div>
            {/* Data em destaque — visível no topo do card */}
            <div className="conf-card-date-badge" aria-label="Data do agendamento">
              <Calendar size={13} />
              <span>{formatarDataCurta(agendamento.data)}</span>
            </div>
          </div>

          {/* Grade de detalhes */}
          <dl className="conf-details">
            <div className="conf-detail">
              <div className="conf-detail-icon" aria-hidden="true">
                <Calendar size={16} />
              </div>
              <dt>Data</dt>
              <dd className="conf-capitalize">{formatarData(agendamento.data)}</dd>
            </div>

            <div className="conf-detail">
              <div className="conf-detail-icon" aria-hidden="true">
                <Clock size={16} />
              </div>
              <dt>Horário</dt>
              <dd>
                {horaInicio || "—"}
                {horaFim ? <span className="conf-detail-sep"> às {horaFim}</span> : null}
              </dd>
            </div>

            <div className="conf-detail">
              <div className="conf-detail-icon" aria-hidden="true">
                <Sparkles size={16} />
              </div>
              <dt>Serviço</dt>
              <dd>{servicoNome}</dd>
            </div>

            <div className="conf-detail">
              <div className="conf-detail-icon" aria-hidden="true">
                <User size={16} />
              </div>
              <dt>Profissional</dt>
              <dd>{profissionalNome}</dd>
            </div>

            {clienteNome && (
              <div className="conf-detail">
                <div className="conf-detail-icon" aria-hidden="true">
                  <User size={16} />
                </div>
                <dt>Cliente</dt>
                <dd>{clienteNome}</dd>
              </div>
            )}

            {empresaEndereco && (
              <div className="conf-detail conf-detail-wide">
                <div className="conf-detail-icon" aria-hidden="true">
                  <MapPin size={16} />
                </div>
                <dt>Endereço</dt>
                <dd>{empresaEndereco}</dd>
              </div>
            )}
          </dl>

          {/* Valor */}
          {valor && (
            <div className="conf-total">
              <div className="conf-total-label">
                <DollarSign size={15} aria-hidden="true" />
                Valor do atendimento
              </div>
              <span className="conf-total-value">{valor}</span>
            </div>
          )}
        </section>

        {/* ── Ações ── */}
        <div className="conf-actions">
          <Link
            to={`/agendar/${slug}/agendamento/${token}`}
            className="conf-action-manage"
          >
            <Settings2 size={16} />
            Gerenciar agendamento
          </Link>

          {estaAtivo && (
            <section className="conf-link" aria-label="Link do seu agendamento">
              <span className="conf-link-icon" aria-hidden="true">
                <Link2 size={18} />
              </span>

              <div className="conf-link-body">
                <strong>Guarde o link do seu agendamento</strong>
                <p>
                  Com ele você consulta, remarca ou cancela seu horário a
                  qualquer momento. O link é exclusivo do seu agendamento e não
                  dá acesso aos dados de outros clientes.
                </p>

                <div className="conf-link-field">
                  <span title={linkGerenciamento}>{linkGerenciamento}</span>
                  <button
                    type="button"
                    onClick={copiarLink}
                    className={`conf-link-copy${copiado ? " is-copied" : ""}`}
                  >
                    {copiado ? <Check size={15} /> : <Copy size={15} />}
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            </section>
          )}

          {!cancelado && (
            <Link
              to={`/agendar/${slug}`}
              className="conf-action-new"
            >
              Fazer outro agendamento
              <ArrowRight size={15} />
            </Link>
          )}

          {cancelado && (
            <Link
              to={`/agendar/${slug}`}
              className="conf-action-primary"
            >
              Fazer um novo agendamento
              <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="conf-footer">
          <img src="/logo.png" alt="Agenda Tech" className="conf-footer-logo" />
          <span>Agendamento online seguro via <strong>Agenda Tech</strong></span>
        </footer>
      </div>
    </div>
  );
}
