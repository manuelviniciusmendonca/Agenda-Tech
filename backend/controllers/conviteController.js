const db = require("../config/db");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { obterHorariosComOrigem } = require("../services/horarioService");
const {
    limparTexto,
    emailValido,
    senhaValida,
    inteiroPositivo,
    tokenPublicoValido,
} = require("../utils/validation");

async function criarConvite(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const profissional_id = Number(req.body?.profissional_id);
        const email = limparTexto(req.body?.email).toLowerCase();

        if (!inteiroPositivo(profissional_id) || !emailValido(email)) {
            return res.status(400).json({
                mensagem:
                    "Informe um profissional válido e um email válido."
            });
        }

        const [profissionais] = await db.query(
            `
            SELECT
                id,
                nome,
                usuario_id
            FROM profissionais
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                profissional_id,
                empresa_id
            ]
        );

        if (profissionais.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Profissional não encontrado."
            });
        }

        const emailNormalizado = email.trim().toLowerCase();

        const token = crypto
            .randomBytes(32)
            .toString("hex");

        const expiracao = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        );

        const frontendUrl = (
            process.env.FRONTEND_URL || "http://localhost:5173"
        ).replace(/\/+$/, "");

        const linkConvite = `${frontendUrl}/convite/${token}`;

        await db.query(
            `
            UPDATE convites_profissionais
            SET usado = TRUE
            WHERE profissional_id = ?
            AND empresa_id = ?
            AND usado = FALSE
            `,
            [
                profissional_id,
                empresa_id
            ]
        );

        await db.query(
            `
            INSERT INTO convites_profissionais
            (
                empresa_id,
                profissional_id,
                email,
                token,
                expiracao
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                profissional_id,
                emailNormalizado,
                token,
                expiracao
            ]
        );

        await db.query(
            `
            UPDATE profissionais
            SET email = ?
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                emailNormalizado,
                profissional_id,
                empresa_id
            ]
        );

        res.status(201).json({
            mensagem:
                "Convite criado com sucesso.",

            convite: {
                profissional_id,
                email: emailNormalizado,
                expiracao,
                token,
                link_convite: linkConvite
            }
        });

    } catch (error) {
        console.error(
            "ERRO AO CRIAR CONVITE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao criar convite."
        });
    }
}

async function validarConvite(req, res) {
    try {
        const token = limparTexto(req.params.token);

        if (!tokenPublicoValido(token)) {
            return res.status(404).json({
                mensagem:
                    "Convite não encontrado."
            });
        }

        const [convites] = await db.query(
            `
            SELECT
                cp.id,
                cp.email,
                cp.expiracao,
                cp.usado,

                p.id AS profissional_id,
                p.nome AS profissional_nome,

                e.id AS empresa_id,
                e.nome AS empresa_nome

            FROM convites_profissionais cp

            INNER JOIN profissionais p
                ON p.id = cp.profissional_id

            INNER JOIN empresas e
                ON e.id = cp.empresa_id

            WHERE cp.token = ?
            `,
            [token]
        );

        if (convites.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Convite não encontrado."
            });
        }

        const convite = convites[0];

        if (convite.usado) {
            return res.status(400).json({
                mensagem:
                    "Este convite já foi utilizado."
            });
        }

        if (
            new Date(convite.expiracao) < new Date()
        ) {
            return res.status(400).json({
                mensagem:
                    "Este convite expirou."
            });
        }

        const horarios = await obterHorariosComOrigem(
            convite.empresa_id,
            convite.profissional_id
        );

        res.json({
            valido: true,
            convite: {
                email: convite.email,
                profissional_id:
                    convite.profissional_id,
                profissional_nome:
                    convite.profissional_nome,
                empresa_id:
                    convite.empresa_id,
                empresa_nome:
                    convite.empresa_nome,
                expiracao:
                    convite.expiracao,
                horarios: horarios.horarios,
                horarios_origem: horarios.origem
            }
        });

    } catch (error) {
        console.error(
            "ERRO AO VALIDAR CONVITE:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao validar convite."
        });
    }
}

async function aceitarConvite(req, res) {
    const token = limparTexto(req.body?.token);
    const senha = typeof req.body?.senha === "string" ? req.body.senha : "";

    if (!token || !senha) {
        return res.status(400).json({
            mensagem:
                "Token e senha são obrigatórios."
        });
    }

    if (!tokenPublicoValido(token)) {
        return res.status(400).json({
            mensagem:
                "Convite inválido, expirado ou já utilizado."
        });
    }

    if (!senhaValida(senha)) {
        return res.status(400).json({
            mensagem:
                "A senha deve ter entre 8 e 72 caracteres, com pelo menos uma letra e um número."
        });
    }

    let conexao;
    let transacaoIniciada = false;

    try {
        conexao = await db.getConnection();
        await conexao.beginTransaction();
        transacaoIniciada = true;

        const [convites] = await conexao.query(
            `
            SELECT
                cp.id,
                cp.empresa_id,
                cp.profissional_id,
                cp.email,
                cp.expiracao,
                p.nome AS profissional_nome,
                p.usuario_id
            FROM convites_profissionais cp
            INNER JOIN profissionais p
                ON p.id = cp.profissional_id
                AND p.empresa_id = cp.empresa_id
            WHERE cp.token = ?
            AND cp.usado = FALSE
            AND cp.expiracao > NOW()
            LIMIT 1
            FOR UPDATE
            `,
            [token]
        );

        if (convites.length === 0) {
            await conexao.rollback();
            transacaoIniciada = false;
            return res.status(400).json({
                mensagem:
                    "Convite inválido, expirado ou já utilizado."
            });
        }

        const convite = convites[0];
        const senhaHash = await bcrypt.hash(senha, 10);

        // Profissional já possui usuário vinculado: apenas redefine a senha.
        if (convite.usuario_id) {
            await conexao.query(
                `
                UPDATE usuarios
                SET senha = ?
                WHERE id = ?
                AND empresa_id = ?
                `,
                [senhaHash, convite.usuario_id, convite.empresa_id]
            );

            await conexao.query(
                `
                UPDATE convites_profissionais
                SET usado = TRUE
                WHERE id = ?
                AND empresa_id = ?
                AND usado = FALSE
                `,
                [convite.id, convite.empresa_id]
            );

            await conexao.commit();
            transacaoIniciada = false;

            return res.status(200).json({
                mensagem:
                    "Convite aceito e senha atualizada com sucesso.",
                usuario: {
                    id: convite.usuario_id,
                    empresa_id: convite.empresa_id,
                    nome: convite.profissional_nome,
                    email: convite.email,
                    role: "PROFISSIONAL"
                }
            });
        }

        const [usuariosExistentes] = await conexao.query(
            `
            SELECT id, role
            FROM usuarios
            WHERE email = ?
            AND empresa_id = ?
            LIMIT 1
            `,
            [convite.email, convite.empresa_id]
        );

        let usuarioId;

        if (usuariosExistentes.length > 0) {
            const usuarioExistente = usuariosExistentes[0];

            if (usuarioExistente.role !== "PROFISSIONAL") {
                await conexao.rollback();
                transacaoIniciada = false;
                return res.status(409).json({
                    mensagem:
                        "Este e-mail pertence a um usuário que não é profissional."
                });
            }

            const [vinculos] = await conexao.query(
                `
                SELECT id
                FROM profissionais
                WHERE usuario_id = ?
                AND empresa_id = ?
                LIMIT 1
                `,
                [usuarioExistente.id, convite.empresa_id]
            );

            if (
                vinculos.length > 0 &&
                vinculos[0].id !== convite.profissional_id
            ) {
                await conexao.rollback();
                transacaoIniciada = false;
                return res.status(409).json({
                    mensagem:
                        "Este usuário já está vinculado a outro profissional."
                });
            }

            await conexao.query(
                `
                UPDATE usuarios
                SET senha = ?
                WHERE id = ?
                AND empresa_id = ?
                `,
                [senhaHash, usuarioExistente.id, convite.empresa_id]
            );

            usuarioId = usuarioExistente.id;
        } else {
            const [novoUsuario] = await conexao.query(
                `
                INSERT INTO usuarios
                (
                    empresa_id,
                    nome,
                    email,
                    senha,
                    role
                )
                VALUES (?, ?, ?, ?, 'PROFISSIONAL')
                `,
                [
                    convite.empresa_id,
                    convite.profissional_nome,
                    convite.email,
                    senhaHash
                ]
            );

            usuarioId = novoUsuario.insertId;
        }

        const [vinculo] = await conexao.query(
            `
            UPDATE profissionais
            SET usuario_id = ?
            WHERE id = ?
            AND empresa_id = ?
            AND usuario_id IS NULL
            `,
            [
                usuarioId,
                convite.profissional_id,
                convite.empresa_id
            ]
        );

        if (vinculo.affectedRows !== 1) {
            await conexao.rollback();
            transacaoIniciada = false;
            return res.status(409).json({
                mensagem:
                    "Não foi possível vincular o usuário ao profissional."
            });
        }

        await conexao.query(
            `
            UPDATE convites_profissionais
            SET usado = TRUE
            WHERE id = ?
            AND empresa_id = ?
            AND usado = FALSE
            `,
            [
                convite.id,
                convite.empresa_id
            ]
        );

        await conexao.commit();
        transacaoIniciada = false;

        return res.status(201).json({
            mensagem:
                "Convite aceito e usuário criado com sucesso.",
            usuario: {
                id: usuarioId,
                empresa_id: convite.empresa_id,
                nome: convite.profissional_nome,
                email: convite.email,
                role: "PROFISSIONAL"
            }
        });

    } catch (error) {
        if (conexao && transacaoIniciada) {
            await conexao.rollback();
        }

        console.error(
            "ERRO AO ACEITAR CONVITE:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao aceitar convite."
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
}

module.exports = {
    criarConvite,
    validarConvite,
    aceitarConvite
};