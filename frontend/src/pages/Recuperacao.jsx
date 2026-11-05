import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  Clock3,
  Copy,
  DollarSign,
  MessageCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import api from "../services/api";

const filtros = [
  { valor: "TODOS", rotulo: "Todos" },
  { valor: "EM_DIA", rotulo: "No prazo" },
  { valor: "HOJE", rotulo: "Retorno hoje" },
  { valor: "ATRASADO", rotulo: "Atrasados" },
  { valor: "RISCO", rotulo: "Em risco" },
];
const clientesVazios = [];

function formatarValor(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(numero)
    : "—";
}

function formatarData(data) {
  if (!data) return "—";
  const [ano, mes, dia] = String(data).slice(0, 10).split("-").map(Number);
  if (!ano || !mes || !dia) return "—";

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(ano, mes - 1, dia),
  );
}

function normalizarTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "");
}

function temDdiExplicito(telefone) {
  return String(telefone || "").trim().startsWith("+");
}

function pluralDias(quantidade) {
  return `${quantidade} ${quantidade === 1 ? "dia" : "dias"}`;
}

function textoPrazo(cliente) {
  const atraso = Number(cliente.dias_atrasado) || 0;

  if (atraso > 0) {
    return `${pluralDias(atraso)} atrasado`;
  }

  if (atraso === 0) {
    return "Retorno previsto para hoje";
  }

  const restantes = Number(cliente.dias_para_retorno) || 0;
  return `Retorna em ${pluralDias(restantes)}`;
}

function classePrazo(cliente) {
  const atraso = Number(cliente.dias_atrasado) || 0;

  if (atraso > 0) return "recovery-days-late";
  if (atraso === 0) return "recovery-days-today";
  return "recovery-days-waiting";
}

function Recuperacao() {
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [mensagemContato, setMensagemContato] = useState("");

  const carregarRecuperacao = useCallback(async (atualizacaoManual = false) => {
    if (atualizacaoManual) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }
    setErro("");

    try {
      const response = await api.get("/recuperacao");
      if (!Array.isArray(response.data?.clientes)) {
        throw new Error("A resposta da recuperação está em formato inválido.");
      }
      setDados(response.data);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os clientes para recuperação.",
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    api
      .get("/recuperacao")
      .then((response) => {
        if (!Array.isArray(response.data?.clientes)) {
          throw new Error("A resposta da recuperação está em formato inválido.");
        }
        if (ativo) setDados(response.data);
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error.response?.data?.mensagem ||
              error.message ||
              "Não foi possível carregar os clientes para recuperação.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  const clientes = dados?.clientes || clientesVazios;
  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return clientes.filter((cliente) => {
      const correspondeStatus =
        filtroStatus === "TODOS" || cliente.status === filtroStatus;
      const correspondeBusca =
        !termo ||
        String(cliente.nome || "").toLocaleLowerCase("pt-BR").includes(termo) ||
        String(cliente.telefone || "").toLocaleLowerCase("pt-BR").includes(termo);

      return correspondeStatus && correspondeBusca;
    });
  }, [busca, clientes, filtroStatus]);

  async function copiarTelefone(telefone) {
    if (!telefone) {
      setMensagemContato("Este cliente não possui telefone cadastrado.");
      return;
    }

    try {
      await navigator.clipboard.writeText(String(telefone));
      setMensagemContato("Telefone copiado.");
    } catch {
      setMensagemContato(
        "Não foi possível copiar o telefone neste navegador.",
      );
    }
  }

  function entrarEmContato(cliente) {
    const telefone = String(cliente.telefone || "");
    const telefoneNormalizado = normalizarTelefone(telefone);

    if (!telefoneNormalizado) {
      setMensagemContato("Este cliente não possui telefone cadastrado.");
      return;
    }

    if (!temDdiExplicito(telefone)) {
      copiarTelefone(telefone);
      return;
    }

    window.open(
      `https://wa.me/${telefoneNormalizado}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function botaoContato(cliente) {
    const temTelefone = Boolean(normalizarTelefone(cliente.telefone));
    const whatsapp = temTelefone && temDdiExplicito(cliente.telefone);

    return (
      <button
        type="button"
        className="recovery-contact-button"
        onClick={(event) => {
          event.stopPropagation();
          entrarEmContato(cliente);
        }}
        disabled={!temTelefone}
        aria-label={
          whatsapp
            ? `Abrir WhatsApp para ${cliente.nome}`
            : `Copiar telefone de ${cliente.nome}`
        }
      >
        {whatsapp ? <MessageCircle size={15} /> : <Copy size={15} />}
        {whatsapp ? "Entrar em contato" : "Copiar telefone"}
      </button>
    );
  }

  function renderStatus(status) {
    if (status === "RISCO") {
      return (
        <span className="recovery-status recovery-status-risk">
          <AlertTriangle size={13} />
          Em risco
        </span>
      );
    }

    if (status === "ATRASADO") {
      return (
        <span className="recovery-status recovery-status-late">
          Atrasado
        </span>
      );
    }

    if (status === "HOJE") {
      return (
        <span className="recovery-status recovery-status-today">
          <BellRing size={13} />
          Retorno hoje
        </span>
      );
    }

    return (
      <span className="recovery-status recovery-status-waiting">
        No prazo
      </span>
    );
  }

  return (
    <div className="page-content recovery-page">
      <header className="page-header recovery-page-header">
        <div>
          <p className="eyebrow">RELACIONAMENTO COM CLIENTES</p>
          <h1>Recuperação de clientes</h1>
          <p className="page-description">
            Acompanhe quem deve voltar, o prazo de cada retorno e transforme
            atrasos em novos agendamentos.
          </p>
        </div>
        <button
          type="button"
          className="recovery-refresh-button"
          onClick={() => carregarRecuperacao(true)}
          disabled={carregando || atualizando}
        >
          <RefreshCw
            size={15}
            className={atualizando ? "recovery-refresh-spinning" : ""}
          />
          {atualizando ? "Atualizando..." : "Atualizar"}
        </button>
      </header>

      {erro && (
        <div className="recovery-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={() => carregarRecuperacao()}>
            Tentar novamente
          </button>
        </div>
      )}

      {mensagemContato && (
        <div className="recovery-feedback" role="status">
          <span>{mensagemContato}</span>
          <button
            type="button"
            onClick={() => setMensagemContato("")}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      <section className="recovery-summary" aria-label="Resumo da recuperação">
        <article className="recovery-summary-card">
          <div className="recovery-summary-icon">
            <Users size={19} />
          </div>
          <div>
            <span>Clientes no funil</span>
            <strong>
              {carregando && !dados ? (
                <span className="recovery-summary-skeleton" />
              ) : (
                clientes.length
              )}
            </strong>
          </div>
        </article>
        <article className="recovery-summary-card recovery-summary-highlight">
          <div className="recovery-summary-icon">
            <DollarSign size={19} />
          </div>
          <div>
            <span>Potencial estimado</span>
            <strong>
              {carregando && !dados ? (
                <span className="recovery-summary-skeleton recovery-value-skeleton" />
              ) : (
                formatarValor(dados?.potencial_retorno)
              )}
            </strong>
          </div>
        </article>
      </section>

      <section className="recovery-list-panel">
        <div className="recovery-list-header">
          <div>
            <h2>Clientes no funil de retorno</h2>
            <p>
              {dados
                ? `${clientesFiltrados.length} de ${clientes.length} clientes`
                : "Clientes sinalizados pelo histórico de atendimentos"}
            </p>
          </div>
          <label className="recovery-search">
            <Search size={16} />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              aria-label="Buscar por nome ou telefone"
            />
          </label>
        </div>

        <div className="recovery-filters" role="group" aria-label="Filtrar clientes">
          {filtros.map((filtro) => (
            <button
              type="button"
              key={filtro.valor}
              className={
                filtroStatus === filtro.valor ? "active" : ""
              }
              onClick={() => setFiltroStatus(filtro.valor)}
            >
              {filtro.rotulo}
            </button>
          ))}
        </div>

        {carregando && !dados ? (
          <div className="recovery-loading" role="status">
            <RefreshCw size={18} className="recovery-refresh-spinning" />
            Carregando clientes para recuperação...
          </div>
        ) : erro ? (
          <div className="recovery-list-error">
            A lista não está disponível até que a conexão seja restabelecida.
          </div>
        ) : !erro && clientes.length === 0 ? (
          <div className="recovery-empty">
            <span className="recovery-empty-icon">
              <CalendarDays size={21} />
            </span>
            <strong>Não há clientes no funil de retorno.</strong>
            <span>
              Conclua atendimentos para começar a acompanhar os retornos.
            </span>
          </div>
        ) : !erro && clientesFiltrados.length === 0 ? (
          <div className="recovery-empty recovery-filter-empty">
            <strong>Nenhum cliente encontrado</strong>
            <span>Altere a busca ou o filtro para ver outros clientes.</span>
          </div>
        ) : (
          <>
            <div className="recovery-table-wrap">
              <table className="recovery-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Último atendimento</th>
                    <th>Intervalo médio</th>
                    <th>Retorno estimado</th>
                    <th>Prazo</th>
                    <th>Atendimentos</th>
                    <th>Total gasto</th>
                    <th>Status</th>
                    <th aria-label="Contato" />
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr
                      key={cliente.id}
                      onClick={() => navigate("/clientes")}
                      className="recovery-table-row"
                    >
                      <td>
                        <button
                          type="button"
                          className="recovery-client-name"
                          onClick={() => navigate("/clientes")}
                        >
                          {cliente.nome}
                        </button>
                        <span className="recovery-client-phone">
                          {cliente.telefone || "Telefone não informado"}
                        </span>
                      </td>
                      <td>{formatarData(cliente.ultimo_atendimento)}</td>
                      <td>{cliente.intervalo_medio_dias} dias</td>
                      <td>{formatarData(cliente.proximo_retorno_estimado)}</td>
                      <td>
                        <strong className={classePrazo(cliente)}>
                          {textoPrazo(cliente)}
                        </strong>
                      </td>
                      <td>{cliente.total_atendimentos}</td>
                      <td>{formatarValor(cliente.valor_total_gasto)}</td>
                      <td>{renderStatus(cliente.status)}</td>
                      <td>{botaoContato(cliente)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="recovery-customer-cards">
              {clientesFiltrados.map((cliente) => (
                <article className="recovery-customer-card" key={cliente.id}>
                  <header>
                    <button
                      type="button"
                      className="recovery-client-name"
                      onClick={() => navigate("/clientes")}
                    >
                      {cliente.nome}
                    </button>
                    {renderStatus(cliente.status)}
                  </header>
                  <p className="recovery-customer-phone">
                    {cliente.telefone || "Telefone não informado"}
                  </p>
                  <div className="recovery-customer-delay">
                    <Clock3 size={15} />
                    <strong>{textoPrazo(cliente)}</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Último atendimento</dt>
                      <dd>{formatarData(cliente.ultimo_atendimento)}</dd>
                    </div>
                    <div>
                      <dt>Intervalo médio</dt>
                      <dd>{cliente.intervalo_medio_dias} dias</dd>
                    </div>
                    <div>
                      <dt>Retorno estimado</dt>
                      <dd>{formatarData(cliente.proximo_retorno_estimado)}</dd>
                    </div>
                    <div>
                      <dt>Total de atendimentos</dt>
                      <dd>{cliente.total_atendimentos}</dd>
                    </div>
                    <div>
                      <dt>Total gasto</dt>
                      <dd>{formatarValor(cliente.valor_total_gasto)}</dd>
                    </div>
                  </dl>
                  {botaoContato(cliente)}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default Recuperacao;
