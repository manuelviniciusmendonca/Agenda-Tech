const express = require("express");

const {
    buscarConfiguracoes,
    atualizarConfiguracoes
} = require("../controllers/configuracaoController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    buscarConfiguracoes
);

router.put(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    atualizarConfiguracoes
);

module.exports = router;