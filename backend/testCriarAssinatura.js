require("dotenv").config();

const { exigirAmbienteSeguro } = require("./scripts/guardTesteAsaas");
exigirAmbienteSeguro();

const { criarAssinatura } = require("./services/asaasService");

function adicionarDias(data, dias) {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);

  return resultado.toISOString().split("T")[0];
}

async function testar() {
  try {
    const dataPrimeiraCobranca = adicionarDias(new Date(), 3);

    const assinatura = await criarAssinatura({
      customerId: "cus_000009788240",
      valor: 45.00,
      dataPrimeiraCobranca,
      descricao: "Agenda Tech - Plano Mensal",
    });

    console.log("✅ ASSINATURA CRIADA NO ASAAS!");
    console.log(JSON.stringify(assinatura, null, 2));

  } catch (error) {
    console.log("❌ ERRO AO CRIAR ASSINATURA");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Resposta:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.log("Erro:", error.message);
    }
  }
}

testar();