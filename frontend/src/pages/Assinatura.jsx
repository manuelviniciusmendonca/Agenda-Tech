import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Check,
    Clock3,
    CreditCard,
    Loader2,
    RefreshCw,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import api from "../services/api";

const BENEFICIOS = [
    "Agenda online para seus clientes",
    "Gestão de clientes",
    "Controle de profissionais",
    "Recuperação de clientes",
    "Dashboard do negócio",
    "Página pública de agendamento",
];

// Verificação automática depois do checkout.
const INTERVALO_VERIFICACAO = 15000;
const MAX_VERIFICACOES = 20;

// O Asaas expira o link do checkout depois de 60 minutos.
const CHECKOUT_VALIDADE_MINUTOS = 60;

const ESTADO_PROFISSIONAL = {
    tom: "erro",
    icone: AlertTriangle,
    selo: "ACESSO SUSPENSO",
    titulo: "O acesso da empresa está suspenso",
    descricao:
        "A assinatura da sua empresa precisa ser regularizada. Fale com o administrador responsável para liberar o acesso. Seus dados e sua agenda continuam salvos.",
    cta: null,
    linhas: [
        ["Situação", "Assinatura pendente"],
        ["Como resolver", "Falar com o administrador"],
    ],
};

export default function Assinatura() {
    const {
        usuario,
        empresa,
        assinaturaStatus,
        bloqueado,
        carregandoAssinatura,
        recarregarAssinatura,
        logout,
    } = useAuth();
    const navigate = useNavigate();

    const ehProfissional = usuario?.role === "PROFISSIONAL";

    const [assinatura, setAssinatura] = useState(null);
    const [carregandoDados, setCarregandoDados] = useState(!ehProfissional);
    const [carregandoCheckout, setCarregandoCheckout] = useState(false);
    const [atualizandoStatus, setAtualizandoStatus] = useState(false);
    const [verificandoAuto, setVerificandoAuto] = useState(false);
    const [erro, setErro] = useState("");
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        if (ehProfissional) {
            return undefined;
        }

        let ativo = true;

        async function carregar() {
            try {
                const { data } = await api.get("/assinaturas/minha");

                if (ativo) {
                    setAssinatura(data);
                    setErro("");
                }
            } catch (error) {
                if (ativo) {
                    setErro(
                        error.response?.data?.mensagem ||
                            "Não foi possível carregar os dados da sua assinatura."
                    );
                }
            } finally {
                if (ativo) {
                    setCarregandoDados(false);
                }
            }
        }

        void carregar();

        return () => {
            ativo = false;
        };
    }, [ehProfissional]);

    async function iniciarCheckout() {
        try {
            setCarregandoCheckout(true);
            setErro("");
            setAviso("");

            const { data } = await api.post("/assinaturas/checkout");

            if (!data?.checkoutUrl) {
                throw new Error("O checkout não foi gerado.");
            }

            window.location.href = data.checkoutUrl;
        } catch (error) {
            console.error("Erro ao iniciar checkout:", error);

            setErro(
                error.response?.data?.mensagem ||
                    error.message ||
                    "Não foi possível iniciar o pagamento."
            );

            setCarregandoCheckout(false);
        }
    }

    async function atualizarStatus() {
        try {
            setAtualizandoStatus(true);
            setErro("");
            setAviso("");

            // Consulta o Asaas na hora: cobre o caso de o
            // webhook ter atrasado ou se perdido.
            const { data } = await api.post(
                "/assinaturas/sincronizar"
            );

            const atualizada = data?.assinatura || null;

            if (atualizada) {
                setAssinatura(atualizada);
            }

            if (statusDaAssinatura(atualizada) === "ATIVA") {
                void recarregarAssinatura();
                setAviso(
                    "Tudo certo! Sua assinatura está ativa e o acesso foi liberado."
                );
            } else {
                setAviso(
                    "Ainda não identificamos a confirmação do pagamento. Se você acabou de pagar, aguarde alguns minutos e tente novamente."
                );
            }
        } catch (error) {
            setErro(
                error.response?.data?.mensagem ||
                    "Não foi possível atualizar o status agora."
            );
        } finally {
            setAtualizandoStatus(false);
        }
    }

    const status = ehProfissional
        ? "SUSPENSA"
        : statusDaAssinatura(assinatura);
    const estado = ehProfissional
        ? ESTADO_PROFISSIONAL
        : estadoDaAssinatura(status, assinatura);
    const pagamentoIniciado = Boolean(
        assinatura?.checkout_url || assinatura?.gateway_subscription_id
    );
    const checkoutVencido = checkoutExpirado(assinatura);
    const Icone = estado.icone;

    // Depois do checkout, confere o pagamento sozinho por até
    // 5 minutos. Cobre webhook atrasado sem o usuário precisar
    // clicar em nada.
    useEffect(() => {
        if (ehProfissional) {
            return undefined;
        }

        if (
            !assinatura?.id ||
            status !== "PENDENTE" ||
            !pagamentoIniciado
        ) {
            return undefined;
        }

        let ativo = true;
        let tentativas = 0;
        let timer = null;

        async function verificar() {
            tentativas += 1;

            if (ativo) {
                setVerificandoAuto(true);
            }

            try {
                const { data } = await api.post(
                    "/assinaturas/sincronizar"
                );

                if (!ativo) {
                    return;
                }

                if (data?.assinatura) {
                    setAssinatura(data.assinatura);
                }

                if (
                    statusDaAssinatura(data?.assinatura) ===
                    "ATIVA"
                ) {
                    void recarregarAssinatura();
                    setVerificandoAuto(false);
                    setAviso(
                        "Pagamento confirmado! Sua assinatura está ativa e o acesso foi liberado."
                    );

                    return;
                }
            } catch (error) {
                // Falha momentânea: tenta de novo no próximo ciclo.
                // Sessão/permissão inválida não melhora repetindo.
                const codigo = error.response?.status;

                if (codigo === 401 || codigo === 403) {
                    setVerificandoAuto(false);
                    return;
                }
            }

            if (ativo && tentativas < MAX_VERIFICACOES) {
                timer = setTimeout(
                    verificar,
                    INTERVALO_VERIFICACAO
                );
            } else {
                setVerificandoAuto(false);
            }
        }

        timer = setTimeout(verificar, 5000);

        return () => {
            ativo = false;

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, [
        ehProfissional,
        assinatura?.id,
        status,
        pagamentoIniciado,
        recarregarAssinatura,
    ]);

    // Profissional com a empresa em dia não deve ficar preso
    // nesta tela: a assinatura é gerenciada pelo administrador.
    useEffect(() => {
        if (
            ehProfissional &&
            assinaturaStatus &&
            !carregandoAssinatura &&
            !bloqueado
        ) {
            navigate("/inicio", { replace: true });
        }
    }, [
        ehProfissional,
        assinaturaStatus,
        carregandoAssinatura,
        bloqueado,
        navigate,
    ]);

    async function verificarAcesso() {
        setAtualizandoStatus(true);

        try {
            await recarregarAssinatura();
        } finally {
            setAtualizandoStatus(false);
        }
    }

    function sair() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div className="page-content assinatura-page">
            <header className="page-header assinatura-page-header">
                <div>
                    <p className="eyebrow">ASSINATURA</p>
                    <h1>Assinatura</h1>
                    <p className="page-description">
                        Acompanhe o plano e o acesso da empresa{" "}
                        {empresa?.nome || "da sua empresa"} ao Agenda Tech.
                    </p>
                </div>
            </header>

            <div className="assinatura-grid">
                <section
                    className="assinatura-plano"
                    aria-label="Plano Agenda Tech"
                >
                    <div className="assinatura-plano-topo">
                        <h2>Plano Agenda Tech</h2>
                        <span>Mensal</span>
                    </div>

                    <div className="assinatura-preco">
                        <strong>R$ 45</strong>
                        <span>/ mês</span>
                    </div>

                    <p className="assinatura-plano-desc">
                        Acesso completo para a sua empresa, sem taxa de
                        adesão e com renovação automática.
                    </p>

                    <ul className="assinatura-beneficios">
                        {BENEFICIOS.map((beneficio) => (
                            <li
                                key={beneficio}
                                className="assinatura-beneficio"
                            >
                                <span className="assinatura-beneficio-icone">
                                    <Check size={13} />
                                </span>

                                {beneficio}
                            </li>
                        ))}
                    </ul>
                </section>

                    <section
                        className={`assinatura-painel assinatura-painel-${estado.tom}`}
                    >
                        {carregandoDados ? (
                            <div className="assinatura-carregando">
                                <Loader2
                                    size={30}
                                    className="assinatura-girando"
                                />
                                <span>Verificando sua assinatura...</span>
                            </div>
                        ) : (
                            <>
                                <div className="assinatura-painel-topo">
                                    <span
                                        className={`assinatura-selo assinatura-selo-${estado.tom}`}
                                    >
                                        {estado.selo}
                                    </span>

                                    <Icone
                                        size={26}
                                        className="assinatura-painel-icone"
                                    />
                                </div>

                                <h2>{estado.titulo}</h2>

                                <p className="assinatura-painel-desc">
                                    {estado.descricao}
                                </p>

                                <dl className="assinatura-resumo">
                                    {estado.linhas.map(
                                        ([rotulo, valor]) => (
                                            <div
                                                key={rotulo}
                                                className="assinatura-resumo-linha"
                                            >
                                                <dt>{rotulo}</dt>
                                                <dd>{valor}</dd>
                                            </div>
                                        )
                                    )}
                                </dl>

                                {verificandoAuto && (
                                    <div
                                        className="assinatura-verificando"
                                        role="status"
                                    >
                                        <Loader2
                                            size={16}
                                            className="assinatura-girando"
                                        />
                                        <span>
                                            Verificando pagamento
                                            automaticamente...
                                        </span>
                                    </div>
                                )}

                                {checkoutVencido && (
                                    <div
                                        className="assinatura-alerta assinatura-alerta-aviso"
                                        role="status"
                                    >
                                        O link de pagamento anterior expirou.
                                        Gere um novo link para concluir a
                                        assinatura.
                                    </div>
                                )}

                                {erro && (
                                    <div
                                        className="assinatura-alerta assinatura-alerta-erro"
                                        role="alert"
                                    >
                                        {erro}
                                    </div>
                                )}

                                {aviso && (
                                    <div
                                        className="assinatura-alerta assinatura-alerta-aviso"
                                        role="status"
                                    >
                                        {aviso}
                                    </div>
                                )}

                                <div className="assinatura-acoes">
                                    {ehProfissional ? (
                                        <button
                                            type="button"
                                            className="assinatura-cta"
                                            onClick={verificarAcesso}
                                            disabled={atualizandoStatus}
                                        >
                                            {atualizandoStatus ? (
                                                <Loader2
                                                    size={18}
                                                    className="assinatura-girando"
                                                />
                                            ) : (
                                                <RefreshCw size={17} />
                                            )}

                                            {atualizandoStatus
                                                ? "Verificando..."
                                                : "Verificar novamente"}
                                        </button>
                                    ) : status === "ATIVA" ? (
                                        <Link
                                            to="/dashboard"
                                            className="assinatura-cta"
                                        >
                                            <ShieldCheck size={18} />
                                            Voltar ao sistema
                                        </Link>
                                    ) : status === "PENDENTE" &&
                                      pagamentoIniciado ? (
                                        <>
                                            <button
                                                type="button"
                                                className="assinatura-cta"
                                                onClick={atualizarStatus}
                                                disabled={atualizandoStatus}
                                            >
                                                {atualizandoStatus ? (
                                                    <Loader2
                                                        size={18}
                                                        className="assinatura-girando"
                                                    />
                                                ) : (
                                                    <RefreshCw size={17} />
                                                )}

                                                {atualizandoStatus
                                                    ? "Verificando..."
                                                    : "Já paguei, atualizar status"}
                                            </button>

                                            {assinatura?.checkout_url && (
                                                <>
                                                    {!checkoutVencido && (
                                                        <a
                                                            href={
                                                                assinatura.checkout_url
                                                            }
                                                            className="assinatura-cta-secundario"
                                                        >
                                                            <CreditCard size={17} />
                                                            Abrir pagamento
                                                        </a>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className={
                                                            checkoutVencido
                                                                ? "assinatura-cta-secundario"
                                                                : "assinatura-link-acao"
                                                        }
                                                        onClick={
                                                            iniciarCheckout
                                                        }
                                                        disabled={
                                                            carregandoCheckout
                                                        }
                                                    >
                                                        {carregandoCheckout
                                                            ? "Gerando novo link..."
                                                            : "Gerar novo link de pagamento"}
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="assinatura-cta"
                                                onClick={iniciarCheckout}
                                                disabled={carregandoCheckout}
                                            >
                                                {carregandoCheckout ? (
                                                    <Loader2
                                                        size={18}
                                                        className="assinatura-girando"
                                                    />
                                                ) : (
                                                    <CreditCard size={18} />
                                                )}

                                                {carregandoCheckout
                                                    ? "Abrindo pagamento..."
                                                    : estado.cta}
                                            </button>

                                            {status === "TRIAL" && (
                                                <Link
                                                    to="/dashboard"
                                                    className="assinatura-cta-secundario"
                                                >
                                                    Continuar usando o teste
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>

                                <p className="assinatura-nota">
                                    O pagamento é processado com segurança pelo
                                    Asaas.
                                </p>

                                <button
                                    type="button"
                                    className="assinatura-link-acao assinatura-sair"
                                    onClick={sair}
                                >
                                    Sair da conta
                                </button>
                            </>
                        )}
                    </section>
            </div>
        </div>
    );
}

function estadoDaAssinatura(status, assinatura) {
    const fim = formatarData(assinatura?.periodo_fim);

    if (status === "ATIVA") {
        const linhas = [
            ["Próxima renovação", fim],
            ["Valor", "R$ 45,00/mês"],
            ["Situação", "Em dia"],
        ];
        const vigencia = descreverVigencia(assinatura?.periodo_fim);

        if (vigencia) {
            linhas.splice(1, 0, ["Vigência", vigencia]);
        }

        return {
            tom: "positivo",
            icone: ShieldCheck,
            selo: "ASSINATURA ATIVA",
            titulo: "Seu plano está ativo",
            descricao:
                "Seu acesso ao Agenda Tech está liberado. A renovação é automática e não é preciso fazer nada.",
            cta: null,
            linhas,
        };
    }

    if (status === "TRIAL") {
        return {
            tom: "positivo",
            icone: Clock3,
            selo: "PERÍODO DE TESTE",
            titulo: "Seu teste está ativo",
            descricao: `Você tem acesso completo ao Agenda Tech até ${fim}. Assine agora para não perder o acesso quando o teste terminar.`,
            cta: "Assinar agora",
            linhas: [
                ["Teste válido até", fim],
                ["Depois do teste", "R$ 45,00/mês"],
                ["Hoje", "R$ 0,00"],
            ],
        };
    }

    if (status === "EXPIRADA") {
        const linhas = [
            ["Vencida em", fim],
            ["Plano mensal", "R$ 45,00/mês"],
            ["Seus dados", "Preservados"],
        ];
        const vigencia = descreverVigencia(assinatura?.periodo_fim);

        if (vigencia) {
            linhas.splice(1, 0, ["Vigência", vigencia]);
        }

        return {
            tom: "atencao",
            icone: Clock3,
            selo: "ASSINATURA VENCIDA",
            titulo: "Sua assinatura venceu",
            descricao:
                "Seus dados continuam salvos. Renove o plano para voltar a usar o Agenda Tech agora mesmo.",
            cta: "Renovar assinatura",
            linhas,
        };
    }

    if (
        status === "PENDENTE" &&
        !assinatura?.checkout_url &&
        !assinatura?.gateway_subscription_id
    ) {
        return {
            tom: "atencao",
            icone: CreditCard,
            selo: "ATIVAÇÃO PENDENTE",
            titulo: "Ative sua assinatura",
            descricao:
                "Sua conta foi criada. Falta apenas ativar o plano para liberar o acesso da empresa ao Agenda Tech.",
            cta: "Assinar agora",
            linhas: [
                ["Plano mensal", "R$ 45,00/mês"],
                ["Acesso", "Liberado após o pagamento"],
                ["Seus dados", "Já cadastrados"],
            ],
        };
    }

    if (status === "PENDENTE") {
        return {
            tom: "atencao",
            icone: Clock3,
            selo: "AGUARDANDO PAGAMENTO",
            titulo: "Estamos confirmando seu pagamento",
            descricao:
                "Assim que o pagamento for confirmado, seu acesso será liberado automaticamente. Isso costuma levar poucos minutos.",
            cta: null,
            linhas: [
                ["Plano", "R$ 45,00/mês"],
                ["Situação", "Aguardando confirmação"],
            ],
        };
    }

    if (status === "INADIMPLENTE") {
        return {
            tom: "erro",
            icone: AlertTriangle,
            selo: "PAGAMENTO EM ATRASO",
            titulo: "Sua assinatura está pendente",
            descricao:
                "Existe uma fatura em aberto. Regularize o pagamento para liberar novamente o acesso da sua empresa.",
            cta: "Pagar fatura",
            linhas: [
                ["Plano", "R$ 45,00/mês"],
                ["Situação", "Fatura em aberto"],
            ],
        };
    }

    if (status === "CANCELADA") {
        return {
            tom: "erro",
            icone: XCircle,
            selo: "ASSINATURA CANCELADA",
            titulo: "Sua assinatura foi cancelada",
            descricao:
                "Reative a assinatura para voltar a usar o Agenda Tech. Seus dados continuam salvos.",
            cta: "Reativar assinatura",
            linhas: [
                ["Plano mensal", "R$ 45,00/mês"],
                ["Seus dados", "Preservados"],
            ],
        };
    }

    return {
        tom: "neutro",
        icone: CreditCard,
        selo: "ASSINATURA",
        titulo: "Escolha seu plano",
        descricao:
            "Assine o Agenda Tech para liberar o acesso completo da sua empresa.",
        cta: "Assinar agora",
        linhas: [
            ["Plano mensal", "R$ 45,00/mês"],
            ["Renovação", "Automática"],
        ],
    };
}

function statusDaAssinatura(assinatura) {
    if (!assinatura) return "DESCONHECIDA";

    const status = String(assinatura.status || "").toUpperCase();

    if (status === "ATIVA" && periodoVencido(assinatura.periodo_fim)) {
        return "EXPIRADA";
    }

    return status || "DESCONHECIDA";
}

function periodoVencido(valor) {
    if (!valor) return false;

    const data = String(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;

    const agora = new Date();
    const hoje = [
        agora.getFullYear(),
        String(agora.getMonth() + 1).padStart(2, "0"),
        String(agora.getDate()).padStart(2, "0"),
    ].join("-");

    return data < hoje;
}

// Diferença em dias entre uma data (YYYY-MM-DD) e hoje.
// Positivo = ainda vai vencer, negativo = já venceu.
function diferencaEmDias(valor) {
    if (!valor) return null;

    const data = String(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;

    const [ano, mes, dia] = data.split("-").map(Number);
    const alvo = Date.UTC(ano, mes - 1, dia);
    const agora = new Date();
    const hoje = Date.UTC(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
    );

    return Math.round((alvo - hoje) / 86400000);
}

function descreverVigencia(valor) {
    const dias = diferencaEmDias(valor);

    if (dias === null) return "";

    if (dias === 0) return "vence hoje";

    if (dias > 0) {
        return `vence em ${dias} ${dias === 1 ? "dia" : "dias"}`;
    }

    const vencidos = Math.abs(dias);

    return `vencida há ${vencidos} ${
        vencidos === 1 ? "dia" : "dias"
    }`;
}

// O checkout do Asaas expira em 60 minutos. Depois disso o
// link antigo deixa de funcionar e é preciso gerar outro.
function checkoutExpirado(assinatura) {
    if (!assinatura?.checkout_url || !assinatura?.updated_at) {
        return false;
    }

    const atualizadoEm = new Date(assinatura.updated_at);

    if (Number.isNaN(atualizadoEm.getTime())) {
        return false;
    }

    const idadeMinutos =
        (Date.now() - atualizadoEm.getTime()) / 60000;

    return idadeMinutos > CHECKOUT_VALIDADE_MINUTOS;
}

function formatarData(valor) {
    if (!valor) return "—";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return "—";

    return data.toLocaleDateString("pt-BR", {
        timeZone: "UTC",
    });
}
