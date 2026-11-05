const express = require("express");
const autenticar = require("../middlewares/authMiddleware");

const router = express.Router();

router.get(
    "/protegido",
    autenticar,
    (req, res) => {
        res.json({
            mensagem: "Você acessou uma rota protegida!",
            usuario: req.usuario
        });
    }
);

module.exports = router;