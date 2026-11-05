const express = require("express");

const {
    listarClientesParaRecuperacao
} = require("../controllers/recuperacaoController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarClientesParaRecuperacao
);

module.exports = router;