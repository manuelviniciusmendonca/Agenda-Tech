const db = require("../config/db");
const {
    limparTexto,
    textoValido,
    emailValido,
    telefoneValido,
} = require("../utils/validation");

async function obterProfissionalDoUsuario(
    usuario_id,
    empresa_id
) {
    const [profissionais] = await db.query(
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

    if (profissionais.length === 0) {
        return null;
    }

    return profissionais[0].id;
}

async function criarCliente(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        const {
            nome: nomeBruto,
            telefone: telefoneBruto,
            email: emailBruto
        } = req.body || {};

        const nome = limparTexto(nomeBruto);
        const telefone = limparTexto(telefoneBruto);
        const email = limparTexto(emailBruto).toLowerCase();

        if (!textoValido(nome, 2, 150) || !telefoneValido(telefone)) {
            return res.status(400).json({
                mensagem:
                    "Informe um nome válido e um telefone válido."
            });
        }

        if (email && !emailValido(email)) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido."
            });
        }

        const [clienteExistente] =
            await db.query(
                `
                SELECT id
                FROM clientes
                WHERE empresa_id = ?
                AND telefone = ?
                `,
                [
                    empresa_id,
                    telefone
                ]
            );

        if (clienteExistente.length > 0) {
            return res.status(409).json({
                mensagem:
                    "Já existe um cliente com este telefone."
            });
        }

        const [resultado] =
            await db.query(
                `
                INSERT INTO clientes
                (
                    empresa_id,
                    nome,
                    telefone,
                    email
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    empresa_id,
                    nome,
                    telefone,
                    email || null
                ]
            );

        res.status(201).json({
            mensagem:
                "Cliente criado com sucesso!",

            cliente: {
                id: resultado.insertId,
                empresa_id,
                nome,
                telefone,
                email: email || null
            }
        });

    } catch (error) {
        console.error(
            "ERRO AO CRIAR CLIENTE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao criar cliente."
        });
    }
}

async function listarClientes(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        let sql = `
            SELECT DISTINCT
                c.id,
                c.empresa_id,
                c.nome,
                c.telefone,
                c.email,
                c.created_at,
                c.updated_at
            FROM clientes c
        `;

        const parametros = [
            empresa_id
        ];

        sql += `
            WHERE c.empresa_id = ?
        `;

        if (
            req.usuario.role ===
            "PROFISSIONAL"
        ) {
            const profissional_id =
                await obterProfissionalDoUsuario(
                    req.usuario.usuario_id,
                    empresa_id
                );

            if (!profissional_id) {
                return res.status(403).json({
                    mensagem:
                        "Usuário profissional não está vinculado a um profissional."
                });
            }

            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM agendamentos a
                    WHERE a.cliente_id = c.id
                    AND a.empresa_id = c.empresa_id
                    AND a.profissional_id = ?
                )
            `;

            parametros.push(
                profissional_id
            );
        }

        sql += `
            ORDER BY c.nome ASC
        `;

        const [clientes] =
            await db.query(
                sql,
                parametros
            );

        res.json(clientes);

    } catch (error) {
        console.error(
            "ERRO AO LISTAR CLIENTES:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao listar clientes."
        });
    }
}

async function buscarClientePorId(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        const { id } = req.params;

        let sql = `
            SELECT
                c.id,
                c.empresa_id,
                c.nome,
                c.telefone,
                c.email,
                c.created_at,
                c.updated_at
            FROM clientes c
            WHERE c.id = ?
            AND c.empresa_id = ?
        `;

        const parametros = [
            id,
            empresa_id
        ];

        if (
            req.usuario.role ===
            "PROFISSIONAL"
        ) {
            const profissional_id =
                await obterProfissionalDoUsuario(
                    req.usuario.usuario_id,
                    empresa_id
                );

            if (!profissional_id) {
                return res.status(403).json({
                    mensagem:
                        "Usuário profissional não está vinculado a um profissional."
                });
            }

            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM agendamentos a
                    WHERE a.cliente_id = c.id
                    AND a.empresa_id = c.empresa_id
                    AND a.profissional_id = ?
                )
            `;

            parametros.push(
                profissional_id
            );
        }

        const [clientes] =
            await db.query(
                sql,
                parametros
            );

        if (clientes.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Cliente não encontrado."
            });
        }

        res.json(clientes[0]);

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR CLIENTE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao buscar cliente."
        });
    }
}

async function atualizarCliente(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        const { id } = req.params;

        const {
            nome: nomeBruto,
            telefone: telefoneBruto,
            email: emailBruto
        } = req.body || {};

        const nome = limparTexto(nomeBruto);
        const telefone = limparTexto(telefoneBruto);
        const email = limparTexto(emailBruto).toLowerCase();

        if (!textoValido(nome, 2, 150) || !telefoneValido(telefone)) {
            return res.status(400).json({
                mensagem:
                    "Informe um nome válido e um telefone válido."
            });
        }

        if (email && !emailValido(email)) {
            return res.status(400).json({
                mensagem: "Informe um e-mail válido."
            });
        }

        let sqlVerificacao = `
            SELECT id
            FROM clientes
            WHERE id = ?
            AND empresa_id = ?
        `;

        const parametrosVerificacao = [
            id,
            empresa_id
        ];

        if (
            req.usuario.role ===
            "PROFISSIONAL"
        ) {
            const profissional_id =
                await obterProfissionalDoUsuario(
                    req.usuario.usuario_id,
                    empresa_id
                );

            if (!profissional_id) {
                return res.status(403).json({
                    mensagem:
                        "Usuário profissional não está vinculado a um profissional."
                });
            }

            sqlVerificacao += `
                AND EXISTS (
                    SELECT 1
                    FROM agendamentos a
                    WHERE a.cliente_id = ?
                    AND a.empresa_id = ?
                    AND a.profissional_id = ?
                )
            `;

            parametrosVerificacao.push(
                id,
                empresa_id,
                profissional_id
            );
        }

        const [clientes] =
            await db.query(
                sqlVerificacao,
                parametrosVerificacao
            );

        if (clientes.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Cliente não encontrado."
            });
        }

        const [clienteComMesmoTelefone] =
            await db.query(
                `
                SELECT id
                FROM clientes
                WHERE empresa_id = ?
                AND telefone = ?
                AND id != ?
                `,
                [
                    empresa_id,
                    telefone,
                    id
                ]
            );

        if (
            clienteComMesmoTelefone.length > 0
        ) {
            return res.status(409).json({
                mensagem:
                    "Já existe outro cliente com este telefone."
            });
        }

        await db.query(
            `
            UPDATE clientes
            SET
                nome = ?,
                telefone = ?,
                email = ?
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                nome,
                telefone,
                email || null,
                id,
                empresa_id
            ]
        );

        res.json({
            mensagem:
                "Cliente atualizado com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO ATUALIZAR CLIENTE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao atualizar cliente."
        });
    }
}

async function excluirCliente(req, res) {
    try {
        const empresa_id =
            req.usuario.empresa_id;

        const { id } = req.params;

        if (
            req.usuario.role ===
            "PROFISSIONAL"
        ) {
            return res.status(403).json({
                mensagem:
                    "Profissionais não possuem permissão para excluir clientes."
            });
        }

        const [resultado] =
            await db.query(
                `
                DELETE FROM clientes
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
                mensagem:
                    "Cliente não encontrado."
            });
        }

        res.json({
            mensagem:
                "Cliente excluído com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO EXCLUIR CLIENTE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao excluir cliente."
        });
    }
}

module.exports = {
    criarCliente,
    listarClientes,
    buscarClientePorId,
    atualizarCliente,
    excluirCliente
};