const db = require("../config/db");
const bcrypt = require("bcryptjs");
const {
    limparTexto,
    textoValido,
    emailValido,
    senhaValida,
} = require("../utils/validation");

async function criarUsuario(req, res) {
    try {
        const corpo = req.body || {};
        const nome = limparTexto(corpo.nome);
        const email = limparTexto(corpo.email).toLowerCase();
        const senha = typeof corpo.senha === "string" ? corpo.senha : "";
        const empresa_id = req.usuario.empresa_id;
        const role = "PROFISSIONAL";

        if (!empresa_id || !nome || !email || !senha) {
            return res.status(400).json({
                mensagem: "Nome, email e senha são obrigatórios."
            });
        }

        if (!textoValido(nome, 2, 150)) {
            return res.status(400).json({
                mensagem: "O nome deve ter entre 2 e 150 caracteres."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                mensagem: "Informe um email válido."
            });
        }

        if (!senhaValida(senha)) {
            return res.status(400).json({
                mensagem:
                    "A senha deve ter entre 8 e 72 caracteres, com pelo menos uma letra e um número."
            });
        }

        const [empresa] = await db.query(
            "SELECT id FROM empresas WHERE id = ?",
            [empresa_id]
        );

        if (empresa.length === 0) {
            return res.status(404).json({
                mensagem: "Empresa não encontrada."
            });
        }

        const [usuarioExistente] = await db.query(
            "SELECT id FROM usuarios WHERE LOWER(email) = ? LIMIT 1",
            [email]
        );

        if (usuarioExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const [resultado] = await db.query(
            `
            INSERT INTO usuarios
            (empresa_id, nome, email, senha, role)
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                nome,
                email,
                senhaHash,
                role
            ]
        );

        return res.status(201).json({
            mensagem: "Usuário criado com sucesso!",
            usuario: {
                id: resultado.insertId,
                empresa_id,
                nome,
                email,
                role
            }
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        console.error("ERRO AO CRIAR USUÁRIO:", error);

        return res.status(500).json({
            mensagem: "Erro ao criar usuário."
        });
    }
}

async function atualizarMeuUsuario(req, res) {
    try {
        const usuario_id = req.usuario.usuario_id;
        const empresa_id = req.usuario.empresa_id;
        const corpo = req.body || {};
        const nome = limparTexto(corpo.nome);
        const email = limparTexto(corpo.email).toLowerCase();
        const senhaAtual =
            typeof corpo.senha_atual === "string" ? corpo.senha_atual : "";

        if (!usuario_id || !empresa_id) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        if (!nome || !email) {
            return res.status(400).json({
                mensagem: "Nome e email são obrigatórios."
            });
        }

        if (!textoValido(nome, 2, 150)) {
            return res.status(400).json({
                mensagem: "O nome deve ter entre 2 e 150 caracteres."
            });
        }

        if (!emailValido(email)) {
            return res.status(400).json({
                mensagem: "Informe um email válido."
            });
        }

        const [usuarios] = await db.query(
            `
            SELECT id, email, senha
            FROM usuarios
            WHERE id = ? AND empresa_id = ?
            LIMIT 1
            `,
            [usuario_id, empresa_id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const usuarioAtual = usuarios[0];

        // Alterar o e-mail é uma operação sensível: exige a senha atual
        // para impedir sequestro de conta com um token roubado.
        if (
            email !== String(usuarioAtual.email || "").toLowerCase()
        ) {
            if (!senhaAtual) {
                return res.status(400).json({
                    mensagem:
                        "Informe sua senha atual para alterar o e-mail."
                });
            }

            const senhaConfere = await bcrypt.compare(
                senhaAtual,
                usuarioAtual.senha
            );

            if (!senhaConfere) {
                return res.status(401).json({
                    mensagem: "Senha atual incorreta."
                });
            }
        }

        const [emailExistente] = await db.query(
            `
            SELECT id
            FROM usuarios
            WHERE LOWER(email) = ?
            AND id != ?
            LIMIT 1
            `,
            [email, usuario_id]
        );

        if (emailExistente.length > 0) {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        await db.query(
            `
            UPDATE usuarios
            SET nome = ?, email = ?
            WHERE id = ? AND empresa_id = ?
            `,
            [nome, email, usuario_id, empresa_id]
        );

        return res.json({
            mensagem: "Dados da conta atualizados com sucesso.",
            usuario: {
                id: usuario_id,
                empresa_id,
                nome,
                email,
                role: req.usuario.role
            }
        });
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Este email já está cadastrado."
            });
        }

        console.error("ERRO AO ATUALIZAR CONTA DO USUÁRIO:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar os dados da conta."
        });
    }
}

async function excluirMinhaConta(req, res) {
    const usuario_id = req.usuario.usuario_id;
    const empresa_id = req.usuario.empresa_id;
    const senha = typeof req.body?.senha === "string"
        ? req.body.senha
        : "";

    if (!senha) {
        return res.status(400).json({
            mensagem: "Informe sua senha para confirmar a exclusão."
        });
    }

    let conn;

    try {
        const [usuarios] = await db.query(
            "SELECT id, senha, role FROM usuarios WHERE id = ? AND empresa_id = ? LIMIT 1",
            [usuario_id, empresa_id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: "Usuário não encontrado."
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuarios[0].senha);

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: "Senha incorreta."
            });
        }

        conn = await db.getConnection();
        await conn.beginTransaction();

        // O administrador é o dono da empresa: excluir a conta remove
        // a empresa e todos os dados vinculados a ela.
        await conn.query(
            `
            DELETE tr FROM tokens_recuperacao_senha tr
            INNER JOIN usuarios u ON u.id = tr.usuario_id
            WHERE u.empresa_id = ?
            `,
            [empresa_id]
        );
        await conn.query("DELETE FROM agendamentos WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM clientes WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM convites_profissionais WHERE empresa_id = ?", [empresa_id]);
        await conn.query(
            `
            DELETE ps FROM profissional_servicos ps
            INNER JOIN profissionais p ON p.id = ps.profissional_id
            WHERE p.empresa_id = ?
            `,
            [empresa_id]
        );
        await conn.query("DELETE FROM horarios_profissionais WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM profissionais WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM servicos WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM horarios_funcionamento WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM usuarios WHERE empresa_id = ?", [empresa_id]);
        await conn.query("DELETE FROM empresas WHERE id = ?", [empresa_id]);

        await conn.commit();

        return res.json({
            mensagem: "Conta excluída com sucesso."
        });
    } catch (error) {
        if (conn) {
            await conn.rollback();
        }

        console.error("ERRO AO EXCLUIR CONTA:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir a conta."
        });
    } finally {
        if (conn) {
            conn.release();
        }
    }
}

module.exports = {
    criarUsuario,
    atualizarMeuUsuario,
    excluirMinhaConta
};
