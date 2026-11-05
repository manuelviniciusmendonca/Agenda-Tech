import { useEffect, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const initialEmpresa = {
  nome: "",
  telefone: "",
  email: "",
  descricao: "",
  endereco: "",
  instagram: "",
};

function OnboardingEmpresa() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [empresa, setEmpresa] = useState(initialEmpresa);
  const [configuracoes, setConfiguracoes] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarEmpresa() {
      try {
        const response = await api.get("/configuracoes");
        if (!ativo) return;

        const dados = response.data;
        setConfiguracoes(dados);
        setEmpresa({
          nome: dados.nome || "",
          telefone: dados.telefone || "",
          email: dados.email || "",
          descricao: dados.descricao || "",
          endereco: dados.endereco || "",
          instagram: dados.instagram || "",
        });
      } catch (error) {
        if (!ativo) return;
        setErro(
          error.response?.data?.mensagem ||
            "Não foi possível carregar os dados da empresa.",
        );
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarEmpresa();

    return () => {
      ativo = false;
    };
  }, []);

  if (usuario?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setEmpresa((atual) => ({ ...atual, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!configuracoes?.slug) {
      setErro("Não foi possível carregar o identificador da empresa.");
      return;
    }

    if (
      !empresa.nome.trim() ||
      !empresa.telefone.trim() ||
      !empresa.email.trim()
    ) {
      setErro("Preencha o nome, telefone e e-mail da empresa.");
      return;
    }

    try {
      setSalvando(true);
      await api.put("/configuracoes", {
        ...configuracoes,
        ...empresa,
        nome: empresa.nome.trim(),
        slug: configuracoes.slug,
        telefone: empresa.telefone.trim(),
        email: empresa.email.trim(),
        descricao: empresa.descricao.trim(),
        endereco: empresa.endereco.trim(),
        instagram: empresa.instagram.trim(),
      });

      navigate("/servicos");
    } catch (error) {
      setErro(
        error.response?.data?.mensagem ||
          "Não foi possível salvar os dados. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="onboarding-page">
      <header className="onboarding-topbar">
        <Link className="onboarding-brand" to="/dashboard" aria-label="Agenda Tech">
          <img
            className="onboarding-logo-image"
            src="/logo.png"
            alt="Agenda Tech"
          />
        </Link>
        <Link className="onboarding-skip" to="/dashboard">
          Pular por enquanto
        </Link>
      </header>

      <div className="onboarding-content">
        <nav className="onboarding-steps" aria-label="Etapas do onboarding">
          <div className="onboarding-step onboarding-step-active">
            <span className="onboarding-step-number">01</span>
            <span>Empresa</span>
          </div>
          <span className="onboarding-step-line" />
          <div className="onboarding-step">
            <span className="onboarding-step-number">02</span>
            <span>Serviços</span>
          </div>
          <span className="onboarding-step-line" />
          <div className="onboarding-step">
            <span className="onboarding-step-number">03</span>
            <span>Profissionais</span>
          </div>
          <span className="onboarding-step-line" />
          <div className="onboarding-step">
            <span className="onboarding-step-number">04</span>
            <span>Horários</span>
          </div>
        </nav>

        <section className="onboarding-card">
          <div className="onboarding-heading">
            <p className="onboarding-eyebrow">ETAPA 01 · SUA EMPRESA</p>
            <h1>Vamos preparar seu espaço.</h1>
            <p>
              Essas informações ajudam seus clientes a conhecer seu negócio
              antes de agendar.
            </p>
          </div>

          {carregando ? (
            <div className="onboarding-loading" role="status">
              <LoaderCircle size={20} className="onboarding-spinner" />
              Carregando dados da empresa...
            </div>
          ) : (
            <form className="onboarding-form" onSubmit={handleSubmit}>
              <div className="onboarding-fields">
                <label className="onboarding-field onboarding-field-wide">
                  <span>Nome da empresa</span>
                  <input
                    name="nome"
                    value={empresa.nome}
                    onChange={atualizarCampo}
                    placeholder="Ex.: Studio Aurora"
                    autoComplete="organization"
                    required
                  />
                </label>

                <label className="onboarding-field">
                  <span>Telefone</span>
                  <input
                    name="telefone"
                    type="tel"
                    value={empresa.telefone}
                    onChange={atualizarCampo}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    required
                  />
                </label>

                <label className="onboarding-field">
                  <span>E-mail</span>
                  <input
                    name="email"
                    type="email"
                    value={empresa.email}
                    onChange={atualizarCampo}
                    placeholder="contato@empresa.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="onboarding-field onboarding-field-wide">
                  <span>Descrição</span>
                  <textarea
                    name="descricao"
                    value={empresa.descricao}
                    onChange={atualizarCampo}
                    placeholder="Conte um pouco sobre sua empresa"
                    rows="3"
                  />
                </label>

                <label className="onboarding-field onboarding-field-wide">
                  <span>Endereço</span>
                  <input
                    name="endereco"
                    value={empresa.endereco}
                    onChange={atualizarCampo}
                    placeholder="Rua, número, bairro e cidade"
                    autoComplete="street-address"
                  />
                </label>

                <label className="onboarding-field onboarding-field-wide">
                  <span>Instagram</span>
                  <input
                    name="instagram"
                    value={empresa.instagram}
                    onChange={atualizarCampo}
                    placeholder="@suaempresa"
                    autoComplete="off"
                  />
                </label>
              </div>

              {erro && (
                <div className="onboarding-error" role="alert">
                  {erro}
                </div>
              )}

              <div className="onboarding-actions">
                <span className="onboarding-save-note">
                  <Check size={15} />
                  Você pode alterar essas informações depois.
                </span>
                <button
                  className="onboarding-continue"
                  type="submit"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Continuar"}
                  {!salvando && <ArrowRight size={17} />}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default OnboardingEmpresa;
