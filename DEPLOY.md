# Deploy do Agenda Tech

Checklist de publicação em produção. Execute na ordem.

> **Antes de começar:** nunca use a API de produção do Asaas em ambiente
> local. O `.env` de desenvolvimento deve apontar para
> `https://api-sandbox.asaas.com/v3`. O arquivo de produção é
> `backend/.env.production.example` → copie para `backend/.env` **no servidor**.

---

## 1. Pré-requisitos

- Servidor com Node.js 20+ e MySQL 8.
- Domínio apontando para o servidor.
- HTTPS válido (Let's Encrypt ou Cloudflare).
- Conta de produção no Asaas com dados bancários e CNPJ configurados.
- `mysqldump` instalado (para backup).

---

## 2. Banco de dados

1. Crie o banco e o usuário:

   ```sql
   CREATE DATABASE agendatech CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   CREATE USER 'agendatech'@'localhost' IDENTIFIED BY 'SENHA_FORTE';
   GRANT ALL PRIVILEGES ON agendatech.* TO 'agendatech'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Importe o schema/dados iniciais.
3. Aplique as migrations na ordem:

   ```
   backend/migrations/001_horarios_profissionais.sql
   backend/migrations/002_assinaturas_status_default_pendente.sql
   ```

4. Confirme o default:

   ```sql
   SHOW COLUMNS FROM assinaturas LIKE 'status';
   -- Default deve ser PENDENTE
   ```

> **Não** copie o banco de desenvolvimento com empresas de teste
> ("Studio Bella", "abc", etc.). Suba um banco limpo.

---

## 3. Backend

1. Copie `backend/.env.production.example` para `backend/.env`.
2. Preencha **todos** os campos vazios. Gere segredos com:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

3. Pontos que mais causam erro:

   | Variável | Valor correto |
   |---|---|
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | `https://app.seudominio.com.br` (sem barra final) |
   | `ASAAS_CALLBACK_BASE_URL` | `https://app.seudominio.com.br` (**sem** `/webhooks/asaas`) |
   | `CORS_ORIGINS` | `https://app.seudominio.com.br` |
   | `TRUST_PROXY` | `1` se houver nginx/Cloudflare |
   | `ASAAS_ENV` | `production` |
   | `ASAAS_API_URL` | `https://api.asaas.com/v3` |

4. Instale e inicie:

   ```bash
   cd backend
   npm ci --omit=dev
   npm start
   ```

5. Verifique: `curl http://localhost:3000/health` deve responder `200`.

---

## 4. Frontend

1. Crie `frontend/.env.production` (se ainda não existir) com a URL da API:

   ```
   VITE_API_URL=https://api.seudominio.com.br
   ```

2. Gere o build:

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

3. Publique o conteúdo de `frontend/dist/` no servidor web.

---

## 5. Proxy reverso (exemplo nginx)

```nginx
server {
    listen 443 ssl;
    server_name app.seudominio.com.br;

    root /var/www/agenda-tech/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> Ajuste o frontend para chamar `/api` ou use um subdomínio para a API.
> O `TRUST_PROXY=1` é necessário para o rate limit enxergar o IP real.

---

## 6. Webhook do Asaas

1. No painel de produção do Asaas, cadastre:

   ```
   https://app.seudominio.com.br/webhooks/asaas
   ```

2. Token: o mesmo valor de `ASAAS_WEBHOOK_TOKEN`.
3. Eventos obrigatórios:

   - `PAYMENT_CREATED`
   - `PAYMENT_CONFIRMED`
   - `PAYMENT_RECEIVED`
   - `PAYMENT_OVERDUE`
   - `PAYMENT_REFUNDED`
   - `SUBSCRIPTION_CREATED`
   - `SUBSCRIPTION_UPDATED`
   - `SUBSCRIPTION_INACTIVATED`
   - `SUBSCRIPTION_DELETED`

4. Teste com o botão de teste do Asaas e confira a tabela
   `webhook_asaas_eventos`.

> Enquanto o domínio não estiver no ar, **não** deixe um túnel temporário
> cadastrado: quando ele cai, nenhum pagamento ativa conta.

---

## 7. Teste real de ponta a ponta

Faça um pagamento real de **R$ 45,00** com cartão:

- [ ] Cadastro novo cria empresa com status `PENDENTE`.
- [ ] `/assinatura` mostra "Ative sua assinatura".
- [ ] Checkout abre em `www.asaas.com` e cobra R$ 45,00 mensal.
- [ ] Após pagar, o retorno cai em `/assinatura/sucesso` (não 404).
- [ ] Status vira `ATIVA` e o acesso ao dashboard é liberado.
- [ ] `periodo_inicio` e `periodo_fim` estão corretos.
- [ ] Estorne o pagamento no painel do Asaas.
- [ ] Status vira `INADIMPLENTE` e o acesso é bloqueado.

Se algo falhar, confira primeiro `webhook_asaas_eventos` e os logs do backend.

---

## 8. Backup

O script usa `mysqldump` e apaga backups antigos conforme retenção.

```bash
cd backend
npm run backup
```

Agende no cron (diário às 03:00):

```cron
0 3 * * * cd /var/www/agenda-tech/backend && /usr/bin/node scripts/backup-mysql.js --dias=14 >> /var/log/agendatech-backup.log 2>&1
```

**Teste a restauração** pelo menos uma vez:

```bash
mysql -u agendatech -p agendatech < backups/agendatech-AAAAMMDD-HHMMSS.sql
```

Guarde uma cópia fora do servidor.

---

## 9. Limpeza de contas pendentes

Contas que se cadastraram e nunca pagaram podem ser removidas após N dias.
O script roda em modo simulação por padrão:

```bash
cd backend
npm run limpar-pendentes -- --dias=30            # simulação
npm run limpar-pendentes -- --dias=30 --confirmar # apaga de verdade
```

Ele ignora contas que já têm assinatura criada no gateway.

---

## 10. Depois do deploy

- [ ] Remover o túnel `trycloudflare` do painel do Asaas (se ainda existir).
- [ ] Confirmar que `backend/.env` não é acessível publicamente.
- [ ] Configurar alerta para falhas de webhook.
- [ ] Ligar os botões da landing ("Entrar" e "Começar agora") ao domínio real.
- [ ] Revisar termos de uso, privacidade (LGPD) e política de reembolso.
- [ ] Configurar e-mail com domínio próprio (SPF/DKIM).
- [ ] Trocar as senhas de MySQL e e-mail listadas em `SECURITY.md`.
- [ ] Fazer backup imediatamente após o primeiro cliente real.
