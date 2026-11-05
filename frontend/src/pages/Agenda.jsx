import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Eye,
  LoaderCircle,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/useAuth";

function dataLocal(date = new Date()) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarDataAgendamento(data) {
  const valor = String(data || "").slice(0, 10);
  const [ano, mes, dia] = valor.split("-").map(Number);
  if (!ano || !mes || !dia) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function formatarHora(hora) {
  return hora ? String(hora).slice(0, 5) : "--:--";
}

function formatarValor(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(numero)
    : "—";
}

function mensagemDeErro(error, fallback) {
  const status = error.response?.status;

  if (status === 400) {
    return error.response.data.mensagem || "Confira os dados informados.";
  }
  if (status === 403) {
    return "Você não tem permissão para realizar esta ação.";
  }
  if (status === 404) {
    return error.response.data.mensagem ||
      "Um dos dados selecionados não foi encontrado.";
  }
  if (status === 409) {
    return "Este horário acabou de ser ocupado. Atualize a disponibilidade e escolha outro horário.";
  }
  if (status >= 500) {
    return "Ocorreu um erro no servidor. Tente novamente.";
  }

  return error.response?.data?.mensagem || fallback;
}

function Agenda() {
  const { usuario } = useAuth();
  const [dataSelecionada, setDataSelecionada] = useState(dataLocal);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgenda, setCarregandoAgenda] = useState(true);
  const [erroAgenda, setErroAgenda] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [agendamentoSelecionadoId, setAgendamentoSelecionadoId] = useState(null);
  const [agendamentoParaConcluirId, setAgendamentoParaConcluirId] = useState(null);
  const [atualizandoStatusId, setAtualizandoStatusId] = useState(null);
  const [erroStatus, setErroStatus] = useState("");

  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [carregandoServicos, setCarregandoServicos] = useState(false);
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [dataFormulario, setDataFormulario] = useState(dataLocal);
  const [horaInicio, setHoraInicio] = useState("");
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);

  useEffect(() => {
    let ativo = true;

    api
      .get(`/agendamentos?data=${encodeURIComponent(dataSelecionada)}`)
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error("A resposta da agenda está em formato inválido.");
        }
        if (ativo) {
          setAgendamentos(response.data);
          setErroAgenda("");
        }
      })
      .catch((error) => {
        if (ativo) {
          setErroAgenda(
            mensagemDeErro(error, "Não foi possível carregar a agenda."),
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoAgenda(false);
      });

    return () => {
      ativo = false;
    };
  }, [dataSelecionada]);

  useEffect(() => {
    if (!modalAberto || !profissionalId || !servicoId || !dataFormulario) {
      return undefined;
    }

    let ativo = true;

    const parametros = new URLSearchParams({
      profissional_id: profissionalId,
      servico_id: servicoId,
      data: dataFormulario,
    });

    api
      .get(`/disponibilidade?${parametros.toString()}`)
      .then((response) => {
        if (!Array.isArray(response.data?.horarios_disponiveis)) {
          throw new Error(
            "A resposta de disponibilidade está em formato inválido.",
          );
        }
        if (ativo) {
          setHorariosDisponiveis(response.data.horarios_disponiveis);
        }
      })
      .catch((error) => {
        if (ativo) {
          setErroFormulario(
            mensagemDeErro(
              error,
              "Não foi possível consultar os horários disponíveis.",
            ),
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoHorarios(false);
      });

    return () => {
      ativo = false;
    };
  }, [
    modalAberto,
    profissionalId,
    servicoId,
    dataFormulario,
  ]);

  function mudarData(dias) {
    const [ano, mes, dia] = dataSelecionada.split("-").map(Number);
    const novaData = new Date(ano, mes - 1, dia);
    novaData.setDate(novaData.getDate() + dias);
    setMensagemSucesso("");
    setErroAgenda("");
    setCarregandoAgenda(true);
    setDataSelecionada(dataLocal(novaData));
  }

  function irParaHoje() {
    const hoje = dataLocal();
    setMensagemSucesso("");
    setErroAgenda("");
    if (dataSelecionada === hoje) {
      recarregarAgendamentos(hoje);
      return;
    }
    setCarregandoAgenda(true);
    setDataSelecionada(hoje);
  }

  async function recarregarAgendamentos(data = dataSelecionada) {
    setCarregandoAgenda(true);
    try {
      const response = await api.get(
        `/agendamentos?data=${encodeURIComponent(data)}`,
      );
      if (!Array.isArray(response.data)) {
        throw new Error("A resposta da agenda está em formato inválido.");
      }
      setAgendamentos(response.data);
      setErroAgenda("");
    } catch (error) {
      setErroAgenda(
        mensagemDeErro(error, "Não foi possível carregar a agenda."),
      );
    } finally {
      setCarregandoAgenda(false);
    }
  }

  async function abrirNovoAgendamento() {
    setModalAberto(true);
    setErroFormulario("");
    setMensagemSucesso("");
    setClienteId("");
    setServicoId("");
    setProfissionalId("");
    setDataFormulario(dataSelecionada);
    setHoraInicio("");
    setHorariosDisponiveis([]);
    setCarregandoHorarios(false);
    setClientes([]);
    setServicos([]);
    setProfissionais([]);
    setCarregandoClientes(true);
    setCarregandoServicos(true);
    setCarregandoProfissionais(true);

    const carregarClientes = api
      .get("/clientes")
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error("A resposta dos clientes está em formato inválido.");
        }
        setClientes(response.data);
      })
      .catch((error) => {
        setErroFormulario(
          mensagemDeErro(
            error,
            error.message || "Não foi possível carregar os clientes.",
          ),
        );
      })
      .finally(() => setCarregandoClientes(false));

    const carregarServicos = api
      .get("/servicos")
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error("A resposta dos serviços está em formato inválido.");
        }
        setServicos(response.data.filter((servico) => Boolean(servico.ativo)));
      })
      .catch((error) => {
        setErroFormulario(
          mensagemDeErro(
            error,
            error.message || "Não foi possível carregar os serviços.",
          ),
        );
      })
      .finally(() => setCarregandoServicos(false));

    const carregarProfissionais = api
      .get("/profissionais")
      .then(async (response) => {
        if (!Array.isArray(response.data)) {
          throw new Error(
            "A resposta dos profissionais está em formato inválido.",
          );
        }
        const ativos = response.data.filter((profissional) =>
          Boolean(profissional.ativo),
        );
        const comServicos = await Promise.all(
          ativos.map(async (profissional) => {
            const vinculos = await api.get(
              `/profissional-servicos/profissional/${profissional.id}`,
            );
            if (!Array.isArray(vinculos.data)) {
              throw new Error(
                "A resposta dos vínculos de serviços está em formato inválido.",
              );
            }
            return {
              ...profissional,
              servicoIds: vinculos.data.map((servico) => String(servico.id)),
            };
          }),
        );

        const escopoProfissional =
          usuario?.role === "PROFISSIONAL"
            ? comServicos.filter(
                (profissional) =>
                  Number(profissional.usuario_id) ===
                  Number(usuario.usuario_id ?? usuario.id),
              )
            : comServicos;

        setProfissionais(escopoProfissional);
        if (
          usuario?.role === "PROFISSIONAL" &&
          escopoProfissional.length === 1
        ) {
          setProfissionalId(String(escopoProfissional[0].id));
        }
      })
      .catch((error) => {
        setErroFormulario(
          mensagemDeErro(
            error,
            error.message || "Não foi possível carregar os profissionais.",
          ),
        );
      })
      .finally(() => setCarregandoProfissionais(false));

    await Promise.all([
      carregarClientes,
      carregarServicos,
      carregarProfissionais,
    ]);
  }

  const profissionaisDisponiveis = profissionais.filter(
    (profissional) =>
      !servicoId || profissional.servicoIds?.includes(String(servicoId)),
  );

  function atualizarServico(value) {
    const profissionalMantido =
      profissionalId &&
      profissionais.some(
        (profissional) =>
          String(profissional.id) === profissionalId &&
          profissional.servicoIds?.includes(String(value)),
      );

    setErroFormulario("");
    setCarregandoHorarios(
      Boolean(value && profissionalMantido && dataFormulario),
    );
    setServicoId(value);
    if (!profissionalMantido) {
      setProfissionalId("");
    }
    setHoraInicio("");
    setHorariosDisponiveis([]);
  }

  async function criarAgendamento(event) {
    event.preventDefault();
    setErroFormulario("");

    if (!clienteId || !servicoId || !profissionalId || !horaInicio) {
      setErroFormulario("Selecione cliente, serviço, profissional e horário.");
      return;
    }

    try {
      setSalvando(true);
      await api.post("/agendamentos", {
        cliente_id: Number(clienteId),
        profissional_id: Number(profissionalId),
        servico_id: Number(servicoId),
        data: dataFormulario,
        hora_inicio: horaInicio,
      });

      setModalAberto(false);
      setMensagemSucesso("Agendamento criado com sucesso.");

      if (dataFormulario === dataSelecionada) {
        await recarregarAgendamentos(dataFormulario);
      } else {
        setDataSelecionada(dataFormulario);
        setCarregandoAgenda(true);
      }
    } catch (error) {
      const mensagem = mensagemDeErro(
        error,
        "Não foi possível criar o agendamento.",
      );
      setErroFormulario(mensagem);

      if (error.response?.status === 409) {
        const parametros = new URLSearchParams({
          profissional_id: profissionalId,
          servico_id: servicoId,
          data: dataFormulario,
        });

        try {
          const response = await api.get(
            `/disponibilidade?${parametros.toString()}`,
          );
          if (!Array.isArray(response.data?.horarios_disponiveis)) {
            setErroFormulario(
              "A resposta de disponibilidade está em formato inválido.",
            );
            return;
          }
          setHorariosDisponiveis(response.data.horarios_disponiveis);
          setHoraInicio("");
        } catch (disponibilidadeError) {
          setErroFormulario(
            mensagemDeErro(
              disponibilidadeError,
              "O horário foi ocupado e não foi possível atualizar a disponibilidade.",
            ),
          );
        }
      }
    } finally {
      setSalvando(false);
    }
  }

  async function aplicarStatus(agendamento, status) {
    setErroStatus("");
    setMensagemSucesso("");
    setAtualizandoStatusId(agendamento.id);

    try {
      if (status === "CANCELADO") {
        await api.put(`/agendamentos/${agendamento.id}/cancelar`);
      } else {
        await api.put(`/agendamentos/${agendamento.id}/status`, { status });
      }

      setAgendamentos((atuais) =>
        atuais.map((item) =>
          item.id === agendamento.id ? { ...item, status } : item,
        ),
      );
      setMensagemSucesso(
        `Agendamento ${nomeStatus(status).toLowerCase()} com sucesso.`,
      );
      return true;
    } catch (error) {
      setErroStatus(
        mensagemDeErro(error, "Não foi possível atualizar o agendamento."),
      );
      return false;
    } finally {
      setAtualizandoStatusId(null);
    }
  }

  async function atualizarStatus(agendamento, status) {
    if (atualizandoStatusId) return;

    // Concluir passa por uma confirmação com o resumo do atendimento
    if (status === "CONCLUIDO") {
      setErroStatus("");
      setMensagemSucesso("");
      setAgendamentoParaConcluirId(agendamento.id);
      return;
    }

    if (
      status === "CANCELADO" &&
      !window.confirm(
        `Cancelar o agendamento de ${agendamento.cliente_nome}?`,
      )
    ) {
      return;
    }

    await aplicarStatus(agendamento, status);
  }

  async function confirmarConclusao() {
    if (!agendamentoParaConcluir || atualizandoStatusId) return;

    const concluiu = await aplicarStatus(agendamentoParaConcluir, "CONCLUIDO");

    if (concluiu) {
      setAgendamentoParaConcluirId(null);
      setAgendamentoSelecionadoId(null);
      setErroStatus("");
    }
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

  const agendamentoSelecionado = agendamentos.find(
    (agendamento) => agendamento.id === agendamentoSelecionadoId,
  );

  const agendamentoParaConcluir = agendamentos.find(
    (agendamento) => agendamento.id === agendamentoParaConcluirId,
  );

  function renderStatus(agendamento) {
    const Icone =
      agendamento.status === "CONCLUIDO"
        ? CircleCheck
        : agendamento.status === "FALTOU"
          ? AlertTriangle
          : null;

    return (
      <span
        className={`agenda-status agenda-status-${String(
          agendamento.status,
        ).toLowerCase()}`}
      >
        {Icone && <Icone size={12} />}
        {nomeStatus(agendamento.status)}
      </span>
    );
  }

  function renderAcoesStatus(agendamento) {
    const atualizando = atualizandoStatusId === agendamento.id;
    const botao = (status, label, className = "") => (
      <button
        type="button"
        className={`agenda-status-action ${className}`}
        onClick={() => atualizarStatus(agendamento, status)}
        disabled={atualizando}
      >
        {atualizando ? (
          <LoaderCircle size={15} className="agenda-spinner" />
        ) : status === "CONFIRMADO" ? (
          <Check size={15} />
        ) : status === "CONCLUIDO" ? (
          <CircleCheck size={15} />
        ) : status === "FALTOU" ? (
          <AlertTriangle size={15} />
        ) : status === "CANCELADO" ? (
          <X size={15} />
        ) : null}
        {atualizando ? "Atualizando..." : label}
      </button>
    );

    if (agendamento.status === "AGENDADO") {
      return (
        <>
          {botao("CONFIRMADO", "Confirmar", "agenda-action-primary")}
          {botao("CANCELADO", "Cancelar", "agenda-action-danger")}
        </>
      );
    }

    if (agendamento.status === "CONFIRMADO") {
      return (
        <>
          {botao("CONCLUIDO", "Concluir", "agenda-action-primary")}
          {botao("FALTOU", "Marcar falta")}
          {botao("CANCELADO", "Cancelar", "agenda-action-danger")}
        </>
      );
    }

    return null;
  }

  return (
    <div className="page-content">
      <header className="page-header agenda-page-header">
        <div>
          <p className="eyebrow">ROTINA DO DIA</p>
          <h1>Agenda</h1>
          <p className="page-description">
            Acompanhe os atendimentos da sua empresa.
          </p>
        </div>
        <button
          type="button"
          className="primary-button agenda-new-button"
          onClick={abrirNovoAgendamento}
        >
          <Plus size={16} />
          Novo agendamento
        </button>
      </header>

      <section className="agenda-daybar" aria-label="Navegação por data">
        <div className="agenda-date-label">
          <CalendarDays size={18} />
          <span>{formatarData(dataSelecionada)}</span>
        </div>
        <div className="agenda-date-controls">
          <button
            type="button"
            className="agenda-today-button"
            onClick={irParaHoje}
          >
            Hoje
          </button>
          <button
            type="button"
            className="agenda-date-arrow"
            aria-label="Dia anterior"
            onClick={() => mudarData(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="agenda-date-arrow"
            aria-label="Próximo dia"
            onClick={() => mudarData(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {mensagemSucesso && (
        <div className="agenda-success" role="status">
          {mensagemSucesso}
        </div>
      )}

      {erroAgenda && (
        <div className="agenda-error" role="alert">
          <span>{erroAgenda}</span>
          <button
            type="button"
            onClick={() => recarregarAgendamentos()}
          >
            Tentar novamente
          </button>
        </div>
      )}

      <section className="agenda-list" aria-label="Agendamentos do dia">
        {carregandoAgenda ? (
          <div className="agenda-state" role="status">
            <LoaderCircle size={21} className="agenda-spinner" />
            Carregando agenda...
          </div>
        ) : !erroAgenda && agendamentos.length === 0 ? (
          <div className="agenda-empty">
            <div className="agenda-empty-icon">
              <CalendarDays size={22} />
            </div>
            <h2>Nenhum agendamento neste dia</h2>
            <p>Seus atendimentos aparecerão aqui quando forem agendados.</p>
            <button
              type="button"
              className="primary-button agenda-new-button"
              onClick={abrirNovoAgendamento}
            >
              <Plus size={16} />
              Novo agendamento
            </button>
          </div>
        ) : (
          agendamentos.map((agendamento) => (
            <article className="agenda-appointment" key={agendamento.id}>
              <div className="agenda-time-range">
                <strong>{formatarHora(agendamento.hora_inicio)}</strong>
                <span>{formatarHora(agendamento.hora_fim)}</span>
              </div>
              <div className="agenda-appointment-main">
                <div className="agenda-appointment-title">
                  <h2>{agendamento.cliente_nome}</h2>
                  {renderStatus(agendamento)}
                </div>
                {agendamento.cliente_telefone && (
                  <p className="agenda-client-phone">
                    {agendamento.cliente_telefone}
                  </p>
                )}
                <div className="agenda-appointment-meta">
                  <span>{agendamento.servico_nome}</span>
                  <span>
                    <UserRound size={13} />
                    {agendamento.profissional_nome}
                  </span>
                </div>
              </div>
              <div className="agenda-appointment-value">
                <span>Valor</span>
                <strong>{formatarValor(agendamento.valor)}</strong>
              </div>
              <div className="agenda-appointment-footer">
                {renderAcoesStatus(agendamento) && (
                  <div className="agenda-appointment-actions">
                    {renderAcoesStatus(agendamento)}
                  </div>
                )}
                <button
                  type="button"
                  className="agenda-details-button"
                  onClick={() =>
                    setAgendamentoSelecionadoId(agendamento.id)
                  }
                >
                  <Eye size={15} />
                  Detalhes e ações
                </button>
              </div>            </article>
          ))
        )}
      </section>

      {modalAberto && (
        <div
          className="agenda-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) {
              setModalAberto(false);
            }
          }}
        >
          <section
            className="agenda-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-modal-title"
          >
            <header className="agenda-modal-header">
              <div>
                <p className="eyebrow">NOVO ATENDIMENTO</p>
                <h2 id="agenda-modal-title">Novo agendamento</h2>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <form className="agenda-form" onSubmit={criarAgendamento}>
              <label className="agenda-form-field agenda-form-wide">
                <span>Cliente</span>
                {carregandoClientes ? (
                  <span className="agenda-field-loading">
                    <LoaderCircle size={15} className="agenda-spinner" />
                    Carregando clientes...
                  </span>
                ) : (
                  <select
                    value={clienteId}
                    onChange={(event) => setClienteId(event.target.value)}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                        {cliente.telefone ? ` — ${cliente.telefone}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="agenda-form-field">
                <span>Serviço</span>
                {carregandoServicos ? (
                  <span className="agenda-field-loading">
                    <LoaderCircle size={15} className="agenda-spinner" />
                    Carregando serviços...
                  </span>
                ) : (
                  <select
                    value={servicoId}
                    onChange={(event) => atualizarServico(event.target.value)}
                    required
                  >
                    <option value="">Selecione um serviço</option>
                    {servicos.map((servico) => (
                      <option key={servico.id} value={servico.id}>
                        {servico.nome}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="agenda-form-field">
                <span>Profissional</span>
                {carregandoProfissionais ? (
                  <span className="agenda-field-loading">
                    <LoaderCircle size={15} className="agenda-spinner" />
                    Carregando profissionais...
                  </span>
                ) : (
                  <select
                    value={profissionalId}
                    onChange={(event) => {
                      const value = event.target.value;
                      setErroFormulario("");
                      setCarregandoHorarios(
                        Boolean(value && servicoId && dataFormulario),
                      );
                      setProfissionalId(value);
                      setHoraInicio("");
                      setHorariosDisponiveis([]);
                    }}
                    required
                    disabled={!profissionaisDisponiveis.length}
                  >
                    <option value="">
                      {servicoId
                        ? "Selecione um profissional"
                        : "Selecione primeiro o serviço"}
                    </option>
                    {profissionaisDisponiveis.map((profissional) => (
                      <option key={profissional.id} value={profissional.id}>
                        {profissional.nome}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label className="agenda-form-field agenda-form-wide">
                <span>Data</span>
                <input
                  type="date"
                  value={dataFormulario}
                  onChange={(event) => {
                    const value = event.target.value;
                    setErroFormulario("");
                    setCarregandoHorarios(
                      Boolean(value && profissionalId && servicoId),
                    );
                    setDataFormulario(value);
                    setHoraInicio("");
                    setHorariosDisponiveis([]);
                  }}
                  required
                />
              </label>

              <div className="agenda-form-field agenda-form-wide">
                <span>Horário disponível</span>
                {!servicoId || !profissionalId || !dataFormulario ? (
                  <p className="agenda-form-hint">
                    Escolha serviço, profissional e data para consultar horários.
                  </p>
                ) : carregandoHorarios ? (
                  <span className="agenda-field-loading">
                    <LoaderCircle size={15} className="agenda-spinner" />
                    Consultando disponibilidade...
                  </span>
                ) : horariosDisponiveis.length > 0 ? (
                  <div className="agenda-time-options">
                    {horariosDisponiveis.map((horario) => (
                      <button
                        type="button"
                        key={horario}
                        className={`agenda-time-option ${
                          horaInicio === horario ? "selected" : ""
                        }`}
                        onClick={() => setHoraInicio(horario)}
                      >
                        {horario}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="agenda-form-hint">
                    Nenhum horário disponível nesta data.
                  </p>
                )}
              </div>

              {erroFormulario && (
                <div className="agenda-error agenda-form-wide" role="alert">
                  {erroFormulario}
                </div>
              )}

              {!carregandoClientes &&
                !carregandoServicos &&
                !carregandoProfissionais &&
                (clientes.length === 0 ||
                  servicos.length === 0 ||
                  profissionais.length === 0) && (
                  <div className="agenda-form-hint agenda-form-wide">
                    Para agendar, cadastre pelo menos um cliente, serviço,
                    profissional ativo e vínculo profissional-serviço.
                  </div>
                )}

              <footer className="agenda-form-actions agenda-form-wide">
                <button
                  type="button"
                  className="agenda-cancel-button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button agenda-submit-button"
                  disabled={
                    salvando ||
                    carregandoClientes ||
                    carregandoServicos ||
                    carregandoProfissionais ||
                    carregandoHorarios
                  }
                >
                  {salvando ? "Salvando agendamento..." : "Confirmar agendamento"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {agendamentoSelecionado && (
        <div
          className="agenda-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !atualizandoStatusId
            ) {
              setAgendamentoSelecionadoId(null);
              setErroStatus("");
            }
          }}
        >
          <section
            className="agenda-modal agenda-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-details-title"
          >
            <header className="agenda-modal-header">
              <div>
                <p className="eyebrow">DETALHES DO ATENDIMENTO</p>
                <h2 id="agenda-details-title">
                  {agendamentoSelecionado.cliente_nome}
                </h2>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                onClick={() => {
                  setAgendamentoSelecionadoId(null);
                  setErroStatus("");
                }}
                disabled={Boolean(atualizandoStatusId)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="agenda-details-grid">
              <div className="agenda-detail-item">
                <span>Cliente</span>
                <strong>{agendamentoSelecionado.cliente_nome}</strong>
              </div>
              <div className="agenda-detail-item">
                <span>Telefone</span>
                <strong>
                  {agendamentoSelecionado.cliente_telefone || "Não informado"}
                </strong>
              </div>
              <div className="agenda-detail-item">
                <span>Serviço</span>
                <strong>{agendamentoSelecionado.servico_nome}</strong>
              </div>
              <div className="agenda-detail-item">
                <span>Profissional</span>
                <strong>
                  <UserRound size={14} />
                  {agendamentoSelecionado.profissional_nome}
                </strong>
              </div>
              <div className="agenda-detail-item">
                <span>Data</span>
                <strong>
                  {formatarDataAgendamento(agendamentoSelecionado.data)}
                </strong>
              </div>
              <div className="agenda-detail-item">
                <span>Horário</span>
                <strong>
                  {formatarHora(agendamentoSelecionado.hora_inicio)} —{" "}
                  {formatarHora(agendamentoSelecionado.hora_fim)}
                </strong>
              </div>
              <div className="agenda-detail-item">
                <span>Valor</span>
                <strong>
                  {formatarValor(agendamentoSelecionado.valor)}
                </strong>
              </div>
              <div className="agenda-detail-item">
                <span>Status</span>
                <strong>{renderStatus(agendamentoSelecionado)}</strong>
              </div>
            </div>

            {erroStatus && (
              <div className="agenda-error agenda-details-error" role="alert">
                {erroStatus}
              </div>
            )}

            {renderAcoesStatus(agendamentoSelecionado) && (
              <div className="agenda-details-actions">
                <p>Ações do agendamento</p>
                <div>
                  {renderAcoesStatus(agendamentoSelecionado)}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {agendamentoParaConcluir && (
        <div
          className="agenda-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !atualizandoStatusId
            ) {
              setAgendamentoParaConcluirId(null);
              setErroStatus("");
            }
          }}
        >
          <section
            className="agenda-modal agenda-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agenda-confirm-title"
          >
            <header className="agenda-modal-header">
              <div>
                <p className="eyebrow">ATENDIMENTO</p>
                <h2 id="agenda-confirm-title">Concluir atendimento</h2>
              </div>
              <button
                type="button"
                className="agenda-modal-close"
                onClick={() => {
                  setAgendamentoParaConcluirId(null);
                  setErroStatus("");
                }}
                disabled={Boolean(atualizandoStatusId)}
                aria-label="Fechar"
              >
                ×
              </button>
            </header>

            <div className="agenda-confirm-summary">
              <strong>{agendamentoParaConcluir.cliente_nome}</strong>
              <span>{agendamentoParaConcluir.servico_nome}</span>
              <span>{formatarValor(agendamentoParaConcluir.valor)}</span>
            </div>

            <div className="agenda-confirm-return">
              <span>Próximo retorno recomendado</span>
              <strong>
                {Number(agendamentoParaConcluir.intervalo_retorno_dias) || 30}{" "}
                dias
              </strong>
            </div>

            {erroStatus && (
              <div className="agenda-error agenda-details-error" role="alert">
                {erroStatus}
              </div>
            )}

            <footer className="agenda-form-actions">
              <button
                type="button"
                className="primary-button agenda-confirm-button"
                onClick={confirmarConclusao}
                disabled={Boolean(atualizandoStatusId)}
              >
                {atualizandoStatusId ? "Concluindo..." : "Confirmar conclusão"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Agenda;
