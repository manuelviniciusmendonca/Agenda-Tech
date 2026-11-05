const express = require("express");

const {
    buscarResumoDashboard
} = require("../controllers/dashboardController");

const autenticar = require("../middlewares/authMiddleware");
const permitirRoles = require("../middlewares/roleMiddleware");
const verificarAssinatura = require("../middlewares/verificarAssinatura");

const router = express.Router();

router.get(
    "/resumo",
    autenticar,
    verificarAssinatura,
    permitirRoles("ADMIN", "PROFISSIONAL"),
    buscarResumoDashboard
);

module.exports = router;