// ===============================================================
// DADOS DA EMPRESA PARA OS DOCUMENTOS LEGAIS
// ===============================================================
// Preencha TUDO que começa com "PREENCHER". Enquanto houver
// qualquer campo pendente, as páginas exibem um aviso de revisão.
//
// Estes dados aparecem nos Termos de Uso, na Política de
// Privacidade, na Política de Cookies e na Política de
// Cancelamento e Reembolso.
// ===============================================================

export const DADOS_EMPRESA = {
    razaoSocial: "PREENCHER: razão social",
    nomeFantasia: "Agenda Tech",
    cnpj: "PREENCHER: CNPJ",
    endereco: "PREENCHER: endereço completo, número e complemento",
    cidadeUf: "PREENCHER: cidade/UF",
    emailContato: "PREENCHER: e-mail de contato",
    emailSuporte: "PREENCHER: e-mail de suporte",
    emailPrivacidade: "PREENCHER: e-mail do encarregado de dados",
    foro: "PREENCHER: comarca/UF",
};

export const VERSAO_LEGAL = "1.0";

export const DATA_ATUALIZACAO = "10 de novembro de 2026";

export const dadosPendentes = Object.values(
    DADOS_EMPRESA
).some((valor) =>
    String(valor).startsWith("PREENCHER")
);

export const DOCUMENTOS_LEGAIS = [
    {
        chave: "termos",
        caminho: "/termos",
        titulo: "Termos de Uso",
        descricao:
            "Regras de uso do Agenda Tech, plano, pagamento e responsabilidades.",
    },
    {
        chave: "privacidade",
        caminho: "/privacidade",
        titulo: "Política de Privacidade",
        descricao:
            "Como tratamos dados pessoais, conforme a LGPD.",
    },
    {
        chave: "cookies",
        caminho: "/cookies",
        titulo: "Política de Cookies",
        descricao:
            "O que armazenamos no seu navegador e como controlar.",
    },
    {
        chave: "cancelamento",
        caminho: "/cancelamento",
        titulo: "Cancelamento e Reembolso",
        descricao:
            "Como cancelar a assinatura e quando há direito a reembolso.",
    },
];
