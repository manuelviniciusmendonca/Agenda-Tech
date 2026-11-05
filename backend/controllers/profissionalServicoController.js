const db = require("../config/db");
const { inteiroPositivo } = require("../utils/validation");

async function adicionarServicoAoProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const profissional_id = Number(req.body?.profissional_id);
        const servico_id = Number(req.body?.servico_id);

        if (!inteiroPositivo(profissional_id) || !inteiroPositivo(servico_id)) {
            return res.status(400).json({
                mensagem: "Profissional e serviço são obrigatórios."
            });
        }

        // Verifica se o profissional pertence à empresa
        const [profissionais] = await db.query(
            `
            SELECT id
            FROM profissionais
            WHERE id = ?
            AND empresa_id = ?
            `,
            [profissional_id, empresa_id]
        );

        if (profissionais.length === 0) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado."
            });
        }

        // Verifica se o serviço pertence à empresa
        const [servicos] = await db.query(
            `
            SELECT id
            FROM servicos
            WHERE id = ?
            AND empresa_id = ?
            `,
            [servico_id, empresa_id]
        );

        if (servicos.length === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado."
            });
        }

        // Verifica se a relação já existe
        const [relacaoExistente] = await db.query(
            `
            SELECT *
            FROM profissional_servicos
            WHERE profissional_id = ?
            AND servico_id = ?
            `,
            [profissional_id, servico_id]
        );

        if (relacaoExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este serviço já está associado ao profissional."
            });
        }

        await db.query(
            `
            INSERT INTO profissional_servicos
            (profissional_id, servico_id)
            VALUES (?, ?)
            `,
            [profissional_id, servico_id]
        );

        res.status(201).json({
            mensagem: "Serviço associado ao profissional com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO ASSOCIAR SERVIÇO AO PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao associar serviço ao profissional."
        });
    }
}

async function listarServicosDoProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const profissional_id = Number(req.params.profissional_id);

        if (!inteiroPositivo(profissional_id)) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado."
            });
        }

        if (req.usuario.role === "PROFISSIONAL") {
            const [vinculos] = await db.query(
                `
                SELECT id
                FROM profissionais
                WHERE usuario_id = ?
                AND empresa_id = ?
                AND id = ?
                `,
                [req.usuario.usuario_id, empresa_id, profissional_id]
            );

            if (vinculos.length === 0) {
                return res.status(404).json({
                    mensagem: "Profissional não encontrado."
                });
            }
        }

        const [profissionais] = await db.query(
            `
            SELECT id
            FROM profissionais
            WHERE id = ?
            AND empresa_id = ?
            `,
            [profissional_id, empresa_id]
        );

        if (profissionais.length === 0) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado."
            });
        }

        const [servicos] = await db.query(
            `
            SELECT
                s.id,
                s.nome,
                s.preco,
                s.duracao_minutos,
                s.intervalo_retorno_dias,
                s.ativo
            FROM profissional_servicos ps
            INNER JOIN servicos s
                ON s.id = ps.servico_id
            WHERE ps.profissional_id = ?
            AND s.empresa_id = ?
            ORDER BY s.nome ASC
            `,
            [profissional_id, empresa_id]
        );

        res.json(servicos);

    } catch (error) {
        console.error(
            "ERRO AO LISTAR SERVIÇOS DO PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao listar serviços do profissional."
        });
    }
}

async function removerServicoDoProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const profissional_id = Number(req.body?.profissional_id);
        const servico_id = Number(req.body?.servico_id);

        if (!inteiroPositivo(profissional_id) || !inteiroPositivo(servico_id)) {
            return res.status(400).json({
                mensagem: "Profissional e serviço são obrigatórios."
            });
        }

        const [resultado] = await db.query(
            `
            DELETE ps
            FROM profissional_servicos ps
            INNER JOIN profissionais p
                ON p.id = ps.profissional_id
            INNER JOIN servicos s
                ON s.id = ps.servico_id
            WHERE ps.profissional_id = ?
            AND ps.servico_id = ?
            AND p.empresa_id = ?
            AND s.empresa_id = ?
            `,
            [
                profissional_id,
                servico_id,
                empresa_id,
                empresa_id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Associação não encontrada."
            });
        }

        res.json({
            mensagem: "Serviço removido do profissional com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO REMOVER SERVIÇO DO PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao remover serviço do profissional."
        });
    }
}

module.exports = {
    adicionarServicoAoProfissional,
    listarServicosDoProfissional,
    removerServicoDoProfissional
};