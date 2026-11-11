require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const db = require("./config/db");

const {
    inicializarEmailService,
} = require("./services/emailService");

// =========================================================
// ROTAS
// =========================================================

const empresaRoutes =
    require("./routes/empresaRoutes");

const usuarioRoutes =
    require("./routes/usuarioRoutes");

const authRoutes =
    require("./routes/authRoutes");

const clienteRoutes =
    require("./routes/clienteRoutes");

const servicoRoutes =
    require("./routes/servicoRoutes");

const profissionalRoutes =
    require("./routes/profissionalRoutes");

const profissionalServicoRoutes =
    require("./routes/profissionalServicoRoutes");

const horarioRoutes =
    require("./routes/horarioRoutes");

const horarioProfissionalRoutes =
    require("./routes/horarioProfissionalRoutes");

const agendamentoRoutes =
    require("./routes/agendamentoRoutes");

const disponibilidadeRoutes =
    require("./routes/disponibilidadeRoutes");

const publicRoutes =
    require("./routes/publicRoutes");

const recuperacaoRoutes =
    require("./routes/recuperacaoRoutes");

const dashboardRoutes =
    require("./routes/dashboardRoutes");

const configuracaoRoutes =
    require("./routes/configuracaoRoutes");

const conviteRoutes =
    require("./routes/conviteRoutes");

const asaasWebhookRoutes =
    require("./routes/asaasWebhookRoutes");

const assinaturaRoutes =
    require("./routes/assinaturaRoutes");

const {
    naoEncontrado,
    tratarErros,
} = require("./middlewares/errorMiddleware");

// =========================================================
// VALIDAR JWT_SECRET
// =========================================================

if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
) {
    console.error(
        "JWT_SECRET ausente ou muito curto (mínimo de 32 caracteres). " +
        "Defina um segredo forte antes de iniciar a API."
    );

    process.exit(1);
}

const app = express();

app.disable("x-powered-by");

// =========================================================
// TRUST PROXY
// =========================================================

if (process.env.TRUST_PROXY) {
    const valor =
        process.env.TRUST_PROXY.trim();

    if (/^\d+$/.test(valor)) {
        app.set(
            "trust proxy",
            Number(valor)
        );
    } else if (valor === "true") {
        app.set(
            "trust proxy",
            1
        );
    } else if (valor !== "false") {
        app.set(
            "trust proxy",
            valor
        );
    }
}

// =========================================================
// HELMET
// =========================================================

app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

// =========================================================
// CORS
// =========================================================

function origensPermitidas() {
    const origens = new Set();

    function adicionar(valor) {
        if (
            typeof valor !== "string"
        ) {
            return;
        }

        const normalizado =
            valor
                .trim()
                .replace(/\/+$/, "");

        if (normalizado) {
            origens.add(normalizado);
        }
    }

    (
        process.env.CORS_ORIGINS || ""
    )
        .split(",")
        .forEach(adicionar);

    adicionar(
        process.env.FRONTEND_URL
    );

    // Desenvolvimento local
    if (
        process.env.NODE_ENV !==
        "production"
    ) {
        [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ].forEach(adicionar);
    }

    return origens;
}

const permitidas =
    origensPermitidas();

app.use(
    cors({
        origin(origin, callback) {
            // Requisições sem Origin
            if (!origin) {
                return callback(
                    null,
                    true
                );
            }

            const normalizado =
                String(origin)
                    .trim()
                    .replace(/\/+$/, "");

            if (
                permitidas.has(
                    normalizado
                )
            ) {
                return callback(
                    null,
                    true
                );
            }

            return callback(
                null,
                false
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        maxAge: 86400,
    })
);

// =========================================================
// BODY PARSER
// =========================================================

app.use(
    express.json({
        limit: "100kb",
    })
);

// =========================================================
// CACHE CONTROL
// =========================================================

app.use(
    (req, res, next) => {
        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        next();
    }
);

// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
    "/health",
    (req, res) => {
        res.json({
            status: "ok",
        });
    }
);

// =========================================================
// ROTAS
// =========================================================

app.use(
    "/empresas",
    empresaRoutes
);

app.use(
    "/usuarios",
    usuarioRoutes
);

app.use(
    "/auth",
    authRoutes
);

app.use(
    "/clientes",
    clienteRoutes
);

app.use(
    "/servicos",
    servicoRoutes
);

app.use(
    "/profissionais",
    profissionalRoutes
);

app.use(
    "/profissional-servicos",
    profissionalServicoRoutes
);

app.use(
    "/horarios",
    horarioRoutes
);

app.use(
    "/horarios-profissionais",
    horarioProfissionalRoutes
);

app.use(
    "/agendamentos",
    agendamentoRoutes
);

app.use(
    "/disponibilidade",
    disponibilidadeRoutes
);

app.use(
    "/public",
    publicRoutes
);

app.use(
    "/recuperacao",
    recuperacaoRoutes
);

app.use(
    "/dashboard",
    dashboardRoutes
);

app.use(
    "/configuracoes",
    configuracaoRoutes
);

app.use(
    "/convites",
    conviteRoutes
);

// =========================================================
// ASSINATURAS
// =========================================================

app.use(
    "/assinaturas",
    assinaturaRoutes
);

// =========================================================
// RETORNO DO CHECKOUT (CALLBACK DO ASAAS)
// =========================================================

// O Asaas exige uma URL pública em https no callback.
// Quando o backend é exposto por um túnel, essas rotas
// redirecionam o navegador para o frontend local/produção.
const retornosCheckout = [
    "sucesso",
    "cancelado",
    "expirado",
];

retornosCheckout.forEach((retorno) => {
    app.get(`/assinatura/${retorno}`, (req, res) => {
        const frontendUrl = (process.env.FRONTEND_URL || "")
            .trim()
            .replace(/\/+$/, "");

        if (!frontendUrl) {
            return res.status(503).json({
                mensagem: "FRONTEND_URL não configurada.",
            });
        }

        return res.redirect(
            302,
            `${frontendUrl}/assinatura/${retorno}`
        );
    });
});

// =========================================================
// WEBHOOK ASAAS
// =========================================================

app.use(
    "/webhooks/asaas",
    asaasWebhookRoutes
);

// =========================================================
// ERROS
// =========================================================

app.use(
    naoEncontrado
);

app.use(
    tratarErros
);

// =========================================================
// SERVIDOR
// =========================================================

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    async () => {
        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

        try {
            await db.query(
                "SELECT 1"
            );

            console.log(
                "Conexão com o banco de dados validada."
            );
        } catch (error) {
            console.error(
                "Não foi possível conectar ao banco de dados:",
                error
            );
        }

        await inicializarEmailService();
    }
);