-- ===============================================================
-- 003 — Registro de aceite dos documentos legais
-- ===============================================================
-- Guarda a prova de que o usuário aceitou os Termos de Uso e a
-- Política de Privacidade, com versão, data/hora, IP e navegador.
--
-- Sem chaves estrangeiras de propósito: evita conflito de tipo com
-- tabelas criadas fora das migrations. Os índices cobrem as
-- consultas por usuário e por empresa.
-- ===============================================================

CREATE TABLE IF NOT EXISTS aceites_legais (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    documento VARCHAR(60) NOT NULL,
    versao VARCHAR(20) NOT NULL,
    aceito_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY idx_aceites_usuario (usuario_id),
    KEY idx_aceites_empresa (empresa_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
