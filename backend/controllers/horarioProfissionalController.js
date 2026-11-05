const db = require("../config/db");

const {
    obterHorariosComOrigem,
    validarSemana,
    salvarSemana,
    restaurarHorarioEmpresa,
} = require("../services/horarioService");

async function obterProfissionalDoUsuario(usuario_id, empresa_id) {
    const [linhas] = await db.query(
        `
        SELECT id
        FROM profissionais
        WHERE usuario_id = ?
        AND empresa_id = ?
        AND ativo = TRUE
        `,
        [usuario_id, empresa_id]
    );

    return linhas[0] || null;
}

async function obterProfissionalDaEmpresa(empresa_id, profissional_id) {
    const [linhas] = await db.query(
        `
        SELECT id, nome, usuario_id
        FROM profissionais
        WHERE id = ?
        AND empresa_id = ?
        `,
        [profissional_id, empresa_id]
    );

    return linhas[0] || null;
}

async function buscarMeusHorarios(req, res) {
    try {
        const { empresa_id, usuario_id } = req.usuario;

        const profissional = await obterProfissionalDoUsuario(
            usuario_id,
            empresa_id
        );

        if (!profissional) {
            return res.status(403).json({
                mensagem:
                    "Usuário profissional não está vinculado a um profissional.",
            });
        }

        const dados = await obterHorariosComOrigem(
            empresa_id,
            profissional.id
        );

        return res.json(dados);

    } catch (error) {
        console.error("ERRO AO BUSCAR MEUS HORÁRIOS:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar seus horários.",
        });
    }
}

async function salvarMeusHorarios(req, res) {
    try {
        const { empresa_id, usuario_id } = req.usuario;

        const profissional = await obterProfissionalDoUsuario(
            usuario_id,
            empresa_id
        );

        if (!profissional) {
            return res.status(403).json({
                mensagem:
                    "Usuário profissional não está vinculado a um profissional.",
            });
        }

        return await salvarHorarios({
            req,
            res,
            empresa_id,
            profissional_id: profissional.id,
        });

    } catch (error) {
        console.error("ERRO AO SALVAR MEUS HORÁRIOS:", error);

        return res.status(500).json({
            mensagem: "Erro ao salvar seus horários.",
        });
    }
}

async function restaurarMeusHorarios(req, res) {
    try {
        const { empresa_id, usuario_id } = req.usuario;

        const profissional = await obterProfissionalDoUsuario(
            usuario_id,
            empresa_id
        );

        if (!profissional) {
            return res.status(403).json({
                mensagem:
                    "Usuário profissional não está vinculado a um profissional.",
            });
        }

        return await restaurarHorarios({
            res,
            empresa_id,
            profissional_id: profissional.id,
        });

    } catch (error) {
        console.error("ERRO AO RESTAURAR MEUS HORÁRIOS:", error);

        return res.status(500).json({
            mensagem: "Erro ao restaurar o horário da empresa.",
        });
    }
}

async function buscarHorariosDoProfissional(req, res) {
    try {
        const { empresa_id, role, usuario_id } = req.usuario;
        const { profissional_id } = req.params;

        const profissional = await obterProfissionalDaEmpresa(
            empresa_id,
            profissional_id
        );

        if (!profissional) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado.",
            });
        }

        if (
            role === "PROFISSIONAL" &&
            Number(profissional.usuario_id) !== Number(usuario_id)
        ) {
            return res.status(403).json({
                mensagem:
                    "Você só pode consultar os seus próprios horários.",
            });
        }

        const dados = await obterHorariosComOrigem(
            empresa_id,
            profissional.id
        );

        return res.json({
            profissional: {
                id: profissional.id,
                nome: profissional.nome,
            },
            ...dados,
        });

    } catch (error) {
        console.error("ERRO AO BUSCAR HORÁRIOS DO PROFISSIONAL:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar horários do profissional.",
        });
    }
}

async function salvarHorariosDoProfissional(req, res) {
    try {
        const { empresa_id } = req.usuario;
        const { profissional_id } = req.params;

        const profissional = await obterProfissionalDaEmpresa(
            empresa_id,
            profissional_id
        );

        if (!profissional) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado.",
            });
        }

        return await salvarHorarios({
            req,
            res,
            empresa_id,
            profissional_id: profissional.id,
        });

    } catch (error) {
        console.error("ERRO AO SALVAR HORÁRIOS DO PROFISSIONAL:", error);

        return res.status(500).json({
            mensagem: "Erro ao salvar horários do profissional.",
        });
    }
}

async function restaurarHorariosDoProfissional(req, res) {
    try {
        const { empresa_id } = req.usuario;
        const { profissional_id } = req.params;

        const profissional = await obterProfissionalDaEmpresa(
            empresa_id,
            profissional_id
        );

        if (!profissional) {
            return res.status(404).json({
                mensagem: "Profissional não encontrado.",
            });
        }

        return await restaurarHorarios({
            res,
            empresa_id,
            profissional_id: profissional.id,
        });

    } catch (error) {
        console.error(
            "ERRO AO RESTAURAR HORÁRIOS DO PROFISSIONAL:",
            error
        );

        return res.status(500).json({
            mensagem: "Erro ao restaurar o horário da empresa.",
        });
    }
}

async function salvarHorarios({ req, res, empresa_id, profissional_id }) {
    const validacao = validarSemana(req.body?.horarios);

    if (!validacao.valido) {
        return res.status(400).json({
            mensagem: validacao.mensagem,
        });
    }

    await salvarSemana({
        empresa_id,
        profissional_id,
        horarios: validacao.horarios,
    });

    const dados = await obterHorariosComOrigem(empresa_id, profissional_id);

    return res.json({
        mensagem: "Horários de atendimento salvos com sucesso.",
        ...dados,
    });
}

async function restaurarHorarios({ res, empresa_id, profissional_id }) {
    await restaurarHorarioEmpresa(empresa_id, profissional_id);

    const dados = await obterHorariosComOrigem(empresa_id, profissional_id);

    return res.json({
        mensagem:
            "Horários próprios removidos. O profissional voltou a usar o horário da empresa.",
        ...dados,
    });
}

module.exports = {
    buscarMeusHorarios,
    salvarMeusHorarios,
    restaurarMeusHorarios,
    buscarHorariosDoProfissional,
    salvarHorariosDoProfissional,
    restaurarHorariosDoProfissional,
};
