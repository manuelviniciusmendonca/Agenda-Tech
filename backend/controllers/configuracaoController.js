const db = require("../config/db");
const { gerarSlug } = require("../utils/slug");

const limitesTexto = {
    nome: 150,
    slug: 150,
    telefone: 20,
    email: 150,
    endereco: 255,
    instagram: 150
};

function validarBooleano(valor) {
    return (
        valor === true ||
        valor === false ||
        valor === 0 ||
        valor === 1 ||
        valor === "0" ||
        valor === "1"
    );
}

function normalizarBooleano(valor) {
    return valor === true || valor === 1 || valor === "1";
}

async function buscarConfiguracoes(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

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
                permitir_reagendamento,
                created_at,
                updated_at
            FROM empresas
            WHERE id = ?
            `,
            [empresa_id]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        res.json(empresas[0]);

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR CONFIGURAÇÕES:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao buscar configurações."
        });
    }
}

async function atualizarConfiguracoes(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const dados = req.body;

        if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
            return res.status(400).json({
                mensagem: "Os dados das configurações são inválidos."
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
            WHERE id = ?
            `,
            [empresa_id]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const atual = empresas[0];
        const camposTexto = [
            "nome",
            "slug",
            "telefone",
            "email",
            "descricao",
            "endereco",
            "instagram"
        ];
        const valores = { ...atual };

        for (const campo of camposTexto) {
            if (dados[campo] === undefined) continue;

            if (dados[campo] !== null && typeof dados[campo] !== "string") {
                return res.status(400).json({
                    mensagem: `O campo ${campo} deve ser um texto válido.`
                });
            }

            let valor = typeof dados[campo] === "string"
                ? dados[campo].trim()
                : null;

            // Normaliza o slug
            if (campo === "slug" && valor) {
                valor = gerarSlug(valor);
            }

            if (
                limitesTexto[campo] &&
                valor !== null &&
                valor.length > limitesTexto[campo]
            ) {
                return res.status(400).json({
                    mensagem: `O campo ${campo} deve ter no máximo ${limitesTexto[campo]} caracteres.`
                });
            }

            if (
                campo === "descricao" &&
                valor !== null &&
                Buffer.byteLength(valor, "utf8") > 65535
            ) {
                return res.status(400).json({
                    mensagem: "A descrição excede o limite permitido."
                });
            }

            valores[campo] = valor || null;
        }

        if (typeof valores.nome !== "string" || !valores.nome.trim()) {
            return res.status(400).json({
                mensagem: "O nome da empresa é obrigatório."
            });
        }

        if (!valores.slug) {
            return res.status(400).json({
                mensagem: "O identificador da empresa não pode ficar vazio."
            });
        }

        if (
            valores.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valores.email)
        ) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido."
            });
        }

        if (dados.antecedencia_minutos !== undefined) {
            const antecedencia = Number(dados.antecedencia_minutos);

            if (
                !Number.isInteger(antecedencia) ||
                antecedencia < 0 ||
                antecedencia > 2147483647
            ) {
                return res.status(400).json({
                    mensagem: "A antecedência deve ser um número inteiro maior ou igual a zero."
                });
            }

            valores.antecedencia_minutos = antecedencia;
        }

        for (const campo of [
            "agendamento_online",
            "permitir_cancelamento",
            "permitir_reagendamento"
        ]) {
            if (dados[campo] === undefined) continue;

            if (!validarBooleano(dados[campo])) {
                return res.status(400).json({
                    mensagem: `O campo ${campo} deve ser verdadeiro ou falso.`
                });
            }

            valores[campo] = normalizarBooleano(dados[campo]);
        }

        if (
            valores.slug !== atual.slug
        ) {
            const [slugExistente] = await db.query(
                `
                SELECT id
                FROM empresas
                WHERE slug = ?
                AND id != ?
                `,
                [valores.slug, empresa_id]
            );

            if (slugExistente.length > 0) {
                return res.status(409).json({
                    mensagem: "Este slug já está sendo utilizado."
                });
            }
        }

        await db.query(
            `
            UPDATE empresas
            SET
                nome = ?,
                slug = ?,
                telefone = ?,
                email = ?,
                descricao = ?,
                endereco = ?,
                instagram = ?,
                agendamento_online = ?,
                antecedencia_minutos = ?,
                permitir_cancelamento = ?,
                permitir_reagendamento = ?
            WHERE id = ?
            `,
            [
                valores.nome,
                valores.slug,
                valores.telefone,
                valores.email,
                valores.descricao,
                valores.endereco,
                valores.instagram,
                valores.agendamento_online,
                valores.antecedencia_minutos,
                valores.permitir_cancelamento,
                valores.permitir_reagendamento,
                empresa_id
            ]
        );

        const [atualizadas] = await db.query(
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
            WHERE id = ?
            `,
            [empresa_id]
        );

        res.json({
            mensagem: "Configurações atualizadas com sucesso!",
            configuracoes: atualizadas[0]
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este identificador já está sendo utilizado."
            });
        }

        console.error(
            "ERRO AO ATUALIZAR CONFIGURAÇÕES:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao atualizar configurações."
        });
    }
}

module.exports = {
    buscarConfiguracoes,
    atualizarConfiguracoes
};