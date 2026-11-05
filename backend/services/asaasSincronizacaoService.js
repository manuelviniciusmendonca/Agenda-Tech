const db = require("../config/db");
const { asaas } = require("./asaasService");

// =====================================================
// SINCRONIZAÇÃO SOB DEMANDA COM O ASAAS
// =====================================================

// Usada quando o usuário volta do checkout e o webhook ainda
// não chegou (ou se perdeu). Consulta o Asaas diretamente e,
// se houver pagamento confirmado, ativa a assinatura usando
// as mesmas regras do webhook.

const STATUS_PAGO = new Set([
    "CONFIRMED",
    "RECEIVED",
]);

// =====================================================
// DATA DO PAGAMENTO
// =====================================================

function extrairDataPagamento(pagamento) {
    const valor =
        pagamento?.paymentDate ||
        pagamento?.clientPaymentDate ||
        pagamento?.confirmedDate ||
        pagamento?.creditDate ||
        pagamento?.dueDate ||
        null;

    if (!valor) {
        return null;
    }

    const data = String(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return null;
    }

    return data;
}

// =====================================================
// BUSCAR ASSINATURA DA EMPRESA
// =====================================================

async function buscarAssinaturaDaEmpresa(empresaId) {
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
                gateway_subscription_id,
                checkout_url,
                updated_at
            FROM assinaturas
            WHERE empresa_id = ?
            LIMIT 1
        `,
        [empresaId]
    );

    return rows[0] || null;
}

// =====================================================
// LOCALIZAR A ASSINATURA DO ASAAS PELO CHECKOUT
// =====================================================

// Assinaturas criadas pelo checkout não recebem
// externalReference, mas guardam o ID do checkout em
// checkoutSession. É por ele que vinculamos.
async function buscarSubscriptionPorCheckout(checkoutId) {
    // Em alguns ambientes o Asaas já devolve a assinatura
    // dentro do próprio checkout.
    try {
        const response = await asaas.get(`/checkouts/${checkoutId}`);

        if (response.data?.subscription) {
            return response.data.subscription;
        }
    } catch (error) {
        // Endpoint de checkout indisponível: segue para a lista.
        if (error.response?.status !== 404) {
            throw error;
        }
    }

    let offset = 0;

    for (let pagina = 0; pagina < 5; pagina += 1) {
        const response = await asaas.get("/subscriptions", {
            params: {
                limit: 100,
                offset,
            },
        });

        const assinaturas = response.data?.data || [];

        const encontrada = assinaturas.find(
            (assinatura) =>
                assinatura.checkoutSession === checkoutId
        );

        if (encontrada) {
            return encontrada.id;
        }

        if (
            !response.data?.hasMore ||
            assinaturas.length === 0
        ) {
            break;
        }

        offset += assinaturas.length;
    }

    return null;
}

// =====================================================
// BUSCAR PAGAMENTOS DA ASSINATURA
// =====================================================

async function buscarPagamentosDaAssinatura(subscriptionId) {
    try {
        const response = await asaas.get(
            `/subscriptions/${subscriptionId}/payments`,
            {
                params: {
                    limit: 50,
                },
            }
        );

        return response.data?.data || [];
    } catch (error) {
        // Assinatura removida no Asaas: nada a sincronizar.
        if (error.response?.status === 404) {
            return [];
        }

        throw error;
    }
}

// =====================================================
// ATIVAR A PARTIR DOS PAGAMENTOS CONFIRMADOS
// =====================================================

async function ativarComPagamentos(assinatura, pagamentos) {
    const pagos = pagamentos
        .map((pagamento) => ({
            id: pagamento.id,
            data: extrairDataPagamento(pagamento),
            status: pagamento.status,
        }))
        .filter(
            (pagamento) =>
                pagamento.status &&
                STATUS_PAGO.has(pagamento.status) &&
                pagamento.id &&
                pagamento.data
        )
        .sort((a, b) => a.data.localeCompare(b.data));

    if (pagos.length === 0) {
        return {
            ativada: false,
            assinatura,
        };
    }

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [registros] = await conexao.query(
            `
                SELECT id, status
                FROM assinaturas
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [assinatura.id]
        );

        const registro = registros[0];

        // Assinatura cancelada não volta a ser ativada.
        if (!registro || registro.status === "CANCELADA") {
            await conexao.commit();

            return {
                ativada: false,
                assinatura: await buscarAssinaturaDaEmpresa(
                    assinatura.empresa_id
                ),
            };
        }

        // Registra cada pagamento uma única vez. A chave única
        // em payment_id evita ativação duplicada junto ao webhook.
        let pagamentosNovos = 0;

        for (const pagamento of pagos) {
            const [resultado] = await conexao.query(
                `
                    INSERT IGNORE INTO asaas_pagamentos_processados
                    (
                        payment_id,
                        subscription_id,
                        tipo_evento
                    )
                    VALUES (?, ?, ?)
                `,
                [
                    pagamento.id,
                    assinatura.gateway_subscription_id,
                    "SINCRONIZACAO",
                ]
            );

            if (resultado.affectedRows > 0) {
                pagamentosNovos += 1;
            }
        }

        // Nenhum pagamento novo: mantém o status atual.
        if (pagamentosNovos === 0) {
            await conexao.commit();

            return {
                ativada: false,
                assinatura: await buscarAssinaturaDaEmpresa(
                    assinatura.empresa_id
                ),
            };
        }

        // O pagamento mais recente define o novo período.
        const ultimoPagamento = pagos[pagos.length - 1];

        // GREATEST evita encurtar um período já maior (por
        // exemplo, se o webhook já tiver renovado a assinatura).
        await conexao.query(
            `
                UPDATE assinaturas
                SET
                    status = 'ATIVA',
                    periodo_inicio = DATE(?),
                    periodo_fim = GREATEST(
                        COALESCE(periodo_fim, DATE(?)),
                        DATE_ADD(
                            DATE(?),
                            INTERVAL 1 MONTH
                        )
                    )
                WHERE id = ?
                  AND status <> 'CANCELADA'
            `,
            [
                ultimoPagamento.data,
                ultimoPagamento.data,
                ultimoPagamento.data,
                assinatura.id,
            ]
        );

        await conexao.commit();

        console.log(
            `🔄 Assinatura ${assinatura.id} sincronizada e ativada.`
        );

        return {
            ativada: true,
            assinatura: await buscarAssinaturaDaEmpresa(
                assinatura.empresa_id
            ),
        };
    } catch (error) {
        await conexao.rollback();
        throw error;
    } finally {
        conexao.release();
    }
}

// =====================================================
// SINCRONIZAR ASSINATURA DA EMPRESA
// =====================================================

async function sincronizarAssinatura(empresaId) {
    let assinatura = await buscarAssinaturaDaEmpresa(empresaId);

    if (!assinatura) {
        return {
            ativada: false,
            assinatura: null,
        };
    }

    // Sem assinatura vinculada, tenta descobrir pelo checkout.
    if (
        !assinatura.gateway_subscription_id &&
        assinatura.gateway_checkout_id
    ) {
        const subscriptionId = await buscarSubscriptionPorCheckout(
            assinatura.gateway_checkout_id
        );

        if (subscriptionId) {
            await db.query(
                `
                    UPDATE assinaturas
                    SET gateway_subscription_id = ?
                    WHERE id = ?
                      AND gateway_subscription_id IS NULL
                `,
                [subscriptionId, assinatura.id]
            );

            assinatura = await buscarAssinaturaDaEmpresa(empresaId);
        }
    }

    if (!assinatura.gateway_subscription_id) {
        return {
            ativada: false,
            assinatura,
        };
    }

    const pagamentos = await buscarPagamentosDaAssinatura(
        assinatura.gateway_subscription_id
    );

    return ativarComPagamentos(assinatura, pagamentos);
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    sincronizarAssinatura,
    ativarComPagamentos,
    extrairDataPagamento,
};
