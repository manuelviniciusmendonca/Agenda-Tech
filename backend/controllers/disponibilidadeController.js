const db = require("../config/db");

const {
    converterParaMinutos,
    formatarHorario,
    obterHorarioFuncionamento,
    validarHorarioFuncionamento,
} = require("../services/horarioService");

const {
    limparTexto,
    dataValida,
    inteiroPositivo,
    slugValido,
} = require("../utils/validation");

async function buscarDisponibilidade(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        const profissional_id = Number(req.query.profissional_id);
        const servico_id = Number(req.query.servico_id);
        const data = limparTexto(req.query.data);

        if (
            !inteiroPositivo(profissional_id) ||
            !inteiroPositivo(servico_id) ||
            !dataValida(data)
        ) {
            return res.status(400).json({
                mensagem:
                    "Profissional, serviço e data são obrigatórios e devem ser válidos."
            });
        }

        if (req.usuario.role === "PROFISSIONAL") {
            const [profissionais] = await db.query(
                `
                SELECT id
                FROM profissionais
                WHERE id = ?
                AND usuario_id = ?
                AND empresa_id = ?
                AND ativo = TRUE
                `,
                [
                    profissional_id,
                    req.usuario.usuario_id,
                    empresa_id
                ]
            );

            if (profissionais.length === 0) {
                return res.status(404).json({
                    mensagem: "Profissional não encontrado."
                });
            }
        }

        const resultado =
            await calcularDisponibilidade({
                empresa_id,
                profissional_id,
                servico_id,
                data
            });

        res.json(resultado);

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR DISPONIBILIDADE:",
            error
        );

        res.status(
            error.status || 500
        ).json({
            mensagem:
                error.mensagem ||
                "Erro ao buscar disponibilidade."
        });
    }
}

async function buscarDisponibilidadePublica(req, res) {
    try {
        const slug = limparTexto(req.params.slug);
        const servico_id = Number(req.params.servico_id);
        const profissional_id = Number(req.params.profissional_id);
        const data = limparTexto(req.params.data);

        if (!slugValido(slug)) {
            return res.status(404).json({
                mensagem:
                    "Empresa não encontrada."
            });
        }

        if (
            !inteiroPositivo(servico_id) ||
            !inteiroPositivo(profissional_id) ||
            !dataValida(data)
        ) {
            return res.status(400).json({
                mensagem:
                    "Serviço, profissional e data são obrigatórios e devem ser válidos."
            });
        }

        const [empresas] = await db.query(
            `
            SELECT
                id,
                nome,
                slug
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

        const resultado =
            await calcularDisponibilidade({
                empresa_id: empresa.id,
                profissional_id,
                servico_id,
                data
            });

        res.json({
            empresa,
            ...resultado
        });

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR DISPONIBILIDADE PÚBLICA:",
            error
        );

        res.status(
            error.status || 500
        ).json({
            mensagem:
                error.mensagem ||
                "Erro ao buscar disponibilidade."
        });
    }
}

async function calcularDisponibilidade({
    empresa_id,
    profissional_id,
    servico_id,
    data
}) {
    if (
        !inteiroPositivo(Number(empresa_id)) ||
        !inteiroPositivo(Number(profissional_id)) ||
        !inteiroPositivo(Number(servico_id)) ||
        !dataValida(data)
    ) {
        throw {
            status: 400,
            mensagem: "Dados inválidos."
        };
    }

    const [profissionais] = await db.query(
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
            empresa_id
        ]
    );

    if (profissionais.length === 0) {
        throw {
            status: 404,
            mensagem:
                "Profissional não encontrado."
        };
    }

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
        throw {
            status: 404,
            mensagem:
                "Serviço não encontrado."
        };
    }

    const servico = servicos[0];

    const [relacao] = await db.query(
        `
        SELECT *
        FROM profissional_servicos
        WHERE profissional_id = ?
        AND servico_id = ?
        `,
        [
            profissional_id,
            servico_id
        ]
    );

    if (relacao.length === 0) {
        throw {
            status: 400,
            mensagem:
                "Este profissional não realiza este serviço."
        };
    }

    const horarioFuncionamento =
        await obterHorarioFuncionamento(
            empresa_id,
            profissional_id,
            data
        );

    if (!horarioFuncionamento) {
        return {
            data,
            profissional:
                profissionais[0],
            servico,
            horarios_disponiveis: []
        };
    }

    const inicioFuncionamento =
        converterParaMinutos(
            horarioFuncionamento.hora_abertura
        );

    const fimFuncionamento =
        converterParaMinutos(
            horarioFuncionamento.hora_fechamento
        );

    const duracao =
        Number(
            servico.duracao_minutos
        );

    // Duração inválida (0, negativa ou NaN) faria o laço abaixo rodar
    // para sempre, derrubando o servidor.
    if (
        !Number.isInteger(duracao) ||
        duracao <= 0 ||
        duracao > 1440 ||
        !Number.isFinite(inicioFuncionamento) ||
        !Number.isFinite(fimFuncionamento)
    ) {
        return {
            data,
            profissional:
                profissionais[0],
            servico,
            horarios_disponiveis: []
        };
    }

    const [agendamentos] = await db.query(
        `
        SELECT
            hora_inicio,
            hora_fim
        FROM agendamentos
        WHERE empresa_id = ?
        AND profissional_id = ?
        AND data = ?
        AND status NOT IN (
            'CANCELADO',
            'FALTOU'
        )
        ORDER BY hora_inicio ASC
        `,
        [
            empresa_id,
            profissional_id,
            data
        ]
    );

    const intervalosOcupados =
        agendamentos.map(
            (agendamento) => ({
                inicio:
                    converterParaMinutos(
                        agendamento.hora_inicio
                    ),

                fim:
                    converterParaMinutos(
                        agendamento.hora_fim
                    )
            })
        );

    const horariosDisponiveis = [];

    // Se for hoje, filtra horários que já passaram
    const agoraObj = new Date();
    const ano = agoraObj.getFullYear();
    const mes = String(agoraObj.getMonth() + 1).padStart(2, "0");
    const dia = String(agoraObj.getDate()).padStart(2, "0");
    const hojeFormatado = `${ano}-${mes}-${dia}`;
    const ehHoje = String(data).slice(0, 10) === hojeFormatado;
    const minutosAgora = agoraObj.getHours() * 60 + agoraObj.getMinutes();

    for (
        let inicio = inicioFuncionamento;
        inicio + duracao <= fimFuncionamento;
        inicio += duracao
    ) {
        // Ignora horários já passados para a data de hoje
        if (ehHoje && inicio <= minutosAgora) {
            continue;
        }

        const fim =
            inicio + duracao;

        const ocupado =
            intervalosOcupados.some(
                (intervalo) =>
                    inicio < intervalo.fim &&
                    fim > intervalo.inicio
            );

        if (!ocupado) {
            horariosDisponiveis.push(
                formatarHorario(inicio)
            );
        }
    }

    return {
        data,
        profissional:
            profissionais[0],
        servico,
        horarios_disponiveis:
            horariosDisponiveis
    };
}

module.exports = {
    buscarDisponibilidade,
    buscarDisponibilidadePublica,
    calcularDisponibilidade,
    obterHorarioFuncionamento,
    validarHorarioFuncionamento
};
