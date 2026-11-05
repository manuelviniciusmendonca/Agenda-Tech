import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Clock3,
  DollarSign,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function formatarData(data) {
  if (!data) return "-";

  const valor = String(data).slice(0, 10);
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarDataCurta(data) {
  if (!data) return "-";

  const valor = String(data).slice(0, 10);
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date(ano, mes - 1, dia))
    .replace(".", "");
}

function formatarPreco(valor) {
  const preco = Number(valor);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(preco) ? preco : 0);
}

function obterStatus(status) {
  const statusMap = {
    AGENDADO: {
      texto: "Aguardando confirmação",
      classe: "is-pending",
    },
    CONFIRMADO: {
      texto: "Confirmado",
      classe: "is-confirmed",
    },
    CONCLUIDO: {
      texto: "Concluído",
      classe: "is-complete",
    },
    CANCELADO: {
      texto: "Cancelado",
      classe: "is-cancelled",
    },
    FALTOU: {
      texto: "Não compareceu",
      classe: "is-neutral",
    },
  };

  return (
    statusMap[status] || {
      texto: status || "Desconhecido",
      classe: "is-neutral",
    }
  );
}

function flagAtiva(valor) {
  // Campo ausente (backend antigo) é tratado como permitido.
  return valor === undefined || valor === null || Number(valor) === 1;
}

export default function PublicAgendamentoGerenciar() {
  const { slug, token } = useParams();
  const [agendamento, setAgendamento] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modo, setModo] = useState("visualizar");
  const [dataNova, setDataNova] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [horarioNovo, setHorarioNovo] = useState("");
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarAgendamento() {
      try {
        setCarregando(true);
        setErro("");
        const response = await api.get(
          `/public/empresa/${slug}/agendamentos/${token}`,
        );
        if (ativo) setAgendamento(response.data);
      } catch (error) {
        console.error(error);
        if (!ativo) return;
        setErro(
          error.response?.status === 404
            ? "Agendamento não encontrado ou o link não é mais válido."
            : "Não foi possível carregar o agendamento.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarAgendamento();
    return () => {
      ativo = false;
    };
  }, [slug, token]);

  const hoje = new Date();
  const hojeFormatado = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  async function carregarHorarios(data) {
    setDataNova(data);
    setHorarioNovo("");
    setHorarios([]);
    setErro("");
    setSucesso("");

    if (!data || !agendamento) return;

    try {
      setCarregandoHorarios(true);
      const response = await api.get(
        `/disponibilidade/publica/${slug}/servico/${agendamento.servico_id}/profissional/${agendamento.profissional_id}/data/${data}`,
      );
      setHorarios(response.data.horarios_disponiveis || []);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível carregar os horários.",
      );
    } finally {
      setCarregandoHorarios(false);
    }
  }

  async function cancelarAgendamento() {
    try {
      setProcessando(true);
      setErro("");
      setSucesso("");
      await api.post(
        `/public/empresa/${slug}/agendamentos/${token}/cancelar`,
      );
      setAgendamento((atual) => ({ ...atual, status: "CANCELADO" }));
      setConfirmandoCancelamento(false);
      setSucesso(
        "Agendamento cancelado com sucesso. O horário voltou a ficar disponível.",
      );
    } catch (error) {
      console.error(error);
      setConfirmandoCancelamento(false);
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível cancelar o agendamento.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function reagendarAgendamento(event) {
    event.preventDefault();
    if (!dataNova || !horarioNovo) {
      setErro("Escolha uma nova data e horário.");
      return;
    }

    try {
      setProcessando(true);
      setErro("");
      setSucesso("");
      const response = await api.post(
        `/public/empresa/${slug}/agendamentos/${token}/reagendar`,
        { data: dataNova, hora_inicio: horarioNovo },
      );
      setAgendamento((atual) => ({
        ...atual,
        ...response.data.agendamento,
        data: dataNova,
        hora_inicio: horarioNovo,
      }));
      setModo("visualizar");
      setHorarios([]);
      setHorarioNovo("");
      setSucesso("Agendamento reagendado com sucesso.");
    } catch (error) {
      console.error(error);
      if (error.response?.status === 409) {
        setErro("Esse horário acabou de ser ocupado. Escolha outro.");
        await carregarHorarios(dataNova);
      } else {
        setErro(
          error.response?.data?.mensagem ||
            "Não foi possível reagendar o agendamento.",
        );
      }
    } finally {
      setProcessando(false);
    }
  }

  const status = obterStatus(agendamento?.status);
  const podeAlterar =
    agendamento?.status === "AGENDADO" ||
    agendamento?.status === "CONFIRMADO";
  const podeCancelar =
    podeAlterar && flagAtiva(agendamento?.permitir_cancelamento);
  const podeReagendar =
    podeAlterar && flagAtiva(agendamento?.permitir_reagendamento);

  if (carregando) {
    return (
      <div className="public-booking-page manage-booking-page">
        <div className="manage-booking-loading" role="status">
          <span className="public-booking-spinner" />
          Carregando os detalhes do seu agendamento...
        </div>
      </div>
    );
  }

  if (erro && !agendamento) {
    return (
      <div className="public-booking-page manage-booking-page">
        <main className="manage-booking-error-card">
          <span className="manage-booking-error-icon">
            <CalendarDays size={26} />
          </span>
          <p className="public-booking-eyebrow">AGENDA TECH</p>
          <h1>Não encontramos esse agendamento</h1>
          <p>{erro}</p>
          <Link
            to={`/agendar/${slug}`}
            className="confirmation-primary-action"
          >
            Fazer novo agendamento
            <ArrowRight size={17} />
          </Link>
        </main>
      </div>
    );
  }

  const empresaNome =
    agendamento.empresa_nome || agendamento.empresa?.nome || "Agendamento";
  const servicoNome =
    agendamento.servico_nome || agendamento.servico?.nome || "Serviço";
  const profissionalNome =
    agendamento.profissional_nome ||
    agendamento.profissional?.nome ||
    "Profissional";
  const clienteNome =
    agendamento.cliente_nome || agendamento.cliente?.nome || "Cliente";
  const clienteTelefone =
    agendamento.cliente_telefone || agendamento.cliente?.telefone;
  const empresaTelefone = agendamento.empresa_telefone;
  const valor = formatarPreco(
    agendamento.valor ?? agendamento.servico?.preco ?? agendamento.servico_preco,
  );
  const horaInicio = agendamento.hora_inicio?.slice(0, 5) || "--:--";
  const horaFim = agendamento.hora_fim?.slice(0, 5);

  return (
    <div className="public-booking-page manage-booking-page">
      <main className="manage-booking-shell">
        <Link
          to={`/agendar/${slug}/confirmado/${token}`}
          className="manage-booking-back"
        >
          <ArrowLeft size={15} />
          Voltar aos detalhes
        </Link>

        <header className="manage-booking-hero">
          <span className={`manage-booking-mark ${status.classe}`}>
            <CalendarCheck size={26} />
          </span>

          <span className={`manage-booking-status ${status.classe}`}>
            <span className="manage-booking-status-dot" />
            {status.texto}
          </span>

          <h1>Gerenciar agendamento</h1>
          <p>Consulte os detalhes, reagende ou cancele o seu horário.</p>
        </header>

        {erro && (
          <div className="manage-booking-feedback is-error" role="alert">
            <XCircle size={17} />
            <span>{erro}</span>
          </div>
        )}
        {sucesso && (
          <div className="manage-booking-feedback is-success" role="status">
            <ShieldCheck size={17} />
            <span>{sucesso}</span>
          </div>
        )}

        <section className="manage-booking-card">
          <div className="manage-booking-card-heading">
            <div className="manage-booking-company-icon">
              <CalendarCheck size={19} />
            </div>
            <div className="manage-booking-company-info">
              <span>SEU ATENDIMENTO</span>
              <h2>{empresaNome}</h2>
              <p>{servicoNome}</p>
            </div>
            <div
              className="manage-booking-date-badge"
              aria-label="Data do agendamento"
            >
              <CalendarDays size={13} />
              <span>{formatarDataCurta(agendamento.data)}</span>
            </div>
          </div>

          <dl className="manage-booking-details">
            <div className="manage-booking-detail">
              <span className="manage-booking-detail-icon">
                <CalendarDays size={16} />
              </span>
              <div>
                <dt>Data</dt>
                <dd className="manage-booking-capitalize">
                  {formatarData(agendamento.data)}
                </dd>
              </div>
            </div>

            <div className="manage-booking-detail">
              <span className="manage-booking-detail-icon">
                <Clock3 size={16} />
              </span>
              <div>
                <dt>Horário</dt>
                <dd>
                  {horaInicio}
                  {horaFim && (
                    <span className="manage-booking-detail-sep">
                      {" "}
                      às {horaFim}
                    </span>
                  )}
                </dd>
              </div>
            </div>

            <div className="manage-booking-detail">
              <span className="manage-booking-detail-icon">
                <UserRound size={16} />
              </span>
              <div>
                <dt>Profissional</dt>
                <dd>{profissionalNome}</dd>
              </div>
            </div>

            <div className="manage-booking-detail">
              <span className="manage-booking-detail-icon">
                <UserRound size={16} />
              </span>
              <div>
                <dt>Cliente</dt>
                <dd>{clienteNome}</dd>
                {clienteTelefone && (
                  <small>
                    <Phone size={12} />
                    {clienteTelefone}
                  </small>
                )}
              </div>
            </div>
          </dl>

          <div className="manage-booking-total">
            <span>
              <DollarSign size={15} />
              Valor do atendimento
            </span>
            <strong>{valor}</strong>
          </div>

          <div className="manage-booking-actions">
            {podeCancelar || podeReagendar ? (
              <>
                {podeReagendar && (
                  <button
                    type="button"
                    onClick={() => {
                      setModo("reagendar");
                      setErro("");
                      setSucesso("");
                    }}
                    className="manage-booking-reschedule"
                  >
                    <RefreshCw size={16} />
                    Reagendar horário
                  </button>
                )}

                {podeCancelar && (
                  <button
                    type="button"
                    disabled={processando}
                    onClick={() => {
                      setErro("");
                      setSucesso("");
                      setConfirmandoCancelamento(true);
                    }}
                    className="manage-booking-cancel"
                  >
                    <XCircle size={16} />
                    Cancelar agendamento
                  </button>
                )}
              </>
            ) : (
              <div className="manage-booking-locked">
                <ShieldCheck size={18} />
                <p>
                  {podeAlterar
                    ? "Esta empresa não permite alterações por este link."
                    : "Este agendamento não pode mais ser alterado."}
                </p>
              </div>
            )}

            <Link to={`/agendar/${slug}`} className="manage-booking-new-link">
              Fazer novo agendamento
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {modo === "reagendar" && (
          <section className="manage-booking-reschedule-card">
            <div className="manage-booking-reschedule-heading">
              <span className="manage-booking-reschedule-icon">
                <RefreshCw size={18} />
              </span>
              <div>
                <h2>Escolha um novo horário</h2>
                <p>Selecione uma data para consultar os horários disponíveis.</p>
              </div>
            </div>

            <form
              onSubmit={reagendarAgendamento}
              className="manage-booking-form"
            >
              <label className="public-booking-field">
                <span>Nova data</span>
                <input
                  type="date"
                  min={hojeFormatado}
                  value={dataNova}
                  onChange={(event) => carregarHorarios(event.target.value)}
                />
              </label>

              {carregandoHorarios && (
                <div className="public-booking-loading-inline" role="status">
                  <span className="public-booking-spinner" />
                  Consultando horários disponíveis...
                </div>
              )}

              {!carregandoHorarios && dataNova && horarios.length === 0 && (
                <div className="manage-booking-no-times">
                  <Clock3 size={19} />
                  <p>Nenhum horário disponível nesta data.</p>
                </div>
              )}

              {horarios.length > 0 && (
                <fieldset className="manage-booking-time-fieldset">
                  <legend>Novo horário</legend>
                  <div className="public-booking-time-options">
                    {horarios.map((horario) => (
                      <button
                        key={horario}
                        type="button"
                        aria-pressed={horarioNovo === horario}
                        onClick={() => setHorarioNovo(horario)}
                        className={`public-booking-time-option${
                          horarioNovo === horario ? " is-selected" : ""
                        }`}
                      >
                        {horario}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="manage-booking-form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setModo("visualizar");
                    setErro("");
                  }}
                  className="manage-booking-form-back"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={processando || !dataNova || !horarioNovo}
                  className="manage-booking-form-submit"
                >
                  {processando ? "Salvando..." : "Confirmar novo horário"}
                  {!processando && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          </section>
        )}

        <p className="manage-booking-note">
          Precisa de ajuda?{" "}
          {empresaTelefone ? (
            <>
              Fale com {empresaNome} pelo telefone{" "}
              <a href={`tel:${empresaTelefone}`}>
                <Phone size={12} />
                {empresaTelefone}
              </a>
              .
            </>
          ) : (
            <>Entre em contato diretamente com {empresaNome}.</>
          )}
        </p>

        <footer className="public-booking-footer">
          <img src="/logo.png" alt="Agenda Tech" className="public-booking-logo" />
          <span>Agendamento online · Agenda Tech</span>
        </footer>
      </main>

      {confirmandoCancelamento && (
        <div
          className="manage-booking-modal"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget && !processando) {
              setConfirmandoCancelamento(false);
            }
          }}
        >
          <div
            className="manage-booking-modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="manage-cancel-title"
          >
            <span className="manage-booking-modal-icon">
              <AlertTriangle size={24} />
            </span>

            <h2 id="manage-cancel-title">Cancelar agendamento?</h2>
            <p>
              O horário de{" "}
              <strong>
                {formatarDataCurta(agendamento.data)} às {horaInicio}
              </strong>{" "}
              voltará a ficar disponível para outros clientes.
            </p>
            <p className="manage-booking-modal-hint">
              Essa ação não pode ser desfeita.
            </p>

            <div className="manage-booking-modal-actions">
              <button
                type="button"
                className="manage-booking-modal-ghost"
                disabled={processando}
                onClick={() => setConfirmandoCancelamento(false)}
              >
                Manter agendamento
              </button>
              <button
                type="button"
                className="manage-booking-modal-danger"
                disabled={processando}
                onClick={cancelarAgendamento}
              >
                {processando ? "Cancelando..." : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
