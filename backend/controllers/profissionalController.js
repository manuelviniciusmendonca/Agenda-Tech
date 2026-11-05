const db = require("../config/db");
const {
    limparTexto,
    textoValido,
    emailValido,
    telefoneValido,
} = require("../utils/validation");

function normalizarDadosProfissional(corpo = {}) {
    const nome = limparTexto(corpo.nome);
    const telefone = limparTexto(corpo.telefone);
    const email = limparTexto(corpo.email).toLowerCase();
    const ativo =
        corpo.ativo === undefined
            ? true
            : corpo.ativo === true ||
              corpo.ativo === 1 ||
              corpo.ativo === "1";

    if (!textoValido(nome, 2, 150)) {
        return { erro: "O nome deve ter entre 2 e 150 caracteres." };
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
            telefone: telefone || null,
            email: email || null,
            ativo,
        },
    };
}

async function criarProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const usuario_id = req.usuario.usuario_id;
        const corpo = req.body || {};
        const vincular_usuario =
            corpo.vincular_usuario === true ||
            corpo.vincular_usuario === 1 ||
            corpo.vincular_usuario === "1";
        const validacao = normalizarDadosProfissional(corpo);

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const { nome, telefone, email, ativo } = validacao.dados;

        if (vincular_usuario) {
            const [profissionalExistente] = await db.query(
                "SELECT id FROM profissionais WHERE usuario_id = ? AND empresa_id = ?",
                [usuario_id, empresa_id]
            );

            if (profissionalExistente.length > 0) {
                return res.status(409).json({
                    mensagem: "Você já possui um perfil profissional cadastrado."
                });
            }
        }

        const [resultado] = await db.query(
            `
            INSERT INTO profissionais
            (
                empresa_id,
                usuario_id,
                nome,
                telefone,
                email,
                ativo
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                vincular_usuario ? usuario_id : null,
                nome,
                telefone || null,
                email || null,
                ativo === undefined ? true : ativo
            ]
        );

        res.status(201).json({
            mensagem:
                "Profissional criado com sucesso!",
            profissional: {
                id: resultado.insertId,
                empresa_id,
                usuario_id: vincular_usuario ? usuario_id : null,
                nome,
                telefone: telefone || null,
                email: email || null,
                ativo:
                    ativo === undefined
                        ? true
                        : ativo
            }
        });

    } catch (error) {
        console.error(
            "ERRO AO CRIAR PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao criar profissional."
        });
    }
}

async function listarProfissionais(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;

        let filtroUsuario = "";
        const parametros = [empresa_id];

        if (req.usuario.role === "PROFISSIONAL") {
            filtroUsuario = "AND usuario_id = ?";
            parametros.push(req.usuario.usuario_id);
        }

        const [profissionais] = await db.query(
            `
            SELECT
                id,
                nome,
                telefone,
                email,
                usuario_id,
                ativo,
                created_at,
                updated_at
            FROM profissionais
            WHERE empresa_id = ?
            ${filtroUsuario}
            ORDER BY nome ASC
            `,
            parametros
        );

        res.json(profissionais);

    } catch (error) {
        console.error(
            "ERRO AO LISTAR PROFISSIONAIS:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao listar profissionais."
        });
    }
}

async function buscarProfissionalPorId(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;

        let filtroUsuario = "";
        const parametros = [id, empresa_id];

        if (req.usuario.role === "PROFISSIONAL") {
            filtroUsuario = "AND usuario_id = ?";
            parametros.push(req.usuario.usuario_id);
        }

        const [profissionais] = await db.query(
            `
            SELECT
                id,
                nome,
                telefone,
                email,
                usuario_id,
                ativo,
                created_at,
                updated_at
            FROM profissionais
            WHERE id = ?
            AND empresa_id = ?
            ${filtroUsuario}
            `,
            parametros
        );

        if (profissionais.length === 0) {
            return res.status(404).json({
                mensagem:
                    "Profissional não encontrado."
            });
        }

        res.json(profissionais[0]);

    } catch (error) {
        console.error(
            "ERRO AO BUSCAR PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao buscar profissional."
        });
    }
}

async function atualizarProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;
        const validacao = normalizarDadosProfissional(req.body || {});

        if (validacao.erro) {
            return res.status(400).json({
                mensagem: validacao.erro
            });
        }

        const { nome, telefone, email, ativo } = validacao.dados;

        const [resultado] = await db.query(
            `
            UPDATE profissionais
            SET
                nome = ?,
                telefone = ?,
                email = ?,
                ativo = ?
            WHERE id = ?
            AND empresa_id = ?
            `,
            [
                nome,
                telefone || null,
                email || null,
                ativo === undefined
                    ? true
                    : ativo,
                id,
                empresa_id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem:
                    "Profissional não encontrado."
            });
        }

        res.json({
            mensagem:
                "Profissional atualizado com sucesso!"
        });

    } catch (error) {
        console.error(
            "ERRO AO ATUALIZAR PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem:
                "Erro ao atualizar profissional."
        });
    }
}

async function excluirProfissional(req, res) {
    try {
        const empresa_id = req.usuario.empresa_id;
        const { id } = req.params;

        const conn = await db.getConnection();

        try {
            await conn.beginTransaction();

            const [profissional] = await conn.query(
                "SELECT usuario_id FROM profissionais WHERE id = ? AND empresa_id = ?",
                [id, empresa_id]
            );

            if (profissional.length === 0) {
                await conn.rollback();
                conn.release();
                return res.status(404).json({
                    mensagem: "Profissional não encontrado."
                });
            }

            const usuario_id = profissional[0].usuario_id;

            await conn.query(
                "DELETE FROM profissional_servicos WHERE profissional_id = ?",
                [id]
            );

            await conn.query(
                "DELETE FROM convites_profissionais WHERE profissional_id = ?",
                [id]
            );

            await conn.query(
                "DELETE FROM agendamentos WHERE profissional_id = ?",
                [id]
            );

            await conn.query(
                "DELETE FROM profissionais WHERE id = ? AND empresa_id = ?",
                [id, empresa_id]
            );

            // A conta do próprio administrador nunca é apagada aqui:
            // ele apenas deixa de ser profissional. A exclusão da conta
            // é feita em Configurações.
            const ehProprioUsuario =
                usuario_id &&
                Number(usuario_id) === Number(req.usuario.usuario_id);

            if (usuario_id && !ehProprioUsuario) {
                await conn.query(
                    "DELETE FROM tokens_recuperacao_senha WHERE usuario_id = ?",
                    [usuario_id]
                );

                await conn.query(
                    "DELETE FROM usuarios WHERE id = ? AND empresa_id = ? AND role <> 'ADMIN'",
                    [usuario_id, empresa_id]
                );
            }

            await conn.commit();
            conn.release();

            res.json({
                mensagem: ehProprioUsuario
                    ? "Você foi removido da lista de profissionais."
                    : "Profissional excluído com sucesso!"
            });

        } catch (error) {
            await conn.rollback();
            conn.release();
            throw error;
        }

    } catch (error) {
        console.error(
            "ERRO AO EXCLUIR PROFISSIONAL:",
            error
        );

        res.status(500).json({
            mensagem: "Erro ao excluir profissional."
        });
    }
}

module.exports = {
    criarProfissional,
    listarProfissionais,
    buscarProfissionalPorId,
    atualizarProfissional,
    excluirProfissional
};