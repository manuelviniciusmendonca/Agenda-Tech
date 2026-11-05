const db = require("../config/db");

async function obterProfissionalDoUsuario(usuario_id, empresa_id) {
    const [rows] = await db.query(
        `SELECT id
         FROM profissionais
         WHERE usuario_id = ?
         AND empresa_id = ?
         AND ativo = TRUE`,
        [usuario_id, empresa_id]
    );

    return rows[0] || null;
}

async function buscarResumoDashboard(req, res) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        let profissional_id = null;

        // Se for profissional, descobrir seu profissional_id
        if (role === "PROFISSIONAL") {
            const profissional = await obterProfissionalDoUsuario(
                usuario_id,
                empresa_id
            );

            if (!profissional) {
                return res.status(403).json({
                    mensagem: "Profissional não encontrado."
                });
            }

            profissional_id = profissional.id;
        }

        // Filtro utilizado nas consultas
        let filtroProfissional = "";
        let parametroProfissional = [];

        if (profissional_id) {
            filtroProfissional = "AND a.profissional_id = ?";
            parametroProfissional = [profissional_id];
        }

        // ==========================================
        // AGENDAMENTOS DE HOJE
        // ==========================================

        const [agendamentosHoje] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM agendamentos a
            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status NOT IN ('CANCELADO', 'FALTOU')
            ${filtroProfissional}
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // FATURAMENTO DE HOJE
        // ==========================================

        const [faturamentoHoje] = await db.query(
            `
            SELECT COALESCE(SUM(a.valor), 0) AS total
            FROM agendamentos a
            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status = 'CONCLUIDO'
            ${filtroProfissional}
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // CONFIRMADOS HOJE
        // ==========================================

        const [confirmadosHoje] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM agendamentos a
            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status = 'CONFIRMADO'
            ${filtroProfissional}
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // CONCLUÍDOS HOJE
        // ==========================================

        const [concluidosHoje] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM agendamentos a
            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status = 'CONCLUIDO'
            ${filtroProfissional}
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // FALTAS HOJE
        // ==========================================

        const [faltasHoje] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM agendamentos a
            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status = 'FALTOU'
            ${filtroProfissional}
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // CLIENTES NO FUNIL
        // Mesma lógica do recuperacaoController:
        // todos os clientes distintos com ao menos
        // 1 atendimento CONCLUIDO na empresa
        // ==========================================

        let filtroRecuperacao = "";
        let parametroRecuperacao = [];

        if (profissional_id) {
            filtroRecuperacao = "AND a.profissional_id = ?";
            parametroRecuperacao = [profissional_id];
        }

        const [clientesRecuperacao] = await db.query(
            `
            SELECT COUNT(DISTINCT a.cliente_id) AS total
            FROM agendamentos a
            INNER JOIN clientes c
                ON c.id = a.cliente_id
                AND c.empresa_id = a.empresa_id
            WHERE a.empresa_id = ?
            AND a.status = 'CONCLUIDO'
            ${filtroRecuperacao}
            `,
            [
                empresa_id,
                ...parametroRecuperacao
            ]
        );

        // ==========================================
        // PRÓXIMOS AGENDAMENTOS
        // ==========================================

        const [proximosAgendamentos] = await db.query(
            `
            SELECT
                a.id,
                a.data,
                a.hora_inicio,
                a.hora_fim,
                a.status,
                a.valor,

                c.nome AS cliente_nome,

                p.nome AS profissional_nome,

                s.nome AS servico_nome

            FROM agendamentos a

            INNER JOIN clientes c
                ON c.id = a.cliente_id

            INNER JOIN profissionais p
                ON p.id = a.profissional_id

            INNER JOIN servicos s
                ON s.id = a.servico_id

            WHERE a.empresa_id = ?
            AND a.data = CURDATE()
            AND a.status NOT IN (
                'CANCELADO',
                'FALTOU'
            )
            ${filtroProfissional}

            ORDER BY
                a.hora_inicio ASC

            LIMIT 10
            `,
            [
                empresa_id,
                ...parametroProfissional
            ]
        );

        // ==========================================
        // TAXA DE COMPARECIMENTO
        // ==========================================

        const concluidos = Number(
            concluidosHoje[0].total
        );

        const faltas = Number(
            faltasHoje[0].total
        );

        const comparecimentos =
            concluidos + faltas;

        let taxaComparecimento = 0;

        if (comparecimentos > 0) {
            taxaComparecimento =
                (concluidos / comparecimentos) * 100;
        }

        // ==========================================
        // RESPOSTA
        // ==========================================

        return res.json({
            agendamentos_hoje:
                Number(agendamentosHoje[0].total),

            faturamento_hoje:
                Number(
                    Number(
                        faturamentoHoje[0].total
                    ).toFixed(2)
                ),

            confirmados_hoje:
                Number(confirmadosHoje[0].total),

            clientes_para_recuperar:
                Number(
                    clientesRecuperacao[0].total
                ),

            taxa_comparecimento:
                Number(
                    taxaComparecimento.toFixed(1)
                ),

            proximos_agendamentos:
                proximosAgendamentos
        });

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR DASHBOARD:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao carregar dashboard."
        });
    }
}

module.exports = {
    buscarResumoDashboard
};