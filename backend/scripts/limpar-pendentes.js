#!/usr/bin/env node
// ===============================================================
// LIMPEZA DE CONTAS PENDENTES ANTIGAS
// ===============================================================
// Remove empresas cujo cadastro nunca foi pago e que estão
// paradas há mais tempo que o limite configurado.
//
// Por padrão roda em MODO SIMULAÇÃO (não apaga nada).
//
// Uso:
//   node scripts/limpar-pendentes.js
//   node scripts/limpar-pendentes.js --dias=45
//   node scripts/limpar-pendentes.js --dias=45 --confirmar
//
// Regras de segurança:
//   - só considera assinaturas com status PENDENTE;
//   - ignora quem já tem assinatura criada no gateway
//     (gateway_subscription_id), pois pode haver pagamento a caminho;
//   - apaga a empresa e, por cascata, seus dados dependentes.

const path = require("path");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
});

const db = require("../config/db");

function argumento(nome) {
    const prefixo = `--${nome}=`;
    const item = process.argv.find((arg) =>
        arg.startsWith(prefixo)
    );

    return item ? item.slice(prefixo.length) : null;
}

const temFlag = (nome) =>
    process.argv.includes(`--${nome}`);

const dias = Number.parseInt(
    argumento("dias") || "30",
    10
);

if (!Number.isFinite(dias) || dias < 1) {
    console.error("Informe --dias com um número maior que zero.");
    process.exit(1);
}

const confirmar = temFlag("confirmar");

async function principal() {
    const [linhas] = await db.query(
        `
            SELECT
                a.id,
                a.empresa_id,
                a.status,
                a.created_at,
                e.nome,
                e.slug,
                e.email
            FROM assinaturas a
            INNER JOIN empresas e
                ON e.id = a.empresa_id
            WHERE a.status = 'PENDENTE'
              AND a.gateway_subscription_id IS NULL
              AND a.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY a.id
        `,
        [dias]
    );

    if (linhas.length === 0) {
        console.log(
            `Nenhuma conta PENDENTE com mais de ${dias} dia(s). Nada a fazer.`
        );

        return;
    }

    console.log(
        `Contas PENDENTE há mais de ${dias} dia(s): ${linhas.length}`
    );

    for (const linha of linhas) {
        console.log(
            `  #${linha.id} | empresa ${linha.empresa_id} | ${linha.nome} (${linha.slug}) | desde ${new Date(linha.created_at).toISOString().slice(0, 10)}`
        );
    }

    if (!confirmar) {
        console.log(
            "\nMODO SIMULAÇÃO: nada foi apagado. Para executar, rode novamente com --confirmar."
        );

        return;
    }

    const ids = linhas.map((linha) => linha.empresa_id);

    const conexao = await db.getConnection();

    try {
        await conexao.beginTransaction();

        const [resultado] = await conexao.query(
            `DELETE FROM empresas WHERE id IN (?)`,
            [ids]
        );

        await conexao.commit();

        console.log(
            `\n✅ ${resultado.affectedRows} empresa(s) removida(s) e dados dependentes apagados por cascata.`
        );
    } catch (error) {
        await conexao.rollback();

        throw error;
    } finally {
        conexao.release();
    }
}

principal()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("ERRO:", error.code || "", error.message);
        process.exit(1);
    });
