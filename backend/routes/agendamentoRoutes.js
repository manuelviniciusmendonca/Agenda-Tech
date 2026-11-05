const express = require("express");

const {
    criarAgendamento,
    listarAgendamentos,
    buscarAgendamentoPorId,
    atualizarStatusAgendamento,
    cancelarAgendamento
} = require("../controllers/agendamentoController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.post(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    criarAgendamento
);

router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    listarAgendamentos
);

router.get(
    "/:id",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarAgendamentoPorId
);

router.put(
    "/:id/status",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    atualizarStatusAgendamento
);

router.put(
    "/:id/cancelar",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    cancelarAgendamento
);

module.exports = router;