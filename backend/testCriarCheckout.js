require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { criarCheckoutAssinatura } = require("./services/asaasService");

function adicionarDias(data, dias) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);

  return resultado.toISOString().split("T")[0];
}

async function testar() {
  try {
    const dataPrimeiraCobranca = adicionarDias(new Date(), 3);

    const checkout = await criarCheckoutAssinatura({
      dataPrimeiraCobranca,

      successUrl: "https://example.com/agenda-tech/sucesso",
      cancelUrl: "https://example.com/agenda-tech/cancelado",
      expiredUrl: "https://example.com/agenda-tech/expirado",
    });

    console.log("✅ CHECKOUT CRIADO!");
    console.log(JSON.stringify(checkout, null, 2));

  } catch (error) {
    console.log("❌ ERRO AO CRIAR CHECKOUT");

    if (error.response) {
      console.log("Status:", error.response.status);

      console.log(
        "Resposta:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log("Erro:", error.message);
    }
  }
}

testar();