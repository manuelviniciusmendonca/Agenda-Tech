import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";
import api from "../services/api";

function formatarValor(valor) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarPercentual(valor) {
  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(Number(valor) || 0)}%`;
}

function formatarHora(hora) {
  return hora ? String(hora).slice(0, 5) : "--:--";
}

function nomeStatus(status) {
  return {
    AGENDADO: "Agendado",
    CONFIRMADO: "Confirmado",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
    FALTOU: "Faltou",
  }[status] || status;
}

function Dashboard() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const controllerRef = useRef(null);

  const buscarDadosDashboard = useCallback(async (signal) => {
    const response = await api.get("/dashboard/resumo", { signal });

    if (
      !response.data ||
      typeof response.data !== "object" ||
      !Array.isArray(response.data.proximos_agendamentos)
    ) {
      throw new Error("A resposta do dashboard está em formato inválido.");
    }

    return response.data;
  }, []);

  const carregarDashboard = useCallback(async (atualizacaoManual = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    if (atualizacaoManual) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }
    setErro("");
    try {
      const resultado = await buscarDadosDashboard(controller.signal);
      if (!controller.signal.aborted) setDados(resultado);
    } catch (error) {
      if (!controller.signal.aborted && error.name !== "AbortError") {
        setErro(
          error.response?.data?.mensagem ||
            error.message ||
            "Não foi possível carregar o dashboard.",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
        setAtualizando(false);
      }
    }
  }, [buscarDadosDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    buscarDadosDashboard(controller.signal)
      .then((resposta) => {
        if (!controller.signal.aborted) {
          setDados(resposta);
          setErro("");
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setErro(
            error.response?.data?.mensagem ||
              error.message ||
              "Não foi possível carregar o dashboard.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => {
      controllerRef.current?.abort();
    };
  }, [buscarDadosDashboard]);

  const metricas = [
    {
      titulo: "Agendamentos hoje",
      valor: dados?.agendamentos_hoje,
      Icone: CalendarDays,
    },
    {
      titulo: "Faturamento hoje",
      valor: formatarValor(dados?.faturamento_hoje),
      Icone: DollarSign,
    },
    {
      titulo: "Confirmados hoje",
      valor: dados?.confirmados_hoje,
      Icone: CheckCircle2,
    },
    {
      titulo: "Clientes no funil",
      valor: dados?.clientes_para_recuperar,
      Icone: UserRoundCheck,
      destaque: true,
    },
    {
      titulo: "Taxa de comparecimento",
      valor: formatarPercentual(dados?.taxa_comparecimento),
      Icone: TrendingUp,
    },
  ];
  const proximosAgendamentos = dados?.proximos_agendamentos || [];
  const dashboardVazio =
    !carregando &&
    dados &&
    [
      dados.agendamentos_hoje,
      dados.faturamento_hoje,
      dados.confirmados_hoje,
      dados.clientes_para_recuperar,
      dados.taxa_comparecimento,
    ].every((valor) => Number(valor) === 0) &&
    proximosAgendamentos.length === 0;

  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-page-header">
        <div>
          <p className="eyebrow">VISÃO GERAL</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Acompanhe os indicadores e atendimentos de hoje.
          </p>
        </div>
        <button
          type="button"
          className="dashboard-refresh-button"
          onClick={() => carregarDashboard(true)}
          disabled={carregando || atualizando}
        >
          <RefreshCw
            size={15}
            className={atualizando ? "dashboard-refresh-spinning" : ""}
          />
          {atualizando ? "Atualizando..." : "Atualizar"}
        </button>
      </header>

      {erro && (
        <div className="dashboard-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={() => carregarDashboard()}>
            Tentar novamente
          </button>
        </div>
      )}

      <section className="dashboard-metrics" aria-label="Resumo do dia">
        {carregando && !dados
          ? metricas.map((metrica) => (
              <div
                className="dashboard-metric dashboard-metric-skeleton"
                key={metrica.titulo}
                aria-hidden="true"
              >
                <span />
                <strong />
                <div />
              </div>
            ))
          : dados &&
            metricas.map(({ titulo, valor, Icone, destaque }) => (
              <article
                className={`dashboard-metric ${
                  destaque ? "dashboard-metric-highlight" : ""
                }`}
                key={titulo}
              >
                <div className="dashboard-metric-heading">
                  <span>{titulo}</span>
                  <span className="dashboard-metric-icon">
                    <Icone size={18} />
                  </span>
                </div>
                <strong>{valor}</strong>
              </article>
            ))}
      </section>

      <section className="dashboard-card dashboard-appointments-card">
        <div className="card-header">
          <div>
            <h2>Próximos agendamentos</h2>
            <p>Agenda de hoje</p>
          </div>
          <button
            type="button"
            className="text-button"
            onClick={() => navigate("/agenda")}
          >
            Ver agenda
          </button>
        </div>

        {carregando && !dados ? (
          <div className="dashboard-appointments-loading" role="status">
            <Clock3 size={17} />
            Carregando agendamentos...
          </div>
        ) : proximosAgendamentos.length > 0 ? (
          <div className="dashboard-appointments-list">
            {proximosAgendamentos.map((agendamento) => (
              <button
                type="button"
                className="dashboard-appointment"
                key={agendamento.id}
                onClick={() => navigate("/agenda")}
              >
                <span className="dashboard-appointment-time">
                  {formatarHora(agendamento.hora_inicio)}
                  <span>—</span>
                  {formatarHora(agendamento.hora_fim)}
                </span>
                <span className="dashboard-appointment-main">
                  <strong>{agendamento.cliente_nome}</strong>
                  <span>{agendamento.servico_nome}</span>
                </span>
                <span className="dashboard-appointment-professional">
                  {agendamento.profissional_nome}
                </span>
                <strong className="dashboard-appointment-value">
                  {formatarValor(agendamento.valor)}
                </strong>
                <span
                  className={`dashboard-status dashboard-status-${String(
                    agendamento.status,
                  ).toLowerCase()}`}
                >
                  {nomeStatus(agendamento.status)}
                </span>
              </button>
            ))}
          </div>
        ) : erro ? null : (
          <div className="dashboard-empty">
            <span className="dashboard-empty-icon">
              <CalendarDays size={20} />
            </span>
            <strong>
              {dashboardVazio
                ? "Seu dashboard ainda não tem dados para hoje"
                : "Nenhum agendamento para exibir"}
            </strong>
            <span>
              {dashboardVazio
                ? "Os indicadores serão atualizados conforme a atividade da empresa."
                : "Os próximos agendamentos de hoje aparecerão aqui."}
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
