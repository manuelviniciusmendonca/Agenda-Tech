const db = require("../config/db");
const { dataValida } = require("../utils/validation");

const TOTAL_DIAS = 7;

function converterParaMinutos(horario) {
    const normalizado = String(horario || "").substring(0, 5);
    const partes = normalizado.split(":");

    if (partes.length !== 2) {
        return NaN;
    }

    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);

    if (
        !Number.isInteger(horas) ||
        !Number.isInteger(minutos) ||
        horas < 0 ||
        horas > 23 ||
        minutos < 0 ||
        minutos > 59
    ) {
        return NaN;
    }

    return horas * 60 + minutos;
}

function formatarHorario(minutos) {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(
        minutosRestantes
    ).padStart(2, "0")}`;
}

function formatarHoraBanco(valor) {
    if (!valor) return null;

    return String(valor).substring(0, 5);
}

function horarioValido(valor) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

async function listarHorariosEmpresa(empresa_id) {
    const [linhas] = await db.query(
        `
        SELECT
            id,
            dia_semana,
            hora_abertura,
            hora_fechamento,
            ativo
        FROM horarios_funcionamento
        WHERE empresa_id = ?
        ORDER BY dia_semana ASC
        `,
        [empresa_id]
    );

    return linhas;
}

async function listarHorariosProfissional(empresa_id, profissional_id) {
    const [linhas] = await db.query(
        `
        SELECT
            id,
            dia_semana,
            hora_abertura,
            hora_fechamento,
            ativo
        FROM horarios_profissionais
        WHERE empresa_id = ?
        AND profissional_id = ?
        ORDER BY dia_semana ASC
        `,
        [empresa_id, profissional_id]
    );

    return linhas;
}

/**
 * Monta a semana completa (0 = domingo ... 6 = sábado) para a interface.
 */
function montarSemana(linhas) {
    const porDia = new Map(
        (linhas || []).map((linha) => [Number(linha.dia_semana), linha])
    );

    const semConfiguracaoPrevia = !linhas || linhas.length === 0;
    const semana = [];

    for (let dia = 0; dia < TOTAL_DIAS; dia++) {
        const linha = porDia.get(dia);

        if (linha) {
            semana.push({
                dia_semana: dia,
                hora_abertura: formatarHoraBanco(linha.hora_abertura),
                hora_fechamento: formatarHoraBanco(linha.hora_fechamento),
                ativo: Boolean(linha.ativo),
            });
        } else if (semConfiguracaoPrevia) {
            // Horários padrão se a empresa ainda não tiver configurado nenhum dia
            const ehSegundaASexta = dia >= 1 && dia <= 5;
            const ehSabado = dia === 6;

            semana.push({
                dia_semana: dia,
                hora_abertura: ehSegundaASexta || ehSabado ? "08:00" : null,
                hora_fechamento: ehSegundaASexta ? "18:00" : ehSabado ? "13:00" : null,
                ativo: ehSegundaASexta || ehSabado,
            });
        } else {
            semana.push({
                dia_semana: dia,
                hora_abertura: null,
                hora_fechamento: null,
                ativo: false,
            });
        }
    }

    return semana;
}

/**
 * Horários do profissional têm prioridade. Sem horários próprios,
 * herda o horário padrão da empresa.
 */
async function obterHorariosComOrigem(empresa_id, profissional_id) {
    if (profissional_id) {
        const proprios = await listarHorariosProfissional(
            empresa_id,
            profissional_id
        );

        if (proprios.length > 0) {
            return {
                origem: "PROFISSIONAL",
                horarios: montarSemana(proprios),
            };
        }
    }

    const empresa = await listarHorariosEmpresa(empresa_id);

    return {
        origem: "EMPRESA",
        horarios: montarSemana(empresa),
    };
}

/**
 * Valida a semana enviada pelo cliente e devolve apenas os campos usados.
 */
function validarSemana(horarios) {
    if (!Array.isArray(horarios) || horarios.length === 0) {
        return {
            valido: false,
            mensagem: "Informe os horários da semana.",
        };
    }

    const diasVistos = new Set();
    const normalizados = [];

    for (const dia of horarios) {
        const diaSemana = Number(dia?.dia_semana);

        if (
            !Number.isInteger(diaSemana) ||
            diaSemana < 0 ||
            diaSemana > 6
        ) {
            return {
                valido: false,
                mensagem: "Dia da semana inválido.",
            };
        }

        if (diasVistos.has(diaSemana)) {
            return {
                valido: false,
                mensagem: "Cada dia da semana deve ser enviado apenas uma vez.",
            };
        }

        diasVistos.add(diaSemana);

        const ativo =
            dia.ativo === true || dia.ativo === 1 || dia.ativo === "1";
        const abertura = ativo
            ? formatarHoraBanco(dia.hora_abertura)
            : null;
        const fechamento = ativo
            ? formatarHoraBanco(dia.hora_fechamento)
            : null;

        if (ativo) {
            if (
                !abertura ||
                !fechamento ||
                !horarioValido(abertura) ||
                !horarioValido(fechamento)
            ) {
                return {
                    valido: false,
                    mensagem:
                        "Preencha a hora de abertura e fechamento de todos os dias abertos.",
                };
            }

            if (
                converterParaMinutos(abertura) >=
                converterParaMinutos(fechamento)
            ) {
                return {
                    valido: false,
                    mensagem:
                        "O horário de fechamento deve ser depois do horário de abertura.",
                };
            }
        }

        normalizados.push({
            dia_semana: diaSemana,
            hora_abertura: abertura,
            hora_fechamento: fechamento,
            ativo,
        });
    }

    return { valido: true, horarios: normalizados };
}

async function salvarSemana({ empresa_id, profissional_id, horarios }) {
    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        for (const dia of horarios) {
            await conexao.query(
                `
                INSERT INTO horarios_profissionais
                    (
                        empresa_id,
                        profissional_id,
                        dia_semana,
                        hora_abertura,
                        hora_fechamento,
                        ativo
                    )
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    empresa_id = VALUES(empresa_id),
                    hora_abertura = VALUES(hora_abertura),
                    hora_fechamento = VALUES(hora_fechamento),
                    ativo = VALUES(ativo)
                `,
                [
                    empresa_id,
                    profissional_id,
                    dia.dia_semana,
                    dia.hora_abertura,
                    dia.hora_fechamento,
                    dia.ativo,
                ]
            );
        }

        await conexao.commit();

    } catch (error) {
        await conexao.rollback();
        throw error;

    } finally {
        conexao.release();
    }
}

async function restaurarHorarioEmpresa(empresa_id, profissional_id) {
    const [resultado] = await db.query(
        `
        DELETE FROM horarios_profissionais
        WHERE empresa_id = ?
        AND profissional_id = ?
        `,
        [empresa_id, profissional_id]
    );

    return resultado.affectedRows;
}

async function obterHorarioFuncionamento(empresa_id, profissional_id, data) {
    if (!dataValida(data)) {
        return null;
    }

    const [dataInfo] = await db.query(
        `
        SELECT DAYOFWEEK(?) AS dia_mysql
        `,
        [data]
    );

    if (dataInfo.length === 0) {
        return null;
    }

    const dia_semana = Number(dataInfo[0].dia_mysql) - 1;

    const { origem, horarios } = await obterHorariosComOrigem(
        empresa_id,
        profissional_id
    );

    const dia = horarios.find(
        (horario) => horario.dia_semana === dia_semana
    );

    if (!dia || !dia.ativo || !dia.hora_abertura || !dia.hora_fechamento) {
        return null;
    }

    return { ...dia, origem };
}

/**
 * Valida se determinado horário + duração
 * está dentro do horário de atendimento.
 *
 * Retorna:
 *
 * {
 *   valido: true,
 *   horarioFuncionamento
 * }
 *
 * ou
 *
 * {
 *   valido: false,
 *   mensagem: "..."
 * }
 */
async function validarHorarioFuncionamento({
    empresa_id,
    profissional_id,
    data,
    hora_inicio,
    duracao_minutos,
}) {
    const horaNormalizada = String(hora_inicio || "").substring(0, 5);
    const duracao = Number(duracao_minutos);

    if (!horarioValido(horaNormalizada)) {
        return {
            valido: false,
            mensagem: "Horário inválido.",
        };
    }

    if (!Number.isFinite(duracao) || duracao <= 0) {
        return {
            valido: false,
            mensagem: "Duração do serviço inválida.",
        };
    }

    const horarioFuncionamento = await obterHorarioFuncionamento(
        empresa_id,
        profissional_id,
        data
    );

    if (!horarioFuncionamento) {
        const { origem } = await obterHorariosComOrigem(
            empresa_id,
            profissional_id
        );

        return {
            valido: false,
            mensagem:
                origem === "PROFISSIONAL"
                    ? "O profissional não atende neste dia."
                    : "A empresa não possui funcionamento neste dia.",
        };
    }

    const inicioFuncionamento = converterParaMinutos(
        horarioFuncionamento.hora_abertura
    );

    const fimFuncionamento = converterParaMinutos(
        horarioFuncionamento.hora_fechamento
    );

    const inicio = converterParaMinutos(hora_inicio);

    const fim = inicio + Number(duracao_minutos);

    if (inicio < inicioFuncionamento || fim > fimFuncionamento) {
        return {
            valido: false,
            mensagem:
                `O horário escolhido está fora do horário de atendimento. ` +
                `Atendimento: ${formatarHorario(
                    inicioFuncionamento
                )} às ${formatarHorario(fimFuncionamento)}.`,
        };
    }

    return {
        valido: true,
        horarioFuncionamento,
    };
}

module.exports = {
    converterParaMinutos,
    formatarHorario,
    listarHorariosEmpresa,
    listarHorariosProfissional,
    montarSemana,
    obterHorariosComOrigem,
    validarSemana,
    salvarSemana,
    restaurarHorarioEmpresa,
    obterHorarioFuncionamento,
    validarHorarioFuncionamento,
};
