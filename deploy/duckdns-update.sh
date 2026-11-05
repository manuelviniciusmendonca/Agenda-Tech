#!/usr/bin/env bash
# ===============================================================
# DuckDNS - atualizacao do IP publico (opcional)
# ===============================================================
# O IP da Oracle e fixo, entao normalmente basta cadastrar uma vez
# no site. Use este script se quiser garantia contra troca de IP.
#
# 1. Preencha as duas variaveis abaixo (NAO versione o token real).
# 2. chmod +x duckdns-update.sh
# 3. crontab -e
#    */15 * * * * /var/www/agendatech/deploy/duckdns-update.sh >/dev/null 2>&1
# ===============================================================

DOMINIO="SEUDOMINIO"
TOKEN="SEU_TOKEN_DUCKDNS"

IP_ATUAL="$(curl -fsS https://ipv4.icanhazip.com | tr -d '[:space:]')"

if [ -z "$IP_ATUAL" ]; then
    echo "Nao foi possivel descobrir o IP publico."
    exit 1
fi

curl -fsS "https://www.duckdns.org/update?domains=${DOMINIO}&token=${TOKEN}&ip=${IP_ATUAL}"
