const express = require("express");

const {
    criarProfissional,
    listarProfissionais,
    buscarProfissionalPorId,
    atualizarProfissional,
    excluirProfissional
} = require("../controllers/profissionalController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarProfissional
);

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarProfissionais
);

router.get(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarProfissionalPorId
);

router.put(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    atualizarProfissional
);

router.delete(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    excluirProfissional
);

module.exports = router;