import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

function dataLocal(date = new Date()) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarHora(hora) {
  return hora ? String(hora).slice(0, 5) : "--:--";
}

function InicioProfissional() {
  const { usuario } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarAgenda = useCallback(async (signal) => {
    const response = await api.get(
      `/agendamentos?data=${encodeURIComponent(dataLocal())}`,
      { signal },
    );
    if (!Array.isArray(response.data)) {
      throw new Error("A resposta da agenda está em formato inválido.");
    }
    return response.data;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    carregarAgenda(controller.signal)
      .then((resultado) => {
        if (!controller.signal.aborted) setAgendamentos(resultado);
      })
      .catch((error) => {
        if (!controller.signal.aborted && error.name !== "AbortError") {
          setErro(
            error.response?.data?.mensagem ||
              error.message ||
              "Não foi possível carregar sua agenda.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false);
      });

    return () => controller.abort();
  }, [carregarAgenda]);

  const agendamentosAtivos = agendamentos.filter(
    (item) => !["CANCELADO", "FALTOU"].includes(item.status),
  );
  const agora = new Date().toTimeString().slice(0, 5);
  const proximosAtendimentos = agendamentosAtivos
    .filter((item) => String(item.hora_inicio).slice(0, 5) >= agora)
    .slice(0, 5);
  const proximo = proximosAtendimentos[0];

  return (
    <div className="professional-home">
      <header className="page-header professional-home-header">
        <div>
          <p className="eyebrow">ÁREA DO PROFISSIONAL</p>
          <h1>Olá, {usuario?.nome || "profissional"}</h1>
          <p className="page-description">
            Aqui está o resumo dos seus atendimentos de hoje.
          </p>
        </div>
      </header>

      {erro && (
        <div className="agenda-error" role="alert">
          {erro}
        </div>
      )}

      <section className="professional-home-summary" aria-label="Resumo do dia">
        <article className="professional-home-card">
          <span className="professional-home-icon"><CalendarDays size={18} /></span>
          <div>
            <span>Atendimentos de hoje</span>
            <strong>{carregando ? "—" : agendamentosAtivos.length}</strong>
          </div>
        </article>
        <article className="professional-home-card">
          <span className="professional-home-icon"><Clock3 size={18} /></span>
          <div>
            <span>Próximo horário</span>
            <strong>{carregando ? "—" : proximo ? formatarHora(proximo.hora_inicio) : "Sem próximos"}</strong>
          </div>
        </article>
        <article className="professional-home-card professional-home-next">
          <span className="professional-home-icon"><UserRound size={18} /></span>
          <div>
            <span>Próximo cliente</span>
            <strong>{carregando ? "Carregando..." : proximo?.cliente_nome || "Nenhum atendimento próximo"}</strong>
            {proximo && <small>{proximo.servico_nome}</small>}
          </div>
        </article>
      </section>

      <section className="professional-home-appointments">
        <div className="professional-home-section-heading">
          <div>
            <p className="eyebrow">AGENDA DE HOJE</p>
            <h2>Próximos atendimentos</h2>
          </div>
          <Link to="/agenda">Ver minha agenda</Link>
        </div>

        {carregando ? (
          <div className="professional-home-empty" role="status">Carregando sua agenda...</div>
        ) : proximosAtendimentos.length ? (
          <div className="professional-home-list">
            {proximosAtendimentos.map((item) => (
              <article className="professional-home-appointment" key={item.id}>
                <strong>{formatarHora(item.hora_inicio)}</strong>
                <div>
                  <b>{item.cliente_nome}</b>
                  <span>{item.servico_nome}</span>
                </div>
                <span className={`agenda-status agenda-status-${String(item.status).toLowerCase()}`}>
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        ) : (
          <div className="professional-home-empty">
            Não há mais atendimentos previstos para hoje.
          </div>
        )}
      </section>
    </div>
  );
}

export default InicioProfissional;
