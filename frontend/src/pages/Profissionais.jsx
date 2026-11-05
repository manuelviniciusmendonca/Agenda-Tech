import { useCallback, useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Check,
  Copy,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const formularioInicial = {
  nome: "",
  telefone: "",
  email: "",
  ativo: true,
};

function formatarPreco(valor) {
  const num = Number(valor);
  return Number.isFinite(num)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
    : "";
}

function Profissionais() {
  const { usuario } = useAuth();
  const podeGerenciar = usuario?.role === "ADMIN";
  const isAdministrador = usuario?.role === "ADMIN";
  const isProfissional = usuario?.role === "PROFISSIONAL";

  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [profissionalEditando, setProfissionalEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const controllerRef = useRef(null);
  const [cadastrandoProprioPerfil, setCadastrandoProprioPerfil] = useState(false);
  const [profissionalConvidado, setProfissionalConvidado] = useState(null);
  const [emailConvite, setEmailConvite] = useState("");
  const [linkConvite, setLinkConvite] = useState("");
  const [erroConvite, setErroConvite] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [criandoConvite, setCriandoConvite] = useState(false);
  const [profissionalParaExcluir, setProfissionalParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");

  const adminTemPerfil = profissionais.some(p => p.usuario_id === usuario?.usuario_id);
  const profissionalLogado = profissionais.find(p => p.usuario_id === usuario?.usuario_id);
  const podeEditarProprioPerfil = isProfissional && profissionalLogado;
  const excluindoMeuPerfil =
    Boolean(profissionalParaExcluir?.usuario_id) &&
    profissionalParaExcluir?.usuario_id === usuario?.usuario_id;

  const buscarDados = useCallback(async (signal) => {
    const [profissionaisResponse, servicosResponse] = await Promise.all([
      api.get("/profissionais", { signal }),
      api.get("/servicos", { signal }),
    ]);

    if (
      !Array.isArray(profissionaisResponse.data) ||
      !Array.isArray(servicosResponse.data)
    ) {
      throw new Error("A resposta de profissionais ou serviços é inválida.");
    }

    const profissionais = await Promise.all(
      profissionaisResponse.data.map(async (profissional) => {
        const response = await api.get(
          `/profissional-servicos/profissional/${profissional.id}`,
          { signal },
        );

        if (!Array.isArray(response.data)) {
          throw new Error("A resposta dos vínculos de serviços é inválida.");
        }

        return { ...profissional, servicos: response.data };
      }),
    );

    return { profissionais, servicos: servicosResponse.data };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    buscarDados(controller.signal)
      .then(({ profissionais: resultado, servicos: servicosCarregados }) => {
        if (controller.signal.aborted) return;
        setProfissionais(resultado);
        setServicos(servicosCarregados);
      })
      .catch((error) => {
        if (controller.signal.aborted || error.name === "AbortError") return;
        setErro(
          error.response?.data?.mensagem ||
            error.message ||
            "Não foi possível carregar os profissionais e serviços.",
        );
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setCarregando(false);
      });

    return () => controller.abort();
  }, [buscarDados]);

  const carregarDados = useCallback(async () => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setCarregando(true);
    setErro("");

    try {
      const { profissionais: resultado, servicos: servicosCarregados } =
        await buscarDados(controller.signal);

      if (!controller.signal.aborted) {
        setProfissionais(resultado);
        setServicos(servicosCarregados);
      }
    } catch (error) {
      if (controller.signal.aborted || error.name === "AbortError") return;
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os profissionais e serviços.",
      );
    } finally {
      if (!controller.signal.aborted) {
        setCarregando(false);
      }
    }
  }, [buscarDados]);

  function tentarCarregarDados() {
    void carregarDados();
  }

  function abrirCriacao() {
    setCadastrandoProprioPerfil(false);
    setProfissionalEditando(null);
    setFormulario(formularioInicial);
    setServicosSelecionados([]);
    setErroFormulario("");
    setModalAberto(true);
  }

  function abrirCriacaoProprioPerfil() {
    setCadastrandoProprioPerfil(true);
    setProfissionalEditando(null);
    setFormulario({
      nome: usuario?.nome || "",
      telefone: "",
      email: usuario?.email || "",
      ativo: true,
    });
    setServicosSelecionados([]);
    setErroFormulario("");
    setModalAberto(true);
  }

  function abrirEdicao(profissional) {
    setProfissionalEditando(profissional);
    setFormulario({
      nome: profissional.nome,
      telefone: profissional.telefone || "",
      email: profissional.email || "",
      ativo: Boolean(profissional.ativo),
    });
    setServicosSelecionados(profissional.servicos.map((servico) => servico.id));
    setErroFormulario("");
    setModalAberto(true);
  }

  function atualizarCampo(event) {
    const { name, value, type, checked } = event.target;
    setFormulario((atual) => ({
      ...atual,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function alternarServico(servicoId) {
    setServicosSelecionados((atuais) =>
      atuais.includes(servicoId)
        ? atuais.filter((id) => id !== servicoId)
        : [...atuais, servicoId],
    );
  }

  function abrirConvite(profissional) {
    setProfissionalConvidado(profissional);
    setEmailConvite(profissional.email || "");
    setLinkConvite("");
    setErroConvite("");
    setCopiado(false);
  }

  async function confirmarExclusao() {
    if (!profissionalParaExcluir || excluindo) return;

    setExcluindo(true);
    setErroExclusao("");

    try {
      await api.delete(`/profissionais/${profissionalParaExcluir.id}`);
      setProfissionalParaExcluir(null);
      await carregarDados();
    } catch (error) {
      setErroExclusao(
        error.response?.data?.mensagem ||
          "Não foi possível excluir o profissional. Tente novamente.",
      );
    } finally {
      setExcluindo(false);
    }
  }

  async function criarConvite(event) {
    event.preventDefault();
    if (!profissionalConvidado || criandoConvite) return;

    setCriandoConvite(true);
    setErroConvite("");

    try {
      const response = await api.post("/convites", {
        profissional_id: profissionalConvidado.id,
        email: emailConvite.trim(),
      });

      const convite = response.data?.convite;
      const link =
        convite?.link_convite ||
        (convite?.token
          ? `${window.location.origin}/convite/${convite.token}`
          : "");

      if (!link) {
        throw new Error("O servidor não retornou o link do convite.");
      }

      setLinkConvite(link);
      await carregarDados();
    } catch (error) {
      setErroConvite(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível criar o convite. Tente novamente.",
      );
    } finally {
      setCriandoConvite(false);
    }
  }

  async function copiarLinkConvite() {
    if (!linkConvite) return;
    try {
      await navigator.clipboard.writeText(linkConvite);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErroConvite("Não foi possível copiar o link. Selecione e copie manualmente.");
    }
  }

  async function sincronizarServicos(profissionalId, servicosAtuais) {
    const servicosAdicionar = servicosSelecionados.filter(
      (id) => !servicosAtuais.includes(id),
    );
    const servicosRemover = servicosAtuais.filter(
      (id) => !servicosSelecionados.includes(id),
    );

    for (const servicoId of servicosAdicionar) {
      await api.post("/profissional-servicos", {
        profissional_id: profissionalId,
        servico_id: servicoId,
      });
    }

    for (const servicoId of servicosRemover) {
      await api.delete("/profissional-servicos", {
        data: {
          profissional_id: profissionalId,
          servico_id: servicoId,
        },
      });
    }
  }

  async function salvarProfissional(event) {
    event.preventDefault();
    setSalvando(true);
    setErroFormulario("");

    let profissionalId = profissionalEditando?.id;

    try {
      if (profissionalEditando) {
        if (!podeEditarProprioPerfil || podeGerenciar) {
          await api.put(`/profissionais/${profissionalEditando.id}`, {
            nome: formulario.nome.trim(),
            telefone: formulario.telefone.trim() || null,
            email: formulario.email.trim() || null,
            ativo: formulario.ativo,
          });
        }
      } else {
        const payload = cadastrandoProprioPerfil
          ? {
              nome: formulario.nome.trim(),
              telefone: formulario.telefone.trim() || null,
              email: formulario.email.trim() || null,
              vincular_usuario: true,
            }
          : {
              nome: formulario.nome.trim(),
              telefone: formulario.telefone.trim() || null,
              email: formulario.email.trim() || null,
            };

        const response = await api.post("/profissionais", payload);
        profissionalId = response.data.profissional.id;
      }

      const servicosAtuais = profissionalEditando
        ? profissionalEditando.servicos.map((servico) => servico.id)
        : [];
      await sincronizarServicos(profissionalId, servicosAtuais);

      setModalAberto(false);
      setCadastrandoProprioPerfil(false);
      await carregarDados();
    } catch (error) {
      setErroFormulario(
        error.response?.data?.mensagem ||
          (profissionalId && !profissionalEditando
            ? "O profissional foi criado, mas não foi possível salvar todos os vínculos de serviços."
            : "Não foi possível salvar o profissional. Tente novamente."),
      );
      if (profissionalId) {
        await carregarDados();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="page-content professionals-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">EQUIPE</p>
          <h1>Profissionais</h1>
          <p className="page-description">
            Gerencie sua equipe, vínculos de serviços e acessos à agenda.
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            className="primary-button professionals-add-button"
            onClick={abrirCriacao}
          >
            <Plus size={16} />
            Novo profissional
          </button>
        )}
      </header>

      {erro && (
        <div className="professionals-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={tentarCarregarDados}>
            Tentar novamente
          </button>
        </div>
      )}

      {isProfissional && profissionalLogado && !carregando && (
        <div className="professionals-self-notice">
          <div>
            <strong>Meu perfil profissional</strong>
            <p>Gerencie os serviços que você atende para aparecer na agenda e no agendamento online.</p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => abrirEdicao(profissionalLogado)}
          >
            Editar meus serviços
          </button>
        </div>
      )}

      {isAdministrador && !adminTemPerfil && !carregando && (
        <div className="professionals-self-notice">
          <div>
            <strong>Você também realiza atendimentos?</strong>
            <p>Cadastre seu perfil profissional para vincular sua agenda e receber agendamentos.</p>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={abrirCriacaoProprioPerfil}
          >
            Cadastrar meu perfil
          </button>
        </div>
      )}

      {carregando ? (
        <div className="professionals-state" role="status">
          <LoaderCircle size={22} className="professionals-spinner" />
          Carregando profissionais...
        </div>
      ) : profissionais.length === 0 ? (
        <div className="professionals-empty">
          <div className="professionals-empty-icon">
            <UserRound size={26} />
          </div>
          <h2>Nenhum profissional cadastrado</h2>
          <p>
            {podeGerenciar
              ? "Adicione os profissionais da sua equipe para começar a montar as agendas."
              : "Os profissionais da empresa aparecerão aqui."}
          </p>
          {podeGerenciar && (
            <button
              type="button"
              className="primary-button professionals-add-button"
              onClick={abrirCriacao}
            >
              <Plus size={16} />
              Adicionar profissional
            </button>
          )}
        </div>
      ) : (
        <div className="professionals-grid">
          {profissionais.map((profissional) => (
            <article className="professional-card" key={profissional.id}>
              <div className="professional-card-top">
                <div className="professional-avatar">
                  <UserRound size={20} />
                </div>
                <span
                  className={`service-status ${
                    profissional.ativo ? "service-status-active" : ""
                  }`}
                >
                  {profissional.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <h2>
                {profissional.usuario_id === usuario?.usuario_id
                  ? `${profissional.nome} (você)`
                  : profissional.nome}
              </h2>

              <div className="professional-contact">
                {profissional.telefone && (
                  <span>
                    <Phone size={14} />
                    {profissional.telefone}
                  </span>
                )}
                {profissional.email && (
                  <span>
                    <Mail size={14} />
                    {profissional.email}
                  </span>
                )}
                {!profissional.telefone && !profissional.email && (
                  <span className="professional-no-contact">
                    Contato não informado
                  </span>
                )}
              </div>

              <div className="professional-services">
                <div className="professional-services-heading">
                  <Briefcase size={14} />
                  <span>Serviços vinculados ({profissional.servicos.length})</span>
                </div>
                {profissional.servicos.length > 0 ? (
                  <div className="professional-service-list">
                    {profissional.servicos.map((servico) => (
                      <span className="professional-service-chip" key={servico.id}>
                        {servico.nome}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="professional-no-services">
                    Nenhum serviço vinculado
                  </span>
                )}
              </div>

              {(podeGerenciar ||
                (podeEditarProprioPerfil &&
                  profissional.usuario_id === usuario?.usuario_id)) && (
                <div className="professional-card-actions">
                  {podeGerenciar &&
                    profissional.usuario_id !== usuario?.usuario_id && (
                      <button
                        type="button"
                        className="professional-action-button"
                        onClick={() => abrirConvite(profissional)}
                        title="Enviar convite de acesso para o profissional"
                      >
                        <Mail size={14} />
                        Convidar
                      </button>
                    )}
                  <button
                    type="button"
                    className="professional-action-button"
                    onClick={() => abrirEdicao(profissional)}
                  >
                    {profissional.usuario_id === usuario?.usuario_id
                      ? "Editar meus serviços"
                      : "Editar"}
                  </button>
                  {podeGerenciar && (
                    <button
                      type="button"
                      className="professional-action-button professional-delete-button"
                      onClick={() => {
                        setErroExclusao("");
                        setProfissionalParaExcluir(profissional);
                      }}
                      title={
                        profissional.usuario_id === usuario?.usuario_id
                          ? "Remover meu perfil profissional"
                          : "Excluir profissional"
                      }
                      aria-label={
                        profissional.usuario_id === usuario?.usuario_id
                          ? "Remover meu perfil profissional"
                          : "Excluir profissional"
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição de Profissional */}
      {modalAberto && (
        <div
          className="professional-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) {
              setModalAberto(false);
            }
          }}
        >
          <section
            className="professional-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="professional-modal-title"
          >
            <header className="professional-modal-header">
              <div>
                <p className="eyebrow">
                  {profissionalEditando
                    ? podeEditarProprioPerfil && profissionalEditando
                      ? "MEUS SERVIÇOS"
                      : "ATUALIZAÇÃO"
                    : "EQUIPE"}
                </p>
                <h2 id="professional-modal-title">
                  {profissionalEditando
                    ? podeEditarProprioPerfil && profissionalEditando
                      ? "Editar meus serviços"
                      : "Editar profissional"
                    : cadastrandoProprioPerfil
                    ? "Cadastrar meu perfil profissional"
                    : "Novo profissional"}
                </h2>
              </div>
              <button
                type="button"
                className="professional-modal-close"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            <form className="professional-form" onSubmit={salvarProfissional}>
              {!cadastrandoProprioPerfil && (!podeEditarProprioPerfil || !profissionalEditando) && (
                <>
                  <label className="professional-form-field professional-form-wide">
                    <span>Nome completo *</span>
                    <input
                      name="nome"
                      value={formulario.nome}
                      onChange={atualizarCampo}
                      placeholder="Ex: Ana Paula Ribeiro"
                      autoComplete="name"
                      required
                      disabled={podeEditarProprioPerfil && profissionalEditando}
                    />
                  </label>

                  <label className="professional-form-field">
                    <span>Telefone / WhatsApp</span>
                    <input
                      name="telefone"
                      type="tel"
                      value={formulario.telefone}
                      onChange={atualizarCampo}
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      disabled={podeEditarProprioPerfil && profissionalEditando}
                    />
                  </label>

                  <label className="professional-form-field">
                    <span>E-mail</span>
                    <input
                      name="email"
                      type="email"
                      value={formulario.email}
                      onChange={atualizarCampo}
                      placeholder="profissional@empresa.com"
                      autoComplete="email"
                      disabled={podeEditarProprioPerfil && profissionalEditando}
                    />
                  </label>
                </>
              )}

              {profissionalEditando && podeGerenciar && (
                <label className="professional-active-toggle professional-form-wide">
                  <input
                    name="ativo"
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={atualizarCampo}
                  />
                  <span className="professional-toggle-mark" />
                  <span>Profissional disponível para atendimentos (ativo)</span>
                </label>
              )}

              <fieldset className="professional-services-fieldset professional-form-wide">
                <legend>
                  {podeEditarProprioPerfil && profissionalEditando
                    ? "Selecione os serviços que você realiza"
                    : "Serviços que este profissional realiza"}
                </legend>
                {servicos.length > 0 ? (
                  <div className="professional-services-options">
                    {servicos.map((servico) => {
                      const selecionado = servicosSelecionados.includes(servico.id);
                      return (
                        <label
                          className={`professional-service-option ${selecionado ? "is-selected" : ""}`}
                          key={servico.id}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => alternarServico(servico.id)}
                          />
                          <span className="professional-checkbox-mark">
                            {selecionado && <Check size={12} />}
                          </span>
                          <div className="professional-service-info">
                            <span className="professional-service-name">{servico.nome}</span>
                            <span className="professional-service-meta">
                              {formatarPreco(servico.preco)} · {servico.duracao_minutos} min
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="professional-no-services">
                    Nenhum serviço cadastrado ainda. Cadastre serviços na aba “Serviços” para associá-los ao profissional.
                  </p>
                )}
              </fieldset>

              {erroFormulario && (
                <div
                  className="professionals-error professional-form-wide"
                  role="alert"
                >
                  {erroFormulario}
                </div>
              )}

              <footer className="professional-form-actions professional-form-wide">
                <button
                  type="button"
                  className="professional-cancel-button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button professional-submit-button"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <LoaderCircle size={15} className="professionals-spinner" />
                      Salvando...
                    </>
                  ) : podeEditarProprioPerfil && profissionalEditando ? (
                    "Salvar meus serviços"
                  ) : (
                    "Salvar profissional"
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* Modal de Envio de Convite */}
      {profissionalConvidado && (
        <div
          className="professional-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !criandoConvite) {
              setProfissionalConvidado(null);
            }
          }}
        >
          <section
            className="professional-modal invite-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-modal-title"
          >
            <header className="professional-modal-header">
              <div>
                <p className="eyebrow">ACESSO À EQUIPE</p>
                <h2 id="invite-modal-title">
                  Convidar {profissionalConvidado.nome}
                </h2>
              </div>
              <button
                type="button"
                className="professional-modal-close"
                onClick={() => setProfissionalConvidado(null)}
                disabled={criandoConvite}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            {linkConvite ? (
              <div className="invite-result">
                <div className="invite-success-banner">
                  <Check size={20} />
                  <span>Convite gerado com sucesso!</span>
                </div>
                <p className="invite-instructions">
                  Compartilhe o link abaixo com <strong>{profissionalConvidado.nome}</strong> para que crie sua senha e acesse a agenda:
                </p>
                <div className="invite-link-row">
                  <input
                    readOnly
                    value={linkConvite}
                    onFocus={(event) => event.target.select()}
                  />
                  <button
                    type="button"
                    className={`booking-admin-copy ${copiado ? "is-copied" : ""}`}
                    onClick={() => void copiarLinkConvite()}
                  >
                    {copiado ? <Check size={15} /> : <Copy size={15} />}
                    <span>{copiado ? "Copiado!" : "Copiar"}</span>
                  </button>
                </div>
                {erroConvite && <p className="invite-error" role="alert">{erroConvite}</p>}
                
                <div className="invite-actions">
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Olá ${profissionalConvidado.nome}! Aqui está seu link de acesso à agenda no Agenda Tech: ${linkConvite}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="booking-admin-btn-whatsapp"
                  >
                    <MessageCircle size={16} />
                    Enviar pelo WhatsApp
                  </a>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setProfissionalConvidado(null)}
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form className="professional-form" onSubmit={criarConvite}>
                <p className="invite-description">
                  Informe o e-mail de <strong>{profissionalConvidado.nome}</strong>. Um link de convite exclusivo será gerado para definir a senha e acessar a própria agenda.
                </p>
                <label className="professional-form-field professional-form-wide">
                  <span>E-mail do profissional *</span>
                  <input
                    type="email"
                    value={emailConvite}
                    onChange={(event) => setEmailConvite(event.target.value)}
                    autoComplete="email"
                    placeholder="exemplo@email.com"
                    required
                  />
                </label>
                {erroConvite && (
                  <div className="professionals-error professional-form-wide" role="alert">
                    {erroConvite}
                  </div>
                )}
                <footer className="professional-form-actions professional-form-wide">
                  <button
                    type="button"
                    className="professional-cancel-button"
                    onClick={() => setProfissionalConvidado(null)}
                    disabled={criandoConvite}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="primary-button professional-submit-button"
                    disabled={criandoConvite}
                  >
                    {criandoConvite ? (
                      <>
                        <LoaderCircle className="professionals-spinner" size={15} />
                        Gerando convite...
                      </>
                    ) : (
                      <>
                        <Mail size={15} />
                        Gerar convite
                      </>
                    )}
                  </button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {profissionalParaExcluir && (
        <div
          className="professional-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !excluindo) {
              setProfissionalParaExcluir(null);
            }
          }}
        >
          <section
            className="professional-modal professional-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            aria-describedby="delete-modal-description"
          >
            <header className="professional-modal-header">
              <div>
                <p className="eyebrow">ATENÇÃO</p>
                <h2 id="delete-modal-title">
                  {excluindoMeuPerfil
                    ? "Remover meu perfil profissional"
                    : "Excluir profissional"}
                </h2>
              </div>
              <button
                type="button"
                className="professional-modal-close"
                onClick={() => setProfissionalParaExcluir(null)}
                disabled={excluindo}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            <div className="professional-delete-body">
              <div className="professional-delete-warning-icon" aria-hidden="true">
                <Trash2 size={22} />
              </div>
              <p id="delete-modal-description">
                {excluindoMeuPerfil ? (
                  <>
                    Você está prestes a remover{" "}
                    <strong>{profissionalParaExcluir.nome}</strong> da lista de
                    profissionais. Sua conta de administrador continuará ativa.
                  </>
                ) : (
                  <>
                    Você está prestes a excluir{" "}
                    <strong>{profissionalParaExcluir.nome}</strong>. Esta ação é
                    permanente e não pode ser desfeita.
                  </>
                )}
              </p>
              <ul className="professional-delete-consequences">
                {excluindoMeuPerfil ? (
                  <>
                    <li>Você deixará de aparecer na agenda e no agendamento online</li>
                    <li>Seus agendamentos e vínculos de serviços serão removidos</li>
                    <li>Sua conta de administrador será mantida</li>
                  </>
                ) : (
                  <>
                    <li>Todos os agendamentos vinculados serão excluídos</li>
                    <li>Os vínculos de serviços serão removidos</li>
                    {profissionalParaExcluir.usuario_id && (
                      <li>A conta de acesso do profissional será excluída</li>
                    )}
                  </>
                )}
              </ul>

              {erroExclusao && (
                <div className="professionals-error" role="alert">
                  {erroExclusao}
                </div>
              )}
            </div>

            <footer className="professional-form-actions">
              <button
                type="button"
                className="professional-cancel-button"
                onClick={() => setProfissionalParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="professional-confirm-delete-button"
                onClick={confirmarExclusao}
                disabled={excluindo}
              >
                {excluindo ? (
                  <>
                    <LoaderCircle size={15} className="professionals-spinner" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    {excluindoMeuPerfil
                      ? "Remover meu perfil"
                      : "Confirmar exclusão"}
                  </>
                )}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

export default Profissionais;
