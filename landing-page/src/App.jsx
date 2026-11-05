import { useEffect, useState } from "react";
import {
  ArrowRight,
  Play,
  Check,
  CalendarDays,
  Users,
  BarChart3,
  Clock3,
  UserRoundCheck,
  RotateCcw,
  ChevronDown,
  Scissors,
  Sparkles,
  Stethoscope,
  Palette,
} from "lucide-react";

import "./App.css";

const appBaseUrl = (
  import.meta.env.VITE_APP_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5173"
    : window.location.origin)
).replace(/\/+$/, "");
const loginUrl = `${appBaseUrl}/login`;
const cadastroUrl = `${appBaseUrl}/cadastro`;

const steps = [
  {
    number: "01",
    title: "Crie seu negócio",
    description:
      "Cadastre sua empresa e tenha seu próprio espaço dentro do Agenda Tech em poucos minutos.",
    visual: "business",
  },
  {
    number: "02",
    title: "Configure sua agenda",
    description:
      "Cadastre seus serviços, profissionais e horários. Tudo organizado em um só lugar.",
    visual: "schedule",
  },
  {
    number: "03",
    title: "Compartilhe seu link",
    description:
      "Envie seu link de agendamento para seus clientes e deixe que eles marquem o horário sozinhos.",
    visual: "link",
  },
  {
    number: "04",
    title: "Gerencie seu negócio",
    description:
      "Acompanhe seus agendamentos, clientes e faturamento diretamente pelo seu dashboard.",
    visual: "dashboard",
  },
  {
    number: "05",
    title: "Recupere seus clientes",
    description:
      "Descubra quais clientes já estão na hora de voltar e transforme antigos clientes em novos agendamentos.",
    visual: "recovery",
  },
];

const features = [
  {
    icon: CalendarDays,
    number: "01",
    title: "Agendamentos",
    description:
      "Organize sua agenda em um só lugar e tenha uma visão clara de todos os horários do seu negócio.",
    size: "large",
  },
  {
    icon: Users,
    number: "02",
    title: "Clientes",
    description:
      "Tenha seus clientes organizados e acompanhe todo o histórico de atendimentos.",
    size: "normal",
  },
  {
    icon: BarChart3,
    number: "03",
    title: "Faturamento",
    description:
      "Acompanhe o desempenho financeiro do seu negócio sem complicação.",
    size: "normal",
  },
  {
    icon: Clock3,
    number: "04",
    title: "Profissionais",
    description:
      "Gerencie sua equipe, serviços e horários de atendimento com facilidade.",
    size: "normal",
  },
  {
    icon: UserRoundCheck,
    number: "05",
    title: "Link de agendamento",
    description:
      "Seu cliente escolhe o serviço, profissional e horário sem precisar falar com você.",
    size: "normal",
  },
  {
    icon: RotateCcw,
    number: "06",
    title: "Recuperação de clientes",
    description:
      "Saiba quem está na hora de voltar e transforme clientes antigos em novos agendamentos.",
    size: "large",
  },
];

const audiences = [
  {
    icon: Sparkles,
    number: "01",
    title: "Salões de beleza",
    description:
      "Agenda organizada, histórico de cada cliente e o momento certo de chamar de volta quem já confia no seu trabalho.",
  },
  {
    icon: Scissors,
    number: "02",
    title: "Barbearias",
    description:
      "Horários sem encaixe manual, serviços com duração definida e clientes recorrentes sempre no radar.",
  },
  {
    icon: Stethoscope,
    number: "03",
    title: "Clínicas de estética",
    description:
      "Intervalos de retorno por procedimento e uma visão clara de quem está pronto para a próxima sessão.",
  },
  {
    icon: Palette,
    number: "04",
    title: "Studios de maquiagem",
    description:
      "Atendimentos, clientes e retornos organizados para você focar no que faz melhor: criar.",
  },
];

const faqs = [
  {
    question: "Preciso instalar algo para usar o Agenda Tech?",
    answer:
      "Não. O Agenda Tech funciona direto no navegador do computador e do celular. Você cria sua conta, configura o negócio e já começa a usar.",
  },
  {
    question: "Como funciona a cobrança?",
    answer:
      "São R$ 45 por mês, cobrados no cartão de crédito. O acesso é liberado assim que o primeiro pagamento é confirmado e a renovação é automática todo mês. Você pode cancelar quando quiser.",
  },
  {
    question: "Meus clientes conseguem agendar sozinhos?",
    answer:
      "Sim. Você compartilha o link do seu negócio e o cliente escolhe serviço, profissional e horário disponível sem precisar falar com você.",
  },
  {
    question: "Como a recuperação de clientes funciona?",
    answer:
      "Você define o intervalo ideal de retorno de cada serviço. O Agenda Tech cruza esse intervalo com o último atendimento e mostra quais clientes estão no momento certo de voltar.",
  },
  {
    question: "Posso cadastrar minha equipe?",
    answer:
      "Sim. Você adiciona profissionais, define os serviços de cada um e organiza os horários de atendimento de toda a equipe.",
  },
  {
    question: "Consigo acessar pelo celular?",
    answer:
      "Sim. A interface foi feita para funcionar bem em celular, tablet e computador, para você acompanhar a agenda de onde estiver.",
  },
];

function StepVisual({ type }) {
  if (type === "business") {
    return (
      <div className="step-interface">
        <div className="interface-header">
          <span>Configuração inicial</span>
          <span className="interface-progress">1 de 5</span>
        </div>

        <div className="setup-title">Vamos configurar seu negócio</div>

        <div className="fake-input">
          <span>Nome do negócio</span>
          <strong>Studio Bella</strong>
        </div>

        <div className="fake-input">
          <span>Categoria</span>
          <strong>Salão de beleza</strong>
        </div>

        <button className="fake-yellow-button">
          Continuar
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (type === "schedule") {
    return (
      <div className="step-interface">
        <div className="interface-header">
          <span>Minha agenda</span>
          <span className="interface-date">Hoje</span>
        </div>

        <div className="schedule-grid">
          <div className="schedule-time">09:00</div>
          <div className="schedule-line"></div>

          <div className="schedule-time">10:00</div>
          <div className="schedule-event">
            <strong>João da Silva</strong>
            <span>Corte masculino · Carlos</span>
          </div>

          <div className="schedule-time">11:00</div>
          <div className="schedule-line"></div>

          <div className="schedule-time">12:00</div>
          <div className="schedule-event yellow-event">
            <strong>Maria Santos</strong>
            <span>Escova · Carlos</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "link") {
    return (
      <div className="step-interface link-interface">
        <div className="link-browser">
          <div className="browser-bar">
            <span></span>
            <div>agendatech.com/studio-bella</div>
          </div>

          <div className="booking-page">
            <div className="booking-logo">Studio Bella</div>

            <span className="booking-small">ESCOLHA UM SERVIÇO</span>

            <div className="booking-option">
              <div>
                <strong>Corte masculino</strong>
                <span>30 min</span>
              </div>

              <strong>R$ 40</strong>
            </div>

            <div className="booking-option">
              <div>
                <strong>Barba</strong>
                <span>30 min</span>
              </div>

              <strong>R$ 30</strong>
            </div>

            <button className="booking-button">Agendar horário</button>
          </div>
        </div>
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className="step-interface">
        <div className="interface-header">
          <span>Visão geral</span>
          <span className="interface-date">03 Nov</span>
        </div>

        <div className="mini-stats">
          <div>
            <span>Agendamentos</span>
            <strong>24</strong>
          </div>

          <div>
            <span>Faturamento</span>
            <strong>R$ 1.840</strong>
          </div>

          <div>
            <span>Clientes</span>
            <strong>148</strong>
          </div>
        </div>

        <div className="mini-chart">
          <div className="chart-label">
            <span>Faturamento</span>
            <strong>+18,4%</strong>
          </div>

          <div className="chart-bars">
            <span style={{ height: "35%" }}></span>
            <span style={{ height: "50%" }}></span>
            <span style={{ height: "42%" }}></span>
            <span style={{ height: "68%" }}></span>
            <span style={{ height: "58%" }}></span>
            <span style={{ height: "82%" }}></span>
            <span style={{ height: "94%" }}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="step-interface recovery-interface">
      <div className="interface-header">
        <span>Clientes para recuperar</span>
        <span className="recovery-count">12 clientes</span>
      </div>

      <div className="recovery-person">
        <div className="person-avatar">J</div>

        <div>
          <strong>João da Silva</strong>
          <span>Último atendimento há 31 dias</span>
        </div>

        <button>
          <Check size={13} />
        </button>
      </div>

      <div className="recovery-person">
        <div className="person-avatar">M</div>

        <div>
          <strong>Maria Santos</strong>
          <span>Último atendimento há 34 dias</span>
        </div>

        <button>
          <Check size={13} />
        </button>
      </div>

      <div className="recovery-person">
        <div className="person-avatar">A</div>

        <div>
          <strong>Ana Oliveira</strong>
          <span>Último atendimento há 41 dias</span>
        </div>

        <button>
          <Check size={13} />
        </button>
      </div>

      <div className="recovery-footer">
        <span>Clientes no momento ideal para retornar</span>
        <strong>↗</strong>
      </div>
    </div>
  );
}

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeDemo, setActiveDemo] = useState("agenda");
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const stepElements = document.querySelectorAll(".step-item");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.step);
            setActiveStep(index);
          }
        });
      },
      {
        root: null,
        threshold: 0.5,
        rootMargin: "-10% 0px -30% 0px",
      }
    );

    stepElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="app">
      {/* NAVBAR */}

      <header className="navbar">
        <a href="/" className="logo">
          <img
            src="/logo.png"
            alt="Agenda Tech"
            className="logo-image"
          />
        </a>

        <nav className="nav-links">
          <a href="#funcionalidades">Funcionalidades</a>

          <a href="#como-funciona">Como funciona</a>

          <a href="#preco">Preço</a>
        </nav>

        <div className="nav-actions">
          <a className="login-button" href={loginUrl}>
            Entrar
          </a>

          <a className="nav-cta" href={cadastroUrl}>
            Começar agora
            <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main>
        {/* =================================================
            HERO — NÃO ALTERADO
        ================================================= */}

        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Acesso completo por R$ 45/mês.
            </div>

            <h1>
              Sua agenda.
              <br />
              Seu negócio.
              <br />
              <span>Mais clientes.</span>
            </h1>

            <p className="hero-description">
              O Agenda Tech reúne agendamentos, clientes, profissionais e
              gestão em um só lugar. Menos confusão. Mais tempo para cuidar
              do seu negócio.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href={cadastroUrl}>
                Começar agora
                <ArrowRight size={18} />
              </a>

              <a href="#como-funciona" className="secondary-button">
                <Play size={16} />
                Ver como funciona
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span>
              Configure em poucos minutos

              <span>✓</span>
              Acesso completo
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-window">
              <div className="window-header">
                <div className="window-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="window-title">Agenda Tech</div>
              </div>

              <div className="dashboard-content">
                <div className="dashboard-top">
                  <div>
                    <small>Visão geral</small>
                    <h3>Olá, Studio Bella</h3>
                  </div>

                  <div className="date-box">Hoje, 03 Nov</div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Agendamentos</span>
                    <strong>24</strong>
                    <small>+12% esta semana</small>
                  </div>

                  <div className="stat-card">
                    <span>Faturamento</span>
                    <strong>R$ 1.840</strong>
                    <small>+18% esta semana</small>
                  </div>

                  <div className="stat-card">
                    <span>Clientes</span>
                    <strong>148</strong>
                    <small>+9 novos</small>
                  </div>
                </div>

                <div className="dashboard-body">
                  <div className="appointments">
                    <div className="section-heading">
                      <strong>Próximos agendamentos</strong>
                      <span>Ver todos</span>
                    </div>

                    <div className="appointment">
                      <div className="appointment-avatar">J</div>

                      <div className="appointment-info">
                        <strong>João da Silva</strong>
                        <span>Corte masculino · 14:00</span>
                      </div>

                      <div className="appointment-status">Confirmado</div>
                    </div>

                    <div className="appointment">
                      <div className="appointment-avatar">M</div>

                      <div className="appointment-info">
                        <strong>Maria Santos</strong>
                        <span>Escova · 15:30</span>
                      </div>

                      <div className="appointment-status">Confirmado</div>
                    </div>

                    <div className="appointment">
                      <div className="appointment-avatar">A</div>

                      <div className="appointment-info">
                        <strong>Ana Oliveira</strong>
                        <span>Design de sobrancelhas · 17:00</span>
                      </div>

                      <div className="appointment-status">Pendente</div>
                    </div>
                  </div>

                  <div className="recovery-card">
                    <div className="recovery-icon">↻</div>

                    <small>Clientes para recuperar</small>

                    <strong>12 clientes</strong>

                    <p>
                      Está na hora de trazer eles
                      <br />
                      de volta.
                    </p>

                    <button>Ver clientes</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="floating-card floating-card-one">
              <span className="floating-icon">✓</span>

              <div>
                <strong>Agendamento confirmado</strong>

                <small>João acabou de agendar</small>
              </div>
            </div>

            <div className="floating-card floating-card-two">
              <strong>+ R$ 180</strong>

              <small>Faturamento hoje</small>
            </div>
          </div>
        </section>

        {/* =================================================
            COMO FUNCIONA
        ================================================= */}

        <section className="how-section" id="como-funciona">
          <div className="how-heading">
            <div className="section-eyebrow">COMO FUNCIONA</div>

            <h2>
              Do primeiro cadastro
              <br />
              ao próximo cliente.
            </h2>

            <p>
              Tudo que você precisa para colocar seu negócio no controle,
              explicado passo a passo.
            </p>
          </div>

          <div className="steps-wrapper">
            <div className="steps-list">
              {steps.map((step, index) => (
                <article
                  className={`step-item ${
                    activeStep === index ? "step-active" : ""
                  }`}
                  data-step={index}
                  key={step.number}
                >
                  <div className="step-number">{step.number}</div>

                  <div className="step-copy">
                    <h3>{step.title}</h3>

                    <p>{step.description}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="steps-visual">
              <div className="sticky-visual">
                <div className="visual-label">
                  <span>AGENDA TECH</span>
                  <span>SEU NEGÓCIO, ORGANIZADO.</span>
                </div>

                <div className="visual-container">
                  {steps.map((step, index) => (
                    <div
                      className={`visual-step ${
                        activeStep === index ? "visual-active" : ""
                      }`}
                      key={step.number}
                    >
                      <div className="visual-step-number">{step.number}</div>

                      <StepVisual type={step.visual} />
                    </div>
                  ))}
                </div>

                <div className="visual-footer">
                  <span>Role para explorar</span>
                  <span>↓</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FUNCIONALIDADES
        ================================================= */}

        <section className="features-section" id="funcionalidades">
          <div className="features-heading">
            <div className="section-eyebrow">FUNCIONALIDADES</div>

            <h2>
              Tudo que seu negócio
              <br />
              precisa. Em um só lugar.
            </h2>

            <p>
              Menos ferramentas espalhadas. Mais controle sobre cada parte do
              seu negócio.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className={`feature-card feature-card-${feature.size}`}
                  key={feature.number}
                >
                  <div className="feature-top">
                    <span className="feature-number">{feature.number}</span>

                    <div className="feature-icon">
                      <Icon size={20} strokeWidth={1.7} />
                    </div>
                  </div>

                  <div className="feature-content">
                    <h3>{feature.title}</h3>

                    <p>{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =================================================
            RECUPERAÇÃO DE CLIENTES
        ================================================= */}

        <section className="recovery-section" id="recuperacao">
  <div className="recovery-heading">
    <div className="section-eyebrow">RECUPERAÇÃO DE CLIENTES</div>

    <h2>
      Seu próximo cliente
      <br />
      <span>já conhece você.</span>
    </h2>

    <p>
      O Agenda Tech identifica automaticamente os clientes que já estão
      na hora de voltar e coloca essas oportunidades na sua frente.
    </p>
  </div>

  <div className="recovery-showcase">
    <div className="recovery-showcase-content">
      <div className="recovery-mini-label">
        <span className="recovery-live-dot"></span>
        INTELIGÊNCIA DE RETORNO
      </div>

      <h3>
        Pare de perder clientes
        <br />
        que poderiam voltar.
      </h3>

      <p>
        Defina o intervalo ideal de retorno de cada serviço e deixe o
        Agenda Tech encontrar os clientes que estão no momento certo
        para um novo atendimento.
      </p>

      <div className="recovery-benefits">
        <div className="recovery-benefit">
          <div className="recovery-check">
            <Check size={13} />
          </div>

          <span>Identificação automática de clientes</span>
        </div>

        <div className="recovery-benefit">
          <div className="recovery-check">
            <Check size={13} />
          </div>

          <span>Intervalo de retorno por serviço</span>
        </div>

        <div className="recovery-benefit">
          <div className="recovery-check">
            <Check size={13} />
          </div>

          <span>Lista de oportunidades de retorno</span>
        </div>
      </div>

      <button className="recovery-cta">
        Começar agora
        <ArrowRight size={17} />
      </button>
    </div>

    <div className="recovery-dashboard">
      <div className="recovery-dashboard-top">
        <div>
          <span>RECUPERAÇÃO</span>
          <strong>Clientes para retornar</strong>
        </div>

        <div className="recovery-dashboard-count">
          <strong>12</strong>
          <span>oportunidades</span>
        </div>
      </div>

      <div className="recovery-alert">
        <div className="recovery-alert-icon">
          <RotateCcw size={16} />
        </div>

        <div>
          <strong>12 clientes estão na hora de voltar</strong>
          <span>
            Baseado no intervalo de retorno dos serviços.
          </span>
        </div>
      </div>

      <div className="recovery-client-list">
        <div className="recovery-client">
          <div className="recovery-client-avatar">J</div>

          <div className="recovery-client-info">
            <strong>João da Silva</strong>
            <span>Corte masculino · há 31 dias</span>
          </div>

          <div className="recovery-client-time">
            <span>Ideal</span>
            <strong>31 dias</strong>
          </div>
        </div>

        <div className="recovery-client">
          <div className="recovery-client-avatar">M</div>

          <div className="recovery-client-info">
            <strong>Maria Santos</strong>
            <span>Escova · há 34 dias</span>
          </div>

          <div className="recovery-client-time">
            <span>Ideal</span>
            <strong>34 dias</strong>
          </div>
        </div>

        <div className="recovery-client">
          <div className="recovery-client-avatar">A</div>

          <div className="recovery-client-info">
            <strong>Ana Oliveira</strong>
            <span>Design de sobrancelhas · há 41 dias</span>
          </div>

          <div className="recovery-client-time">
            <span>Ideal</span>
            <strong>41 dias</strong>
          </div>
        </div>
      </div>

      <div className="recovery-dashboard-footer">
        <span>Potencial de retorno identificado</span>

        <strong>+ R$ 480</strong>
      </div>
    </div>
  </div>
        </section>

        {/* =================================================
            PARA QUEM É
        ================================================= */}

        <section className="audience-section" id="para-quem">
          <div className="audience-heading">
            <div className="section-eyebrow">PARA QUEM É</div>

            <h2>
              Feito para quem
              <br />
              vive de atendimento.
            </h2>

            <p>
              Se o seu negócio depende de horários, clientes e recorrência,
              o Agenda Tech foi desenhado para o seu dia a dia.
            </p>
          </div>

          <div className="audience-list">
            {audiences.map((audience) => {
              const Icon = audience.icon;

              return (
                <article className="audience-item" key={audience.number}>
                  <span className="audience-number">{audience.number}</span>

                  <div className="audience-icon">
                    <Icon size={20} strokeWidth={1.7} />
                  </div>

                  <div className="audience-copy">
                    <h3>{audience.title}</h3>

                    <p>{audience.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* =================================================
            DEMONSTRAÇÃO
        ================================================= */}

        <section className="demo-section" id="demonstracao">
          <div className="demo-heading">
            <div className="section-eyebrow">DENTRO DO PRODUTO</div>

            <h2>
              Seu negócio inteiro
              <br />
              em uma única tela.
            </h2>

            <p>
              Agenda, clientes e recuperação trabalhando juntos. Sem planilhas,
              sem cadernos e sem informação espalhada.
            </p>
          </div>

          <div
            className="demo-tabs"
            role="tablist"
            aria-label="Áreas do produto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === "agenda"}
              className={`demo-tab ${
                activeDemo === "agenda" ? "demo-tab-active" : ""
              }`}
              onClick={() => setActiveDemo("agenda")}
            >
              <CalendarDays size={16} />
              Agenda
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === "clientes"}
              className={`demo-tab ${
                activeDemo === "clientes" ? "demo-tab-active" : ""
              }`}
              onClick={() => setActiveDemo("clientes")}
            >
              <Users size={16} />
              Clientes
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeDemo === "recuperacao"}
              className={`demo-tab ${
                activeDemo === "recuperacao" ? "demo-tab-active" : ""
              }`}
              onClick={() => setActiveDemo("recuperacao")}
            >
              <RotateCcw size={16} />
              Recuperação
            </button>
          </div>

          <div className="demo-window">
            <div className="demo-window-bar">
              <div className="window-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <span className="demo-url">app.agendatech.com</span>

              <span className="demo-live">AO VIVO</span>
            </div>

            <div className="demo-app">
              <aside className="demo-sidebar">
                <div className="demo-brand">
                  <img
                    src="/logo.png"
                    alt="Agenda Tech"
                    className="demo-brand-image"
                  />
                </div>

                <div className="demo-nav">
                  <span
                    className={activeDemo === "agenda" ? "demo-nav-active" : ""}
                  >
                    <CalendarDays size={15} />
                    Agenda
                  </span>

                  <span
                    className={
                      activeDemo === "clientes" ? "demo-nav-active" : ""
                    }
                  >
                    <Users size={15} />
                    Clientes
                  </span>

                  <span
                    className={
                      activeDemo === "recuperacao" ? "demo-nav-active" : ""
                    }
                  >
                    <RotateCcw size={15} />
                    Recuperação
                  </span>

                  <span>
                    <BarChart3 size={15} />
                    Faturamento
                  </span>

                  <span>
                    <Clock3 size={15} />
                    Profissionais
                  </span>
                </div>

                <div className="demo-sidebar-foot">
                  <span className="demo-user-avatar">S</span>

                  <div>
                    <strong>Studio Bella</strong>
                    <span>Plano ativo</span>
                  </div>
                </div>
              </aside>

              <div className="demo-main">
                {activeDemo === "agenda" && (
                  <div className="demo-panel">
                    <div className="demo-panel-head">
                      <div>
                        <span>AGENDA</span>
                        <h3>Hoje, 03 de novembro</h3>
                      </div>

                      <span className="demo-panel-badge">
                        8 agendamentos
                      </span>
                    </div>

                    <div className="demo-agenda">
                      <div className="demo-agenda-row">
                        <span className="demo-time">09:00</span>

                        <div className="demo-event">
                          <div>
                            <strong>João da Silva</strong>
                            <span>Corte masculino · Carlos</span>
                          </div>

                          <span className="demo-event-status">
                            Confirmado
                          </span>
                        </div>
                      </div>

                      <div className="demo-agenda-row">
                        <span className="demo-time">10:30</span>

                        <div className="demo-event demo-event-highlight">
                          <div>
                            <strong>Maria Santos</strong>
                            <span>Escova · Carlos</span>
                          </div>

                          <span className="demo-event-status">
                            Confirmado
                          </span>
                        </div>
                      </div>

                      <div className="demo-agenda-row">
                        <span className="demo-time">13:00</span>

                        <div className="demo-event">
                          <div>
                            <strong>Ana Oliveira</strong>
                            <span>Design de sobrancelhas · Bia</span>
                          </div>

                          <span className="demo-event-status demo-pending">
                            Pendente
                          </span>
                        </div>
                      </div>

                      <div className="demo-agenda-row">
                        <span className="demo-time">15:30</span>

                        <div className="demo-event">
                          <div>
                            <strong>Camila Rocha</strong>
                            <span>Coloração · Bia</span>
                          </div>

                          <span className="demo-event-status">
                            Confirmado
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemo === "clientes" && (
                  <div className="demo-panel">
                    <div className="demo-panel-head">
                      <div>
                        <span>CLIENTES</span>
                        <h3>Sua base organizada</h3>
                      </div>

                      <span className="demo-panel-badge">148 clientes</span>
                    </div>

                    <div className="demo-client-stats">
                      <div>
                        <span>Total de clientes</span>
                        <strong>148</strong>
                      </div>

                      <div>
                        <span>Novos este mês</span>
                        <strong>+9</strong>
                      </div>

                      <div>
                        <span>Retorno médio</span>
                        <strong>32 dias</strong>
                      </div>
                    </div>

                    <div className="demo-table">
                      <div className="demo-table-head">
                        <span>Cliente</span>
                        <span>Último atendimento</span>
                        <span>Serviço</span>
                      </div>

                      <div className="demo-table-row">
                        <strong>João da Silva</strong>
                        <span>Há 31 dias</span>
                        <span>Corte masculino</span>
                      </div>

                      <div className="demo-table-row">
                        <strong>Maria Santos</strong>
                        <span>Há 12 dias</span>
                        <span>Escova</span>
                      </div>

                      <div className="demo-table-row">
                        <strong>Ana Oliveira</strong>
                        <span>Há 41 dias</span>
                        <span>Sobrancelhas</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemo === "recuperacao" && (
                  <div className="demo-panel">
                    <div className="demo-panel-head">
                      <div>
                        <span>RECUPERAÇÃO</span>
                        <h3>Clientes no momento certo</h3>
                      </div>

                      <span className="demo-panel-badge">12 oportunidades</span>
                    </div>

                    <div className="demo-recovery-alert">
                      <RotateCcw size={16} />

                      <div>
                        <strong>12 clientes prontos para voltar</strong>
                        <span>
                          Baseado no intervalo ideal de cada serviço.
                        </span>
                      </div>
                    </div>

                    <div className="demo-recovery-list">
                      <div className="demo-recovery-row">
                        <span className="demo-recovery-avatar">J</span>

                        <div>
                          <strong>João da Silva</strong>
                          <span>Corte masculino · há 31 dias</span>
                        </div>

                        <span className="demo-recovery-meta">
                          Ideal 30 dias
                        </span>

                        <strong className="demo-recovery-value">R$ 80</strong>
                      </div>

                      <div className="demo-recovery-row">
                        <span className="demo-recovery-avatar">M</span>

                        <div>
                          <strong>Maria Santos</strong>
                          <span>Escova · há 34 dias</span>
                        </div>

                        <span className="demo-recovery-meta">
                          Ideal 30 dias
                        </span>

                        <strong className="demo-recovery-value">R$ 120</strong>
                      </div>

                      <div className="demo-recovery-row">
                        <span className="demo-recovery-avatar">A</span>

                        <div>
                          <strong>Ana Oliveira</strong>
                          <span>Sobrancelhas · há 41 dias</span>
                        </div>

                        <span className="demo-recovery-meta">
                          Ideal 35 dias
                        </span>

                        <strong className="demo-recovery-value">R$ 280</strong>
                      </div>
                    </div>

                    <div className="demo-panel-foot">
                      <span>Potencial identificado</span>
                      <strong>+ R$ 480</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PREÇO
        ================================================= */}

        <section className="pricing-section" id="preco">
          <div className="pricing-heading">
            <div className="section-eyebrow">PREÇO</div>

            <h2>
              Um plano.
              <br />
              Tudo incluído.
            </h2>

            <p>
              Sem taxas escondidas e sem planos confusos. Um plano único, com
              tudo incluído.
            </p>
          </div>

          <div className="pricing-panel">
            <div className="pricing-main">
              <span className="pricing-label">PLANO ÚNICO</span>

              <h3>Agenda Tech</h3>

              <p className="pricing-description">
                Tudo que seu negócio precisa para organizar a agenda, acompanhar
                clientes e recuperar faturamento.
              </p>

              <div className="pricing-price">
                <strong>R$ 45</strong>
                <span>/mês</span>
              </div>

              <a className="pricing-cta" href={cadastroUrl}>
                Começar agora
                <ArrowRight size={17} />
              </a>

              <span className="pricing-note">
                Cobrança mensal no cartão. Cancele quando quiser.
              </span>
            </div>

            <ul className="pricing-features">
              <li>
                <Check size={14} />
                <span>Agenda online para seus clientes</span>
              </li>

              <li>
                <Check size={14} />
                <span>Gestão completa de clientes</span>
              </li>

              <li>
                <Check size={14} />
                <span>Profissionais e horários</span>
              </li>

              <li>
                <Check size={14} />
                <span>Recuperação de clientes</span>
              </li>

              <li>
                <Check size={14} />
                <span>Dashboard do negócio</span>
              </li>

              <li>
                <Check size={14} />
                <span>Página pública de agendamento</span>
              </li>
            </ul>
          </div>
        </section>

        {/* =================================================
            FAQ
        ================================================= */}

        <section className="faq-section" id="faq">
          <div className="faq-heading">
            <div className="section-eyebrow">FAQ</div>

            <h2>
              Perguntas
              <br />
              frequentes.
            </h2>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;

              return (
                <div
                  className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
                  key={faq.question}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <ChevronDown size={18} />
                  </button>

                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =================================================
            CTA FINAL
        ================================================= */}

        <section className="final-cta-section">
          <div className="final-cta">
            <span className="final-cta-label">COMECE HOJE</span>

            <h2>
              Menos tempo organizando.
              <br />
              <span>Mais tempo atendendo.</span>
            </h2>

            <p>
              Coloque seu negócio no controle e transforme clientes antigos em
              novos agendamentos.
            </p>

            <a className="final-cta-button" href={cadastroUrl}>
              Começar agora
              <ArrowRight size={18} />
            </a>

            <span className="final-cta-note">
              R$ 45/mês. Cancele quando quiser.
            </span>
          </div>
        </section>
      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="/" className="logo">
              <img
                src="/logo.png"
                alt="Agenda Tech"
                className="logo-image"
              />
            </a>

            <p>
              Agenda, clientes e recuperação em um só lugar. Para negócios que
              vivem de atendimento.
            </p>
          </div>

          <div className="footer-columns">
            <div className="footer-column">
              <span>Produto</span>
              <a href="#funcionalidades">Funcionalidades</a>
              <a href="#como-funciona">Como funciona</a>
              <a href="#recuperacao">Recuperação</a>
              <a href="#preco">Preço</a>
            </div>

            <div className="footer-column">
              <span>Agenda Tech</span>
              <a href="#para-quem">Para quem é</a>
              <a href="#demonstracao">Demonstração</a>
              <a href="#faq">FAQ</a>
              <a href="#preco">Começar agora</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Agenda Tech. Todos os direitos reservados.</span>
          <span>Feito para quem vive de atendimento.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
