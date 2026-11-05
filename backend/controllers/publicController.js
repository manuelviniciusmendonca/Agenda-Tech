const db = require("../config/db");
const crypto = require("crypto");

const {
    validarHorarioFuncionamento
} = require("./disponibilidadeController");

const {
    limparTexto,
    textoValido,
    emailValido,
    telefoneValido,
    inteiroPositivo,
    slugValido,
    tokenPublicoValido,
    dataValida,
    normalizarHora,
    dataHoraNoPassado,
    dataMuitoDistante,
} = require("../utils/validation");

function converterParaMinutos(horario) {
    const partes = String(horario)
        .substring(0, 5)
        .split(":")
        .map(Number);

    return partes[0] * 60 + partes[1];
}

function formatarHorario(minutos) {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(
        minutosRestantes
    ).padStart(2, "0")}:00`;
}

async function buscarEmpresaPublica(req, res) {
    try {
        const slug = limparTexto(req.params.slug);

        if (!slugValido(slug)) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const [empresas] = await db.query(
            `
            SELECT
                id,
                nome,
                slug,
                telefone,
                email,
                descricao,
                endereco,
                instagram,
                agendamento_online,
                antecedencia_minutos,
                permitir_cancelamento,
                permitir_reagendamento
            FROM empresas
            WHERE slug = ?
            `,
            [slug]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const empresa = empresas[0];

        const [servicos] = await db.query(
            `
            SELECT
                id,
                nome,
                preco,
                duracao_minutos
            FROM servicos
            WHERE empresa_id = ?
            AND ativo = TRUE
            ORDER BY nome ASC
            `,
            [empresa.id]
        );

        const [profissionais] = await db.query(
            `
            SELECT
                id,
                nome
            FROM profissionais
            WHERE empresa_id = ?
            AND ativo = TRUE
            ORDER BY nome ASC
            `,
            [empresa.id]
        );

        return res.json({
            empresa,
            servicos,
            profissionais
        });

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR EMPRESA PÚBLICA:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao carregar página da empresa."
        });
    }
}

async function listarProfissionaisPorServico(req, res) {
    try {
        const slug = limparTexto(req.params.slug);
        const servico_id = Number(req.params.servico_id);

        if (!slugValido(slug)) {
            return res.status(404).json({
                mensagem:
                    "Empresa não encontrada."
            });
        }

        if (!inteiroPositivo(servico_id)) {
            return res.status(404).json({
                mensagem:
                    "Serviço não encontrado."
            });
        }

        const [empresas] = await db.query(
            `
            SELECT id
            FROM empresas
            WHERE slug = ?
            `,
            [slug]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Empresa não encontrada."
            });
        }

        const empresa_id = empresas[0].id;

        const [servicos] = await db.query(
            `
            SELECT id
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

        const [profissionais] =
            await db.query(
                `
                SELECT
                    p.id,
                    p.nome
                FROM profissionais p

                INNER JOIN profissional_servicos ps
                    ON ps.profissional_id = p.id

                WHERE p.empresa_id = ?
                AND p.ativo = TRUE
                AND ps.servico_id = ?

                ORDER BY p.nome ASC
                `,
                [
                    empresa_id,
                    servico_id
                ]
            );

        return res.json(
            profissionais
        );

    } catch (error) {
        console.error(
            "ERRO AO LISTAR PROFISSIONAIS:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao listar profissionais."
        });
    }
}

async function criarAgendamentoPublico(
    req,
    res
) {
    try {
        const slug = limparTexto(req.params.slug);
        const corpo = req.body || {};

        const cliente_nome = limparTexto(corpo.cliente_nome);
        const cliente_telefone = limparTexto(corpo.cliente_telefone);
        const cliente_email = limparTexto(corpo.cliente_email).toLowerCase();
        const profissional_id =
            corpo.profissional_id === undefined ||
            corpo.profissional_id === null ||
            corpo.profissional_id === ""
                ? null
                : Number(corpo.profissional_id);
        const servico_id = Number(corpo.servico_id);
        const data = limparTexto(corpo.data);
        const hora_inicio = normalizarHora(corpo.hora_inicio);

        if (!slugValido(slug)) {
            return res.status(404).json({
                mensagem:
                    "Empresa não encontrada."
            });
        }

        if (
            !textoValido(cliente_nome, 2, 150) ||
            !telefoneValido(cliente_telefone) ||
            !inteiroPositivo(servico_id) ||
            !dataValida(data) ||
            !hora_inicio
        ) {
            return res.status(400).json({
                mensagem:
                    "Dados do agendamento inválidos. Confira nome, telefone, serviço, data e horário."
            });
        }

        if (cliente_email && !emailValido(cliente_email)) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido."
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

        if (
            dataHoraNoPassado(data, hora_inicio) ||
            dataMuitoDistante(data)
        ) {
            return res.status(400).json({
                mensagem: "Data ou horário inválido."
            });
        }

        // --------------------------------------------------
        // EMPRESA
        // --------------------------------------------------

        const [empresas] = await db.query(
            `
            SELECT
                id,
                nome,
                slug,
                agendamento_online,
                antecedencia_minutos
            FROM empresas
            WHERE slug = ?
            `,
            [slug]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Empresa não encontrada."
            });
        }

        const empresa = empresas[0];

        if (!empresa.agendamento_online) {
            return res.status(403).json({
                mensagem:
                    "O agendamento online está desativado."
            });
        }

        // --------------------------------------------------
        // ANTECEDÊNCIA MÍNIMA
        // --------------------------------------------------

        const dataHoraAgendamento =
            new Date(
                `${data}T${hora_inicio}`
            );

        if (
            Number.isNaN(
                dataHoraAgendamento.getTime()
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Data ou horário inválido."
            });
        }

        const agora = new Date();

        const diferencaMinutos =
            (
                dataHoraAgendamento.getTime() -
                agora.getTime()
            ) /
            (1000 * 60);

        // Removida validação de antecedência mínima para permitir agendamentos imediatos

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
                empresa.id
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
        // PROFISSIONAL
        // --------------------------------------------------

        let profissionalFinal = null;

        if (profissional_id) {
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
                        profissional_id,
                        empresa.id
                    ]
                );

            if (
                profissionais.length === 0
            ) {
                return res.status(404).json({
                    mensagem:
                        "Profissional não encontrado."
                });
            }

            profissionalFinal =
                profissionais[0];
        } else {
            // Se nenhum profissional foi informado,
            // procura automaticamente alguém que realize o serviço.

            const [profissionais] =
                await db.query(
                    `
                    SELECT
                        p.id,
                        p.nome
                    FROM profissionais p

                    INNER JOIN profissional_servicos ps
                        ON ps.profissional_id = p.id

                    WHERE p.empresa_id = ?
                    AND p.ativo = TRUE
                    AND ps.servico_id = ?

                    ORDER BY p.id ASC
                    `,
                    [
                        empresa.id,
                        servico_id
                    ]
                );

            if (
                profissionais.length === 0
            ) {
                return res.status(400).json({
                    mensagem:
                        "Nenhum profissional disponível para este serviço."
                });
            }

            // O profissional será escolhido
            // depois de verificar disponibilidade.
            profissionalFinal =
                profissionais[0];
        }

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
                profissionalFinal.id,
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
                empresa_id: empresa.id,
                profissional_id: profissionalFinal.id,
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
        // VERIFICAR CONFLITO E CRIAR (em transação)
        // --------------------------------------------------
        //
        // A checagem de conflito e o INSERT precisam acontecer na mesma
        // transação, com o profissional bloqueado (FOR UPDATE). Sem isso,
        // duas requisições simultâneas podem passar pela checagem e
        // reservar o mesmo horário.

        const conexao = await db.getConnection();
        let transacaoAberta = false;

        try {
            await conexao.beginTransaction();
            transacaoAberta = true;

            const [trava] = await conexao.query(
                `
                SELECT id
                FROM profissionais
                WHERE id = ?
                AND empresa_id = ?
                FOR UPDATE
                `,
                [
                    profissionalFinal.id,
                    empresa.id
                ]
            );

            if (trava.length === 0) {
                await conexao.rollback();
                transacaoAberta = false;

                return res.status(404).json({
                    mensagem:
                        "Profissional não encontrado."
                });
            }

            const [conflitos] =
                await conexao.query(
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
                        empresa.id,
                        profissionalFinal.id,
                        data,
                        hora_fim,
                        hora_inicio
                    ]
                );

            if (conflitos.length > 0) {
                await conexao.rollback();
                transacaoAberta = false;

                return res.status(409).json({
                    mensagem:
                        "Este horário já está ocupado."
                });
            }

            // --------------------------------------------------
            // CLIENTE
            // --------------------------------------------------

            const [clientes] = await conexao.query(
                `
                SELECT
                    id
                FROM clientes
                WHERE empresa_id = ?
                AND telefone = ?
                LIMIT 1
                `,
                [
                    empresa.id,
                    cliente_telefone
                ]
            );

            let cliente_id;

            if (clientes.length > 0) {
                cliente_id =
                    clientes[0].id;

            } else {
                const [novoCliente] =
                    await conexao.query(
                        `
                        INSERT INTO clientes (
                            empresa_id,
                            nome,
                            telefone,
                            email
                        )
                        VALUES (?, ?, ?, ?)
                        `,
                        [
                            empresa.id,
                            cliente_nome,
                            cliente_telefone,
                            cliente_email || null
                        ]
                    );

                cliente_id =
                    novoCliente.insertId;
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
                await conexao.query(
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
                        empresa.id,
                        cliente_id,
                        profissionalFinal.id,
                        servico_id,
                        data,
                        hora_inicio,
                        hora_fim,
                        servico.preco
                    ]
                );

            await conexao.commit();
            transacaoAberta = false;

            return res.status(201).json({
                mensagem:
                    "Agendamento realizado com sucesso.",

                agendamento: {
                    id:
                        resultado.insertId,

                    token_publico:
                        tokenPublico,

                    data,
                    hora_inicio,
                    hora_fim,

                    cliente: {
                        id: cliente_id,
                        nome: cliente_nome,
                        telefone:
                            cliente_telefone
                    },

                    profissional:
                        profissionalFinal,

                    servico
                }
            });
        } catch (erroTransacao) {
            if (transacaoAberta) {
                await conexao.rollback();
            }

            throw erroTransacao;
        } finally {
            conexao.release();
        }

    } catch (error) {
        console.error(
            "ERRO AO CRIAR AGENDAMENTO PÚBLICO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao realizar agendamento."
        });
    }
}

async function buscarAgendamentoPublico(
    req,
    res
) {
    try {
        const slug = limparTexto(req.params.slug);
        const token = limparTexto(req.params.token);

        if (!slugValido(slug) || !tokenPublicoValido(token)) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
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
                    c.email AS cliente_email,

                    p.id AS profissional_id,
                    p.nome AS profissional_nome,

                    s.id AS servico_id,
                    s.nome AS servico_nome,
                    s.preco AS servico_preco,
                    s.duracao_minutos,

                    e.id AS empresa_id,
                    e.nome AS empresa_nome,
                    e.slug AS empresa_slug,
                    e.telefone AS empresa_telefone,
                    e.email AS empresa_email,
                    e.agendamento_online,
                    e.antecedencia_minutos,
                    e.permitir_cancelamento,
                    e.permitir_reagendamento

                FROM agendamentos a

                INNER JOIN empresas e
                    ON e.id = a.empresa_id

                INNER JOIN clientes c
                    ON c.id = a.cliente_id
                    AND c.empresa_id = a.empresa_id

                INNER JOIN profissionais p
                    ON p.id = a.profissional_id
                    AND p.empresa_id = a.empresa_id

                INNER JOIN servicos s
                    ON s.id = a.servico_id
                    AND s.empresa_id = a.empresa_id

                WHERE e.slug = ?
                AND a.token_publico = ?
                LIMIT 1
                `,
                [
                    slug,
                    token
                ]
            );

        if (
            agendamentos.length === 0
        ) {
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
            "ERRO AO BUSCAR AGENDAMENTO PÚBLICO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao buscar agendamento."
        });
    }
}

async function cancelarAgendamentoPublico(
    req,
    res
) {
    try {
        const slug = limparTexto(req.params.slug);
        const token = limparTexto(req.params.token);

        if (!slugValido(slug) || !tokenPublicoValido(token)) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT
                    a.id,
                    a.data,
                    a.hora_inicio,
                    a.status,

                    e.id AS empresa_id,
                    e.permitir_cancelamento,
                    e.antecedencia_minutos

                FROM agendamentos a

                INNER JOIN empresas e
                    ON e.id = a.empresa_id

                WHERE e.slug = ?
                AND a.token_publico = ?
                LIMIT 1
                `,
                [
                    slug,
                    token
                ]
            );

        if (
            agendamentos.length === 0
        ) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        const agendamento =
            agendamentos[0];

        if (
            !agendamento.permitir_cancelamento
        ) {
            return res.status(403).json({
                mensagem:
                    "O cancelamento online está desativado."
            });
        }

        if (
            [
                "CANCELADO",
                "CONCLUIDO",
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

        const dataString =
            agendamento.data instanceof Date
                ? agendamento.data
                      .toISOString()
                      .split("T")[0]
                : String(
                      agendamento.data
                  ).substring(0, 10);

        const dataHora =
            new Date(
                `${dataString}T${String(
                    agendamento.hora_inicio
                ).substring(0, 8)}`
            );

        const agora = new Date();

        // Removida validação de antecedência mínima para cancelamento

        await db.query(
            `
            UPDATE agendamentos
            SET status = 'CANCELADO'
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                agendamento.id,
                agendamento.empresa_id
            ]
        );

        return res.json({
            mensagem:
                "Agendamento cancelado com sucesso."
        });

    } catch (error) {
        console.error(
            "ERRO AO CANCELAR AGENDAMENTO PÚBLICO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao cancelar agendamento."
        });
    }
}

async function reagendarAgendamentoPublico(
    req,
    res
) {
    try {
        const slug = limparTexto(req.params.slug);
        const token = limparTexto(req.params.token);
        const corpo = req.body || {};
        const data = limparTexto(corpo.data);
        const hora_inicio = normalizarHora(corpo.hora_inicio);

        if (!slugValido(slug) || !tokenPublicoValido(token)) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        if (
            !dataValida(data) ||
            !hora_inicio ||
            dataHoraNoPassado(data, hora_inicio) ||
            dataMuitoDistante(data)
        ) {
            return res.status(400).json({
                mensagem:
                    "Data ou horário inválido."
            });
        }

        const [agendamentos] =
            await db.query(
                `
                SELECT
                    a.id,
                    a.data,
                    a.hora_inicio,
                    a.status,
                    a.profissional_id,
                    a.servico_id,

                    e.id AS empresa_id,
                    e.permitir_reagendamento,
                    e.antecedencia_minutos,

                    s.duracao_minutos

                FROM agendamentos a

                INNER JOIN empresas e
                    ON e.id = a.empresa_id

                INNER JOIN servicos s
                    ON s.id = a.servico_id
                    AND s.empresa_id = a.empresa_id

                WHERE e.slug = ?
                AND a.token_publico = ?
                LIMIT 1
                `,
                [
                    slug,
                    token
                ]
            );

        if (
            agendamentos.length === 0
        ) {
            return res.status(404).json({
                mensagem:
                    "Agendamento não encontrado."
            });
        }

        const agendamento =
            agendamentos[0];

        if (
            !agendamento.permitir_reagendamento
        ) {
            return res.status(403).json({
                mensagem:
                    "O reagendamento online está desativado."
            });
        }

        if (
            [
                "CANCELADO",
                "CONCLUIDO",
                "FALTOU"
            ].includes(
                agendamento.status
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Este agendamento não pode mais ser reagendado."
            });
        }

        // --------------------------------------------------
        // ANTECEDÊNCIA
        // --------------------------------------------------

        const novaDataHora =
            new Date(
                `${data}T${hora_inicio}`
            );

        if (
            Number.isNaN(
                novaDataHora.getTime()
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Data ou horário inválido."
            });
        }

        const agora = new Date();

        // Removida validação de antecedência mínima para reagendamento

        // --------------------------------------------------
        // HORÁRIO DE FUNCIONAMENTO
        // --------------------------------------------------

        const validacaoHorario =
            await validarHorarioFuncionamento({
                empresa_id:
                    agendamento.empresa_id,
                profissional_id:
                    agendamento.profissional_id,

                data,

                hora_inicio,

                duracao_minutos:
                    agendamento.duracao_minutos
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

        const inicioMinutos =
            converterParaMinutos(
                hora_inicio
            );

        const fimMinutos =
            inicioMinutos +
            Number(
                agendamento.duracao_minutos
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
                AND id <> ?
                AND status NOT IN (
                    'CANCELADO',
                    'FALTOU'
                )
                AND hora_inicio < ?
                AND hora_fim > ?
                LIMIT 1
                `,
                [
                    agendamento.empresa_id,
                    agendamento.profissional_id,
                    data,
                    agendamento.id,
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
        // ATUALIZAR
        // --------------------------------------------------

        await db.query(
            `
            UPDATE agendamentos
            SET
                data = ?,
                hora_inicio = ?,
                hora_fim = ?,
                status = 'AGENDADO'
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                data,
                hora_inicio,
                hora_fim,
                agendamento.id,
                agendamento.empresa_id
            ]
        );

        return res.json({
            mensagem:
                "Agendamento reagendado com sucesso.",

            agendamento: {
                id:
                    agendamento.id,

                data,
                hora_inicio,
                hora_fim
            }
        });

    } catch (error) {
        console.error(
            "ERRO AO REAGENDAR AGENDAMENTO PÚBLICO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao reagendar agendamento."
        });
    }
}

module.exports = {
    buscarEmpresaPublica,
    listarProfissionaisPorServico,
    criarAgendamentoPublico,
    buscarAgendamentoPublico,
    cancelarAgendamentoPublico,
    reagendarAgendamentoPublico
};