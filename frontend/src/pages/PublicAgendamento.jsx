import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Link2,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";

function obterDataHojeLocal() {
  const agora = new Date();
  return [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function PublicAgendamento() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const profissionalIdUrl = searchParams.get("profissional");
  const hoje = obterDataHojeLocal();

  const [empresa, setEmpresa] = useState(null);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);

  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  const [clienteNome, setClienteNome] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");

  const [etapa, setEtapa] = useState(1);
  const [slugCarregado, setSlugCarregado] = useState(null);
  const [carregandoProfissionais, setCarregandoProfissionais] = useState(false);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [acessoAberto, setAcessoAberto] = useState(false);
  const [acessoValor, setAcessoValor] = useState("");
  const [erroAcesso, setErroAcesso] = useState("");

  useEffect(() => {
    let ativo = true;
    async function carregarEmpresa() {
      try {
        const response = await api.get(`/public/empresa/${slug}`);
        if (!ativo) return;
        setEmpresa(response.data.empresa);
        setServicos(Array.isArray(response.data.servicos) ? response.data.servicos : []);
        setProfissionais(Array.isArray(response.data.profissionais) ? response.data.profissionais : []);
        setErro(
          Number(response.data.empresa.agendamento_online) !== 1
            ? "O agendamento online está desativado por esta empresa."
            : "",
        );
      } catch (error) {
        if (!ativo) return;
        setErro(
          error.response?.status === 404
            ? "Empresa não encontrada."
            : "Não foi possível carregar a página de agendamento.",
        );
        setEmpresa(null);
      } finally {
        if (ativo) setSlugCarregado(slug);
      }
    }
    void carregarEmpresa();
    return () => { ativo = false; };
  }, [slug]);

  async function carregarHorariosParaProfissional(profissional, data, servico = servicoSelecionado) {
    if (!data || !profissional || !servico) return;
    try {
      setCarregandoHorarios(true);
      setErro("");
      const response = await api.get(
        `/disponibilidade/publica/${slug}/servico/${servico.id}/profissional/${profissional.id}/data/${data}`,
      );
      setHorarios(response.data.horarios_disponiveis || []);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível consultar os horários.");
    } finally {
      setCarregandoHorarios(false);
    }
  }

  async function selecionarServico(servico) {
    setServicoSelecionado(servico);
    setProfissionalSelecionado(null);
    setDataSelecionada("");
    setHorarioSelecionado("");
    setHorarios([]);
    setProfissionais([]);
    setErro("");
    setEtapa(2);
    setCarregandoProfissionais(true);
    try {
      const response = await api.get(`/public/empresa/${slug}/servicos/${servico.id}/profissionais`);
      const lista = Array.isArray(response.data) ? response.data : [];
      const filtrado = profissionalIdUrl
        ? lista.filter((p) => String(p.id) === String(profissionalIdUrl))
        : [];
      const exibidos = filtrado.length > 0 ? filtrado : lista;
      setProfissionais(exibidos);
      if (exibidos.length === 1) {
        setProfissionalSelecionado(exibidos[0]);
        setDataSelecionada(hoje);
        await carregarHorariosParaProfissional(exibidos[0], hoje, servico);
      }
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Não foi possível carregar os profissionais.");
    } finally {
      setCarregandoProfissionais(false);
    }
  }

  async function selecionarProfissional(profissional) {
    setProfissionalSelecionado(profissional);
    const data = dataSelecionada || hoje;
    setDataSelecionada(data);
    setHorarioSelecionado("");
    setHorarios([]);
    setErro("");
    await carregarHorariosParaProfissional(profissional, data);
  }

  async function trocarData(data) {
    setDataSelecionada(data);
    setHorarioSelecionado("");
    setHorarios([]);
    setErro("");
    if (profissionalSelecionado) await carregarHorariosParaProfissional(profissionalSelecionado, data);
  }

  function selecionarHorario(horario) {
    setHorarioSelecionado(horario);
    setErro("");
    setEtapa(3);
  }

  async function confirmarAgendamento(event) {
    event.preventDefault();
    if (!clienteNome.trim() || !clienteTelefone.trim()) {
      setErro("Preencha seu nome e telefone para continuar.");
      return;
    }
    try {
      setEnviando(true);
      setErro("");
      const response = await api.post(`/public/empresa/${slug}/agendamentos`, {
        cliente_nome: clienteNome.trim(),
        cliente_telefone: clienteTelefone.trim(),
        cliente_email: clienteEmail.trim() || undefined,
        profissional_id: profissionalSelecionado.id,
        servico_id: servicoSelecionado.id,
        data: dataSelecionada,
        hora_inicio: horarioSelecionado,
      });
      navigate(`/agendar/${slug}/confirmado/${response.data.agendamento.token_publico}`);
    } catch (error) {
      if (error.response?.status === 409) {
        setErro("Este horário acabou de ser reservado. Escolha outro.");
        await carregarHorariosParaProfissional(profissionalSelecionado, dataSelecionada);
      } else {
        setErro(error.response?.data?.mensagem || "Não foi possível confirmar o agendamento.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function acessarAgendamento(event) {
    event.preventDefault();

    const valor = acessoValor.trim();

    if (!valor) {
      setErroAcesso("Informe o link ou o código do seu agendamento.");
      return;
    }

    setErroAcesso("");

    // Código puro do agendamento (token)
    if (/^[A-Za-z0-9_-]{16,128}$/.test(valor)) {
      navigate(
        `/agendar/${encodeURIComponent(slug)}/agendamento/${encodeURIComponent(valor)}`,
      );
      return;
    }

    // Link completo ou caminho recebido na confirmação
    let caminho;

    try {
      caminho = new URL(valor, window.location.origin).pathname;
    } catch {
      caminho = valor.split("?")[0].split("#")[0];
    }

    const partes = caminho.split("/").filter(Boolean);
    const indice = partes.findIndex(
      (parte) => parte === "agendamento" || parte === "confirmado",
    );

    if (indice > 0 && partes[indice + 1]) {
      const slugDoLink = partes[0] === "agendar" ? partes[1] : slug;
      const token = partes[indice + 1];

      navigate(
        `/agendar/${encodeURIComponent(slugDoLink)}/agendamento/${encodeURIComponent(token)}`,
      );
      return;
    }

    setErroAcesso(
      "Não foi possível identificar o agendamento. Confira o link recebido.",
    );
  }

  function voltar() {
    setErro("");
    if (etapa === 2) { setEtapa(1); setProfissionalSelecionado(null); setDataSelecionada(""); setHorarios([]); }
    if (etapa === 3) { setEtapa(2); }
  }

  function formatarPreco(preco) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(preco) || 0);
  }

  function formatarData(data) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-").map(Number);
    if (!ano || !mes || !dia) return data;
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date(ano, mes - 1, dia));
  }

  const profissionaisDisponiveis = Array.isArray(profissionais) ? profissionais : [];
  const carregando = slugCarregado !== slug;

  if (carregando) {
    return (
      <div className="bk-page">
        <div className="bk-loading" role="status">
          <div className="bk-loading-ring" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="bk-page">
        <div className="bk-unavailable">
          <CalendarDays size={24} strokeWidth={1.5} />
          <h1>Página não encontrada</h1>
          <p>{erro || "Esta empresa não está disponível para agendamento online."}</p>
        </div>
      </div>
    );
  }

  const agendamentoAtivo = Number(empresa.agendamento_online) === 1;

  return (
    <div className="bk-page">
      <div className="bk-shell">

        {/* ── Cabeçalho ── */}
        <header className="bk-header">
          <div className="bk-header-mark">
            <CalendarCheck size={20} strokeWidth={1.5} />
          </div>
          <h1 className="bk-header-name">{empresa.nome}</h1>
          {empresa.descricao && (
            <p className="bk-header-desc">{empresa.descricao}</p>
          )}
          {(empresa.endereco || empresa.telefone) && (
            <div className="bk-header-meta">
              {empresa.endereco && (
                <span><MapPin size={13} />{empresa.endereco}</span>
              )}
              {empresa.telefone && (
                <span><Phone size={13} />{empresa.telefone}</span>
              )}
            </div>
          )}
        </header>

        {/* ── Agendamento desativado ── */}
        {!agendamentoAtivo ? (
          <div className="bk-offline">
            <p className="bk-offline-title">Agendamento online desativado</p>
            <p className="bk-offline-desc">
              Esta empresa não está recebendo novos agendamentos online no momento.
            </p>
            {empresa.telefone && (
              <a href={`tel:${empresa.telefone}`} className="bk-offline-tel">
                <Phone size={14} />{empresa.telefone}
              </a>
            )}
          </div>
        ) : (
          <main className="bk-card">

            {/* ── Stepper ── */}
            <nav className="bk-steps" aria-label="Progresso">
              {[
                { num: 1, label: "Serviço" },
                { num: 2, label: "Horário" },
                { num: 3, label: "Dados" },
              ].map(({ num, label }) => {
                const done = etapa > num;
                const active = etapa === num;
                return (
                  <div
                    key={num}
                    className={`bk-step${active ? " bk-step-active" : ""}${done ? " bk-step-done" : ""}`}
                    aria-current={active ? "step" : undefined}
                  >
                    <div className="bk-step-num">
                      {done ? <Check size={12} strokeWidth={2.5} /> : num}
                    </div>
                    <span className="bk-step-label">{label}</span>
                  </div>
                );
              })}
            </nav>

            {erro && (
              <div className="bk-error" role="alert">{erro}</div>
            )}

            {etapa > 1 && (
              <button type="button" className="bk-back" onClick={voltar}>
                <ArrowLeft size={14} />
                Voltar
              </button>
            )}

            {/* ── Etapa 1: Serviço ── */}
            {etapa === 1 && (
              <section className="bk-step-content">
                <h2 className="bk-step-title">Escolha o serviço</h2>

                {servicos.length === 0 ? (
                  <p className="bk-empty">Nenhum serviço disponível no momento.</p>
                ) : (
                  <ul className="bk-service-list">
                    {servicos.map((servico) => (
                      <li key={servico.id}>
                        <button
                          type="button"
                          className="bk-service-btn"
                          onClick={() => selecionarServico(servico)}
                        >
                          <div className="bk-service-info">
                            <strong>{servico.nome}</strong>
                            <span>
                              <Clock size={12} />
                              {servico.duracao_minutos} min
                            </span>
                          </div>
                          <div className="bk-service-price">
                            <span>{formatarPreco(servico.preco)}</span>
                            <ArrowRight size={14} className="bk-service-arrow" />
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* ── Etapa 2: Profissional + data + horário ── */}
            {etapa === 2 && servicoSelecionado && (
              <section className="bk-step-content">
                <h2 className="bk-step-title">Profissional e horário</h2>
                <p className="bk-step-sub">
                  {servicoSelecionado.nome} &middot; {servicoSelecionado.duracao_minutos} min
                </p>

                {/* Profissional */}
                <div className="bk-section">
                  <p className="bk-section-label">Profissional</p>
                  {carregandoProfissionais ? (
                    <div className="bk-inline-loading" role="status">
                      <div className="bk-loading-ring bk-loading-ring-sm" />
                      Carregando...
                    </div>
                  ) : profissionaisDisponiveis.length === 0 ? (
                    <p className="bk-empty">Nenhum profissional disponível para este serviço.</p>
                  ) : (
                    <div className="bk-professional-list">
                      {profissionaisDisponiveis.map((prof) => {
                        const sel = profissionalSelecionado?.id === prof.id;
                        return (
                          <button
                            key={prof.id}
                            type="button"
                            className={`bk-professional-btn${sel ? " bk-professional-btn-sel" : ""}`}
                            onClick={() => selecionarProfissional(prof)}
                          >
                            <div className="bk-professional-avatar">
                              <User size={13} strokeWidth={1.5} />
                            </div>
                            <span>{prof.nome}</span>
                            {sel && <Check size={13} className="bk-professional-check" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Data */}
                {profissionalSelecionado && (
                  <div className="bk-section">
                    <p className="bk-section-label">Data</p>
                    <input
                      type="date"
                      className="bk-date-input"
                      min={hoje}
                      value={dataSelecionada}
                      onChange={(e) => trocarData(e.target.value)}
                    />
                  </div>
                )}

                {/* Horários */}
                {dataSelecionada && profissionalSelecionado && (
                  <div className="bk-section">
                    <p className="bk-section-label">
                      Horários disponíveis — <span className="bk-capitalize">{formatarData(dataSelecionada)}</span>
                    </p>
                    {carregandoHorarios ? (
                      <div className="bk-inline-loading" role="status">
                        <div className="bk-loading-ring bk-loading-ring-sm" />
                        Verificando disponibilidade...
                      </div>
                    ) : horarios.length === 0 ? (
                      <div className="bk-no-times">
                        <Clock size={16} strokeWidth={1.5} />
                        <p>Sem horários disponíveis nesta data.</p>
                      </div>
                    ) : (
                      <div className="bk-time-grid">
                        {horarios.map((h) => (
                          <button
                            key={h}
                            type="button"
                            className={`bk-time-btn${horarioSelecionado === h ? " bk-time-btn-sel" : ""}`}
                            onClick={() => selecionarHorario(h)}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* ── Etapa 3: Dados do cliente ── */}
            {etapa === 3 && (
              <section className="bk-step-content">
                <h2 className="bk-step-title">Seus dados</h2>

                {/* Resumo */}
                <dl className="bk-summary">
                  <div><dt>Serviço</dt><dd>{servicoSelecionado?.nome}</dd></div>
                  <div><dt>Profissional</dt><dd>{profissionalSelecionado?.nome}</dd></div>
                  <div><dt>Data</dt><dd className="bk-capitalize">{formatarData(dataSelecionada)}</dd></div>
                  <div><dt>Horário</dt><dd>{horarioSelecionado}</dd></div>
                  <div className="bk-summary-total">
                    <dt>Total</dt>
                    <dd>{formatarPreco(servicoSelecionado?.preco)}</dd>
                  </div>
                </dl>

                <form onSubmit={confirmarAgendamento} className="bk-form">
                  <label className="bk-field">
                    <span>Nome completo <abbr title="obrigatório">*</abbr></span>
                    <input
                      type="text"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder="Seu nome"
                      autoComplete="name"
                      maxLength={150}
                      required
                    />
                  </label>

                  <label className="bk-field">
                    <span>Telefone / WhatsApp <abbr title="obrigatório">*</abbr></span>
                    <input
                      type="tel"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      maxLength={20}
                      required
                    />
                  </label>

                  <label className="bk-field">
                    <span>E-mail <span className="bk-optional">(opcional)</span></span>
                    <input
                      type="email"
                      value={clienteEmail}
                      onChange={(e) => setClienteEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      maxLength={150}
                    />
                  </label>

                  <div className="bk-privacy">
                    <ShieldCheck size={14} strokeWidth={1.5} />
                    <span>Seus dados são usados apenas para este agendamento.</span>
                  </div>

                  <button type="submit" className="bk-submit" disabled={enviando}>
                    {enviando ? (
                      <>
                        <div className="bk-loading-ring bk-loading-ring-inv" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        Confirmar agendamento
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </form>
              </section>
            )}

          </main>
        )}

        <section className="bk-access" aria-label="Acessar meu agendamento">
          <button
            type="button"
            className="bk-access-toggle"
            aria-expanded={acessoAberto}
            aria-controls="bk-access-form"
            onClick={() => {
              setAcessoAberto((aberto) => !aberto);
              setErroAcesso("");
            }}
          >
            <Link2 size={16} />
            Já tenho um agendamento
            <ChevronDown size={16} className="bk-access-chevron" />
          </button>

          {acessoAberto && (
            <form
              id="bk-access-form"
              className="bk-access-form"
              onSubmit={acessarAgendamento}
            >
              <p>
                Cole o link recebido na confirmação ou informe o código do
                agendamento.
              </p>

              <label className="bk-field">
                <span>Link ou código do agendamento</span>
                <input
                  type="text"
                  value={acessoValor}
                  onChange={(event) => {
                    setAcessoValor(event.target.value);
                    setErroAcesso("");
                  }}
                  placeholder="Cole aqui o link ou o código"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={2048}
                />
              </label>

              {erroAcesso && (
                <div className="bk-error" role="alert">
                  {erroAcesso}
                </div>
              )}

              <button
                type="submit"
                className="bk-access-submit"
                disabled={!acessoValor.trim()}
              >
                Acessar agendamento
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </section>

        <footer className="bk-footer">
          <img src="/logo.png" alt="Agenda Tech" className="bk-footer-logo" />
          <span>Agendamento via <strong>Agenda Tech</strong></span>
        </footer>
      </div>
    </div>
  );
}
