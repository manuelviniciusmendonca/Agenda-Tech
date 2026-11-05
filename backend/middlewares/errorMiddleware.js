/**
 * Tratamento centralizado de erros.
 *
 * Nenhum detalhe interno (SQL, stack trace, mensagem do driver)
 * é enviado ao cliente.
 */

function naoEncontrado(req, res) {
    return res.status(404).json({
        mensagem: "Recurso não encontrado.",
    });
}

// eslint-disable-next-line no-unused-vars
function tratarErros(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    console.error("ERRO NÃO TRATADO:", error);

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            mensagem: "O corpo da requisição contém JSON inválido.",
        });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({
            mensagem: "A requisição é muito grande.",
        });
    }

    return res.status(500).json({
        mensagem: "Erro interno do servidor.",
    });
}

module.exports = {
    naoEncontrado,
    tratarErros,
};
