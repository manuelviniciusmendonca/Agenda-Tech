const express = require("express");

const router = express.Router();

const {
    criarCheckout,
    buscarMinhaAssinatura,
    sincronizarMinhaAssinatura,
} = require("../controllers/assinaturaController");

const authMiddleware =
    require("../middlewares/authMiddleware");

const permitirRoles =
    require("../middlewares/roleMiddleware");

// BUSCAR MINHA ASSINATURA
router.get(
    "/minha",
    authMiddleware,
    permitirRoles("ADMIN"),
    buscarMinhaAssinatura
);

// SINCRONIZAR ASSINATURA COM O ASAAS
router.post(
    "/sincronizar",
    authMiddleware,
    permitirRoles("ADMIN"),
    sincronizarMinhaAssinatura
);

// CRIAR CHECKOUT
router.post(
    "/checkout",
    authMiddleware,
    permitirRoles("ADMIN"),
    criarCheckout
);

module.exports = router;