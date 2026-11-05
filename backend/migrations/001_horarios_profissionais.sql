-- Horários de atendimento por profissional.
-- Quando o profissional não possui nenhuma linha nesta tabela, o sistema
-- usa o horário padrão da empresa (horarios_funcionamento).

CREATE TABLE IF NOT EXISTS `horarios_profissionais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresa_id` int NOT NULL,
  `profissional_id` int NOT NULL,
  `dia_semana` tinyint NOT NULL,
  `hora_abertura` time DEFAULT NULL,
  `hora_fechamento` time DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_horarios_profissional_dia` (`profissional_id`, `dia_semana`),
  KEY `fk_horarios_profissionais_empresa` (`empresa_id`),
  CONSTRAINT `fk_horarios_profissionais_empresa`
    FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_horarios_profissionais_profissional`
    FOREIGN KEY (`profissional_id`) REFERENCES `profissionais` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_horarios_profissionais_dia` CHECK (`dia_semana` BETWEEN 0 AND 6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Garante um único horário por dia também no horário padrão da empresa,
-- para que o upsert do controller seja seguro.
ALTER TABLE `horarios_funcionamento`
  ADD UNIQUE KEY `uq_horarios_funcionamento_empresa_dia` (`empresa_id`, `dia_semana`);
