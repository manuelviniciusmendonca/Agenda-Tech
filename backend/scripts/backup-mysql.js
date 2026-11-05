#!/usr/bin/env node
// ===============================================================
// BACKUP DO MYSQL
// ===============================================================
// Uso:
//   node scripts/backup-mysql.js
//   node scripts/backup-mysql.js --dias=14
//
// Requer o cliente `mysqldump` instalado e disponível no PATH.
// Variáveis opcionais:
//   BACKUP_DIR             (padrão: <backend>/backups)
//   BACKUP_RETENTION_DAYS  (padrão: 7)
//
// A senha NÃO é passada por argumento: é gravada num arquivo
// temporário de opções e apagada ao final.

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

require("dotenv").config({
    path: path.resolve(__dirname, "..", ".env"),
});

function argumento(nome) {
    const prefixo = `--${nome}=`;
    const item = process.argv.find((arg) =>
        arg.startsWith(prefixo)
    );

    return item ? item.slice(prefixo.length) : null;
}

function inteiro(valor, padrao) {
    const numero = Number.parseInt(valor, 10);

    return Number.isFinite(numero) && numero >= 0
        ? numero
        : padrao;
}

const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || "3306";
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD || "";
const dbName = process.env.DB_NAME;

if (!dbUser || !dbName) {
    console.error(
        "DB_USER e DB_NAME precisam estar definidos no .env."
    );
    process.exit(1);
}

const diretorioBackup = path.resolve(
    argumento("dir") ||
        process.env.BACKUP_DIR ||
        path.join(__dirname, "..", "backups")
);

const retencaoDias = inteiro(
    argumento("dias") || process.env.BACKUP_RETENTION_DAYS,
    7
);

fs.mkdirSync(diretorioBackup, { recursive: true });

const agora = new Date();
const carimbo = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
    "-",
    String(agora.getHours()).padStart(2, "0"),
    String(agora.getMinutes()).padStart(2, "0"),
    String(agora.getSeconds()).padStart(2, "0"),
].join("");

const arquivoDestino = path.join(
    diretorioBackup,
    `${dbName}-${carimbo}.sql`
);

// Arquivo temporário de credenciais (evita senha na linha de comando).
const arquivoOpcoes = path.join(
    os.tmpdir(),
    `agendatech-mysqldump-${process.pid}.cnf`
);

const conteudoOpcoes = [
    "[client]",
    `host=${dbHost}`,
    `port=${dbPort}`,
    `user=${dbUser}`,
    `password=${dbPassword}`,
].join("\n");

fs.writeFileSync(arquivoOpcoes, conteudoOpcoes, {
    mode: 0o600,
});

let codigoSaida = 1;

try {
    const resultado = spawnSync(
        "mysqldump",
        [
            `--defaults-extra-file=${arquivoOpcoes}`,
            "--single-transaction",
            "--quick",
            "--routines",
            "--events",
            "--default-character-set=utf8mb4",
            "--databases",
            dbName,
            `--result-file=${arquivoDestino}`,
        ],
        { stdio: "inherit" }
    );

    if (resultado.error) {
        if (resultado.error.code === "ENOENT") {
            console.error(
                "mysqldump não encontrado no PATH. Instale o MySQL Client ou informe o caminho completo."
            );
        } else {
            console.error(
                "Falha ao executar mysqldump:",
                resultado.error.message
            );
        }
    } else if (resultado.status !== 0) {
        console.error(
            `mysqldump terminou com código ${resultado.status}. Backup não concluído.`
        );
    } else {
        const tamanho = fs.statSync(arquivoDestino).size;

        console.log(
            `✅ Backup criado: ${arquivoDestino} (${(tamanho / 1024 / 1024).toFixed(2)} MB)`
        );

        codigoSaida = 0;

        // Remove backups mais antigos que a retenção.
        const limite = Date.now() - retencaoDias * 86400000;

        for (const nome of fs.readdirSync(diretorioBackup)) {
            if (!nome.endsWith(".sql")) continue;

            const caminho = path.join(diretorioBackup, nome);
            const info = fs.statSync(caminho);

            if (info.mtimeMs < limite) {
                fs.unlinkSync(caminho);
                console.log(`🗑️  Removido backup antigo: ${nome}`);
            }
        }

        console.log(
            `Retenção aplicada: ${retencaoDias} dia(s).`
        );
    }
} finally {
    try {
        fs.unlinkSync(arquivoOpcoes);
    } catch {
        // Arquivo já removido ou inacessível: nada a fazer.
    }
}

process.exit(codigoSaida);
