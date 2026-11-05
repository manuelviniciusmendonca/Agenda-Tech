const express = require("express");

const {
    buscarDisponibilidade,
    buscarDisponibilidadePublica
} = require("../controllers/disponibilidadeController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");
const { limiteConsultaPublica } = require("../middlewares/rateLimit");

const router = express.Router();

// Disponibilidade interna
router.get(
    "/",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarDisponibilidade
);

// Disponibilidade pública
router.get(
    "/publica/:slug/servico/:servico_id/profissional/:profissional_id/data/:data",
    limiteConsultaPublica,
    buscarDisponibilidadePublica
);

module.exports = router;