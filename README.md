# Agenda Tech

SaaS de gestão de agendamentos para negócios de atendimento — salões, clínicas,
estúdios e profissionais autônomos. O sistema é multiempresa, com painel
administrativo, agenda pública, gestão de profissionais e cobrança recorrente
pelo Asaas.

## Funcionalidades

- Cadastro de empresa com onboarding e página pública de agendamento.
- Agenda, horários de atendimento e horários por profissional.
- Gestão de clientes, serviços e profissionais.
- Dashboard com indicadores e recuperação de clientes.
- Painel do profissional com a própria agenda.
- Assinatura mensal de **R$ 45,00** com checkout, webhook e sincronização Asaas.
- Bloqueio automático de acesso para assinaturas pendentes, vencidas ou canceladas.

## Estrutura do projeto

```
backend/        API REST em Express + MySQL
frontend/       Painel administrativo (React + Vite)
landing-page/   Site de divulgação (React + Vite)
DEPLOY.md       Checklist de publicação em produção
SECURITY.md     Pendências e recomendações de segurança
```

## Tecnologias

**Backend**

- Node.js, Express 5 e MySQL 8 (`mysql2`)
- JWT, bcrypt, Helmet e rate limit
- Nodemailer para recuperação de senha
- Axios para integração com o Asaas

**Frontend e landing page**

- React 19, Vite 8 e React Router 7
- Lucide React para ícones
- CSS puro (sem framework de estilos)
- ESLint no painel e Oxlint na landing page

## Requisitos

- Node.js 20 ou superior
- MySQL 8 ou superior
- npm

## Como rodar localmente

### 1. Banco de dados

Crie o banco e o usuário:

```sql
CREATE DATABASE agendatech CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'agendatech'@'localhost' IDENTIFIED BY 'SENHA_FORTE';
GRANT ALL PRIVILEGES ON agendatech.* TO 'agendatech'@'localhost';
FLUSH PRIVILEGES;
```

Importe o schema inicial do projeto e aplique as migrations incrementais na
ordem, a partir de `backend/migrations/`:

```
001_horarios_profissionais.sql
002_assinaturas_status_default_pendente.sql
```

> O dump com o schema completo não é versionado porque pode conter dados de
> clientes. Mantenha uma cópia segura fora do repositório.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

No Windows, use `copy .env.example .env`.

Preencha o `.env` antes de iniciar:

- `JWT_SECRET` com no mínimo **32 caracteres** (a API não inicia sem ele);
- credenciais do MySQL;
- dados do Asaas (em desenvolvimento, use o **sandbox**).

A API sobe em `http://localhost:3000`. Confirme com:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

### 3. Painel administrativo

```bash
cd frontend
npm install
npm run dev
```

Abre em `http://localhost:5173`.

Opcionalmente, crie `frontend/.env` para apontar para outra API:

```
VITE_API_URL=http://localhost:3000
```

Sem essa variável, o frontend usa `http://localhost:3000`.

### 4. Landing page

```bash
cd landing-page
npm install
npm run dev
```

## Variáveis de ambiente

O modelo completo está em `backend/.env.example` (desenvolvimento) e
`backend/.env.production.example` (produção).

| Variável | Para que serve |
|---|---|
| `PORT` | Porta da API (padrão `3000`) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Conexão MySQL |
| `JWT_SECRET` | Assinatura dos tokens (mínimo 32 caracteres) |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_IN` | Configuração dos tokens |
| `FRONTEND_URL` | URL do painel, usada no CORS e nos links de e-mail |
| `CORS_ORIGINS` | Origens adicionais permitidas, separadas por vírgula |
| `TRUST_PROXY` | `1` quando houver nginx/Cloudflare na frente da API |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` | Envio de e-mails |
| `ASAAS_ENV` | `sandbox` ou `production` |
| `ASAAS_API_URL` | URL da API do Asaas |
| `ASAAS_API_KEY` | Chave da API do Asaas |
| `ASAAS_WEBHOOK_TOKEN` | Token validado nos webhooks recebidos |
| `ASAAS_CALLBACK_BASE_URL` | Raiz pública em HTTPS para o retorno do checkout |

> **Nunca** versione o `.env` real. Apenas os arquivos `.env.example` e
> `.env.production.example` entram no repositório.

## Fluxo de assinatura

1. O cadastro cria a empresa com assinatura `PENDENTE`, sem período de teste.
2. Em `/assinatura`, o administrador gera o checkout do Asaas (R$ 45,00/mês).
3. O Asaas envia os eventos para `POST /webhooks/asaas`.
4. O backend valida o token, garante idempotência e ativa a assinatura após
   `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`.
5. Se o webhook atrasar, `POST /assinaturas/sincronizar` consulta o Asaas sob
   demanda e libera o acesso do mesmo jeito.
6. Assinaturas vencidas ou não pagas recebem `403` com o código
   `ASSINATURA_VENCIDA` ou `ASSINATURA_BLOQUEADA` e são levadas para
   `/assinatura`.

## Scripts

**Backend** (`backend/`)

```bash
npm run dev               # servidor com nodemon
npm start                 # servidor em modo produção
npm run backup            # backup do MySQL com retenção
npm run limpar-pendentes  # remove contas pendentes (simulação por padrão)
```

**Frontend** (`frontend/`)

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

**Landing page** (`landing-page/`)

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Deploy

O passo a passo completo está em [DEPLOY.md](DEPLOY.md), incluindo banco, proxy
reverso, webhook do Asaas, backup e teste real de ponta a ponta.

## Segurança

- Segredos ficam apenas no `.env` do servidor.
- O webhook do Asaas exige o token `asaas-access-token`.
- Nunca use a chave de produção do Asaas em ambiente local.
- Recomendações e pendências adicionais estão em [SECURITY.md](SECURITY.md).
