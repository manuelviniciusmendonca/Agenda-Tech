import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    CheckCircle,
    Clock3,
    Loader2,
    RefreshCw,
} from "lucide-react";
import api from "../services/api";

const INTERVALO = 5000;
const MAX_TENTATIVAS = 24;

export default function AssinaturaSucesso() {
    const [situacao, setSituacao] = useState("verificando");
    const [verificandoAgora, setVerificandoAgora] = useState(false);

    const encerrado = useRef(false);

    // Confere o pagamento sozinho por até 2 minutos. O webhook
    // costuma chegar em segundos, mas se atrasar a página não
    // fica parada esperando o usuário clicar.
    useEffect(() => {
        let ativo = true;
        let tentativas = 0;
        let timer = null;

        async function verificar() {
            if (encerrado.current) {
                return;
            }

            tentativas += 1;

            try {
                const { data } = await api.post(
                    "/assinaturas/sincronizar"
                );

                if (!ativo) {
                    return;
                }

                if (data?.assinatura?.status === "ATIVA") {
                    encerrado.current = true;
                    setSituacao("ativo");

                    return;
                }
            } catch (error) {
                // Segue tentando: o pagamento pode ainda não
                // estar disponível na consulta. Sessão ou
                // permissão inválida não melhora repetindo.
                const codigo = error.response?.status;

                if (codigo === 401 || codigo === 403) {
                    encerrado.current = true;
                    setSituacao("aguardando");

                    return;
                }
            }

            if (!ativo) {
                return;
            }

            setSituacao("aguardando");

            if (tentativas < MAX_TENTATIVAS) {
                timer = setTimeout(verificar, INTERVALO);
            }
        }

        void verificar();

        return () => {
            ativo = false;

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, []);

    async function verificarAgora() {
        try {
            setVerificandoAgora(true);

            const { data } = await api.post(
                "/assinaturas/sincronizar"
            );

            if (data?.assinatura?.status === "ATIVA") {
                encerrado.current = true;
                setSituacao("ativo");
            } else {
                setSituacao("aguardando");
            }
        } catch {
            setSituacao("aguardando");
        } finally {
            setVerificandoAgora(false);
        }
    }

    const liberado = situacao === "ativo";
    const verificando = situacao === "verificando";

    return (
        <div className="assinatura-retorno">
            <div className="assinatura-retorno-card">
                <div
                    className={`assinatura-retorno-icone ${
                        liberado
                            ? "assinatura-retorno-icone-positivo"
                            : "assinatura-retorno-icone-atencao"
                    }`}
                >
                    {liberado ? (
                        <CheckCircle size={34} />
                    ) : verificando ? (
                        <Loader2
                            size={34}
                            className="assinatura-girando"
                        />
                    ) : (
                        <Clock3 size={34} />
                    )}
                </div>

                {liberado ? (
                    <>
                        <h1>Acesso liberado</h1>

                        <p>
                            Pagamento confirmado. Sua assinatura
                            está ativa e sua empresa já pode usar
                            o Agenda Tech.
                        </p>

                        <Link
                            to="/dashboard"
                            className="assinatura-cta"
                        >
                            Ir para o Dashboard
                        </Link>

                        <Link
                            to="/assinatura"
                            className="assinatura-cta-secundario"
                        >
                            Ver minha assinatura
                        </Link>
                    </>
                ) : (
                    <>
                        <h1>
                            {verificando
                                ? "Confirmando seu pagamento"
                                : "Estamos confirmando seu pagamento"}
                        </h1>

                        <p>
                            {verificando
                                ? "Só um instante. Estamos conferindo o pagamento com o Asaas."
                                : "Recebemos seu pagamento e o Asaas ainda está processando a confirmação. A página verifica sozinha por alguns minutos."}
                        </p>

                        <button
                            type="button"
                            className="assinatura-cta"
                            onClick={verificarAgora}
                            disabled={
                                verificando || verificandoAgora
                            }
                        >
                            {verificandoAgora ? (
                                <Loader2
                                    size={18}
                                    className="assinatura-girando"
                                />
                            ) : (
                                <RefreshCw size={17} />
                            )}

                            {verificandoAgora
                                ? "Verificando..."
                                : "Verificar novamente"}
                        </button>

                        <Link
                            to="/assinatura"
                            className="assinatura-cta-secundario"
                        >
                            Ver minha assinatura
                        </Link>
                    </>
                )}

                <p className="assinatura-nota">
                    Se o acesso não liberar em alguns minutos,
                    fale com o suporte informando o e-mail da
                    conta.
                </p>
            </div>
        </div>
    );
}
