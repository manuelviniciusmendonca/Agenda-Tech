const express = require("express");

const {
    criarServico,
    listarServicos,
    buscarServicoPorId,
    atualizarServico,
    excluirServico
} = require("../controllers/servicoController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarServico
);

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarServicos
);

router.get(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarServicoPorId
);

router.put(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    atualizarServico
);

router.delete(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    excluirServico
);

module.exports = router;