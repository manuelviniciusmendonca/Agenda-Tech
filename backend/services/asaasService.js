const axios = require("axios");

// Usa ASAAS_API_URL quando definida; caso contrário, escolhe
// automaticamente entre sandbox e produção conforme ASAAS_ENV.
const ASAAS_API_URL =
    process.env.ASAAS_API_URL ||
    (process.env.ASAAS_ENV === "production"
        ? "https://api.asaas.com/v3"
        : "https://api-sandbox.asaas.com/v3");

const asaas = axios.create({
    baseURL: ASAAS_API_URL,
    headers: {
        access_token: process.env.ASAAS_API_KEY,
        "User-Agent": process.env.ASAAS_USER_AGENT,
        "Content-Type": "application/json",
    },
});

// =========================================================
// CRIAR CUSTOMER
// =========================================================

async function criarCustomer({
    nome,
    email,
    telefone,
    cpfCnpj,
    address,
    addressNumber,
    province,
    postalCode,
}) {
    const response = await asaas.post("/customers", {
        name: nome,
        email: email || undefined,
        mobilePhone: telefone || undefined,
        cpfCnpj,
        address,
        addressNumber,
        province,
        postalCode,
    });

    return response.data;
}

// =========================================================
// CRIAR ASSINATURA DIRETA
// =========================================================

async function criarAssinatura({
    customerId,
    valor,
    dataPrimeiraCobranca,
    descricao,
}) {
    const response = await asaas.post("/subscriptions", {
        customer: customerId,
        billingType: "CREDIT_CARD",
        value: valor,
        nextDueDate: dataPrimeiraCobranca,
        cycle: "MONTHLY",
        description: descricao,
    });

    return response.data;
}

// =========================================================
// CRIAR CHECKOUT DE ASSINATURA
// =========================================================

// O Asaas só aceita URLs de retorno públicas (https).
// Em desenvolvimento, com localhost, o callback é omitido
// para o checkout continuar funcionando.
function urlDeRetornoValida(url) {
    try {
        const parsed = new URL(url);

        return (
            parsed.protocol === "https:" &&
            parsed.hostname !== "localhost" &&
            parsed.hostname !== "127.0.0.1"
        );
    } catch {
        return false;
    }
}

async function criarCheckoutAssinatura({
    empresaId,
    dataPrimeiraCobranca,
    successUrl,
    cancelUrl,
    expiredUrl,
}) {
    const urlsValidas = [successUrl, cancelUrl, expiredUrl].every(
        urlDeRetornoValida
    );

    const response = await asaas.post("/checkouts", {
        billingTypes: ["CREDIT_CARD"],
        chargeTypes: ["RECURRENT"],

        minutesToExpire: 60,

        // Identifica qual empresa do Agenda Tech
        // pertence a este Checkout.
        externalReference: `agenda_tech_empresa_${empresaId}`,

        ...(urlsValidas
            ? {
                  callback: {
                      successUrl,
                      cancelUrl,
                      expiredUrl,
                  },
              }
            : {}),

        items: [
            {
                name: "Agenda Tech - Plano Mensal",
                description: "Assinatura mensal do Agenda Tech",
                quantity: 1,
                value: 45.00,
            },
        ],

        subscription: {
            cycle: "MONTHLY",
            nextDueDate: dataPrimeiraCobranca,
        },
    });

    return response.data;
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    asaas,
    criarCustomer,
    criarAssinatura,
    criarCheckoutAssinatura,
};