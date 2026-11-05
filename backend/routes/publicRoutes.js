const express = require("express");

const {
    buscarEmpresaPublica,
    listarProfissionaisPorServico,
    criarAgendamentoPublico,
    buscarAgendamentoPublico,
    cancelarAgendamentoPublico,
    reagendarAgendamentoPublico
} = require("../controllers/publicController");

const {
    limiteAgendamentoPublico,
    limiteConsultaPublica,
} = require("../middlewares/rateLimit");

const router = express.Router();

// Página pública da empresa
router.get(
    "/empresa/:slug",
    buscarEmpresaPublica
);

// Profissionais disponíveis para determinado serviço
router.get(
    "/empresa/:slug/servicos/:servico_id/profissionais",
    listarProfissionaisPorServico
);

// Criar agendamento público
router.post(
    "/empresa/:slug/agendamentos",
    limiteAgendamentoPublico,
    criarAgendamentoPublico
);

// Consultar agendamento através do token público
router.get(
    "/empresa/:slug/agendamentos/:token",
    buscarAgendamentoPublico
);

// Cancelar agendamento público
router.post(
    "/empresa/:slug/agendamentos/:token/cancelar",
    limiteConsultaPublica,
    cancelarAgendamentoPublico
);

// Reagendar agendamento público
router.post(
    "/empresa/:slug/agendamentos/:token/reagendar",
    limiteConsultaPublica,
    reagendarAgendamentoPublico
);

module.exports = router;
