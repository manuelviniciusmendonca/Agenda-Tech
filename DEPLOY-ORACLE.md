# Deploy gratuito — Oracle Cloud + DuckDNS

Guia para publicar o Agenda Tech **sem custo mensal**, com endereço fixo e
HTTPS. É o substituto definitivo do túnel `trycloudflare`.

Ao final você terá:

| Peça | Endereço |
|---|---|
| Painel | `https://SEUDOMINIO.duckdns.org` |
| API | `https://SEUDOMINIO.duckdns.org/api` |
| Webhook Asaas | `https://SEUDOMINIO.duckdns.org/webhooks/asaas` |
| Banco MySQL | `localhost:3306` (fechado para a internet) |

Tudo roda na mesma máquina virtual: nginx serve o painel e repassa `/api` e
`/webhooks` para o Node.

> **Substitua `SEUDOMINIO`** pelo nome que você criar no DuckDNS em todos os
> arquivos e comandos deste guia.

---

## Custos

- **Oracle Cloud Always Free:** R$ 0/mês (VPS com até 4 OCPU / 24 GB no plano
  gratuito).
- **DuckDNS:** R$ 0 (subdomínio `*.duckdns.org`).
- **Let's Encrypt:** R$ 0 (certificado HTTPS, renovação automática).
- **Asaas:** sem mensalidade; taxa apenas por transação recebida.

A Oracle pede cartão de crédito **apenas para validar a conta**. O plano Always
Free não é cobrado. Não faça upgrade para "Pay As You Go" sem querer.

---

## Antes de começar

Você vai precisar de:

- conta na Oracle Cloud (a verificação pode levar alguns minutos);
- conta no DuckDNS (login com Google/GitHub);
- chave de API **de produção** do Asaas;
- acesso ao MySQL local (a senha do `root` ou de um usuário com permissão de
  leitura).

---

## Passo 1 — Criar a máquina na Oracle

1. Acesse <https://cloud.oracle.com> e entre na sua conta.
2. Menu → **Compute** → **Instances** → **Create instance**.
3. Preencha:
   - **Name:** `agendatech`
   - **Image:** Ubuntu 24.04 (ou 22.04)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere / ARM)
     - **OCPUs:** 2
     - **Memory:** 12 GB
   - **Public IP:** deixe marcado *Assign a public IPv4 address*
   - **SSH keys:** faça upload da sua chave pública (`id_rsa.pub`) ou gere uma
     nova e **baixe a chave privada**.
4. Clique em **Create** e espere o status ficar **Running**.
5. Anote o **Public IP address**.

> **Se aparecer "Out of capacity":** a região está sem ARM no momento. Tente
> outra região/zona, tente novamente mais tarde, ou use `VM.Standard.E2.1.Micro`
> (AMD, 1 GB de RAM). Com a Micro, crie 2 GB de swap antes de instalar o MySQL:
>
> ```bash
> sudo fallocate -l 2G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

### Conectar por SSH

No Windows (PowerShell), a partir da pasta onde está a chave:

```powershell
ssh -i .\chave.key ubuntu@IP_PUBLICO
```

Se o Windows reclamar da permissão da chave:

```powershell
icacls .\chave.key /inheritance:r
icacls .\chave.key /grant:r "$($env:USERNAME):(R)"
```

---

## Passo 2 — Abrir as portas 80 e 443

São **dois** firewalls. Precisa liberar nos dois.

### 2.1 Security List da Oracle (console)

1. Na instância, clique na **VCN** → **Security Lists** → a lista padrão.
2. **Add Ingress Rules** (duas vezes):

| Source CIDR | Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | `80` |
| `0.0.0.0/0` | TCP | `443` |

A porta `22` (SSH) já vem liberada.

### 2.2 Firewall da própria instância (iptables)

As imagens Ubuntu da Oracle bloqueiam portas por padrão. No servidor:

```bash
sudo apt update
sudo apt install -y iptables-persistent

# Veja a posição da regra REJECT (normalmente a última)
sudo iptables -L INPUT --line-numbers -n
```

Insira as regras **antes** do `REJECT` (ajuste `6` se a sua lista for diferente):

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

> Se a sua imagem usar `ufw` em vez de iptables:
> ```bash
> sudo ufw allow OpenSSH
> sudo ufw allow 80/tcp
> sudo ufw allow 443/tcp
> sudo ufw enable
> ```

---

## Passo 3 — Criar o subdomínio no DuckDNS

1. Acesse <https://www.duckdns.org> e faça login.
2. Em **add domain**, digite por exemplo `agendatech` → **add domain**.
3. No campo **current ip**, coloque o **IP público da Oracle** → **update ip**.
4. Anote o **token** que aparece no topo da página (você vai usá-lo só se quiser
   atualização automática; o IP da Oracle é fixo).

Confirme a propagação (no seu PC):

```powershell
nslookup agendatech.duckdns.org
```

Deve devolver o IP da Oracle. Se ainda não aparecer, espere alguns minutos.

Chamaremos esse endereço de `https://SEUDOMINIO.duckdns.org`.

---

## Passo 4 — Preparar o servidor

Já conectado por SSH:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx mysql-server certbot python3-certbot-nginx curl
```

### Node.js 22 + PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
sudo npm install -g pm2
```

### Pastas

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
sudo mkdir -p /var/log/agendatech
sudo chown -R $USER:$USER /var/log/agendatech
```

---

## Passo 5 — Banco de dados

### 5.1 Criar banco e usuário no servidor

```bash
sudo mysql
```

Dentro do MySQL:

```sql
CREATE DATABASE agendatech CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'agendatech'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON agendatech.* TO 'agendatech'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

O MySQL já escuta apenas em `127.0.0.1`, então **não** exponha a porta 3306.

### 5.2 Exportar o schema do seu PC

O repositório **não** versiona o schema completo (ele pode conter dados de
clientes). Exporte do seu MySQL local.

No seu PC (PowerShell), na pasta do projeto:

```powershell
$mysqldump = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"

# Opção recomendada: SOMENTE ESTRUTURA (produção começa limpa)
& $mysqldump -u root -p --no-data --routines --triggers --single-transaction --set-gtid-purged=OFF agendatech > schema.sql
```

Se preferir levar os dados junto (isso leva as empresas de teste para produção):

```powershell
& $mysqldump -u root -p --routines --triggers --single-transaction --set-gtid-purged=OFF agendatech > agendatech-completo.sql
```

### 5.3 Enviar e importar

```powershell
scp -i .\chave.key .\schema.sql ubuntu@IP_PUBLICO:/tmp/schema.sql
```

No servidor:

```bash
mysql -u agendatech -p agendatech < /tmp/schema.sql
```

Confira as tabelas:

```bash
mysql -u agendatech -p -e "SHOW TABLES;" agendatech
```

> Se importou um dump antigo, aplique as migrations na ordem:
> ```bash
> mysql -u agendatech -p agendatech < backend/migrations/001_horarios_profissionais.sql
> mysql -u agendatech -p agendatech < backend/migrations/002_assinaturas_status_default_pendente.sql
> ```

---

## Passo 6 — Subir o código

```bash
cd /var/www
git clone https://github.com/manuelviniciusmendonca/Agenda-Tech.git agendatech
cd agendatech/backend
npm ci --omit=dev
```

---

## Passo 7 — `.env` de produção

```bash
cd /var/www/agendatech/backend
cp .env.production.example .env
nano .env
```

Gere os dois segredos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # ASAAS_WEBHOOK_TOKEN
```

Preencha, no mínimo:

```env
PORT=3000
NODE_ENV=production

JWT_SECRET=<cole o segredo de 48 bytes>
JWT_ISSUER=agendatech-api
JWT_AUDIENCE=agendatech-web
JWT_EXPIRES_IN=7d

DB_HOST=localhost
DB_USER=agendatech
DB_PASSWORD=<a senha criada no passo 5>
DB_NAME=agendatech
DB_PORT=3306

FRONTEND_URL=https://SEUDOMINIO.duckdns.org
ASAAS_CALLBACK_BASE_URL=https://SEUDOMINIO.duckdns.org
CORS_ORIGINS=https://SEUDOMINIO.duckdns.org
TRUST_PROXY=1

ASAAS_ENV=production
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_API_KEY=<chave de PRODUÇÃO do Asaas>
ASAAS_USER_AGENT=Agenda Tech
ASAAS_WEBHOOK_TOKEN=<token gerado acima>
```

Regras importantes:

- `FRONTEND_URL` e `ASAAS_CALLBACK_BASE_URL`: **raiz**, com `https`, **sem**
  barra no final e **sem** `/webhooks/asaas`.
- `ASAAS_WEBHOOK_TOKEN`: o **mesmo** valor deve ser cadastrado no painel do
  Asaas.
- Se ainda não tiver SMTP, deixe o bloco `EMAIL_*` vazio — o sistema funciona,
  mas a recuperação de senha por e-mail não envia.
- Proteja o arquivo:

```bash
chmod 600 .env
```

---

## Passo 8 — Build do painel

```bash
cd /var/www/agendatech/frontend
npm ci
VITE_API_URL=https://SEUDOMINIO.duckdns.org/api npm run build
```

O `VITE_API_URL` é **gravado no build**. Se mudar o domínio depois, refaça o
build.

> A landing page é opcional. Se quiser publicá-la, crie outro subdomínio no
> DuckDNS (`landing-agendatech.duckdns.org`) e repita o processo de nginx +
> certbot apontando para `landing-page/dist`, com
> `VITE_APP_URL=https://SEUDOMINIO.duckdns.org` no build.

---

## Passo 9 — nginx + HTTPS

O arquivo pronto está em `deploy/nginx-agendatech.conf`. No servidor:

```bash
sudo cp /var/www/agendatech/deploy/nginx-agendatech.conf /etc/nginx/sites-available/agendatech
sudo nano /etc/nginx/sites-available/agendatech
```

Troque **todas** as ocorrências de `SEUDOMINIO` pelo seu nome.

```bash
sudo ln -s /etc/nginx/sites-available/agendatech /etc/nginx/sites-enabled/agendatech
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Agora o certificado:

```bash
sudo certbot --nginx -d SEUDOMINIO.duckdns.org
```

Escolha a opção de **redirecionar HTTP para HTTPS**. O certbot reescreve o
bloco `listen 80` e cria o `listen 443` sozinho.

Teste a renovação:

```bash
sudo certbot renew --dry-run
```

---

## Passo 10 — Iniciar a API com PM2

```bash
cd /var/www/agendatech
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

O `pm2 startup` imprime um comando `sudo ...`; copie e execute. Depois:

```bash
pm2 status
pm2 logs agendatech-api --lines 30
```

Confirme que a API responde (de qualquer lugar):

```bash
curl https://SEUDOMINIO.duckdns.org/health
# {"status":"ok"}
```

---

## Passo 11 — Cadastrar o webhook no Asaas

No painel do Asaas (produção) → **Integrações** → **Webhooks**:

- **URL:** `https://SEUDOMINIO.duckdns.org/webhooks/asaas`
- **Token de autenticação:** o mesmo `ASAAS_WEBHOOK_TOKEN` do `.env`
- **Eventos:**
  - `PAYMENT_CREATED`
  - `PAYMENT_CONFIRMED`
  - `PAYMENT_RECEIVED`
  - `PAYMENT_OVERDUE`
  - `PAYMENT_REFUNDED`
  - `SUBSCRIPTION_CREATED`
  - `SUBSCRIPTION_UPDATED`
  - `SUBSCRIPTION_INACTIVATED`
  - `SUBSCRIPTION_DELETED`

Salve e use o botão de teste do Asaas, se disponível. O `pm2 logs` deve mostrar a
requisição chegando.

> Antes de testar, **remova o webhook antigo** que aponta para o
> `trycloudflare` — ele está morto e só gera erro.

---

## Passo 12 — Teste de ponta a ponta

1. Abra `https://SEUDOMINIO.duckdns.org`.
2. Crie uma conta nova (ela nasce `PENDENTE`).
3. Entre e vá em **Assinatura**.
4. Gere o checkout de **R$ 45,00/mês**.
5. Pague com cartão.
6. Confirme:
   - retorno para `https://SEUDOMINIO.duckdns.org/assinatura/sucesso`;
   - status virando **ATIVA** em até ~2 minutos;
   - acesso liberado no painel;
   - evento registrado no `pm2 logs`.
7. Faça o **estorno** no painel do Asaas e confirme que a assinatura fica
   `INADIMPLENTE`.

Se o webhook demorar, a própria tela de sucesso chama
`POST /assinaturas/sincronizar` e libera o acesso — é o fallback esperado.

---

## Passo 13 — Backup automático

```bash
chmod +x /var/www/agendatech/backend/scripts/backup-mysql.js   # se necessário
cd /var/www/agendatech/backend
npm run backup -- --dias=14
```

Se funcionar, agende no cron:

```bash
crontab -e
```

```cron
0 3 * * * cd /var/www/agendatech/backend && /usr/bin/npm run backup -- --dias=14 >> /var/log/agendatech/backup.log 2>&1
```

Guarde uma cópia dos backups **fora** do servidor (no seu PC ou em outro
serviço). Backup na mesma máquina não protege contra perda do servidor.

---

## Atualizações futuras

Depois de qualquer alteração no GitHub:

```bash
cd /var/www/agendatech
git pull

cd backend
npm ci --omit=dev
pm2 restart agendatech-api

cd ../frontend
npm ci
VITE_API_URL=https://SEUDOMINIO.duckdns.org/api npm run build
```

Se só o backend mudou, o build do frontend não é necessário (e vice-versa).

---

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `502 Bad Gateway` | API parada | `pm2 status` / `pm2 logs` |
| Site abre, mas login falha | `VITE_API_URL` errado no build | refaça o build do frontend |
| Erro de CORS no console | `FRONTEND_URL` diferente do domínio | ajuste no `.env` e `pm2 restart` |
| Webhook responde `401` | token diferente do Asaas | iguale `ASAAS_WEBHOOK_TOKEN` |
| `404` ao atualizar a página | falta o `try_files` | revise o nginx do repositório |
| Certbot falha | DNS ou porta 80 fechada | confira `nslookup` e os dois firewalls |
| MySQL não conecta | senha/usuário errados | teste `mysql -u agendatech -p agendatech` |
| E-mail de senha não chega | SMTP não configurado | preencha `EMAIL_*` |

---

## Checklist final

- [ ] Instância Oracle `Running` e com IP fixo anotado
- [ ] Portas 80/443 liberadas na Security List **e** no iptables
- [ ] DuckDNS apontando para o IP correto
- [ ] Banco criado e schema importado
- [ ] `backend/.env` preenchido e com `chmod 600`
- [ ] Frontend buildado com `VITE_API_URL=.../api`
- [ ] nginx ativo e `nginx -t` sem erros
- [ ] HTTPS emitido e renovação testada
- [ ] PM2 com `pm2 save` e `pm2 startup`
- [ ] `https://SEUDOMINIO.duckdns.org/health` respondendo `{"status":"ok"}`
- [ ] Webhook antigo removido e novo cadastrado com os 9 eventos
- [ ] Teste real de R$ 45 concluído e estornado
- [ ] Backup automático rodando e cópia externa guardada

---

## Avisos

- **Nunca** versione o `.env` real. O repositório é público.
- **Nunca** use a chave de produção do Asaas em testes locais.
- Planos gratuitos mudam de regra sem aviso. A Oracle pode recuperar
  instâncias Always Free ociosas — por isso o backup externo é obrigatório.
- Se um dia migrar para um domínio próprio, basta trocar o DNS, refazer o build
  do frontend e atualizar o webhook do Asaas.
