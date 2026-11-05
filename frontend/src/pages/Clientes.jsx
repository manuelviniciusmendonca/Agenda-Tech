import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LoaderCircle,
  Mail,
  Phone,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const formularioInicial = {
  nome: "",
  telefone: "",
  email: "",
};

function mensagemErro(error, acao = "carregar") {
  const status = error.response?.status;

  if (status === 400) return "Nome e telefone são obrigatórios.";
  if (status === 401) return "Sua sessão expirou. Entre novamente.";
  if (status === 403) {
    return (
      error.response?.data?.mensagem ||
      "Você não tem permissão para realizar esta ação."
    );
  }
  if (status === 404) return "Cliente não encontrado.";
  if (status === 409) {
    return "Este telefone já está cadastrado nesta empresa.";
  }
  if (status >= 500 && acao === "excluir") {
    return "Não foi possível excluir o cliente. Pode haver agendamentos vinculados a ele.";
  }
  if (status >= 500) {
    return "Ocorreu um erro no servidor. Tente novamente.";
  }

  return (
    error.response?.data?.mensagem ||
    `Não foi possível ${acao} os clientes. Tente novamente.`
  );
}

function ordenarPorNome(clientes) {
  return [...clientes].sort((a, b) =>
    String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR"),
  );
}

function Clientes() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const podeExcluir = usuario?.role === "ADMIN";

  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);
  const [clienteDetalhe, setClienteDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const buscarClientes = useCallback(async () => {
    const response = await api.get("/clientes");
    if (!Array.isArray(response.data)) {
      throw new Error("A resposta de clientes está em formato inválido.");
    }
    return response.data;
  }, []);

  useEffect(() => {
    let ativo = true;

    buscarClientes()
      .then((resultado) => {
        if (ativo) {
          setClientes(resultado);
          setErro("");
        }
      })
      .catch((error) => {
        if (!ativo) return;
        if (error.response?.status === 401) {
          logout();
          navigate("/login", { replace: true });
          return;
        }
        setErro(mensagemErro(error));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [buscarClientes, logout, navigate]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return clientes;

    return clientes.filter((cliente) =>
      [cliente.nome, cliente.telefone, cliente.email].some((valor) =>
        String(valor || "").toLocaleLowerCase("pt-BR").includes(termo),
      ),
    );
  }, [busca, clientes]);

  async function atualizarLista() {
    setCarregando(true);
    setErro("");
    setMensagemSucesso("");

    try {
      setClientes(await buscarClientes());
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setErro(mensagemErro(error));
    } finally {
      setCarregando(false);
    }
  }

  function abrirCriacao() {
    setClienteEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario("");
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setClienteEditando(cliente);
    setFormulario({
      nome: cliente.nome || "",
      telefone: cliente.telefone || "",
      email: cliente.email || "",
    });
    setErroFormulario("");
    setModalAberto(true);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setFormulario((atual) => ({ ...atual, [name]: value }));
  }

  async function salvarCliente(event) {
    event.preventDefault();
    setErroFormulario("");

    const dados = {
      nome: formulario.nome.trim(),
      telefone: formulario.telefone.trim(),
      email: formulario.email.trim(),
    };

    if (!dados.nome || !dados.telefone) {
      setErroFormulario("Nome e telefone são obrigatórios.");
      return;
    }

    try {
      setSalvando(true);
      if (clienteEditando) {
        await api.put(`/clientes/${clienteEditando.id}`, dados);
        setClientes((atuais) =>
          ordenarPorNome(
            atuais.map((cliente) =>
              cliente.id === clienteEditando.id
                ? { ...cliente, ...dados }
                : cliente,
            ),
          ),
        );
        setMensagemSucesso("Cliente atualizado com sucesso.");
      } else {
        const response = await api.post("/clientes", dados);
        const novoCliente = response.data?.cliente;
        if (novoCliente) {
          setClientes((atuais) => ordenarPorNome([...atuais, novoCliente]));
        } else {
          setClientes(await buscarClientes());
        }
        setMensagemSucesso("Cliente criado com sucesso.");
      }

      setModalAberto(false);
      setFormulario(formularioInicial);
      setClienteEditando(null);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setErroFormulario(
        mensagemErro(
          error,
          clienteEditando ? "atualizar" : "criar",
        ),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirCliente(cliente) {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    setErro("");
    setMensagemSucesso("");
    setExcluindoId(cliente.id);

    try {
      await api.delete(`/clientes/${cliente.id}`);
      setClientes((atuais) =>
        atuais.filter((item) => item.id !== cliente.id),
      );
      setMensagemSucesso("Cliente excluído com sucesso.");
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setErro(mensagemErro(error, "excluir"));
    } finally {
      setExcluindoId(null);
    }
  }

  async function abrirDetalhes(cliente) {
    setClienteDetalhe(null);
    setErroDetalhe("");
    setCarregandoDetalhe(true);

    try {
      const response = await api.get(`/clientes/${cliente.id}`);
      setClienteDetalhe(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }
      setErroDetalhe(mensagemErro(error, "carregar"));
      setClienteDetalhe(cliente);
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    setErroFormulario("");
  }

  return (
    <div className="page-content clients-page">
      <header className="page-header clients-page-header">
        <div>
          <p className="eyebrow">RELACIONAMENTO</p>
          <h1>Clientes</h1>
          <p className="page-description">
            Consulte e mantenha atualizados os dados dos seus clientes.
          </p>
        </div>
        <button
          type="button"
          className="primary-button clients-add-button"
          onClick={abrirCriacao}
        >
          <Plus size={16} />
          Novo cliente
        </button>
      </header>

      {mensagemSucesso && (
        <div className="clients-success" role="status">
          <span>{mensagemSucesso}</span>
          <button
            type="button"
            onClick={() => setMensagemSucesso("")}
            aria-label="Fechar mensagem"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {erro && (
        <div className="clients-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={atualizarLista}>
            Tentar novamente
          </button>
        </div>
      )}

      <section className="clients-panel">
        <div className="clients-toolbar">
          <div className="clients-list-heading">
            <div className="clients-heading-icon">
              <Users size={18} />
            </div>
            <div>
              <h2>Lista de clientes</h2>
              <p>
                {carregando
                  ? "Carregando..."
                  : `${clientes.length} ${
                      clientes.length === 1 ? "cliente" : "clientes"
                    }`}
              </p>
            </div>
          </div>
          <label className="clients-search">
            <Search size={16} />
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, telefone ou e-mail"
              aria-label="Buscar clientes"
            />
          </label>
        </div>

        {carregando ? (
          <div className="clients-state" role="status">
            <LoaderCircle size={21} className="clients-spinner" />
            Carregando clientes...
          </div>
        ) : erro ? (
          <div className="clients-state clients-state-error">
            Não foi possível exibir a lista de clientes.
          </div>
        ) : clientes.length === 0 ? (
          <div className="clients-empty">
            <span className="clients-empty-icon">
              <Users size={22} />
            </span>
            <strong>Nenhum cliente cadastrado.</strong>
            <span>Cadastre um cliente para começar sua lista.</span>
            <button
              type="button"
              className="primary-button clients-add-button"
              onClick={abrirCriacao}
            >
              <Plus size={15} />
              Novo cliente
            </button>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="clients-empty clients-no-results">
            <strong>Nenhum cliente encontrado.</strong>
            <span>Tente buscar por outro nome, telefone ou e-mail.</span>
          </div>
        ) : (
          <>
            <div className="clients-table-wrap">
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>E-mail</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id}>
                      <td>
                        <button
                          type="button"
                          className="clients-name-button"
                          onClick={() => abrirDetalhes(cliente)}
                        >
                          <span className="clients-avatar">
                            <UserRound size={16} />
                          </span>
                          {cliente.nome}
                        </button>
                      </td>
                      <td>
                        <span className="clients-contact">
                          <Phone size={14} />
                          {cliente.telefone || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="clients-contact">
                          <Mail size={14} />
                          {cliente.email || "—"}
                        </span>
                      </td>
                      <td>
                        <div className="clients-actions">
                          <button
                            type="button"
                            className="clients-action-button"
                            onClick={() => abrirEdicao(cliente)}
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                          {podeExcluir && (
                            <button
                              type="button"
                              className="clients-action-button clients-delete-action"
                              onClick={() => excluirCliente(cliente)}
                              disabled={excluindoId === cliente.id}
                            >
                              {excluindoId === cliente.id ? (
                                <LoaderCircle
                                  size={14}
                                  className="clients-spinner"
                                />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="clients-cards">
              {clientesFiltrados.map((cliente) => (
                <article className="clients-card" key={cliente.id}>
                  <button
                    type="button"
                    className="clients-card-heading"
                    onClick={() => abrirDetalhes(cliente)}
                  >
                    <span className="clients-avatar">
                      <UserRound size={16} />
                    </span>
                    <strong>{cliente.nome}</strong>
                  </button>
                  <div className="clients-card-contact">
                    <span>
                      <Phone size={14} />
                      {cliente.telefone || "Telefone não informado"}
                    </span>
                    <span>
                      <Mail size={14} />
                      {cliente.email || "E-mail não informado"}
                    </span>
                  </div>
                  <div className="clients-actions">
                    <button
                      type="button"
                      className="clients-action-button"
                      onClick={() => abrirEdicao(cliente)}
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    {podeExcluir && (
                      <button
                        type="button"
                        className="clients-action-button clients-delete-action"
                        onClick={() => excluirCliente(cliente)}
                        disabled={excluindoId === cliente.id}
                      >
                        {excluindoId === cliente.id ? (
                          <LoaderCircle
                            size={14}
                            className="clients-spinner"
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Excluir
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {modalAberto && (
        <div
          className="clients-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal();
          }}
        >
          <section
            className="clients-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clients-modal-title"
          >
            <header className="clients-modal-header">
              <div>
                <p className="eyebrow">
                  {clienteEditando ? "DADOS DO CLIENTE" : "NOVO CADASTRO"}
                </p>
                <h2 id="clients-modal-title">
                  {clienteEditando ? "Editar cliente" : "Novo cliente"}
                </h2>
              </div>
              <button
                type="button"
                className="clients-modal-close"
                onClick={fecharModal}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>

            <form className="clients-form" onSubmit={salvarCliente}>
              <label className="clients-form-field clients-form-wide">
                <span>Nome <b>*</b></span>
                <input
                  name="nome"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  autoComplete="name"
                  required
                  maxLength={150}
                />
              </label>
              <label className="clients-form-field">
                <span>Telefone <b>*</b></span>
                <input
                  name="telefone"
                  type="tel"
                  value={formulario.telefone}
                  onChange={atualizarCampo}
                  autoComplete="tel"
                  required
                  maxLength={30}
                />
              </label>
              <label className="clients-form-field">
                <span>E-mail</span>
                <input
                  name="email"
                  type="email"
                  value={formulario.email}
                  onChange={atualizarCampo}
                  autoComplete="email"
                  maxLength={254}
                />
              </label>

              {erroFormulario && (
                <div className="clients-error clients-form-wide" role="alert">
                  {erroFormulario}
                </div>
              )}

              <footer className="clients-form-actions clients-form-wide">
                <button
                  type="button"
                  className="clients-cancel-button"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button clients-submit-button"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <LoaderCircle size={15} className="clients-spinner" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      {clienteEditando ? "Salvar alterações" : "Criar cliente"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {(clienteDetalhe || carregandoDetalhe) && (
        <div
          className="clients-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !carregandoDetalhe) {
              setClienteDetalhe(null);
              setErroDetalhe("");
            }
          }}
        >
          <section
            className="clients-modal clients-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clients-detail-title"
          >
            <header className="clients-modal-header">
              <div>
                <p className="eyebrow">CADASTRO</p>
                <h2 id="clients-detail-title">Detalhes do cliente</h2>
              </div>
              <button
                type="button"
                className="clients-modal-close"
                onClick={() => {
                  setClienteDetalhe(null);
                  setErroDetalhe("");
                }}
                disabled={carregandoDetalhe}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </header>
            {carregandoDetalhe ? (
              <div className="clients-state">
                <LoaderCircle size={20} className="clients-spinner" />
                Carregando dados do cliente...
              </div>
            ) : (
              <>
                {erroDetalhe && (
                  <div className="clients-error" role="alert">
                    {erroDetalhe}
                  </div>
                )}
                <div className="clients-detail-list">
                  <div>
                    <span>Nome</span>
                    <strong>{clienteDetalhe.nome}</strong>
                  </div>
                  <div>
                    <span>Telefone</span>
                    <strong>{clienteDetalhe.telefone || "—"}</strong>
                  </div>
                  <div>
                    <span>E-mail</span>
                    <strong>{clienteDetalhe.email || "—"}</strong>
                  </div>
                </div>
                <footer className="clients-form-actions">
                  <button
                    type="button"
                    className="clients-cancel-button"
                    onClick={() => {
                      setClienteDetalhe(null);
                      setErroDetalhe("");
                    }}
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    className="primary-button clients-submit-button"
                    onClick={() => {
                      setClienteDetalhe(null);
                      abrirEdicao(clienteDetalhe);
                    }}
                  >
                    <Pencil size={14} />
                    Editar
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Clientes;
