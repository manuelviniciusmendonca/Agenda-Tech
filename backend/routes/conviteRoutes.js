const express = require("express");

const {
    criarConvite,
    validarConvite,
    aceitarConvite
} = require("../controllers/conviteController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

// Criar convite - somente ADMIN com assinatura válida
router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarConvite
);

// Validar convite - público
router.get(
    "/validar/:token",
    validarConvite
);

// Aceitar convite - público
router.post(
    "/aceitar",
    aceitarConvite
);

module.exports = router;