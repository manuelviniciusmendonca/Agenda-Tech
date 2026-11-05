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

function diferencaEmDias(dataInicial, dataFinal) {
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);

    const diferenca =
        fim.getTime() - inicio.getTime();

    return Math.round(
        diferenca / (1000 * 60 * 60 * 24)
    );
}

function adicionarDias(data, dias) {
    const resultado = new Date(data);

    resultado.setDate(
        resultado.getDate() + dias
    );

    return resultado;
}

function formatarData(data) {
    // Evita problemas de timezone usando parsing manual
    const dataObj = new Date(data);
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dia = String(dataObj.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

async function listarClientesParaRecuperacao(req, res) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        let profissional_id = null;

        // ==========================================
        // IDENTIFICAR PROFISSIONAL
        // ==========================================

        if (role === "PROFISSIONAL") {
            const profissional =
                await obterProfissionalDoUsuario(
                    usuario_id,
                    empresa_id
                );

            if (!profissional) {
                return res.status(403).json({
                    mensagem:
                        "Profissional não encontrado."
                });
            }

            profissional_id = profissional.id;
        }

        // ==========================================
        // FILTRO POR PROFISSIONAL
        // ==========================================

        let filtroProfissional = "";
        let parametros = [empresa_id];

        if (profissional_id) {
            filtroProfissional =
                "AND a.profissional_id = ?";

            parametros.push(profissional_id);
        }

        // ==========================================
        // BUSCAR HISTÓRICO
        // ==========================================

        const [agendamentos] = await db.query(
            `
            SELECT
                a.cliente_id,
                a.data,
                a.valor,

                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,

                s.intervalo_retorno_dias

            FROM agendamentos a

            INNER JOIN clientes c
                ON c.id = a.cliente_id
                AND c.empresa_id = a.empresa_id

            INNER JOIN servicos s
                ON s.id = a.servico_id
                AND s.empresa_id = a.empresa_id

            WHERE a.empresa_id = ?
            AND a.status = 'CONCLUIDO'
            ${filtroProfissional}

            ORDER BY
                a.cliente_id ASC,
                a.data ASC
            `,
            parametros
        );

        // ==========================================
        // AGRUPAR POR CLIENTE
        // ==========================================

        const clientesMap = new Map();

        for (const agendamento of agendamentos) {
            if (
                !clientesMap.has(
                    agendamento.cliente_id
                )
            ) {
                clientesMap.set(
                    agendamento.cliente_id,
                    {
                        id: agendamento.cliente_id,
                        nome: agendamento.cliente_nome,
                        telefone:
                            agendamento.cliente_telefone,
                        atendimentos: []
                    }
                );
            }

            clientesMap
                .get(agendamento.cliente_id)
                .atendimentos
                .push(agendamento);
        }

        const hoje = new Date();

        // Zera o horário para comparar apenas por dia
        hoje.setHours(0, 0, 0, 0);

        const resultado = [];

        // ==========================================
        // CALCULAR RECUPERAÇÃO
        // ==========================================

        for (const cliente of clientesMap.values()) {
            const atendimentos =
                cliente.atendimentos;

            if (atendimentos.length === 0) {
                continue;
            }

            const ultimo =
                atendimentos[
                    atendimentos.length - 1
                ];

            const ultimaData =
                new Date(ultimo.data);

            let intervaloMedio;

            // ======================================
            // MÉDIA REAL DE RETORNO
            // ======================================

            if (atendimentos.length >= 2) {
                let totalDias = 0;
                let quantidadeIntervalos = 0;

                for (
                    let i = 1;
                    i < atendimentos.length;
                    i++
                ) {
                    const anterior =
                        atendimentos[i - 1];

                    const atual =
                        atendimentos[i];

                    const dias =
                        diferencaEmDias(
                            anterior.data,
                            atual.data
                        );

                    if (dias > 0) {
                        totalDias += dias;
                        quantidadeIntervalos++;
                    }
                }

                if (quantidadeIntervalos > 0) {
                    intervaloMedio =
                        Math.round(
                            totalDias /
                                quantidadeIntervalos
                        );
                }
            }

            // ======================================
            // FALLBACK DO SERVIÇO
            // ======================================

            if (!intervaloMedio) {
                intervaloMedio =
                    Number(
                        ultimo.intervalo_retorno_dias
                    ) || 30;
            }

            // ======================================
            // ESTIMAR PRÓXIMO RETORNO
            // ======================================

            const proximoRetorno =
                adicionarDias(
                    ultimaData,
                    intervaloMedio
                );

            const diasAtrasado =
                diferencaEmDias(
                    proximoRetorno,
                    hoje
                );

            // Negativo = ainda dentro do prazo
            // Zero     = o retorno está previsto para hoje
            // Positivo = já passou do prazo

            // ======================================
            // VALOR TOTAL GASTO
            // ======================================

            const valorTotal =
                atendimentos.reduce(
                    (total, atendimento) => {
                        return (
                            total +
                            Number(
                                atendimento.valor || 0
                            )
                        );
                    },
                    0
                );

            // ======================================
            // STATUS DE RECUPERAÇÃO
            // ======================================

            let status;

            if (diasAtrasado > 0) {
                status =
                    diasAtrasado >= 30
                        ? "RISCO"
                        : "ATRASADO";
            } else if (diasAtrasado === 0) {
                // É hoje: dispara o alerta de retorno
                status = "HOJE";
            } else {
                // Ainda dentro do prazo
                status = "EM_DIA";
            }

            // ======================================
            // ADICIONAR RESULTADO
            // ======================================

            resultado.push({
                id: cliente.id,

                nome: cliente.nome,

                telefone:
                    cliente.telefone,

                ultimo_atendimento:
                    formatarData(
                        ultimaData
                    ),

                intervalo_medio_dias:
                    intervaloMedio,

                proximo_retorno_estimado:
                    formatarData(
                        proximoRetorno
                    ),

                dias_atrasado:
                    diasAtrasado,

                // Quantos dias faltam para o retorno (0 se já passou)
                dias_para_retorno:
                    diasAtrasado < 0
                        ? -diasAtrasado
                        : 0,

                total_atendimentos:
                    atendimentos.length,

                valor_total_gasto:
                    Number(
                        valorTotal.toFixed(2)
                    ),

                status
            });
        }

        // ==========================================
        // ORDENAR
        // MAIS ATRASADOS PRIMEIRO
        // ==========================================

        resultado.sort(
            (a, b) =>
                b.dias_atrasado -
                a.dias_atrasado
        );

        // ==========================================
        // POTENCIAL DE RETORNO
        // ==========================================

        const potencialRetorno =
            resultado.reduce(
                (total, cliente) => {
                    const ticketMedio =
                        cliente.total_atendimentos > 0
                            ? cliente.valor_total_gasto /
                              cliente.total_atendimentos
                            : 0;

                    return (
                        total +
                        ticketMedio
                    );
                },
                0
            );

        // ==========================================
        // RESPOSTA
        // ==========================================

        return res.json({
            total: resultado.length,

            potencial_retorno:
                Number(
                    potencialRetorno.toFixed(2)
                ),

            clientes: resultado
        });

    } catch (error) {
        console.error(
            "ERRO AO LISTAR CLIENTES PARA RECUPERAÇÃO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao buscar clientes para recuperação."
        });
    }
}

module.exports = {
    listarClientesParaRecuperacao
};