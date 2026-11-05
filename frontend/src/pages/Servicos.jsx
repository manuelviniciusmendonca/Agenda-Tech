import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Clock3,
  Edit2,
  LoaderCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const formularioInicial = {
  nome: "",
  preco: "",
  duracao_minutos: "",
  intervalo_retorno_dias: "",
  ativo: true,
};

function formatarPreco(preco) {
  const valor = Number(preco);

  if (!Number.isFinite(valor)) {
    return "—";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function Servicos() {
  const { usuario } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [servicoEditando, setServicoEditando] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState(null);
  const [erroFormulario, setErroFormulario] = useState("");

  const podeGerenciar = usuario?.role === "ADMIN";

  const carregarServicos = useCallback(async () => {
    try {
      const response = await api.get("/servicos");
      if (!Array.isArray(response.data)) {
        throw new Error("A resposta dos serviços está em formato inválido.");
      }
      setErro("");
      setServicos(response.data);
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          error.message ||
          "Não foi possível carregar os serviços. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    api
      .get("/servicos")
      .then((response) => {
        if (!Array.isArray(response.data)) {
          throw new Error("A resposta dos serviços está em formato inválido.");
        }
        if (!ativo) return;
        setServicos(response.data);
      })
      .catch((error) => {
        if (!ativo) return;
        setErro(
          error.response?.data?.mensagem ||
            error.message ||
            "Não foi possível carregar os serviços. Tente novamente.",
        );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function abrirCriacao() {
    setServicoEditando(null);
    setFormulario(formularioInicial);
    setErroFormulario("");
    setModalAberto(true);
  }

  function abrirEdicao(servico) {
    setServicoEditando(servico);
    setFormulario({
      nome: servico.nome || "",
      preco: String(servico.preco ?? ""),
      duracao_minutos: String(servico.duracao_minutos ?? ""),
      intervalo_retorno_dias:
        servico.intervalo_retorno_dias == null
          ? ""
          : String(servico.intervalo_retorno_dias),
      ativo: Boolean(servico.ativo),
    });
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

  async function salvarServico(event) {
    event.preventDefault();
    setErroFormulario("");

    const preco = Number(formulario.preco);
    const duracao = Number(formulario.duracao_minutos);
    const retorno = formulario.intervalo_retorno_dias
      ? Number(formulario.intervalo_retorno_dias)
      : null;

    if (!formulario.nome.trim()) {
      setErroFormulario("Informe o nome do serviço.");
      return;
    }

    if (!Number.isFinite(preco) || preco < 0) {
      setErroFormulario("Informe um preço válido, igual ou maior que zero.");
      return;
    }

    if (!Number.isInteger(duracao) || duracao <= 0) {
      setErroFormulario("A duração deve ser um número de minutos maior que zero.");
      return;
    }

    if (retorno !== null && (!Number.isInteger(retorno) || retorno < 0)) {
      setErroFormulario("O intervalo de retorno deve ser um número de dias válido.");
      return;
    }

    const dados = {
      nome: formulario.nome.trim(),
      preco,
      duracao_minutos: duracao,
      intervalo_retorno_dias: retorno,
    };

    if (servicoEditando) {
      dados.ativo = formulario.ativo;
    }

    try {
      setSalvando(true);
      if (servicoEditando) {
        await api.put(`/servicos/${servicoEditando.id}`, dados);
      } else {
        await api.post("/servicos", dados);
      }

      setModalAberto(false);
      await carregarServicos();
    } catch (error) {
      setErroFormulario(
        error.response?.data?.mensagem ||
          "Não foi possível salvar o serviço. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirServico(servico) {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o serviço "${servico.nome}"?`,
    );

    if (!confirmado) return;

    setErro("");
    setExcluindoId(servico.id);

    try {
      await api.delete(`/servicos/${servico.id}`);
      setServicos((atuais) =>
        atuais.filter((item) => item.id !== servico.id),
      );
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível excluir o serviço. Tente novamente.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">GESTÃO DO NEGÓCIO</p>
          <h1>Serviços</h1>
          <p className="page-description">
            Gerencie os serviços oferecidos pela sua empresa.
          </p>
        </div>
        {podeGerenciar && (
          <button
            type="button"
            className="primary-button services-add-button"
            onClick={abrirCriacao}
          >
            <Plus size={16} />
            Novo serviço
          </button>
        )}
      </header>

      {erro && (
        <div className="services-error" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={carregarServicos}>
            Tentar novamente
          </button>
        </div>
      )}

      {carregando ? (
        <div className="services-state" role="status">
          <LoaderCircle size={22} className="services-spinner" />
          Carregando serviços...
        </div>
      ) : servicos.length === 0 ? (
        <div className="services-empty">
          <div className="services-empty-icon">
            <Briefcase size={22} />
          </div>
          <h2>Nenhum serviço cadastrado</h2>
          <p>
            {podeGerenciar
              ? "Adicione o primeiro serviço da sua empresa para começar."
              : "Os serviços da empresa aparecerão aqui."}
          </p>
          {podeGerenciar && (
            <button
              type="button"
              className="primary-button services-add-button"
              onClick={abrirCriacao}
            >
              <Plus size={16} />
              Adicionar serviço
            </button>
          )}
        </div>
      ) : (
        <div className="services-grid">
          {servicos.map((servico) => (
            <article className="service-card" key={servico.id}>
              <div className="service-card-top">
                <div className="service-icon">
                  <Briefcase size={19} />
                </div>
                <span
                  className={`service-status ${
                    servico.ativo ? "service-status-active" : ""
                  }`}
                >
                  {servico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="service-card-info">
                <h2>{servico.nome}</h2>
                <strong className="service-price">
                  {formatarPreco(servico.preco)}
                </strong>
              </div>

              <div className="service-details">
                <span>
                  <Clock3 size={15} />
                  {servico.duracao_minutos} min
                </span>
                <span>
                  Retorno estimado:{" "}
                  {servico.intervalo_retorno_dias == null
                    ? "Não informado"
                    : `${servico.intervalo_retorno_dias} dias`}
                </span>
              </div>

              {podeGerenciar && (
                <div className="service-card-actions">
                  <button
                    type="button"
                    className="service-action-button"
                    onClick={() => abrirEdicao(servico)}
                    aria-label={`Editar ${servico.nome}`}
                  >
                    <Edit2 size={15} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="service-action-button service-delete-button"
                    onClick={() => excluirServico(servico)}
                    disabled={excluindoId === servico.id}
                    aria-label={`Excluir ${servico.nome}`}
                  >
                    {excluindoId === servico.id ? (
                      <LoaderCircle size={15} className="services-spinner" />
                    ) : (
                      <Trash2 size={15} />
                    )}
                    {excluindoId === servico.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {modalAberto && (
        <div
          className="service-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) {
              setModalAberto(false);
            }
          }}
        >
          <section
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
          >
            <header className="service-modal-header">
              <div>
                <p className="eyebrow">
                  {servicoEditando ? "ATUALIZAÇÃO" : "NOVO CADASTRO"}
                </p>
                <h2 id="service-modal-title">
                  {servicoEditando ? "Editar serviço" : "Novo serviço"}
                </h2>
              </div>
              <button
                type="button"
                className="service-modal-close"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
                aria-label="Fechar"
              >
                <X size={19} />
              </button>
            </header>

            <form className="service-form" onSubmit={salvarServico}>
              <label className="service-form-field service-form-wide">
                <span>Nome do serviço</span>
                <input
                  name="nome"
                  value={formulario.nome}
                  onChange={atualizarCampo}
                  placeholder="Ex.: Corte feminino"
                  required
                />
              </label>

              <label className="service-form-field">
                <span>Preço (R$)</span>
                <input
                  name="preco"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formulario.preco}
                  onChange={atualizarCampo}
                  placeholder="0,00"
                  required
                />
              </label>

              <label className="service-form-field">
                <span>Duração (minutos)</span>
                <input
                  name="duracao_minutos"
                  type="number"
                  min="1"
                  step="1"
                  value={formulario.duracao_minutos}
                  onChange={atualizarCampo}
                  placeholder="60"
                  required
                />
              </label>

              <label className="service-form-field service-form-wide">
                <span>Intervalo de retorno (dias)</span>
                <input
                  name="intervalo_retorno_dias"
                  type="number"
                  min="0"
                  step="1"
                  value={formulario.intervalo_retorno_dias}
                  onChange={atualizarCampo}
                  placeholder="Opcional"
                />
              </label>

              {servicoEditando && (
                <label className="service-active-toggle service-form-wide">
                  <input
                    name="ativo"
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={atualizarCampo}
                  />
                  <span className="service-toggle-mark" />
                  <span>Serviço ativo</span>
                </label>
              )}

              {erroFormulario && (
                <div className="services-error service-form-wide" role="alert">
                  {erroFormulario}
                </div>
              )}

              <footer className="service-form-actions service-form-wide">
                <button
                  type="button"
                  className="service-cancel-button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button service-submit-button"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar serviço"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Servicos;
