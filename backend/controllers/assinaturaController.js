
const db = require("../config/db");

const {
    asaas,
    criarCheckoutAssinatura,
} = require("../services/asaasService");

const {
    sincronizarAssinatura,
} = require("../services/asaasSincronizacaoService");

// =====================================================
// BASE PÚBLICA PARA O RETORNO DO CHECKOUT
// =====================================================

function urlPublicaHttps(url) {
    try {
        const parsed = new URL(url);

        return (
            parsed.protocol === "https:" &&
            parsed.hostname !== "localhost" &&
            parsed.hostname !== "127.0.0.1"
        );
    } catch {
        return false;
    }
}

function obterBaseCallback() {
    const candidatos = [
        process.env.ASAAS_CALLBACK_BASE_URL,
        process.env.FRONTEND_URL,
    ]
        .filter(Boolean)
        .map((url) =>
            url
                .trim()
                .replace(/\/+$/, "")
                // Remove o caminho do webhook caso ele tenha sido
                // incluído por engano: o retorno do checkout fica na
                // raiz do site, não em /webhooks/asaas.
                .replace(/\/webhooks\/asaas$/i, "")
        );

    return candidatos.find(urlPublicaHttps) || null;
}

// =====================================================
// VERIFICAR SE A ASSINATURA AINDA ESTÁ ATIVA NO ASAAS
// =====================================================

async function assinaturaAtivaNoGateway(subscriptionId) {
    try {
        const response = await asaas.get(
            `/subscriptions/${subscriptionId}`
        );

        return Boolean(
            response.data &&
            response.data.deleted !== true &&
            response.data.status === "ACTIVE"
        );
    } catch (error) {
        // Assinatura removida no Asaas: pode contratar novamente.
        if (error.response?.status === 404) {
            return false;
        }

        throw error;
    }
}

// =====================================================
// BUSCAR ASSINATURA DA EMPRESA LOGADA
// =====================================================

async function buscarMinhaAssinatura(req, res) {
    try {
        const empresaId = req.usuario.empresa_id;

        const [rows] = await db.query(
            `
                SELECT
                    id,
                    empresa_id,
                    plano,
                    valor,
                    status,
                    gateway,
                    periodo_inicio,
                    periodo_fim,
                    gateway_checkout_id,
                    checkout_url,
                    updated_at
                FROM assinaturas
                WHERE empresa_id = ?
                LIMIT 1
            `,
            [empresaId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensagem: "Assinatura não encontrada.",
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error("Erro ao buscar assinatura:", error);

        return res.status(500).json({
            mensagem: "Erro interno ao buscar assinatura.",
        });
    }
}

// =====================================================
// SINCRONIZAR ASSINATURA COM O ASAAS
// =====================================================

async function sincronizarMinhaAssinatura(req, res) {
    try {
        const empresaId = req.usuario.empresa_id;

        const resultado = await sincronizarAssinatura(
            empresaId
        );

        if (!resultado.assinatura) {
            return res.status(404).json({
                mensagem: "Assinatura não encontrada.",
            });
        }

        return res.status(200).json({
            ativada: resultado.ativada,
            assinatura: resultado.assinatura,
        });

    } catch (error) {
        console.error(
            "Erro ao sincronizar assinatura:",
            error.response?.data || error.message
        );

        return res.status(502).json({
            mensagem:
                "Não foi possível consultar o pagamento agora. Tente novamente em instantes.",
        });
    }
}

// =====================================================
// CRIAR NOVO CHECKOUT ASAAS
// =====================================================

async function criarCheckout(req, res) {
    try {
        const empresaId = req.usuario.empresa_id;

        // Buscar assinatura da empresa
        const [rows] = await db.query(
            `
                SELECT
                    id,
                    empresa_id,
                    plano,
                    valor,
                    status,
                    periodo_inicio,
                    periodo_fim,
                    periodo_fim < CURDATE() AS periodo_vencido,
                    gateway_checkout_id,
                    gateway_subscription_id,
                    checkout_url,
                    DATE_FORMAT(
                        GREATEST(
                            COALESCE(periodo_fim, CURDATE()),
                            CURDATE()
                        ),
                        '%Y-%m-%d'
                    ) AS data_primeira_cobranca
                FROM assinaturas
                WHERE empresa_id = ?
                LIMIT 1
            `,
            [empresaId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                mensagem: "Assinatura da empresa não encontrada.",
            });
        }

        const assinatura = rows[0];

        // Assinatura vigente não precisa de novo checkout.
        if (
            assinatura.status === "ATIVA" &&
            !assinatura.periodo_vencido
        ) {
            return res.status(409).json({
                mensagem: "Sua assinatura já está ativa.",
            });
        }

        // Se já existe assinatura ativa no gateway, não criar outra.
        // Isso evita cobranças duplicadas quando o usuário repete o checkout.
        if (assinatura.gateway_subscription_id) {
            const ativaNoGateway = await assinaturaAtivaNoGateway(
                assinatura.gateway_subscription_id
            );

            if (ativaNoGateway) {
                // Assinatura ativa no gateway: envia para a fatura
                // pendente em vez de criar outra assinatura (o que
                // geraria cobrança duplicada).
                try {
                    const response = await asaas.get(
                        "/payments",
                        {
                            params: {
                                subscription:
                                    assinatura.gateway_subscription_id,
                                limit: 10,
                            },
                        }
                    );

                    const pagamento = (
                        response.data?.data || []
                    )
                        .filter(
                            (item) =>
                                item.status === "OVERDUE" ||
                                item.status === "PENDING"
                        )
                        .sort((a, b) =>
                            String(a.dueDate).localeCompare(
                                String(b.dueDate)
                            )
                        )[0];

                    if (pagamento?.invoiceUrl) {
                        return res.status(200).json({
                            mensagem: "Pagamento pendente.",
                            checkoutUrl: pagamento.invoiceUrl,
                            pagamentoId: pagamento.id,
                        });
                    }
                } catch (error) {
                    console.error(
                        "Erro ao buscar fatura pendente:",
                        error.response?.data || error.message
                    );
                }

                return res.status(409).json({
                    mensagem:
                        "Sua assinatura já está ativa. Aguarde a confirmação do pagamento.",
                });
            }
        }

        // Reaproveita o checkout pendente enquanto ele ainda é válido.
        // O checkout do Asaas expira em 60 minutos.
        if (
            !assinatura.gateway_subscription_id &&
            assinatura.gateway_checkout_id &&
            assinatura.checkout_url
        ) {
            const [validade] = await db.query(
                `
                    SELECT
                        TIMESTAMPDIFF(
                            MINUTE,
                            updated_at,
                            NOW()
                        ) AS minutos
                    FROM assinaturas
                    WHERE id = ?
                    LIMIT 1
                `,
                [assinatura.id]
            );

            const minutos = validade[0]?.minutos;

            if (
                minutos !== null &&
                minutos !== undefined &&
                minutos < 60
            ) {
                // Normaliza o status para o checkout reaproveitado.
                await db.query(
                    `
                        UPDATE assinaturas
                        SET status = CASE
                            WHEN status = 'EXPIRADA'
                                 AND periodo_fim >= CURDATE()
                            THEN 'TRIAL'
                            WHEN status IN (
                                'EXPIRADA',
                                'CANCELADA',
                                'INADIMPLENTE'
                            ) THEN 'PENDENTE'
                            ELSE status
                        END
                        WHERE id = ?
                          AND gateway_subscription_id IS NULL
                    `,
                    [assinatura.id]
                );

                return res.status(200).json({
                    mensagem: "Checkout já criado.",
                    checkoutId: assinatura.gateway_checkout_id,
                    checkoutUrl: assinatura.checkout_url,
                    dataPrimeiraCobranca:
                        assinatura.data_primeira_cobranca,
                    reaproveitado: true,
                });
            }
        }

        // =====================================================
        // DEFINIR DATA DA PRIMEIRA COBRANÇA
        // =====================================================

        // Novas contas não têm período de teste: a primeira
        // cobrança é feita hoje. Assinaturas antigas com
        // periodo_fim mantêm a data já definida (por exemplo,
        // trials criados antes desta mudança).
        await db.query(
            `
                UPDATE assinaturas
                SET periodo_inicio = COALESCE(
                    periodo_inicio,
                    CURDATE()
                )
                WHERE id = ?
                  AND periodo_inicio IS NULL
            `,
            [assinatura.id]
        );

        // A primeira cobrança nunca pode ficar no passado.
        const [dataRows] = await db.query(
            `
                SELECT DATE_FORMAT(
                    GREATEST(
                        COALESCE(periodo_fim, CURDATE()),
                        CURDATE()
                    ),
                    '%Y-%m-%d'
                ) AS data_primeira_cobranca
                FROM assinaturas
                WHERE id = ?
                LIMIT 1
            `,
            [assinatura.id]
        );

        if (
            dataRows.length === 0 ||
            !dataRows[0].data_primeira_cobranca
        ) {
            throw new Error(
                "Não foi possível definir a data da primeira cobrança."
            );
        }

        const dataPrimeiraCobranca =
            dataRows[0].data_primeira_cobranca;

        // =====================================================
        // CRIAR CHECKOUT NO ASAAS
        // =====================================================

        // O Asaas exige URLs de retorno públicas em https.
        // ASAAS_CALLBACK_BASE_URL permite usar um túnel durante
        // o desenvolvimento sem alterar a URL do frontend local.
        const baseCallback = obterBaseCallback();

        if (!baseCallback) {
            return res.status(503).json({
                mensagem:
                    "Checkout indisponível: configure ASAAS_CALLBACK_BASE_URL com uma URL pública https.",
            });
        }

        const checkout = await criarCheckoutAssinatura({
            empresaId,
            dataPrimeiraCobranca,

            successUrl:
                `${baseCallback}/assinatura/sucesso`,

            cancelUrl:
                `${baseCallback}/assinatura/cancelado`,

            expiredUrl:
                `${baseCallback}/assinatura/expirado`,
        });

        if (!checkout?.id || !checkout?.link) {
            throw new Error(
                "O Asaas não retornou o ID ou o link do checkout."
            );
        }

        // =====================================================
        // SALVAR DADOS DO CHECKOUT
        // =====================================================

        const [atualizacao] = await db.query(
            `
                UPDATE assinaturas
                SET
                    gateway_checkout_id = ?,
                    gateway_subscription_id = NULL,
                    checkout_url = ?,
                    status = CASE
                        WHEN status = 'EXPIRADA'
                             AND periodo_fim >= CURDATE()
                        THEN 'TRIAL'
                        WHEN status IN (
                            'EXPIRADA',
                            'CANCELADA',
                            'INADIMPLENTE'
                        ) THEN 'PENDENTE'
                        ELSE status
                    END
                WHERE id = ?
                  AND (
                      gateway_subscription_id IS NULL
                      OR gateway_subscription_id = ?
                  )
            `,
            [
                checkout.id,
                checkout.link,
                assinatura.id,
                assinatura.gateway_subscription_id,
            ]
        );

        if (atualizacao.affectedRows === 0) {
            return res.status(409).json({
                mensagem:
                    "Sua assinatura já está ativa. Aguarde a confirmação do pagamento.",
            });
        }

        console.log(
            `🛒 Checkout ${checkout.id} criado para a empresa ${empresaId}.`
        );

        return res.status(200).json({
            mensagem: "Checkout criado com sucesso.",
            checkoutId: checkout.id,
            checkoutUrl: checkout.link,
            dataPrimeiraCobranca,
        });

    } catch (error) {
        console.error("\n========== ERRO ASAAS ==========");
        console.error("Mensagem:", error.message);
        console.error("Status HTTP:", error.response?.status);

        console.error(
            "Resposta Asaas:",
            JSON.stringify(error.response?.data, null, 2)
        );

        console.error("URL:", error.config?.url);
        console.error("================================\n");

        return res.status(500).json({
            mensagem: "Erro ao criar checkout.",
            detalhe: error.response?.data || error.message,
        });
    }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    criarCheckout,
    buscarMinhaAssinatura,
    sincronizarMinhaAssinatura,
};
