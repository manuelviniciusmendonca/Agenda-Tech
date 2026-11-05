const express = require("express");

const {
    adicionarServicoAoProfissional,
    listarServicosDoProfissional,
    removerServicoDoProfissional
} = require("../controllers/profissionalServicoController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

// Vincular serviço ao profissional
router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    adicionarServicoAoProfissional
);

// Consultar serviços do profissional
router.get(
    "/profissional/:profissional_id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarServicosDoProfissional
);

// Remover serviço do profissional
router.delete(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    removerServicoDoProfissional
);

module.exports = router;