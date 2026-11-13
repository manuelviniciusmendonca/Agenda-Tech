const axios = require("axios");
const { escaparHtml } = require("../utils/validation");

// Configuração do provedor de e-mail (Resend)
const RESEND_API_URL = "https://api.resend.com/emails";

async function inicializarEmailService() {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
        console.warn(
            "Serviço de e-mail não configurado. Configure RESEND_API_KEY e EMAIL_FROM no .env"
        );

        return false;
    }

    // Nunca loga a chave: apenas o provedor utilizado.
    console.log("Serviço de e-mail pronto (provedor: Resend).");

    return true;
}

async function enviarEmailRecuperacao(email, nome, token) {
    const apiKey = process.env.RESEND_API_KEY;
    const remetente = process.env.EMAIL_FROM;

    if (!apiKey || !remetente) {
        throw new Error(
            "Serviço de e-mail não configurado. Configure RESEND_API_KEY e EMAIL_FROM no .env"
        );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const linkRecuperacao = `${frontendUrl}/redefinir-senha/${token}`;
    const nomeSeguro = escaparHtml(nome);
    const linkSeguro = escaparHtml(linkRecuperacao);

    const mailOptions = {
        from: remetente,
        to: [email],
        subject: "Redefinição de senha - Agenda Tech",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #000;">Redefinição de senha</h2>
                <p>Olá, ${nomeSeguro}!</p>
                <p>Recebemos uma solicitação para redefinir sua senha no Agenda Tech.</p>
                <p>Clique no link abaixo para criar uma nova senha:</p>
                <p>
                    <a href="${linkSeguro}" style="display: inline-block; padding: 12px 24px; background-color: #FFD700; color: #000; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Redefinir minha senha
                    </a>
                </p>
                <p style="font-size: 14px; color: #666;">Este link expira em 1 hora.</p>
                <p style="font-size: 14px; color: #666;">Se você não solicitou esta redefinição, ignore este e-mail.</p>
            </div>
        `,
        text: `
            Redefinição de senha - Agenda Tech

            Olá, ${nome}!

            Recebemos uma solicitação para redefinir sua senha no Agenda Tech.

            Acesse o link abaixo para criar uma nova senha:
            ${linkRecuperacao}

            Este link expira em 1 hora.

            Se você não solicitou esta redefinição, ignore este e-mail.
        `,
    };

    try {
        await axios.post(RESEND_API_URL, mailOptions, {
            timeout: 10000,
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        console.log(`E-mail de recuperação enviado para ${email}`);
        return true;
    } catch (error) {
        console.error(
            "Erro ao enviar e-mail de recuperação:",
            error.response?.data || error.message
        );
        throw new Error(
            "Não foi possível enviar o e-mail de recuperação."
        );
    }
}

module.exports = {
    inicializarEmailService,
    enviarEmailRecuperacao,
};
