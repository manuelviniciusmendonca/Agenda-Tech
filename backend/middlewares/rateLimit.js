const rateLimit = require("express-rate-limit");

function criarLimite({ janelaMs, limite, mensagem }) {
    return rateLimit({
        windowMs: janelaMs,
        limit: limite,
        standardHeaders: true,
        legacyHeaders: false,
        message: { mensagem },
    });
}

// Protege contra força bruta de senha.
const limiteLogin = criarLimite({
    janelaMs: 15 * 60 * 1000,
    limite: 10,
    mensagem:
        "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
});

// Evita criação massiva de contas/empresas.
const limiteCadastro = criarLimite({
    janelaMs: 60 * 60 * 1000,
    limite: 5,
    mensagem:
        "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.",
});

// Evita abuso de e-mail e de redefinição de senha.
const limiteRecuperacaoSenha = criarLimite({
    janelaMs: 15 * 60 * 1000,
    limite: 5,
    mensagem:
        "Muitas solicitações de recuperação de senha. Aguarde alguns minutos e tente novamente.",
});

// Limita criação de agendamentos públicos por IP.
const limiteAgendamentoPublico = criarLimite({
    janelaMs: 10 * 60 * 1000,
    limite: 20,
    mensagem:
        "Muitas solicitações de agendamento. Aguarde alguns minutos e tente novamente.",
});

// Limita consultas/cancelamentos/reagendamentos por token.
const limiteConsultaPublica = criarLimite({
    janelaMs: 10 * 60 * 1000,
    limite: 60,
    mensagem:
        "Muitas solicitações. Aguarde alguns minutos e tente novamente.",
});

module.exports = {
    limiteLogin,
    limiteCadastro,
    limiteRecuperacaoSenha,
    limiteAgendamentoPublico,
    limiteConsultaPublica,
};
