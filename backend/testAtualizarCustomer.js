require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { atualizarCustomer } = require("./services/asaasService");

async function testar() {
  try {
    const customer = await atualizarCustomer({
      customerId: "cus_000009788240",

      cpfCnpj: "12345678909",

      address: "Rua Teste",
      addressNumber: "100",

      postalCode: "49000000",

      province: "Centro",

      city: "Aracaju",
      state: "SE",
    });

    console.log("✅ CUSTOMER ATUALIZADO!");
    console.log(JSON.stringify(customer, null, 2));

  } catch (error) {
    console.log("❌ ERRO AO ATUALIZAR CUSTOMER");

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