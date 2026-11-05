const express = require("express");

const {
    criarOuAtualizarHorario,
    listarHorarios,
    excluirHorario
} = require("../controllers/horarioController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    criarOuAtualizarHorario
);

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarHorarios
);

router.delete(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    excluirHorario
);

module.exports = router;