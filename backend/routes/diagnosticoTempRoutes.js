// =========================================================
// DIAGNÓSTICO TEMPORÁRIO — REMOVER DEPOIS
// =========================================================
// Responde somente se a variável DIAG_TOKEN estiver definida
// no ambiente e o header x-diag-token bater com ela.
// Não retorna senha, hash, JWT, variáveis de ambiente nem
// qualquer outro segredo.

const express = require("express");
const db = require("../config/db");

const router = express.Router();

const EMAIL_DIAGNOSTICO = "manuelvinicius098@gmail.com";

router.get("/db", async (req, res) => {
    const tokenEsperado = process.env.DIAG_TOKEN;

    // Sem token configurado a rota fica desativada.
    if (!tokenEsperado || req.get("x-diag-token") !== tokenEsperado) {
        return res.status(404).json({
            mensagem: "Recurso não encontrado.",
        });
    }

    try {
        const [info] = await db.query(
            "SELECT DATABASE() AS banco, @@hostname AS host, @@port AS porta"
        );

        const [usuarios] = await db.query(
            "SELECT id FROM usuarios WHERE LOWER(email) = ? LIMIT 1",
            [EMAIL_DIAGNOSTICO]
        );

        return res.json({
            banco: info[0].banco,
            host: info[0].host,
            porta: info[0].porta,
            usuarioEncontrado: usuarios.length > 0,
            usuarioId: usuarios[0] ? usuarios[0].id : null,
        });
    } catch (error) {
        console.error("ERRO NO DIAGNÓSTICO TEMPORÁRIO:", error);

        return res.status(500).json({
            mensagem: "Falha no diagnóstico.",
        });
    }
});

module.exports = router;
