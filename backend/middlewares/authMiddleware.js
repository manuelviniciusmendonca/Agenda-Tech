const jwt = require("jsonwebtoken");
const db = require("../config/db");
const {
    JWT_ISSUER,
    JWT_AUDIENCE,
    ROLES_VALIDAS,
} = require("../config/auth");

async function autenticar(req, res, next) {
    try {
        const autorizacao = req.headers.authorization;

        if (!autorizacao) {
            return res.status(401).json({
                mensagem: "Token não informado."
            });
        }

        const partes = autorizacao.split(" ");

        if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
            return res.status(401).json({
                mensagem: "Formato do token inválido."
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error(
                "JWT_SECRET não configurado: requisição autenticada recusada."
            );

            return res.status(503).json({
                mensagem: "Autenticação indisponível no momento."
            });
        }

        const token = partes[1];

        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"],
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        const usuarioId = Number(payload?.usuario_id);
        const empresaId = Number(payload?.empresa_id);

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0 ||
            !Number.isInteger(empresaId) ||
            empresaId <= 0 ||
            !ROLES_VALIDAS.includes(payload?.role)
        ) {
            return res.status(401).json({
                mensagem: "Token inválido ou expirado."
            });
        }

        // Confere no banco a cada requisição: contas removidas, empresas
        // removidas ou papéis alterados deixam de valer imediatamente,
        // mesmo que o token ainda esteja dentro da validade.
        const [usuarios] = await db.query(
            `
            SELECT
                u.id,
                u.nome,
                u.email,
                u.role,
                u.empresa_id,
                e.slug AS empresa_slug
            FROM usuarios u
            INNER JOIN empresas e
                ON e.id = u.empresa_id
            WHERE u.id = ?
            AND u.empresa_id = ?
            LIMIT 1
            `,
            [usuarioId, empresaId]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: "Sessão inválida ou expirada."
            });
        }

        const usuario = usuarios[0];

        req.usuario = {
            usuario_id: usuario.id,
            empresa_id: usuario.empresa_id,
            role: usuario.role,
            nome: usuario.nome,
            email: usuario.email,
            empresa_slug: usuario.empresa_slug,
        };

        return next();

    } catch (error) {
        if (
            error?.name === "JsonWebTokenError" ||
            error?.name === "TokenExpiredError" ||
            error?.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                mensagem: "Token inválido ou expirado."
            });
        }

        console.error("ERRO NO MIDDLEWARE DE AUTENTICAÇÃO:", error);

        return res.status(503).json({
            mensagem: "Não foi possível validar a sessão agora."
        });
    }
}

module.exports = autenticar;
