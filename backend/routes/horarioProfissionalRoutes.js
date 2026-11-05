const express = require("express");

const {
    buscarMeusHorarios,
    salvarMeusHorarios,
    restaurarMeusHorarios,
    buscarHorariosDoProfissional,
    salvarHorariosDoProfissional,
    restaurarHorariosDoProfissional,
} = require("../controllers/horarioProfissionalController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

// Horários do próprio profissional autenticado
router.get(
    "/me",
    autenticar,
    verificarAssinatura,
    permitirRoles("PROFISSIONAL"),
    buscarMeusHorarios
);

router.put(
    "/me",
    autenticar,
    verificarAssinatura,
    permitirRoles("PROFISSIONAL"),
    salvarMeusHorarios
);

router.delete(
    "/me",
    autenticar,
    verificarAssinatura,
    permitirRoles("PROFISSIONAL"),
    restaurarMeusHorarios
);

// Horários de um profissional específico
router.get(
    "/profissional/:profissional_id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarHorariosDoProfissional
);

router.put(
    "/profissional/:profissional_id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    salvarHorariosDoProfissional
);

router.delete(
    "/profissional/:profissional_id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN"),
    restaurarHorariosDoProfissional
);

module.exports = router;