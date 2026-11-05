-- Novos cadastros passam a começar como PENDENTE (sem trial).
-- O código sempre informa o status explicitamente, mas o default do
-- banco era TRIAL e poderia criar um trial silencioso no futuro.
-- O enum continua aceitando TRIAL para as contas legadas.

ALTER TABLE `assinaturas`
  ALTER COLUMN `status`
  SET DEFAULT 'PENDENTE';
