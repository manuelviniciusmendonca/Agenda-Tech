const express = require("express");

const {
    criarCliente,
    listarClientes,
    buscarClientePorId,
    atualizarCliente,
    excluirCliente
} = require("../controllers/clienteController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarCliente
);

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarClientes
);

router.get(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarClientePorId
);

router.put(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    atualizarCliente
);

router.delete(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    excluirCliente
);

module.exports = router;