# Segurança — Agenda Tech

Registro da auditoria de segurança feita no projeto e do que ainda depende
de configuração do ambiente de produção.

## Correções aplicadas

### Autenticação e sessão

- JWT validado com algoritmo fixo (`HS256`), `issuer` e `audience`.
- Payload do token conferido (ids inteiros positivos e papel conhecido).
- Usuário e empresa são consultados no banco a cada requisição: conta
  removida, empresa removida ou papel alterado invalidam o token na hora.
- `JWT_SECRET` obrigatório na inicialização (mínimo de 32 caracteres).
- Login com resposta genérica e comparação de senha em tempo constante para
  e-mail inexistente (evita enumeração de contas).
- Política de senha: 8 a 72 caracteres, ao menos uma letra e um número.
- Recuperação de senha com token aleatório de 64 hex, armazenado apenas como
  hash SHA-256, uso único e expiração de 1 hora.
- Resposta de recuperação é sempre a mesma, mesmo quando o envio de e-mail
  falha ou o endereço não existe.
- `POST /empresas` agora exige `ADMIN`; o onboarding público continua em
  `/auth/cadastro`.
- Criação de usuário, convites e alteração de conta com validação de entrada.
- Troca de e-mail exige a senha atual.

### Validação de entrada

- Helpers centralizados em `backend/utils/validation.js` (texto, e-mail,
  senha, data, hora, slug, token, telefone, inteiro, escape de HTML).
- Datas e horários validados em todos os fluxos públicos.
- Bloqueio de datas no passado e acima de 2 anos.
- IDs de rota e de query validados como inteiros positivos.
- `horarioService` aceita apenas `00:00`–`23:59` e durações válidas.

### Isolamento entre empresas (IDOR)

- Consultas de agendamentos, clientes, serviços, profissionais, horários e
  convites filtram por `empresa_id`.
- JOINs de agendamentos também conferem `empresa_id` das tabelas relacionadas.
- Profissional só acessa os próprios agendamentos, clientes e horários.
- `GET /empresas` retorna somente a empresa do usuário autenticado.

### Disponibilidade e agendamento

- Cálculo de disponibilidade valida profissional, serviço e data.
- Duração inválida não gera mais laço infinito (proteção contra DoS).
- Criação de agendamento público roda em transação com `SELECT ... FOR UPDATE`
  no profissional, impedindo duas reservas simultâneas do mesmo horário.
- Cancelamento e reagendamento respeitam `permitir_cancelamento` e
  `permitir_reagendamento` da empresa.
- Token público é aleatório (32 bytes) e identifica apenas um agendamento.

### Cabeçalhos, CORS e erros

- `helmet` habilitado e `x-powered-by` desativado.
- CORS por lista de origens (`CORS_ORIGINS`/`FRONTEND_URL`); em produção,
  apenas domínios configurados.
- `Cache-Control: no-store` em todas as respostas.
- Corpo JSON limitado a 100 kB (400 para JSON inválido, 413 para corpo grande).
- `TRUST_PROXY` só é aplicado quando configurado (evita forjar IP e burlar
  rate limit).
- Middleware central de erros: nenhum stack trace, SQL ou mensagem do driver
  vai para o cliente.
- Rotas de teste (`/teste`, `/teste-db`) removidas.
- `<meta name="referrer" content="no-referrer">` no frontend, evitando vazar
  tokens de agendamento pelo cabeçalho `Referer`.

### Rate limit

- Login: 10 tentativas por 15 minutos.
- Cadastro: 5 por hora.
- Recuperação/redefinição de senha: 5 por 15 minutos.
- Agendamento público: 20 por 10 minutos.
- Consulta/cancelamento/reagendamento e disponibilidade pública: 60 por
  10 minutos.

### Dependências

- `npm audit --omit=dev` sem vulnerabilidades no backend e no frontend.
- Backend atualizado com `helmet` e correção do `body-parser`.

## Arquivos de configuração

- `.gitignore` criado na raiz (ignora `.env`, `node_modules`, `dist`, backups
  e arquivos compactados).
- `backend/.env.example` criado com todas as variáveis e sem segredos.
- `agendatech_backup/` e `agendatech.zip` removidos (continham cópia do
  `.env`).
- `JWT_SECRET` rotacionado; sessões antigas foram invalidadas.

## Ações pendentes (ambiente)

Estas ações dependem de serviços externos e devem ser feitas pelo responsável:

1. **Trocar a senha do MySQL** usada pela API e atualizar `DB_PASSWORD`.
2. **Trocar a senha de aplicativo do Gmail** (`EMAIL_PASSWORD`) e revogar a
   anterior na conta Google.
3. Em produção, definir:
   - `FRONTEND_URL` com o domínio real;
   - `CORS_ORIGINS` com as origens permitidas;
   - `TRUST_PROXY=1` se houver proxy reverso confiável;
   - HTTPS no proxy (a API não termina TLS sozinha).
4. Revisar o histórico/versões do OneDrive: arquivos apagados podem continuar
   no histórico da nuvem.

## Observações

- O token de sessão do painel fica no `localStorage`. Isso é aceitável para o
  modelo atual (SPA + API), mas cookies `HttpOnly` seriam mais resistentes a
  XSS. Não há uso de `dangerouslySetInnerHTML` no frontend.
- A área do cliente é baseada no link com token; não existe login de cliente.
  Quem tiver o link gerencia o agendamento — por isso o link deve ser tratado
  como confidencial.
