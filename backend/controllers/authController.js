const db = require("../config/db");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const {
    gerarSlug,
} = require("../utils/slug");

const {
    enviarEmailRecuperacao,
} = require("../services/emailService");

const {
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
} = require("../config/auth");

const {
    limparTexto,
    textoValido,
    emailValido,
    senhaValida,
    telefoneValido,
} = require("../utils/validation");

// =========================================================
// RESPOSTA PADRÃO DE RECUPERAÇÃO
// =========================================================

const RESPOSTA_RECUPERACAO = {
    mensagem:
        "Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
};

// =========================================================
// HASH FICTÍCIO
// =========================================================

// Usado quando o e-mail não existe.
// Ajuda a manter o tempo de resposta semelhante
// e dificulta enumeração de contas.

const HASH_FICTICIO =
    "$2b$10$cvdlSfXODLRG6Dg2J3kMzOmVqr4uLwWC2LtMoPRpfN4XstKU7oQiK";

// =========================================================
// ASSINAR JWT
// =========================================================

function assinarToken(usuario) {
    return jwt.sign(
        {
            usuario_id:
                usuario.usuario_id,

            empresa_id:
                usuario.empresa_id,

            role:
                usuario.role,
        },

        process.env.JWT_SECRET,

        {
            algorithm: "HS256",
            expiresIn:
                JWT_EXPIRES_IN,

            issuer:
                JWT_ISSUER,

            audience:
                JWT_AUDIENCE,
        }
    );
}

// =========================================================
// CADASTRO
// =========================================================

async function cadastrar(req, res) {
    const {
        empresa,
        admin,
        aceite,
    } = req.body || {};

    // =====================================================
    // VALIDAR DADOS BÁSICOS
    // =====================================================

    if (
        !empresa ||
        !admin
    ) {
        return res.status(400).json({
            mensagem:
                "Dados da empresa e do administrador são obrigatórios.",
        });
    }

    if (
        typeof empresa !== "object" ||
        typeof admin !== "object" ||
        typeof empresa.nome !== "string" ||
        typeof empresa.slug !== "string" ||
        typeof admin.nome !== "string" ||
        typeof admin.email !== "string" ||
        typeof admin.senha !== "string"
    ) {
        return res.status(400).json({
            mensagem:
                "Os dados enviados possuem formato inválido.",
        });
    }

    // =====================================================
    // NORMALIZAR DADOS
    // =====================================================

    const nomeEmpresa =
        limparTexto(
            empresa.nome
        );

    const slugEmpresa =
        gerarSlug(
            limparTexto(
                empresa.slug
            )
        );

    const nomeAdmin =
        limparTexto(
            admin.nome
        );

    const emailAdmin =
        limparTexto(
            admin.email
        ).toLowerCase();

    const senhaAdmin =
        admin.senha;

    const telefoneEmpresa =
        limparTexto(
            empresa.telefone
        );

    const emailEmpresa =
        limparTexto(
            empresa.email
        ).toLowerCase();

    // =====================================================
    // ACEITE DOS DOCUMENTOS LEGAIS
    // =====================================================

    if (
        !aceite ||
        typeof aceite !== "object" ||
        aceite.termos !== true ||
        typeof aceite.versao !== "string" ||
        !aceite.versao.trim()
    ) {
        return res.status(400).json({
            mensagem:
                "É necessário aceitar os Termos de Uso e a Política de Privacidade para criar a conta.",
        });
    }

    const versaoAceite =
        aceite.versao.trim().slice(0, 20);

    // =====================================================
    // VALIDAR EMPRESA / ADMIN
    // =====================================================

    if (
        !textoValido(
            nomeEmpresa,
            2,
            150
        ) ||
        !textoValido(
            slugEmpresa,
            2,
            100
        ) ||
        !textoValido(
            nomeAdmin,
            2,
            150
        )
    ) {
        return res.status(400).json({
            mensagem:
                "Nome e slug devem ter entre 2 e 150 caracteres.",
        });
    }

    if (
        !emailValido(
            emailAdmin
        )
    ) {
        return res.status(400).json({
            mensagem:
                "Informe um e-mail válido.",
        });
    }

    if (
        !senhaValida(
            senhaAdmin
        )
    ) {
        return res.status(400).json({
            mensagem:
                "A senha deve ter entre 8 e 72 caracteres, com pelo menos uma letra e um número.",
        });
    }

    if (
        telefoneEmpresa &&
        !telefoneValido(
            telefoneEmpresa
        )
    ) {
        return res.status(400).json({
            mensagem:
                "Informe um telefone válido.",
        });
    }

    if (
        emailEmpresa &&
        !emailValido(
            emailEmpresa
        )
    ) {
        return res.status(400).json({
            mensagem:
                "Informe um e-mail válido para a empresa.",
        });
    }

    // =====================================================
    // VALIDAR JWT
    // =====================================================

    if (
        !process.env.JWT_SECRET
    ) {
        return res.status(500).json({
            mensagem:
                "A autenticação não está configurada no servidor.",
        });
    }

    let conexao;

    let transacaoIniciada =
        false;

    try {
        // =================================================
        // HASH DA SENHA
        // =================================================

        const senhaHash =
            await bcrypt.hash(
                senhaAdmin,
                10
            );

        // =================================================
        // CONEXÃO + TRANSAÇÃO
        // =================================================

        conexao =
            await db.getConnection();

        await conexao.beginTransaction();

        transacaoIniciada =
            true;

        // =================================================
        // VERIFICAR SLUG
        // =================================================

        const [
            slugsExistentes,
        ] = await conexao.query(
            `
                SELECT id
                FROM empresas
                WHERE slug = ?
                LIMIT 1
            `,
            [
                slugEmpresa,
            ]
        );

        if (
            slugsExistentes.length >
            0
        ) {
            await conexao.rollback();

            transacaoIniciada =
                false;

            return res.status(409).json({
                mensagem:
                    "Este slug já está sendo utilizado.",
            });
        }

        // =================================================
        // VERIFICAR E-MAIL
        // =================================================

        const [
            emailsExistentes,
        ] = await conexao.query(
            `
                SELECT id
                FROM usuarios
                WHERE email = ?
                LIMIT 1
            `,
            [
                emailAdmin,
            ]
        );

        if (
            emailsExistentes.length >
            0
        ) {
            await conexao.rollback();

            transacaoIniciada =
                false;

            return res.status(409).json({
                mensagem:
                    "Este email já está cadastrado.",
            });
        }

        // =================================================
        // CRIAR EMPRESA
        // =================================================

        const [
            empresaCriada,
        ] = await conexao.query(
            `
                INSERT INTO empresas
                    (
                        nome,
                        slug,
                        telefone,
                        email
                    )
                VALUES (?, ?, ?, ?)
            `,
            [
                nomeEmpresa,
                slugEmpresa,
                telefoneEmpresa ||
                    null,
                emailEmpresa ||
                    null,
            ]
        );

        const empresa_id =
            empresaCriada.insertId;

        // =================================================
        // CRIAR ADMIN
        // =================================================

        const role =
            "ADMIN";

        const [
            usuarioCriado,
        ] = await conexao.query(
            `
                INSERT INTO usuarios
                    (
                        empresa_id,
                        nome,
                        email,
                        senha,
                        role
                    )
                VALUES (?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                nomeAdmin,
                emailAdmin,
                senhaHash,
                role,
            ]
        );

        // =================================================
        // REGISTRAR ACEITE DOS DOCUMENTOS LEGAIS
        // =================================================

        await conexao.query(
            `
                INSERT INTO aceites_legais
                    (
                        empresa_id,
                        usuario_id,
                        documento,
                        versao,
                        ip,
                        user_agent
                    )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                empresa_id,
                usuarioCriado.insertId,
                "TERMOS_E_PRIVACIDADE",
                versaoAceite,
                String(req.ip || "").slice(0, 45) ||
                    null,
                String(
                    req.get("user-agent") || ""
                ).slice(0, 255) || null,
            ]
        );

        // =================================================
        // CRIAR ASSINATURA AGUARDANDO PAGAMENTO
        // =================================================

        await conexao.query(
            `
                INSERT INTO assinaturas
                    (
                        empresa_id,
                        plano,
                        valor,
                        status,
                        gateway,
                        periodo_inicio,
                        periodo_fim
                    )
                VALUES
                    (
                        ?,
                        'MENSAL',
                        45.00,
                        'PENDENTE',
                        'ASAAS',
                        CURDATE(),
                        NULL
                    )
            `,
            [
                empresa_id,
            ]
        );

        // =================================================
        // HORÁRIOS PADRÃO
        // =================================================

        const horariosPadrao = [
            [
                empresa_id,
                0,
                null,
                null,
                0,
            ],

            [
                empresa_id,
                1,
                "08:00",
                "18:00",
                1,
            ],

            [
                empresa_id,
                2,
                "08:00",
                "18:00",
                1,
            ],

            [
                empresa_id,
                3,
                "08:00",
                "18:00",
                1,
            ],

            [
                empresa_id,
                4,
                "08:00",
                "18:00",
                1,
            ],

            [
                empresa_id,
                5,
                "08:00",
                "18:00",
                1,
            ],

            [
                empresa_id,
                6,
                "08:00",
                "13:00",
                1,
            ],
        ];

        for (
            const [
                eId,
                dia,
                abre,
                fecha,
                ativo,
            ]
            of horariosPadrao
        ) {
            await conexao.query(
                `
                    INSERT INTO
                        horarios_funcionamento
                        (
                            empresa_id,
                            dia_semana,
                            hora_abertura,
                            hora_fechamento,
                            ativo
                        )
                    VALUES (?, ?, ?, ?, ?)
                `,
                [
                    eId,
                    dia,
                    abre,
                    fecha,
                    ativo,
                ]
            );
        }

        // =================================================
        // DADOS DO USUÁRIO
        // =================================================

        const usuario = {
            usuario_id:
                usuarioCriado.insertId,

            empresa_id,

            role,
        };

        // =================================================
        // GERAR JWT
        // =================================================

        const token =
            assinarToken(
                usuario
            );

        // =================================================
        // COMMIT
        // =================================================

        await conexao.commit();

        transacaoIniciada =
            false;

        // =================================================
        // RESPOSTA
        // =================================================

        return res.status(201).json({
            mensagem:
                "Cadastro realizado com sucesso.",

            token,

            usuario: {
                id:
                    usuario.usuario_id,

                nome:
                    nomeAdmin,

                email:
                    emailAdmin,

                role,

                empresa_id,
            },

            empresa: {
                id:
                    empresa_id,

                nome:
                    nomeEmpresa,

                slug:
                    slugEmpresa,
            },
        });

    } catch (error) {
        // =================================================
        // ROLLBACK
        // =================================================

        if (
            conexao &&
            transacaoIniciada
        ) {
            await conexao.rollback();
        }

        // =================================================
        // DUPLICIDADE
        // =================================================

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {
            return res.status(409).json({
                mensagem:
                    "Este e-mail ou identificador de empresa já está em uso.",
            });
        }

        // =================================================
        // ERRO
        // =================================================

        console.error(
            "ERRO AO FAZER CADASTRO:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao realizar cadastro.",
        });

    } finally {
        if (conexao) {
            conexao.release();
        }
    }
}

// =========================================================
// LOGIN
// =========================================================

async function login(req, res) {
    try {
        const {
            email,
            senha,
        } = req.body || {};

        // =================================================
        // VALIDAR CAMPOS
        // =================================================

        if (
            typeof email !== "string" ||
            typeof senha !== "string"
        ) {
            return res.status(400).json({
                mensagem:
                    "Email e senha são obrigatórios.",
            });
        }

        const emailNormalizado =
            limparTexto(
                email
            ).toLowerCase();

        if (
            !emailNormalizado ||
            emailNormalizado.length >
                254 ||
            !senha ||
            senha.length > 200
        ) {
            return res.status(401).json({
                mensagem:
                    "Email ou senha inválidos.",
            });
        }

        // =================================================
        // BUSCAR USUÁRIO
        // =================================================

        const [
            usuarios,
        ] = await db.query(
            `
                SELECT
                    id,
                    empresa_id,
                    nome,
                    email,
                    senha,
                    role
                FROM usuarios
                WHERE LOWER(email) = ?
                LIMIT 1
            `,
            [
                emailNormalizado,
            ]
        );

        const usuario =
            usuarios[0];

        // =================================================
        // VALIDAR SENHA
        // =================================================

        const senhaValidaInformada =
            await bcrypt.compare(
                senha,
                usuario
                    ? usuario.senha
                    : HASH_FICTICIO
            );

        if (
            !usuario ||
            !senhaValidaInformada
        ) {
            return res.status(401).json({
                mensagem:
                    "Email ou senha inválidos.",
            });
        }

        // =================================================
        // VALIDAR EMPRESA
        // =================================================

        const [
            empresas,
        ] = await db.query(
            `
                SELECT id
                FROM empresas
                WHERE id = ?
                LIMIT 1
            `,
            [
                usuario.empresa_id,
            ]
        );

        if (
            empresas.length === 0
        ) {
            return res.status(401).json({
                mensagem:
                    "Email ou senha inválidos.",
            });
        }

        // =================================================
        // JWT
        // =================================================

        const token =
            assinarToken({
                usuario_id:
                    usuario.id,

                empresa_id:
                    usuario.empresa_id,

                role:
                    usuario.role,
            });

        // =================================================
        // RESPOSTA
        // =================================================

        return res.json({
            mensagem:
                "Login realizado com sucesso!",

            token,

            usuario: {
                id:
                    usuario.id,

                empresa_id:
                    usuario.empresa_id,

                nome:
                    usuario.nome,

                email:
                    usuario.email,

                role:
                    usuario.role,
            },
        });

    } catch (error) {
        console.error(
            "ERRO AO FAZER LOGIN:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao fazer login.",
        });
    }
}

// =========================================================
// ESQUECI MINHA SENHA
// =========================================================

async function forgotPassword(
    req,
    res
) {
    try {
        const {
            email,
        } = req.body || {};

        // =================================================
        // VALIDAR E-MAIL
        // =================================================

        if (
            typeof email !== "string" ||
            !emailValido(email)
        ) {
            return res.status(400).json({
                mensagem:
                    "Informe um e-mail válido.",
            });
        }

        const emailNormalizado =
            limparTexto(
                email
            ).toLowerCase();

        // =================================================
        // BUSCAR USUÁRIO
        // =================================================

        const [
            usuarios,
        ] = await db.query(
            `
                SELECT
                    id,
                    nome,
                    email
                FROM usuarios
                WHERE LOWER(email) = ?
                LIMIT 1
            `,
            [
                emailNormalizado,
            ]
        );

        // =================================================
        // RESPOSTA GENÉRICA
        // =================================================

        if (
            usuarios.length === 0
        ) {
            return res.json(
                RESPOSTA_RECUPERACAO
            );
        }

        const usuario =
            usuarios[0];

        // =================================================
        // GERAR TOKEN
        // =================================================

        const token =
            crypto
                .randomBytes(32)
                .toString("hex");

        const tokenHash =
            crypto
                .createHash(
                    "sha256"
                )
                .update(token)
                .digest("hex");

        const expiracao =
            new Date(
                Date.now() +
                    60 *
                        60 *
                        1000
            );

        // =================================================
        // INVALIDAR TOKENS ANTIGOS
        // =================================================

        await db.query(
            `
                UPDATE
                    tokens_recuperacao_senha
                SET
                    usado = TRUE
                WHERE
                    usuario_id = ?
                    AND usado = FALSE
            `,
            [
                usuario.id,
            ]
        );

        // =================================================
        // SALVAR NOVO TOKEN
        // =================================================

        await db.query(
            `
                INSERT INTO
                    tokens_recuperacao_senha
                    (
                        usuario_id,
                        token_hash,
                        expiracao
                    )
                VALUES (?, ?, ?)
            `,
            [
                usuario.id,
                tokenHash,
                expiracao,
            ]
        );

        // =================================================
        // ENVIAR E-MAIL
        // =================================================

        try {
            await enviarEmailRecuperacao(
                usuario.email,
                usuario.nome,
                token
            );

        } catch (
            erroEnvio
        ) {
            // Não revela se o e-mail existe
            // nem detalhes do SMTP.

            console.error(
                "ERRO AO ENVIAR E-MAIL DE RECUPERAÇÃO:",
                erroEnvio
            );
        }

        return res.json(
            RESPOSTA_RECUPERACAO
        );

    } catch (error) {
        console.error(
            "ERRO AO PROCESSAR forgot-password:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Não foi possível processar a solicitação agora.",
        });
    }
}

// =========================================================
// REDEFINIR SENHA
// =========================================================

async function resetPassword(
    req,
    res
) {
    try {
        const {
            token,
            senha,
        } = req.body || {};

        // =================================================
        // VALIDAR CAMPOS
        // =================================================

        if (
            typeof token !== "string" ||
            typeof senha !== "string"
        ) {
            return res.status(400).json({
                mensagem:
                    "Token e nova senha são obrigatórios.",
            });
        }

        // =================================================
        // VALIDAR FORMATO DO TOKEN
        // =================================================

        if (
            !/^[a-f0-9]{64}$/i.test(
                token
            )
        ) {
            return res.status(400).json({
                mensagem:
                    "Este link de recuperação é inválido.",
            });
        }

        // =================================================
        // VALIDAR SENHA
        // =================================================

        if (
            !senhaValida(senha)
        ) {
            return res.status(400).json({
                mensagem:
                    "A senha deve ter entre 8 e 72 caracteres, com pelo menos uma letra e um número.",
            });
        }

        // =================================================
        // HASH DO TOKEN
        // =================================================

        const tokenHash =
            crypto
                .createHash(
                    "sha256"
                )
                .update(token)
                .digest("hex");

        // =================================================
        // BUSCAR TOKEN
        // =================================================

        const [
            tokens,
        ] = await db.query(
            `
                SELECT
                    id,
                    usuario_id,
                    usado,
                    expiracao
                FROM
                    tokens_recuperacao_senha
                WHERE
                    token_hash = ?
                LIMIT 1
            `,
            [
                tokenHash,
            ]
        );

        // =================================================
        // TOKEN NÃO EXISTE
        // =================================================

        if (
            tokens.length === 0
        ) {
            return res.status(400).json({
                mensagem:
                    "Este link de recuperação é inválido.",
            });
        }

        const tokenRecuperacao =
            tokens[0];

        // =================================================
        // TOKEN JÁ USADO
        // =================================================

        if (
            tokenRecuperacao.usado
        ) {
            return res.status(400).json({
                mensagem:
                    "Este link de recuperação já foi utilizado.",
            });
        }

        // =================================================
        // TOKEN EXPIRADO
        // =================================================

        if (
            new Date(
                tokenRecuperacao.expiracao
            ) < new Date()
        ) {
            return res.status(400).json({
                mensagem:
                    "Este link de recuperação expirou.",
            });
        }

        // =================================================
        // VERIFICAR USUÁRIO
        // =================================================

        const [
            usuarios,
        ] = await db.query(
            `
                SELECT id
                FROM usuarios
                WHERE id = ?
                LIMIT 1
            `,
            [
                tokenRecuperacao.usuario_id,
            ]
        );

        if (
            usuarios.length === 0
        ) {
            return res.status(400).json({
                mensagem:
                    "Este link de recuperação é inválido.",
            });
        }

        // =================================================
        // NOVO HASH DA SENHA
        // =================================================

        const senhaHash =
            await bcrypt.hash(
                senha,
                10
            );

        // =================================================
        // ATUALIZAR SENHA
        // =================================================

        await db.query(
            `
                UPDATE usuarios
                SET senha = ?
                WHERE id = ?
            `,
            [
                senhaHash,
                usuarios[0].id,
            ]
        );

        // =================================================
        // INVALIDAR TOKEN
        // =================================================

        await db.query(
            `
                UPDATE
                    tokens_recuperacao_senha
                SET
                    usado = TRUE
                WHERE
                    usuario_id = ?
                    AND usado = FALSE
            `,
            [
                tokenRecuperacao.usuario_id,
            ]
        );

        return res.json({
            mensagem:
                "Senha redefinida com sucesso.",
        });

    } catch (error) {
        console.error(
            "ERRO AO PROCESSAR reset-password:",
            error
        );

        return res.status(500).json({
            mensagem:
                "Erro ao redefinir senha.",
        });
    }
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    cadastrar,
    login,
    forgotPassword,
    resetPassword,
};