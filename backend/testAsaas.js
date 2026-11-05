require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { asaas } = require("./services/asaasService");

async function testar() {
  try {
    const response = await asaas.get("/customers", {
      params: {
        limit: 10,
      },
    });

    console.log("CUSTOMERS:");
    console.log(JSON.stringify(response.data.data, null, 2));
  } catch (error) {
    console.log("❌ ERRO");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Resposta:", error.response.data);
    } else {
      console.log("Erro:", error.message);
    }
  }
}

testar();