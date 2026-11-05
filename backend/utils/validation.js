/**
 * Helpers de validação e normalização usados pelos controllers.
 *
 * Todas as funções são puras e não lançam exceções: retornam
 * verdadeiro/falso (ou o valor normalizado) para manter o fluxo
 * de respostas HTTP sob controle dos controllers.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const HORA_COM_SEGUNDOS_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const TOKEN_PUBLICO_REGEX = /^[a-f0-9]{64}$/i;
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TELEFONE_REGEX = /^[+()\d\s.-]+$/;

function limparTexto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

function textoValido(valor, min = 1, max = 255) {
    const texto = limparTexto(valor);

    return texto.length >= min && texto.length <= max;
}

function emailValido(valor) {
    const email = limparTexto(valor).toLowerCase();

    return email.length > 0 && email.length <= 254 && EMAIL_REGEX.test(email);
}

/**
 * Política de senha: 8 a 72 caracteres (limite seguro do bcrypt),
 * com pelo menos uma letra e um número.
 */
function senhaValida(valor) {
    if (typeof valor !== "string") {
        return false;
    }

    if (valor.length < 8 || valor.length > 72) {
        return false;
    }

    return /[A-Za-z]/.test(valor) && /\d/.test(valor);
}

function dataValida(valor) {
    const data = limparTexto(valor);

    if (!DATA_REGEX.test(data)) {
        return false;
    }

    const [ano, mes, dia] = data.split("-").map(Number);

    if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12 || dia < 1) {
        return false;
    }

    const verificacao = new Date(Date.UTC(ano, mes - 1, dia));

    return (
        verificacao.getUTCFullYear() === ano &&
        verificacao.getUTCMonth() === mes - 1 &&
        verificacao.getUTCDate() === dia
    );
}

function horaValida(valor) {
    return HORA_REGEX.test(limparTexto(valor));
}

/**
 * Aceita "HH:MM" ou "HH:MM:SS" e devolve sempre "HH:MM".
 * Retorna string vazia quando o formato é inválido.
 */
function normalizarHora(valor) {
    const hora = limparTexto(valor);

    if (!HORA_COM_SEGUNDOS_REGEX.test(hora)) {
        return "";
    }

    return hora.substring(0, 5);
}

function inteiroPositivo(valor) {
    const numero = Number(valor);

    return Number.isInteger(numero) && numero > 0;
}

function telefoneValido(valor) {
    const telefone = limparTexto(valor);

    if (!telefone || telefone.length > 20 || !TELEFONE_REGEX.test(telefone)) {
        return false;
    }

    const digitos = telefone.replace(/\D/g, "");

    return digitos.length >= 8 && digitos.length <= 15;
}

function slugValido(valor) {
    const slug = limparTexto(valor);

    return slug.length >= 2 && slug.length <= 100 && SLUG_REGEX.test(slug);
}

function tokenPublicoValido(valor) {
    return TOKEN_PUBLICO_REGEX.test(limparTexto(valor));
}

/**
 * Verifica se uma data/hora já passou, considerando uma pequena
 * tolerância para agendamentos feitos "para agora".
 */
function dataHoraNoPassado(data, hora, toleranciaMinutos = 5) {
    if (!dataValida(data)) {
        return true;
    }

    const horaNormalizada = normalizarHora(hora);

    if (!horaNormalizada) {
        return true;
    }

    const dataHora = new Date(`${limparTexto(data)}T${horaNormalizada}:00`);

    if (Number.isNaN(dataHora.getTime())) {
        return true;
    }

    return dataHora.getTime() < Date.now() - toleranciaMinutos * 60 * 1000;
}

function dataMuitoDistante(data, anos = 2) {
    if (!dataValida(data)) {
        return true;
    }

    const limite = new Date();
    limite.setFullYear(limite.getFullYear() + anos);

    const [ano, mes, dia] = limparTexto(data).split("-").map(Number);
    const dataInformada = new Date(ano, mes - 1, dia);

    return dataInformada.getTime() > limite.getTime();
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

module.exports = {
    limparTexto,
    textoValido,
    emailValido,
    senhaValida,
    dataValida,
    horaValida,
    normalizarHora,
    inteiroPositivo,
    telefoneValido,
    slugValido,
    tokenPublicoValido,
    dataHoraNoPassado,
    dataMuitoDistante,
    escaparHtml,
};
