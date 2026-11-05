/**
 * Configuração central de autenticação.
 *
 * O issuer/audience impedem que um token assinado para outro
 * serviço (com o mesmo segredo) seja aceito por esta API.
 */
module.exports = {
    JWT_ISSUER: process.env.JWT_ISSUER || "agendatech-api",
    JWT_AUDIENCE: process.env.JWT_AUDIENCE || "agendatech-web",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    ROLES_VALIDAS: ["ADMIN", "PROFISSIONAL"],
};
