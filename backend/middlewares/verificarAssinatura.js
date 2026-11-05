const db = require("../config/db");

async function verificarAssinatura(req, res, next) {
    try {
        const empresaId = req.usuario?.empresa_id;

        if (!empresaId) {
            return res.status(401).json({
                mensagem: "Empresa não identificada."
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                status,
                periodo_inicio,
                periodo_fim
            FROM assinaturas
            WHERE empresa_id = ?
            LIMIT 1
            `,
            [empresaId]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                codigo: "ASSINATURA_NAO_ENCONTRADA",
                mensagem: "Sua empresa não possui assinatura cadastrada."
            });
        }

        const assinatura = rows[0];

        if (assinatura.status === "TRIAL") {
            if (!assinatura.periodo_fim) {
                return res.status(403).json({
                    codigo: "TRIAL_SEM_VENCIMENTO",
                    mensagem: "O período de teste não possui data de encerramento."
                });
            }

            const [resultado] = await db.query(
                `SELECT CURDATE() <= DATE(?) AS trial_valido`,
                [assinatura.periodo_fim]
            );

            if (!resultado[0].trial_valido) {
                await db.query(
                    `
                    UPDATE assinaturas
                    SET status = 'EXPIRADA'
                    WHERE id = ?
                    `,
                    [assinatura.id]
                );

                return res.status(403).json({
                    codigo: "TRIAL_EXPIRADO",
                    mensagem: "Seu período de teste terminou. Escolha um plano para continuar.",
                    status: "EXPIRADA"
                });
            }
        } else if (assinatura.status === "ATIVA") {
            // A data de vencimento é a última barreira: mesmo que
            // o webhook atrase ou se perca, o acesso não continua
            // indefinidamente.
            const [vencimento] = await db.query(
                `
                SELECT (
                    periodo_fim IS NOT NULL
                    AND periodo_fim < CURDATE()
                ) AS vencida
                FROM assinaturas
                WHERE id = ?
                LIMIT 1
                `,
                [assinatura.id]
            );

            if (vencimento[0]?.vencida) {
                await db.query(
                    `
                    UPDATE assinaturas
                    SET status = 'EXPIRADA'
                    WHERE id = ?
                      AND status = 'ATIVA'
                    `,
                    [assinatura.id]
                );

                return res.status(403).json({
                    codigo: "ASSINATURA_VENCIDA",
                    mensagem: "Sua assinatura venceu. Renove o plano para continuar.",
                    status: "EXPIRADA"
                });
            }
        } else {
            return res.status(403).json({
                codigo: "ASSINATURA_BLOQUEADA",
                mensagem: "Sua assinatura não permite acesso ao sistema.",
                status: assinatura.status
            });
        }

        req.assinatura = assinatura;

        return next();

    } catch (error) {
        console.error("ERRO AO VERIFICAR ASSINATURA:", error);

        return res.status(503).json({
            mensagem: "Não foi possível verificar sua assinatura."
        });
    }
}

module.exports = verificarAssinatura;