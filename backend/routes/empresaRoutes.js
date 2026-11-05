const express = require("express");

const {
    criarEmpresa,
    listarEmpresas,
    buscarEmpresaPorId,
    atualizarEmpresa,
    excluirEmpresa
} = require("../controllers/empresaController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

// Criação de empresa
router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarEmpresa
);

// Listar empresas
router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarEmpresas
);

// Buscar empresa
router.get(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    buscarEmpresaPorId
);

// Atualizar empresa
router.put(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    atualizarEmpresa
);

// Excluir empresa
router.delete(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    excluirEmpresa
);

module.exports = router;