const nodemailer = require("nodemailer");
const { escaparHtml } = require("../utils/validation");

// Configuração do transportador de e-mail
let transporter = null;

async function inicializarEmailService() {
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.warn("Serviço de e-mail não configurado. Configure EMAIL_HOST e EMAIL_USER no .env");
        return false;
    }

    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    // Valida as credenciais já na inicialização, para não descobrir
    // o problema só quando alguém pede recuperação de senha
    try {
        await transporter.verify();
        console.log(`Serviço de e-mail pronto (${process.env.EMAIL_USER}).`);
        return true;
    } catch (error) {
        console.error(
            "FALHA AO AUTENTICAR NO SERVIDOR DE E-MAIL. Confira EMAIL_USER/EMAIL_PASSWORD no .env:",
            error.message
        );
        return false;
    }
}

async function enviarEmailRecuperacao(email, nome, token) {
    if (!transporter) {
        throw new Error(
            "Serviço de e-mail não configurado. Configure EMAIL_HOST e EMAIL_USER no .env"
        );
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";
    const linkRecuperacao = `${frontendUrl}/redefinir-senha/${token}`;
    const nomeSeguro = escaparHtml(nome);
    const linkSeguro = escaparHtml(linkRecuperacao);

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
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
        await transporter.sendMail(mailOptions);
        console.log(`E-mail de recuperação enviado para ${email}`);
        return true;
    } catch (error) {
        console.error("Erro ao enviar e-mail de recuperação:", error);
        throw new Error(
            "Não foi possível enviar o e-mail de recuperação."
        );
    }
}

module.exports = {
    inicializarEmailService,
    enviarEmailRecuperacao,
};
