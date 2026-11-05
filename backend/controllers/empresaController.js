const db = require("../config/db");
const { gerarSlug } = require("../utils/slug");
const {
    limparTexto,
    textoValido,
    emailValido,
    telefoneValido,
    inteiroPositivo,
} = require("../utils/validation");

function validarDadosEmpresa(corpo) {
    const nome = limparTexto(corpo.nome);
    const slug = gerarSlug(limparTexto(corpo.slug));
    const telefone = limparTexto(corpo.telefone);
    const email = limparTexto(corpo.email).toLowerCase();

    if (!textoValido(nome, 2, 150)) {
        return { erro: "O nome deve ter entre 2 e 150 caracteres." };
    }

    if (!textoValido(slug, 2, 100)) {
        return { erro: "O identificador da empresa é inválido." };
    }

    if (telefone && !telefoneValido(telefone)) {
        return { erro: "Informe um telefone válido." };
    }

    if (email && !emailValido(email)) {
        return { erro: "Informe um e-mail válido." };
    }

    return {
        dados: {
            nome,
            slug,
            telefone: telefone || null,
            email: email || null,
        },
    };
}

async function criarEmpresa(req, res) {
    try {
        const validacao = validarDadosEmpresa(req.body || {});

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const { nome, slug, telefone, email } = validacao.dados;

        const [slugExistente] = await db.query(
            "SELECT id FROM empresas WHERE slug = ? LIMIT 1",
            [slug]
        );

        if (slugExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este identificador já está em uso."
            });
        }

        const [resultado] = await db.query(
            `
            INSERT INTO empresas (nome, slug, telefone, email)
            VALUES (?, ?, ?, ?)
            `,
            [nome, slug, telefone, email]
        );

        return res.status(201).json({
            mensagem: "Empresa criada com sucesso!",
            empresa: {
                id: resultado.insertId,
                nome,
                slug,
                telefone,
                email
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este identificador já está em uso."
            });
        }

        console.error("ERRO AO CRIAR EMPRESA:", error);

        return res.status(500).json({
            mensagem: "Erro ao criar empresa."
        });
    }
}

async function listarEmpresas(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        const [empresas] = await db.query(
            "SELECT id, nome, slug FROM empresas WHERE id = ?",
            [empresa_id]
        );

        return res.json(empresas);

    } catch (error) {
        console.error("ERRO AO LISTAR EMPRESAS:", error);

        return res.status(500).json({
            mensagem: "Erro ao listar empresas."
        });
    }
}

async function buscarEmpresaPorId(req, res) {
    try {
        const id = Number(req.params.id);
        const empresa_id = req.usuario.empresa_id;

        if (
            !inteiroPositivo(id) ||
            Number(id) !== Number(empresa_id)
        ) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const [empresas] = await db.query(
            "SELECT * FROM empresas WHERE id = ?",
            [empresa_id]
        );

        if (empresas.length === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        return res.json(empresas[0]);

    } catch (error) {
        console.error("ERRO AO BUSCAR EMPRESA:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar empresa."
        });
    }
}

async function atualizarEmpresa(req, res) {
    try {
        const id = Number(req.params.id);
        const empresa_id = req.usuario.empresa_id;

        if (
            !inteiroPositivo(id) ||
            Number(id) !== Number(empresa_id)
        ) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const validacao = validarDadosEmpresa(req.body || {});

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const { nome, slug, telefone, email } = validacao.dados;

        const [slugExistente] = await db.query(
            `
            SELECT id
            FROM empresas
            WHERE slug = ?
            AND id != ?
            LIMIT 1
            `,
            [slug, empresa_id]
        );

        if (slugExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este identificador já está em uso."
            });
        }

        const [resultado] = await db.query(
            `
            UPDATE empresas
            SET nome = ?, slug = ?, telefone = ?, email = ?
            WHERE id = ?
            `,
            [nome, slug, telefone, email, empresa_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        return res.json({
            mensagem: "Empresa atualizada com sucesso!"
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este identificador já está em uso."
            });
        }

        console.error("ERRO AO ATUALIZAR EMPRESA:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar empresa."
        });
    }
}

async function excluirEmpresa(req, res) {
    try {
        const id = Number(req.params.id);
        const empresa_id = req.usuario.empresa_id;

        if (
            !inteiroPositivo(id) ||
            Number(id) !== Number(empresa_id)
        ) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const [resultado] = await db.query(
            "DELETE FROM empresas WHERE id = ?",
            [empresa_id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        return res.json({
            mensagem: "Empresa excluída com sucesso!"
        });

    } catch (error) {
        console.error("ERRO AO EXCLUIR EMPRESA:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir empresa."
        });
    }
}

module.exports = {
    criarEmpresa,
    listarEmpresas,
    buscarEmpresaPorId,
    atualizarEmpresa,
    excluirEmpresa
};
