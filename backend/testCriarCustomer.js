require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { criarCustomer } = require("./services/asaasService");

async function testar() {
  try {
    const customer = await criarCustomer({
      nome: "Studio Bella",
      email: "studio@bella.com",
      telefone: "79988887777",
    });

    console.log("✅ CUSTOMER CRIADO NO ASAAS!");
    console.log(customer);
  } catch (error) {
    console.log("❌ ERRO AO CRIAR CUSTOMER");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Resposta:", error.response.data);
    } else {
      console.log("Erro:", error.message);
    }
  }
}

testar();