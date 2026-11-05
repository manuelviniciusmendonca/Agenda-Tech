function permitirRoles(...rolesPermitidas) {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                mensagem: "Usuário não autenticado."
            });
        }

        if (!rolesPermitidas.includes(req.usuario.role)) {
            return res.status(403).json({
                mensagem:
                    "Você não possui permissão para realizar esta ação."
            });
        }

        next();
    };
}

module.exports = permitirRoles;