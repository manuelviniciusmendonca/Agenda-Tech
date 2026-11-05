const express = require("express");

const {
    criarUsuario,
    atualizarMeuUsuario,
    excluirMinhaConta
} = require("../controllers/usuarioController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

// Atualizar os próprios dados - permitido mesmo sem assinatura
router.put(
    "/me",
    autenticar,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    atualizarMeuUsuario
);

// Excluir a própria conta - permitido mesmo sem assinatura
router.delete(
    "/me",
    autenticar,
    permitirRoles("ADMIN"),
    excluirMinhaConta
);

// Criar usuário - exige assinatura válida
router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarUsuario
);

module.exports = router;