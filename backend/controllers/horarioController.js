const db = require("../config/db");
const { converterParaMinutos } = require("../services/horarioService");
const { horaValida, inteiroPositivo } = require("../utils/validation");

function normalizarBooleano(valor) {
    return valor === true || valor === 1 || valor === "1";
}

function horarioValido(valor) {
    return horaValida(valor);
}

async function criarOuAtualizarHorario(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const {
            dia_semana,
            hora_abertura,
            hora_fechamento,
            ativo
        } = req.body;

        const dia = Number(dia_semana);

        if (!Number.isInteger(dia) || dia < 0 || dia > 6) {
            return res.status(400).json({
                mensagem: "Dia da semana deve estar entre 0 e 6."
            });
        }

        const ativoDia =
            ativo === undefined ? true : normalizarBooleano(ativo);

        if (!ativoDia) {
            await db.query(
                `
                INSERT INTO horarios_funcionamento
                    (empresa_id, dia_semana, hora_abertura, hora_fechamento, ativo)
                VALUES (?, ?, NULL, NULL, FALSE)
                ON DUPLICATE KEY UPDATE
                    hora_abertura = NULL,
                    hora_fechamento = NULL,
                    ativo = FALSE
                `,
                [empresa_id, dia]
            );

            return res.json({
                mensagem: "Dia marcado como fechado."
            });
        }

        if (
            !horarioValido(hora_abertura) ||
            !horarioValido(hora_fechamento)
        ) {
            return res.status(400).json({
                mensagem:
                    "Informe a hora de abertura e de fechamento no formato HH:MM."
            });
        }

        if (
            converterParaMinutos(hora_abertura) >=
            converterParaMinutos(hora_fechamento)
        ) {
            return res.status(400).json({
                mensagem:
                    "O horário de fechamento deve ser depois do horário de abertura."
            });
        }

        await db.query(
            `
            INSERT INTO horarios_funcionamento
                (empresa_id, dia_semana, hora_abertura, hora_fechamento, ativo)
            VALUES (?, ?, ?, ?, TRUE)
            ON DUPLICATE KEY UPDATE
                hora_abertura = VALUES(hora_abertura),
                hora_fechamento = VALUES(hora_fechamento),
                ativo = TRUE
            `,
            [
                empresa_id,
                dia,
                hora_abertura,
                hora_fechamento
            ]
        );

        return res.json({
            mensagem: "Horário salvo com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO CRIAR/ATUALIZAR HORÁRIO:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao salvar horário."
        });
    }
}

async function listarHorarios(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const [horarios] = await db.query(
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

        res.json(horarios);

    } catch (error) {
        console.error(
            "ERRO AO LISTAR HORÁRIOS:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao listar horários."
        });
    }
}

async function excluirHorario(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const id = Number(req.params.id);

        if (!inteiroPositivo(id)) {
            return res.status(404).json({
                mensagem: "Horário não encontrado."
            });
        }

        const [resultado] = await db.query(
            `
            DELETE FROM horarios_funcionamento
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                id,
                empresa_id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Horário não encontrado."
            });
        }

        res.json({
            mensagem: "Horário excluído com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO EXCLUIR HORÁRIO:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao excluir horário."
        });
    }
}

module.exports = {
    criarOuAtualizarHorario,
    listarHorarios,
    excluirHorario
};