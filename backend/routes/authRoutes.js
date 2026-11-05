const express = require("express");

const {
    login,
    cadastrar,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

const {
    limiteLogin,
    limiteCadastro,
    limiteRecuperacaoSenha,
} = require("../middlewares/rateLimit");

const router = express.Router();

router.post("/login", limiteLogin, login);
router.post("/cadastro", limiteCadastro, cadastrar);
router.post("/forgot-password", limiteRecuperacaoSenha, forgotPassword);
router.post("/reset-password", limiteRecuperacaoSenha, resetPassword);

module.exports = router;
