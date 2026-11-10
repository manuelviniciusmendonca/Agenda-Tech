// ===============================================================
// DADOS DA EMPRESA — LANDING PAGE
// ===============================================================
// Preencha TUDO que começa com "PREENCHER". O Decreto 7.962/2013
// exige a identificação do fornecedor em sites de comércio
// eletrônico (razão social, CNPJ e endereço).
// ===============================================================

export const DADOS_EMPRESA = {
    razaoSocial: "PREENCHER: razão social",
    cnpj: "PREENCHER: CNPJ",
    endereco: "PREENCHER: endereço completo",
    cidadeUf: "PREENCHER: cidade/UF",
    emailContato: "PREENCHER: e-mail de contato",
};

export const dadosPendentes = Object.values(DADOS_EMPRESA).some(
    (valor) => String(valor).startsWith("PREENCHER")
);
