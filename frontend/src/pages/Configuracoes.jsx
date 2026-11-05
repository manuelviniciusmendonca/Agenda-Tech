import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AtSign,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Info,
  Link2,
  LoaderCircle,
  MapPin,
  Phone,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

// ─── Opções pré-definidas de antecedência ─────────────────────────────────────
const OPCOES_ANTECEDENCIA = [
  { label: "Sem restrição", value: 0 },
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
  { label: "3 horas", value: 180 },
  { label: "6 horas", value: 360 },
  { label: "12 horas", value: 720 },
  { label: "1 dia", value: 1440 },
  { label: "2 dias", value: 2880 },
  { label: "Personalizado", value: "custom" },
];

const ESTADO_INICIAL = {
  nome: "",
  slug: "",
  telefone: "",
  email: "",
  descricao: "",
  endereco: "",
  instagram: "",
  agendamento_online: true,
  antecedencia_minutos: 60,
  permitir_cancelamento: true,
  permitir_reagendamento: true,
};

// ─── Subcomponente: Toggle switch acessível ───────────────────────────────────
function Toggle({ id, checked, onChange, disabled, label, description }) {
  return (
    <label className="cfg-toggle-row" htmlFor={id}>
      <div className="cfg-toggle-text">
        <span className="cfg-toggle-label">{label}</span>
        {description && (
          <span className="cfg-toggle-description">{description}</span>
        )}
      </div>
      <div className="cfg-toggle-control">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="cfg-toggle-input"
        />
        <div className="cfg-toggle-track" aria-hidden="true">
          <div className="cfg-toggle-thumb" />
        </div>
      </div>
    </label>
  );
}

// ─── Subcomponente: Campo de texto com ícone ──────────────────────────────────
function Campo({ label, hint, icon: Icon, erro: campoErro, children }) {
  return (
    <div className="cfg-field">
      <label className="cfg-field-label">
        {label}
        {hint && (
          <span className="cfg-field-hint" title={hint}>
            <Info size={12} />
          </span>
        )}
      </label>
      <div className={`cfg-field-input-wrap${campoErro ? " cfg-field-error" : ""}${Icon ? " cfg-field-has-icon" : ""}`}>
        {Icon && (
          <span className="cfg-field-icon" aria-hidden="true">
            <Icon size={14} />
          </span>
        )}
        {children}
      </div>
      {campoErro && <span className="cfg-field-error-msg">{campoErro}</span>}
    </div>
  );
}

// ─── Subcomponente: Seletor de antecedência ───────────────────────────────────
function SeletorAntecedencia({ valor, onChange, disabled }) {
  const opcaoAtual = OPCOES_ANTECEDENCIA.find((o) => o.value === valor) || {
    value: "custom",
  };
  const isCustom = opcaoAtual.value === "custom";
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    function fechar(e) {
      if (!ref.current?.contains(e.target)) setAberto(false);
    }
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  function escolher(opcao) {
    if (opcao.value !== "custom") {
      onChange(opcao.value);
    }
    setAberto(false);
  }

  return (
    <div className="cfg-antecedencia">
      <div className="cfg-antecedencia-select" ref={ref}>
        <button
          type="button"
          className={`cfg-antecedencia-btn${disabled ? " cfg-antecedencia-btn-disabled" : ""}`}
          onClick={() => !disabled && setAberto((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={aberto}
          disabled={disabled}
        >
          <span>
            {isCustom
              ? "Personalizado"
              : (OPCOES_ANTECEDENCIA.find((o) => o.value === valor)?.label ?? "Personalizado")}
          </span>
          <ChevronDown size={14} className={`cfg-antecedencia-chevron${aberto ? " open" : ""}`} />
        </button>

        {aberto && (
          <ul className="cfg-antecedencia-dropdown" role="listbox">
            {OPCOES_ANTECEDENCIA.map((opcao) => (
              <li
                key={opcao.value}
                role="option"
                aria-selected={opcao.value === valor || (opcao.value === "custom" && isCustom)}
                className={`cfg-antecedencia-option${(opcao.value === valor || (opcao.value === "custom" && isCustom)) ? " selected" : ""}`}
                onClick={() => escolher(opcao)}
              >
                {opcao.value === valor && <Check size={13} />}
                {opcao.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isCustom && (
        <div className="cfg-antecedencia-custom">
          <input
            type="number"
            value={valor}
            onChange={(e) => onChange(Number(e.target.value))}
            min="0"
            max="2147483647"
            step="1"
            disabled={disabled}
            className="cfg-antecedencia-input"
            aria-label="Antecedência em minutos"
          />
          <span className="cfg-antecedencia-unit">min</span>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function Configuracoes() {
  const { usuario, atualizarEmpresaContexto, logout } = useAuth();
  const navigate = useNavigate();
  const podeEditar = usuario?.role === "ADMIN";

  const [dados, setDados] = useState(ESTADO_INICIAL);
  const [dadosOriginais, setDadosOriginais] = useState(ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [carregado, setCarregado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [modalExclusaoAberta, setModalExclusaoAberta] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState("");
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusaoConta, setErroExclusaoConta] = useState("");

  // Fecha o modal de exclusão de conta com Escape
  useEffect(() => {
    if (!modalExclusaoAberta) return undefined;

    function fecharComEscape(event) {
      if (event.key === "Escape" && !excluindoConta) {
        setModalExclusaoAberta(false);
        setSenhaExclusao("");
        setErroExclusaoConta("");
      }
    }

    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [modalExclusaoAberta, excluindoConta]);

  // Detecta se há alterações pendentes
  const temAlteracoes =
    carregado &&
    JSON.stringify(dados) !== JSON.stringify(dadosOriginais);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const response = await api.get("/configuracoes");
        if (!ativo) return;
        const d = response.data;
        const normalizado = {
          nome: d.nome || "",
          slug: d.slug || "",
          telefone: d.telefone || "",
          email: d.email || "",
          descricao: d.descricao || "",
          endereco: d.endereco || "",
          instagram: d.instagram || "",
          agendamento_online: Boolean(Number(d.agendamento_online)),
          antecedencia_minutos: Number(d.antecedencia_minutos) || 0,
          permitir_cancelamento: Boolean(Number(d.permitir_cancelamento)),
          permitir_reagendamento: Boolean(Number(d.permitir_reagendamento)),
        };
        setDados(normalizado);
        setDadosOriginais(normalizado);
        setCarregado(true);
      } catch (error) {
        if (!ativo) return;
        setErro(
          error.response?.data?.mensagem ||
            "Não foi possível carregar as configurações da empresa.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    void carregar();
    return () => { ativo = false; };
  }, []);

  function atualizar(name, value) {
    setErro("");
    setSucesso("");
    setDados((prev) => ({ ...prev, [name]: value }));
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    atualizar(name, type === "checkbox" ? checked : value);
  }

  function descartar() {
    setDados(dadosOriginais);
    setErro("");
    setSucesso("");
  }

  function abrirModalExclusao() {
    setSenhaExclusao("");
    setErroExclusaoConta("");
    setModalExclusaoAberta(true);
  }

  function fecharModalExclusao() {
    if (excluindoConta) return;
    setModalExclusaoAberta(false);
    setSenhaExclusao("");
    setErroExclusaoConta("");
  }

  async function excluirConta(e) {
    e.preventDefault();

    if (!senhaExclusao) {
      setErroExclusaoConta("Informe sua senha para confirmar a exclusão.");
      return;
    }

    setExcluindoConta(true);
    setErroExclusaoConta("");

    try {
      await api.delete("/usuarios/me", { senha: senhaExclusao });
      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setErroExclusaoConta(
        error.response?.data?.mensagem ||
          "Não foi possível excluir a conta. Tente novamente.",
      );
    } finally {
      setExcluindoConta(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const antecedencia = Number(dados.antecedencia_minutos);
    if (!Number.isInteger(antecedencia) || antecedencia < 0) {
      setErro("A antecedência deve ser um número inteiro maior ou igual a zero.");
      return;
    }

    try {
      setSalvando(true);
      const response = await api.put("/configuracoes", {
        ...dados,
        nome: dados.nome.trim(),
        slug: dados.slug.trim(),
        telefone: dados.telefone.trim(),
        email: dados.email.trim(),
        descricao: dados.descricao.trim(),
        endereco: dados.endereco.trim(),
        instagram: dados.instagram.trim(),
        antecedencia_minutos: antecedencia,
      });

      const atualizado = response.data.configuracoes;
      if (atualizado) {
        const normalizado = {
          nome: atualizado.nome || "",
          slug: atualizado.slug || "",
          telefone: atualizado.telefone || "",
          email: atualizado.email || "",
          descricao: atualizado.descricao || "",
          endereco: atualizado.endereco || "",
          instagram: atualizado.instagram || "",
          agendamento_online: Boolean(Number(atualizado.agendamento_online)),
          antecedencia_minutos: Number(atualizado.antecedencia_minutos) || 0,
          permitir_cancelamento: Boolean(Number(atualizado.permitir_cancelamento)),
          permitir_reagendamento: Boolean(Number(atualizado.permitir_reagendamento)),
        };
        setDados(normalizado);
        setDadosOriginais(normalizado);
        atualizarEmpresaContexto?.(atualizado);
      }

      setSucesso(response.data.mensagem || "Configurações salvas com sucesso.");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível salvar as configurações. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  const camposDesabilitados = !podeEditar || salvando || !carregado;

  return (
    <div className="cfg-page">
      {/* ── Cabeçalho da página ──────────────────────────────────────── */}
      <header className="cfg-page-header">
        <div className="cfg-page-header-text">
          <p className="eyebrow">PREFERÊNCIAS DA EMPRESA</p>
          <h1>Configurações</h1>
          <p className="page-description">
            Gerencie os dados da empresa e as regras de agendamento online.
          </p>
        </div>

        {/* Barra de ações flutuante — aparece só quando há alterações */}
        {temAlteracoes && (
          <div className="cfg-unsaved-bar" role="status" aria-live="polite">
            <span className="cfg-unsaved-dot" aria-hidden="true" />
            <span>Alterações não salvas</span>
            <button
              type="button"
              className="cfg-discard-btn"
              onClick={descartar}
              disabled={salvando}
            >
              Descartar
            </button>
            <button
              type="button"
              className="cfg-save-btn-inline"
              onClick={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <LoaderCircle size={14} className="cfg-spinner" />
              ) : (
                <Save size={14} />
              )}
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </header>

      {/* ── Feedback global ─────────────────────────────────────────── */}
      {erro && (
        <div className="cfg-alert cfg-alert-error" role="alert">
          <XCircle size={15} />
          <span>{erro}</span>
          <button
            type="button"
            className="cfg-alert-close"
            onClick={() => setErro("")}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}
      {sucesso && (
        <div className="cfg-alert cfg-alert-success" role="status">
          <Check size={15} />
          <span>{sucesso}</span>
          <button
            type="button"
            className="cfg-alert-close"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}

      {carregando ? (
        <div className="cfg-loading" role="status">
          <LoaderCircle size={22} className="cfg-spinner" />
          <span>Carregando configurações...</span>
        </div>
      ) : (
        <form onSubmit={salvar} noValidate>
          <div className="cfg-layout">

            {/* ── COLUNA PRINCIPAL ──────────────────────────────────── */}
            <div className="cfg-main">

              {/* Seção: Dados da empresa */}
              <section className="cfg-card">
                <div className="cfg-card-header">
                  <div className="cfg-card-icon">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h2 className="cfg-card-title">Dados da empresa</h2>
                    <p className="cfg-card-description">
                      Informações exibidas para os clientes na página de agendamento.
                    </p>
                  </div>
                </div>

                <div className="cfg-fields">
                  <Campo
                    label="Nome da empresa"
                    icon={Building2}
                  >
                    <input
                      name="nome"
                      value={dados.nome}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="organization"
                      required
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <Campo
                    label="Identificador (slug)"
                    hint="Aparece na URL da sua página pública: /agendar/seu-slug"
                    icon={Link2}
                  >
                    <input
                      name="slug"
                      value={dados.slug}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="off"
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <Campo label="Telefone" icon={Phone}>
                    <input
                      name="telefone"
                      type="tel"
                      value={dados.telefone}
                      onChange={handleChange}
                      maxLength={20}
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <Campo label="E-mail" icon={AtSign}>
                    <input
                      name="email"
                      type="email"
                      value={dados.email}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="email"
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <Campo
                    label="Endereço"
                    icon={MapPin}
                    className="cfg-field-wide"
                  >
                    <input
                      name="endereco"
                      value={dados.endereco}
                      onChange={handleChange}
                      maxLength={255}
                      autoComplete="street-address"
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <Campo
                    label="Instagram"
                    hint="Somente o @ ou o nome do perfil"
                    icon={AtSign}
                  >
                    <input
                      name="instagram"
                      value={dados.instagram}
                      onChange={handleChange}
                      maxLength={150}
                      autoComplete="off"
                      disabled={camposDesabilitados}
                    />
                  </Campo>

                  <div className="cfg-field cfg-field-wide">
                    <label className="cfg-field-label">Descrição</label>
                    <textarea
                      name="descricao"
                      value={dados.descricao}
                      onChange={handleChange}
                      rows={3}
                      maxLength={65535}
                      placeholder="Fale um pouco sobre sua empresa para os clientes..."
                      disabled={camposDesabilitados}
                      className="cfg-textarea"
                    />
                  </div>
                </div>
              </section>

              {/* Seção: Agendamento */}
              <section className="cfg-card">
                <div className="cfg-card-header">
                  <div className="cfg-card-icon">
                    <CalendarClock size={18} />
                  </div>
                  <div>
                    <h2 className="cfg-card-title">Agendamento online</h2>
                    <p className="cfg-card-description">
                      Controle como os clientes interagem com sua agenda pública.
                    </p>
                  </div>
                </div>

                <div className="cfg-toggles">
                  <Toggle
                    id="agendamento_online"
                    label="Agendamento online ativo"
                    description="Permite que clientes agendem diretamente pela sua página pública."
                    checked={dados.agendamento_online}
                    onChange={(e) => atualizar("agendamento_online", e.target.checked)}
                    disabled={camposDesabilitados}
                  />
                  <Toggle
                    id="permitir_cancelamento"
                    label="Cancelamento pelo cliente"
                    description="O cliente pode cancelar o próprio agendamento pelo link enviado."
                    checked={dados.permitir_cancelamento}
                    onChange={(e) => atualizar("permitir_cancelamento", e.target.checked)}
                    disabled={camposDesabilitados}
                  />
                  <Toggle
                    id="permitir_reagendamento"
                    label="Reagendamento pelo cliente"
                    description="O cliente pode alterar a data e horário do agendamento."
                    checked={dados.permitir_reagendamento}
                    onChange={(e) => atualizar("permitir_reagendamento", e.target.checked)}
                    disabled={camposDesabilitados}
                  />
                </div>

                <div className="cfg-antecedencia-section">
                  <div className="cfg-antecedencia-label">
                    <span className="cfg-field-label">Antecedência mínima para agendamento</span>
                    <p className="cfg-field-sublabel">
                      Com quanto tempo de antecedência o cliente pode criar um agendamento.
                    </p>
                  </div>
                  <SeletorAntecedencia
                    valor={dados.antecedencia_minutos}
                    onChange={(v) => atualizar("antecedencia_minutos", v)}
                    disabled={camposDesabilitados}
                  />
                </div>
              </section>
            </div>

            {/* ── COLUNA LATERAL ────────────────────────────────────── */}
            <aside className="cfg-aside">

              {/* Card: Salvar */}
              {podeEditar && (
                <div className="cfg-info-card">
                  <button
                    type="submit"
                    className="cfg-save-btn"
                    disabled={salvando || carregando || !carregado}
                  >
                    {salvando ? (
                      <LoaderCircle size={16} className="cfg-spinner" />
                    ) : (
                      <Save size={16} />
                    )}
                    {salvando ? "Salvando..." : "Salvar alterações"}
                  </button>
                  {temAlteracoes && (
                    <button
                      type="button"
                      className="cfg-discard-btn-full"
                      onClick={descartar}
                      disabled={salvando}
                    >
                      Descartar alterações
                    </button>
                  )}
                  <p className="cfg-save-note">
                    Alterações aplicadas imediatamente para todos os usuários da empresa.
                  </p>
                </div>
              )}

              {/* Card: Excluir conta */}
              {podeEditar && (
                <div className="cfg-info-card cfg-danger-card">
                  <div className="cfg-info-card-header cfg-danger-card-header">
                    <Trash2 size={15} />
                    <span>Excluir conta</span>
                  </div>
                  <p className="cfg-info-card-desc">
                    Remove permanentemente sua conta de administrador e todos os
                    dados da empresa. Esta ação não pode ser desfeita.
                  </p>
                  <button
                    type="button"
                    className="cfg-danger-button"
                    onClick={abrirModalExclusao}
                  >
                    <Trash2 size={14} />
                    Excluir minha conta
                  </button>
                </div>
              )}
            </aside>
          </div>
        </form>
      )}

      {modalExclusaoAberta && (
        <div
          className="professional-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !excluindoConta) {
              fecharModalExclusao();
            }
          }}
        >
          <section
            className="professional-modal professional-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cfg-delete-account-title"
            aria-describedby="cfg-delete-account-description"
          >
            <header className="professional-modal-header">
              <div>
                <p className="eyebrow">ZONA DE PERIGO</p>
                <h2 id="cfg-delete-account-title">Excluir minha conta</h2>
              </div>
              <button
                type="button"
                className="professional-modal-close"
                onClick={fecharModalExclusao}
                disabled={excluindoConta}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            <form className="cfg-delete-account-form" onSubmit={excluirConta}>
              <div className="professional-delete-body">
                <div className="professional-delete-warning-icon" aria-hidden="true">
                  <Trash2 size={22} />
                </div>
                <p id="cfg-delete-account-description">
                  Você está prestes a excluir permanentemente a conta de{" "}
                  <strong>{usuario?.nome || usuario?.email}</strong> e todos os
                  dados de <strong>{dados.nome || "sua empresa"}</strong>.
                </p>
                <ul className="professional-delete-consequences">
                  <li>Todos os profissionais e contas de acesso vinculados serão excluídos</li>
                  <li>Todos os agendamentos, clientes, serviços e horários serão removidos</li>
                  <li>A página pública de agendamento deixará de existir</li>
                  <li>Esta ação é permanente e não pode ser desfeita</li>
                </ul>

                <label className="professional-form-field cfg-delete-account-password">
                  <span>Confirme sua senha *</span>
                  <input
                    type="password"
                    value={senhaExclusao}
                    onChange={(event) => {
                      setSenhaExclusao(event.target.value);
                      setErroExclusaoConta("");
                    }}
                    autoComplete="current-password"
                    placeholder="Digite sua senha atual"
                    required
                    disabled={excluindoConta}
                  />
                </label>

                {erroExclusaoConta && (
                  <div className="cfg-alert cfg-alert-error" role="alert">
                    <XCircle size={15} />
                    <span>{erroExclusaoConta}</span>
                  </div>
                )}
              </div>

              <footer className="professional-form-actions">
                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={fecharModalExclusao}
                  disabled={excluindoConta}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="professional-confirm-delete-button"
                  disabled={excluindoConta}
                >
                  {excluindoConta ? (
                    <>
                      <LoaderCircle size={15} className="cfg-spinner" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Excluir permanentemente
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Configuracoes;
