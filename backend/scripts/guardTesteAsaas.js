// Scripts manuais de teste usam a credencial configurada no .env.
// Quando o ambiente é produção, eles podem gerar cobranças reais.
// Esta guarda exige confirmação explícita antes de prosseguir.

function exigirAmbienteSeguro() {
    const ambiente = String(
        process.env.ASAAS_ENV || ""
    ).toLowerCase();

    const url = String(
        process.env.ASAAS_API_URL || ""
    ).toLowerCase();

    // api-sandbox.asaas.com não contém "api.asaas.com", então
    // apenas o host de produção é bloqueado aqui.
    const producao =
        ambiente === "production" ||
        url.includes("api.asaas.com");

    if (
        producao &&
        process.env.CONFIRMAR_TESTE_PRODUCAO !== "1"
    ) {
        console.error(
            "\n⛔ Script de teste bloqueado: o ambiente Asaas configurado é PRODUÇÃO.\n" +
                "   Rodar este script pode gerar cobranças reais.\n" +
                "   Se realmente quiser executar, defina CONFIRMAR_TESTE_PRODUCAO=1.\n"
        );

        process.exit(1);
    }
}

module.exports = { exigirAmbienteSeguro };
