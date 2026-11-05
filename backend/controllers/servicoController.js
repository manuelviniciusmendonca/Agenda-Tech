const db = require("../config/db");
const {
    limparTexto,
    textoValido,
} = require("../utils/validation");

function normalizarDadosServico(corpo = {}) {
    const nome = limparTexto(corpo.nome);
    const preco = Number(corpo.preco);
    const duracao = Number(corpo.duracao_minutos);
    const intervaloBruto = corpo.intervalo_retorno_dias;
    const intervalo =
        intervaloBruto === undefined ||
        intervaloBruto === null ||
        intervaloBruto === ""
            ? null
            : Number(intervaloBruto);
    const ativo =
        corpo.ativo === undefined
            ? true
            : corpo.ativo === true ||
              corpo.ativo === 1 ||
              corpo.ativo === "1";

    if (!textoValido(nome, 2, 150)) {
        return { erro: "O nome deve ter entre 2 e 150 caracteres." };
    }

    if (!Number.isFinite(preco) || preco < 0 || preco > 99999999.99) {
        return { erro: "Informe um preço válido." };
    }

    if (!Number.isInteger(duracao) || duracao < 1 || duracao > 1440) {
        return { erro: "A duração deve ser entre 1 e 1440 minutos." };
    }

    if (
        intervalo !== null &&
        (!Number.isInteger(intervalo) || intervalo < 0 || intervalo > 3650)
    ) {
        return { erro: "O intervalo de retorno é inválido." };
    }

    return {
        dados: {
            nome,
            preco,
            duracao_minutos: duracao,
            intervalo_retorno_dias: intervalo,
            ativo,
        },
    };
}

async function criarServico(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const validacao = normalizarDadosServico(req.body || {});

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const {
            nome,
            preco,
            duracao_minutos,
            intervalo_retorno_dias,
        } = validacao.dados;

        const [resultado] = await db.query(
            `
            INSERT INTO servicos
            (
                empresa_id,
                nome,
                preco,
                duracao_minutos,
                intervalo_retorno_dias
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                nome,
                preco,
                duracao_minutos,
                intervalo_retorno_dias || null
            ]
        );

        res.status(201).json({
            mensagem: "Serviço criado com sucesso!",
            servico: {
                id: resultado.insertId,
                empresa_id,
                nome,
                preco,
                duracao_minutos,
                intervalo_retorno_dias:
                    intervalo_retorno_dias || null
            }
        });

    } catch (error) {
        console.error("ERRO AO CRIAR SERVIÇO:", error);

        res.status(500).json({
            mensagem: "Erro ao criar serviço."
        });
    }
}

async function listarServicos(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const [servicos] = await db.query(
            `
            SELECT *
            FROM servicos
            WHERE empresa_id = ?
            ORDER BY nome ASC
            `,
            [empresa_id]
        );

        res.json(servicos);

    } catch (error) {
        console.error("ERRO AO LISTAR SERVIÇOS:", error);

        res.status(500).json({
            mensagem: "Erro ao listar serviços."
        });
    }
}

async function buscarServicoPorId(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;

        const [servicos] = await db.query(
            `
            SELECT *
            FROM servicos
            WHERE id = ?
            AND empresa_id = ?
            `,
            [id, empresa_id]
        );

        if (servicos.length === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado."
            });
        }

        res.json(servicos[0]);

    } catch (error) {
        console.error("ERRO AO BUSCAR SERVIÇO:", error);

        res.status(500).json({
            mensagem: "Erro ao buscar serviço."
        });
    }
}

async function atualizarServico(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;
        const validacao = normalizarDadosServico(req.body || {});

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const {
            nome,
            preco,
            duracao_minutos,
            intervalo_retorno_dias,
            ativo,
        } = validacao.dados;

        const [resultado] = await db.query(
            `
            UPDATE servicos
            SET
                nome = ?,
                preco = ?,
                duracao_minutos = ?,
                intervalo_retorno_dias = ?,
                ativo = ?
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                nome,
                preco,
                duracao_minutos,
                intervalo_retorno_dias || null,
                ativo === undefined ? true : ativo,
                id,
                empresa_id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado."
            });
        }

        res.json({
            mensagem: "Serviço atualizado com sucesso!"
        });

    } catch (error) {
        console.error("ERRO AO ATUALIZAR SERVIÇO:", error);

        res.status(500).json({
            mensagem: "Erro ao atualizar serviço."
        });
    }
}

async function excluirServico(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;

        const [resultado] = await db.query(
            `
            DELETE FROM servicos
            WHERE id = ?
            AND empresa_id = ?
            `,
            [id, empresa_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado."
            });
        }

        res.json({
            mensagem: "Serviço excluído com sucesso!"
        });

    } catch (error) {
        console.error("ERRO AO EXCLUIR SERVIÇO:", error);

        res.status(500).json({
            mensagem: "Erro ao excluir serviço."
        });
    }
}

module.exports = {
    criarServico,
    listarServicos,
    buscarServicoPorId,
    atualizarServico,
    excluirServico
};