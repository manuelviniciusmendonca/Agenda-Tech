require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { criarCustomer } = require("./services/asaasService");

async function testar() {
  try {
    const customer = await criarCustomer({
      nome: "Studio Bella Checkout",
      email: "studio@bella.com",
      telefone: "79988887777",

      // Dados fictícios para Sandbox
      cpfCnpj: "24971563792",
      address: "Avenida Teste",
      addressNumber: "100",
      province: "Centro",
      postalCode: "49000000",
    });

    console.log("✅ CUSTOMER CRIADO!");
    console.log(JSON.stringify(customer, null, 2));

  } catch (error) {
    console.log("❌ ERRO AO CRIAR CUSTOMER");

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