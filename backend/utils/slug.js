/**
 * Gera um slug amigável para URL a partir de uma string.
 *
 * Converte para lowercase, remove acentos, substitui espaços e caracteres
 * especiais por hífens, e remove múltiplos hífens consecutivos.
 *
 * @param {string} texto - Texto para converter em slug
 * @returns {string} Slug gerado
 */
function gerarSlug(texto) {
    if (!texto || typeof texto !== "string") {
        return "";
    }

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais (exceto espaço e hífen)
        .trim()
        .replace(/\s+/g, "-") // Substitui espaços por hífens
        .replace(/-+/g, "-") // Remove múltiplos hífens consecutivos
        .replace(/^-+|-+$/g, ""); // Remove hífens no início e fim
}

module.exports = {
    gerarSlug
};
