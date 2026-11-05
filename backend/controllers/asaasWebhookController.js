
const db = require("../config/db");
const { asaas } = require("../services/asaasService");

// =====================================================
// BUSCAR DADOS COMPLETOS DO PAGAMENTO NO ASAAS
// =====================================================

async function buscarDadosPagamento(payment) {
    let pagamento = payment;

    const obterData = (dados) =>
        dados.paymentDate ||
        dados.clientPaymentDate ||
        dados.confirmedDate ||
        dados.creditDate ||
        null;

    // Se o webhook não trouxe a data, consulta a API do Asaas.

    if (!obterData(pagamento)) {
        console.log(
            `🔎 Consultando pagamento ${payment.id} no Asaas...`
        );

        const response = await asaas.get(
            `/payments/${payment.id}`
        );

        pagamento = {
            ...payment,
            ...response.data,
        };
    }

    const dataPagamento = obterData(pagamento);

    if (!dataPagamento) {
        throw new Error(
            `O Asaas não retornou uma data válida para o pagamento ${payment.id}.`
        );
    }

    // Aceita datas no formato YYYY-MM-DD ou ISO com horário.

    const data = String(dataPagamento).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        throw new Error(
            `Data inválida para o pagamento ${payment.id}: ${dataPagamento}`
        );
    }

    const dataObjeto = new Date(`${data}T00:00:00Z`);

    if (
        Number.isNaN(dataObjeto.getTime()) ||
        dataObjeto.toISOString().slice(0, 10) !== data
    ) {
        throw new Error(
            `Data inválida para o pagamento ${payment.id}: ${data}`
        );
    }

    return {
        pagamento,
        dataPagamento: data,
    };
}

// =====================================================
// VINCULAR ASSINATURA PELO ID DO GATEWAY
// =====================================================

async function vincularAssinaturaPorSubscription(
    conexao,
    subscriptionId
) {
    const [existentes] = await conexao.query(
        `
            SELECT id
            FROM assinaturas
            WHERE gateway_subscription_id = ?
            LIMIT 1
        `,
        [subscriptionId]
    );

    if (existentes.length > 0) {
        return true;
    }

    let subscription;

    try {
        const response = await asaas.get(
            `/subscriptions/${subscriptionId}`
        );

        subscription = response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return false;
        }

        throw error;
    }

    const checkoutSession = subscription?.checkoutSession;

    if (!checkoutSession) {
        return false;
    }

    await conexao.query(
        `
            UPDATE assinaturas
            SET gateway_subscription_id = ?
            WHERE gateway_checkout_id = ?
              AND (
                  gateway_subscription_id IS NULL
                  OR gateway_subscription_id = ?
              )
        `,
        [
            subscriptionId,
            checkoutSession,
            subscriptionId,
        ]
    );

    const [verificacao] = await conexao.query(
        `
            SELECT id
            FROM assinaturas
            WHERE gateway_checkout_id = ?
              AND gateway_subscription_id = ?
            LIMIT 1
        `,
        [checkoutSession, subscriptionId]
    );

    return verificacao.length > 0;
}

// =====================================================
// RECEBER WEBHOOK ASAAS
// =====================================================

async function receberWebhook(req, res) {
    let conexao;
    let transacaoIniciada = false;

    try {
        // 1. VALIDAR TOKEN

        const tokenRecebido = req.headers["asaas-access-token"];
        const tokenEsperado = process.env.ASAAS_WEBHOOK_TOKEN;

        if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
            return res.status(401).json({
                mensagem: "Não autorizado.",
            });
        }

        // 2. VALIDAR EVENTO

        const evento = req.body;

        if (!evento?.id || !evento?.event) {
            return res.status(400).json({
                mensagem: "Evento inválido.",
            });
        }

        const eventoId = evento.id;
        const tipoEvento = evento.event;
        const payload = JSON.stringify(evento);

        // 3. REGISTRAR EVENTO

        await db.query(
            `
                INSERT IGNORE INTO webhook_asaas_eventos
                (evento_id, tipo_evento, payload)
                VALUES (?, ?, ?)
            `,
            [eventoId, tipoEvento, payload]
        );

        console.log("📩 Webhook Asaas:", tipoEvento);

        // 4. COMPLETAR DADOS DE PAGAMENTO, SE NECESSÁRIO

        let dadosPagamento = null;

        const eventosPositivos = [
            "PAYMENT_CONFIRMED",
            "PAYMENT_RECEIVED",
        ];

        if (
            eventosPositivos.includes(tipoEvento) &&
            evento.payment?.subscription
        ) {
            if (!evento.payment.id) {
                throw new Error("Pagamento sem identificador.");
            }

            dadosPagamento = await buscarDadosPagamento(
                evento.payment
            );
        }

        // 5. INICIAR TRANSAÇÃO

        conexao = await db.getConnection();

        await conexao.beginTransaction();
        transacaoIniciada = true;

        // Bloqueia o evento para evitar processamento simultâneo.

        const [eventos] = await conexao.query(
            `
                SELECT id, processado
                FROM webhook_asaas_eventos
                WHERE evento_id = ?
                LIMIT 1
                FOR UPDATE
            `,
            [eventoId]
        );

        if (eventos.length === 0) {
            throw new Error("Evento não encontrado no banco.");
        }

        if (Number(eventos[0].processado) === 1) {
            await conexao.commit();
            transacaoIniciada = false;

            return res.status(200).json({
                mensagem: "Evento já processado.",
            });
        }

        // 6. EVENTOS DO CHECKOUT

        // O status da assinatura só muda quando o pagamento é
        // confirmado. Cancelar ou deixar o checkout expirar não
        // pode revogar o período de teste em andamento.
        if (
            tipoEvento === "CHECKOUT_PAID" ||
            tipoEvento === "CHECKOUT_CANCELED" ||
            tipoEvento === "CHECKOUT_EXPIRED"
        ) {
            console.log(
                `ℹ️ Checkout ${evento.checkout?.id || "-"}: ${tipoEvento}. Status preservado.`
            );
        }

        // 7. ASSINATURA CRIADA

        if (tipoEvento === "SUBSCRIPTION_CREATED") {
            const subscription = evento.subscription;

            if (!subscription?.id) {
                throw new Error("Dados da assinatura ausentes.");
            }

            const subscriptionId = subscription.id;
            const checkoutSession = subscription.checkoutSession;
            const externalReference = subscription.externalReference;

            let vinculada = false;

            // Tenta vincular pelo checkout.

            if (checkoutSession) {
                await conexao.query(
                    `
                        UPDATE assinaturas
                        SET gateway_subscription_id = ?
                        WHERE gateway_checkout_id = ?
                          AND (
                              gateway_subscription_id IS NULL
                              OR gateway_subscription_id = ?
                          )
                    `,
                    [
                        subscriptionId,
                        checkoutSession,
                        subscriptionId,
                    ]
                );

                const [verificacao] = await conexao.query(
                    `
                        SELECT id
                        FROM assinaturas
                        WHERE gateway_checkout_id = ?
                          AND gateway_subscription_id = ?
                        LIMIT 1
                    `,
                    [checkoutSession, subscriptionId]
                );

                vinculada = verificacao.length > 0;
            }

            // Alternativa: vincular pelo externalReference.

            if (!vinculada && externalReference) {
                const match = externalReference.match(
                    /^agenda_tech_empresa_(\d+)$/
                );

                if (match) {
                    const empresaId = Number(match[1]);

                    await conexao.query(
                        `
                            UPDATE assinaturas
                            SET gateway_subscription_id = ?
                            WHERE empresa_id = ?
                              AND (
                                  gateway_subscription_id IS NULL
                                  OR gateway_subscription_id = ?
                              )
                        `,
                        [
                            subscriptionId,
                            empresaId,
                            subscriptionId,
                        ]
                    );

                    const [verificacao] = await conexao.query(
                        `
                            SELECT id
                            FROM assinaturas
                            WHERE empresa_id = ?
                              AND gateway_subscription_id = ?
                            LIMIT 1
                        `,
                        [empresaId, subscriptionId]
                    );

                    vinculada = verificacao.length > 0;
                }
            }

            if (!vinculada) {
                throw new Error(
                    `Não foi possível vincular a assinatura ${subscriptionId}.`
                );
            }

            console.log(
                `📋 Assinatura ${subscriptionId} vinculada.`
            );
        }

        // 7.1 ASSINATURA ATUALIZADA

        if (
            tipoEvento === "SUBSCRIPTION_UPDATED" &&
            evento.subscription?.id
        ) {
            const subscriptionId = evento.subscription.id;

            await vincularAssinaturaPorSubscription(
                conexao,
                subscriptionId
            );

            // O Asaas pode inativar a assinatura enviando apenas
            // SUBSCRIPTION_UPDATED. Reflete o status para não
            // manter acesso indevido.
            const statusGateway = String(
                evento.subscription.status || ""
            ).toUpperCase();

            if (
                statusGateway === "INACTIVE" ||
                statusGateway === "EXPIRED"
            ) {
                await conexao.query(
                    `
                        UPDATE assinaturas
                        SET status = 'CANCELADA'
                        WHERE gateway_subscription_id = ?
                          AND status <> 'CANCELADA'
                    `,
                    [subscriptionId]
                );

                console.log(
                    `📋 Assinatura ${subscriptionId} cancelada via SUBSCRIPTION_UPDATED.`
                );
            }
        }

        // 8. PAGAMENTOS RECORRENTES

        if (evento.payment?.subscription) {
            const payment = evento.payment;
            const subscriptionId = payment.subscription;

            // ---------------------------------------------
            // PAGAMENTO CONFIRMADO OU RECEBIDO
            // ---------------------------------------------

            if (eventosPositivos.includes(tipoEvento)) {
                const dataPagamento =
                    dadosPagamento.dataPagamento;

                const [assinaturas] = await conexao.query(
                    `
                        SELECT id, status, periodo_fim
                        FROM assinaturas
                        WHERE gateway_subscription_id = ?
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [subscriptionId]
                );

                let assinatura = assinaturas[0] || null;

                // O evento de pagamento pode chegar antes do
                // SUBSCRIPTION_CREATED. Nesse caso, tenta vincular
                // a assinatura agora para não perder a ativação.
                if (!assinatura) {
                    const vinculada =
                        await vincularAssinaturaPorSubscription(
                            conexao,
                            subscriptionId
                        );

                    if (vinculada) {
                        const [vinculadas] =
                            await conexao.query(
                                `
                                    SELECT id, status
                                    FROM assinaturas
                                    WHERE gateway_subscription_id = ?
                                    LIMIT 1
                                    FOR UPDATE
                                `,
                                [subscriptionId]
                            );

                        assinatura = vinculadas[0] || null;
                    }
                }

                if (!assinatura) {
                    throw new Error(
                        `Assinatura ${subscriptionId} não encontrada.`
                    );
                }

                // Cada cobrança só pode ser registrada uma vez.

                let pagamentoNovo = false;

                try {
                    await conexao.query(
                        `
                            INSERT INTO asaas_pagamentos_processados
                            (
                                payment_id,
                                subscription_id,
                                tipo_evento
                            )
                            VALUES (?, ?, ?)
                        `,
                        [
                            payment.id,
                            subscriptionId,
                            tipoEvento,
                        ]
                    );

                    pagamentoNovo = true;

                } catch (error) {
                    if (error.code !== "ER_DUP_ENTRY") {
                        throw error;
                    }
                }

                if (pagamentoNovo) {
                    if (assinatura.status !== "CANCELADA") {
                        await conexao.query(
                            `
                                UPDATE assinaturas
                                SET
                                    status = 'ATIVA',
                                    periodo_inicio = DATE(?),
                                    periodo_fim = GREATEST(
                                        COALESCE(
                                            periodo_fim,
                                            DATE(?)
                                        ),
                                        DATE_ADD(
                                            DATE(?),
                                            INTERVAL 1 MONTH
                                        )
                                    )
                                WHERE id = ?
                                  AND status <> 'CANCELADA'
                            `,
                            [
                                dataPagamento,
                                dataPagamento,
                                dataPagamento,
                                assinatura.id,
                            ]
                        );

                        console.log(
                            `💳 Pagamento ${payment.id} registrado. Assinatura ativada.`
                        );
                    } else {
                        console.log(
                            `⚠️ Pagamento recebido, mas a assinatura está cancelada.`
                        );
                    }

                } else {
                    // Pagamento repetido: não altera status ou período.

                    console.log(
                        `ℹ️ Pagamento ${payment.id} já registrado. Período preservado.`
                    );
                }
            }

            // ---------------------------------------------
            // EVENTOS NEGATIVOS
            // ---------------------------------------------

            const eventosNegativos = [
                "PAYMENT_OVERDUE",
                "PAYMENT_REFUNDED",
                "PAYMENT_RECEIVED_IN_CASH_UNDONE",
            ];

            if (eventosNegativos.includes(tipoEvento)) {
                const [assinaturas] = await conexao.query(
                    `
                        SELECT id, status, periodo_inicio
                        FROM assinaturas
                        WHERE gateway_subscription_id = ?
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [subscriptionId]
                );

                let assinatura = assinaturas[0] || null;

                if (!assinatura) {
                    const vinculada =
                        await vincularAssinaturaPorSubscription(
                            conexao,
                            subscriptionId
                        );

                    if (vinculada) {
                        const [vinculadas] =
                            await conexao.query(
                                `
                                    SELECT id, status, periodo_inicio
                                    FROM assinaturas
                                    WHERE gateway_subscription_id = ?
                                    LIMIT 1
                                    FOR UPDATE
                                `,
                                [subscriptionId]
                            );

                        assinatura = vinculadas[0] || null;
                    }
                }

                if (assinatura) {
                    if (assinatura.status !== "CANCELADA") {
                        let eventoAntigo = false;

                        if (
                            payment.dueDate &&
                            assinatura.periodo_inicio
                        ) {
                            const inicioPeriodo = String(
                                assinatura.periodo_inicio
                            ).slice(0, 10);

                            eventoAntigo =
                                payment.dueDate < inicioPeriodo;
                        }

                        if (!eventoAntigo) {
                            await conexao.query(
                                `
                                    UPDATE assinaturas
                                    SET status = 'INADIMPLENTE'
                                    WHERE id = ?
                                      AND status <> 'CANCELADA'
                                `,
                                [assinatura.id]
                            );

                            console.log(
                                `⚠️ Assinatura ${subscriptionId} inadimplente.`
                            );
                        } else {
                            console.log(
                                `ℹ️ Evento negativo antigo ignorado.`
                            );
                        }
                    }
                }
            }
        }

        // 9. CANCELAMENTO DA ASSINATURA

        if (
            evento.subscription?.id &&
            (
                tipoEvento === "SUBSCRIPTION_INACTIVATED" ||
                tipoEvento === "SUBSCRIPTION_DELETED"
            )
        ) {
            await conexao.query(
                `
                    UPDATE assinaturas
                    SET status = 'CANCELADA'
                    WHERE gateway_subscription_id = ?
                `,
                [evento.subscription.id]
            );

            console.log(
                `📋 Assinatura ${evento.subscription.id} cancelada.`
            );
        }

        // 10. MARCAR EVENTO COMO PROCESSADO

        await conexao.query(
            `
                UPDATE webhook_asaas_eventos
                SET processado = TRUE
                WHERE evento_id = ?
            `,
            [eventoId]
        );

        await conexao.commit();
        transacaoIniciada = false;

        console.log(
            `✅ Webhook ${eventoId} processado.`
        );

        return res.status(200).json({
            mensagem: "Webhook processado com sucesso.",
        });

    } catch (error) {
        if (conexao && transacaoIniciada) {
            await conexao.rollback();
        }

        console.error(
            "❌ Erro no webhook Asaas:",
            error.response?.data || error
        );

        return res.status(500).json({
            mensagem: "Erro ao processar webhook.",
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
}

module.exports = {
    receberWebhook,
};
