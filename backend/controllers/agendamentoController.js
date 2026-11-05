const db = require("../config/db");
const crypto = require("crypto");

const {
    validarHorarioFuncionamento
} = require("../services/horarioService");

const {
    limparTexto,
    dataValida,
    normalizarHora,
    inteiroPositivo,
} = require("../utils/validation");

async function obterProfissionalDoUsuario(
    usuario_id,
    empresa_id
) {
    const [rows] = await db.query(
        `
        SELECT id
        FROM profissionais
        WHERE usuario_id = ?
        AND empresa_id = ?
        AND ativo = TRUE
        `,
        [
            usuario_id,
            empresa_id
        ]
    );

    return rows[0] || null;
}

async function criarAgendamento(req, res) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        const corpo = req.body || {};
        const cliente_id = Number(corpo.cliente_id);
        const profissional_id = Number(corpo.profissional_id);
        const servico_id = Number(corpo.servico_id);
        const data = limparTexto(corpo.data);
        const hora_inicio = normalizarHora(corpo.hora_inicio);

        if (
            !inteiroPositivo(cliente_id) ||
            !inteiroPositivo(profissional_id) ||
            !inteiroPositivo(servico_id) ||
            !dataValida(data) ||
            !hora_inicio
        ) {
            return res.status(400).json({
                mensagem:
                    "Cliente, profissional, serviço, data e horário são obrigatórios e devem ser válidos."
            });
        }

        // --------------------------------------------------
        // PROFISSIONAL
        // --------------------------------------------------

        let profissionalPermitido =
            profissional_id;

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

            if (
                Number(profissional_id) !==
                Number(profissional.id)
            ) {
                return res.status(403).json({
                    mensagem:
                        "Você só pode criar agendamentos para sua própria agenda."
                });
            }

            profissionalPermitido =
                profissional.id;
        }

        // --------------------------------------------------
        // CLIENTE
        // --------------------------------------------------

        const [clientes] = await db.query(
            `
            SELECT id
            FROM clientes
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                cliente_id,
                empresa_id
            ]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Cliente não encontrado."
            });
        }

        // Profissional validado no escopo da empresa

        // --------------------------------------------------
        // PROFISSIONAL
        // --------------------------------------------------

        const [profissionais] =
            await db.query(
                `
                SELECT
                    id,
                    nome
                FROM profissionais
                WHERE id = ?
                AND empresa_id = ?
                AND ativo = TRUE
                `,
                [
                    profissionalPermitido,
                    empresa_id
                ]
            );

        if (profissionais.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Profissional não encontrado."
            });
        }

        // --------------------------------------------------
        // SERVIÇO
        // --------------------------------------------------

        const [servicos] = await db.query(
            `
            SELECT
                id,
                nome,
                preco,
                duracao_minutos
            FROM servicos
            WHERE id = ?
            AND empresa_id = ?
            AND ativo = TRUE
            `,
            [
                servico_id,
                empresa_id
            ]
        );

        if (servicos.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Serviço não encontrado."
            });
        }

        const servico = servicos[0];

        // --------------------------------------------------
        // RELAÇÃO PROFISSIONAL + SERVIÇO
        // --------------------------------------------------

        const [relacao] = await db.query(
            `
            SELECT *
            FROM profissional_servicos
            WHERE profissional_id = ?
            AND servico_id = ?
            `,
            [
                profissionalPermitido,
                servico_id
            ]
        );

        if (relacao.length === 0) {
            return res.status(400).json({
                mensagem:
                    "Este profissional não realiza este serviço."
            });
        }

        // --------------------------------------------------
        // HORÁRIO DE FUNCIONAMENTO
        // --------------------------------------------------

        const validacaoHorario =
            await validarHorarioFuncionamento({
                empresa_id,
                profissional_id: profissionalPermitido,
                data,
                hora_inicio,
                duracao_minutos:
                    servico.duracao_minutos
            });

        if (!validacaoHorario.valido) {
            return res.status(400).json({
                mensagem:
                    validacaoHorario.mensagem
            });
        }

        // --------------------------------------------------
        // CALCULAR HORA FINAL
        // --------------------------------------------------

        function converterParaMinutos(horario) {
            const partes =
                String(horario)
                    .substring(0, 5)
                    .split(":")
                    .map(Number);

            return (
                partes[0] * 60 +
                partes[1]
            );
        }

        function formatarHorario(minutos) {
            const horas =
                Math.floor(
                    minutos / 60
                );

            const minutosRestantes =
                minutos % 60;

            return `${String(
                horas
            ).padStart(2, "0")}:${String(
                minutosRestantes
            ).padStart(2, "0")}:00`;
        }

        const inicioMinutos =
            converterParaMinutos(
                hora_inicio
            );

        const fimMinutos =
            inicioMinutos +
            Number(
                servico.duracao_minutos
            );

        const hora_fim =
            formatarHorario(
                fimMinutos
            );

        // --------------------------------------------------
        // VERIFICAR CONFLITO
        // --------------------------------------------------

        const [conflitos] =
            await db.query(
                `
                SELECT id
                FROM agendamentos
                WHERE empresa_id = ?
                AND profissional_id = ?
                AND data = ?
                AND status NOT IN (
                    'CANCELADO',
                    'FALTOU'
                )
                AND hora_inicio < ?
                AND hora_fim > ?
                LIMIT 1
                `,
                [
                    empresa_id,
                    profissionalPermitido,
                    data,
                    hora_fim,
                    hora_inicio
                ]
            );

        if (conflitos.length > 0) {
            return res.status(409).json({
                mensagem:
                    "Este horário já está ocupado."
            });
        }

        // --------------------------------------------------
        // TOKEN PÚBLICO
        // --------------------------------------------------

        const tokenPublico =
            crypto
                .randomBytes(32)
                .toString("hex");

        // --------------------------------------------------
        // CRIAR AGENDAMENTO
        // --------------------------------------------------

        const [resultado] =
            await db.query(
                `
                INSERT INTO agendamentos (
                    token_publico,
                    empresa_id,
                    cliente_id,
                    profissional_id,
                    servico_id,
                    data,
                    hora_inicio,
                    hora_fim,
                    status,
                    valor
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AGENDADO', ?)
                `,
                [
                    tokenPublico,
                    empresa_id,
                    cliente_id,
                    profissionalPermitido,
                    servico_id,
                    data,
                    hora_inicio,
                    hora_fim,
                    servico.preco
                ]
            );

        return res.status(201).json({
            mensagem:
                "Agendamento criado com sucesso.",

            agendamento_id:
                resultado.insertId,

            token_publico:
                tokenPublico
        });

    } catch (error) {
        console.error(
            "ERRO AO CRIAR AGENDAMENTO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao criar agendamento.",
        });
    }
}

async function listarAgendamentos(req, res) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        const profissional_id =
            req.query.profissional_id === undefined ||
            req.query.profissional_id === ""
                ? null
                : Number(req.query.profissional_id);
        const data = limparTexto(req.query.data);

        if (data && !dataValida(data)) {
            return res.status(400).json({
                mensagem: "Data inválida."
            });
        }

        if (
            profissional_id !== null &&
            !inteiroPositivo(profissional_id)
        ) {
            return res.status(400).json({
                mensagem: "Profissional inválido."
            });
        }

        let profissionalFiltro = null;

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

            profissionalFiltro =
                profissional.id;

        } else if (profissional_id) {
            profissionalFiltro =
                profissional_id;
        }

        let filtros = [
            "a.empresa_id = ?"
        ];

        let parametros = [
            empresa_id
        ];

        if (profissionalFiltro) {
            filtros.push(
                "a.profissional_id = ?"
            );

            parametros.push(
                profissionalFiltro
            );
        }

        if (data) {
            filtros.push(
                "a.data = ?"
            );

            parametros.push(data);
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT
                    a.id,
                    a.token_publico,
                    a.data,
                    a.hora_inicio,
                    a.hora_fim,
                    a.status,
                    a.valor,

                    c.id AS cliente_id,
                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,

                    p.id AS profissional_id,
                    p.nome AS profissional_nome,

                    s.id AS servico_id,
                    s.nome AS servico_nome,
                    s.intervalo_retorno_dias

                FROM agendamentos a

                INNER JOIN clientes c
                    ON c.id = a.cliente_id
                    AND c.empresa_id = a.empresa_id

                INNER JOIN profissionais p
                    ON p.id = a.profissional_id
                    AND p.empresa_id = a.empresa_id

                INNER JOIN servicos s
                    ON s.id = a.servico_id
                    AND s.empresa_id = a.empresa_id

                WHERE ${filtros.join(
                    " AND "
                )}

                ORDER BY
                    a.data ASC,
                    a.hora_inicio ASC
                `,
                parametros
            );

        return res.json(
            agendamentos
        );

    } catch (error) {
        console.error(
            "ERRO AO LISTAR AGENDAMENTOS:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao listar agendamentos.",
        });
    }
}

async function buscarAgendamentoPorId(
    req,
    res
) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        const { id } = req.params;

        if (!inteiroPositivo(Number(id))) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        let filtroProfissional = "";

        let parametros = [
            id,
            empresa_id
        ];

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

            filtroProfissional =
                "AND a.profissional_id = ?";

            parametros.push(
                profissional.id
            );
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT
                    a.id,
                    a.token_publico,
                    a.data,
                    a.hora_inicio,
                    a.hora_fim,
                    a.status,
                    a.valor,

                    c.id AS cliente_id,
                    c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,

                    p.id AS profissional_id,
                    p.nome AS profissional_nome,

                    s.id AS servico_id,
                    s.nome AS servico_nome,
                    s.intervalo_retorno_dias

                FROM agendamentos a

                INNER JOIN clientes c
                    ON c.id = a.cliente_id
                    AND c.empresa_id = a.empresa_id

                INNER JOIN profissionais p
                    ON p.id = a.profissional_id
                    AND p.empresa_id = a.empresa_id

                INNER JOIN servicos s
                    ON s.id = a.servico_id
                    AND s.empresa_id = a.empresa_id

                WHERE a.id = ?
                AND a.empresa_id = ?
                ${filtroProfissional}
                `,
                parametros
            );

        if (agendamentos.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        return res.json(
            agendamentos[0]
        );

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR AGENDAMENTO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao buscar agendamento.",
        });
    }
}

async function atualizarStatusAgendamento(
    req,
    res
) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        const { id } = req.params;
        const { status } = req.body;

        if (!inteiroPositivo(Number(id))) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        const statusPermitidos = [
            "AGENDADO",
            "CONFIRMADO",
            "CONCLUIDO",
            "CANCELADO",
            "FALTOU"
        ];

        if (
            !statusPermitidos.includes(
                status
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Status inválido."
            });
        }

        let filtroProfissional = "";
        let parametrosBusca = [
            id,
            empresa_id
        ];

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

            filtroProfissional =
                "AND profissional_id = ?";

            parametrosBusca.push(
                profissional.id
            );
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT id
                FROM agendamentos
                WHERE id = ?
                AND empresa_id = ?
                ${filtroProfissional}
                `,
                parametrosBusca
            );

        if (agendamentos.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        await db.query(
            `
            UPDATE agendamentos
            SET status = ?
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                status,
                id,
                empresa_id
            ]
        );

        return res.json({
            mensagem:
                "Status atualizado com sucesso."
        });

    } catch (error) {
        console.error(
            "ERRO AO ATUALIZAR STATUS:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao atualizar status.",
        });
    }
}

async function cancelarAgendamento(
    req,
    res
) {
    try {
        const {
            empresa_id,
            role,
            usuario_id
        } = req.usuario;

        const { id } = req.params;

        if (!inteiroPositivo(Number(id))) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        let filtroProfissional = "";
        let parametros = [
            id,
            empresa_id
        ];

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

            filtroProfissional =
                "AND profissional_id = ?";

            parametros.push(
                profissional.id
            );
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT
                    id,
                    status
                FROM agendamentos
                WHERE id = ?
                AND empresa_id = ?
                ${filtroProfissional}
                `,
                parametros
            );

        if (agendamentos.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        const agendamento =
            agendamentos[0];

        if (
            [
                "CONCLUIDO",
                "CANCELADO",
                "FALTOU"
            ].includes(
                agendamento.status
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Este agendamento não pode mais ser cancelado."
            });
        }

        await db.query(
            `
            UPDATE agendamentos
            SET status = 'CANCELADO'
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                id,
                empresa_id
            ]
        );

        return res.json({
            mensagem:
                "Agendamento cancelado com sucesso."
        });

    } catch (error) {
        console.error(
            "ERRO AO CANCELAR AGENDAMENTO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao cancelar agendamento.",
        });
    }
}

module.exports = {
    criarAgendamento,
    listarAgendamentos,
    buscarAgendamentoPorId,
    atualizarStatusAgendamento,
    cancelarAgendamento
};