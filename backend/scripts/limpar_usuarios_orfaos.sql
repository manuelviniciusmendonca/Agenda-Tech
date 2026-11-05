-- Apagar usuários PROFISSIONAL que não estão vinculados a nenhum profissional
DELETE FROM usuarios
WHERE role = 'PROFISSIONAL'
AND id NOT IN (SELECT usuario_id FROM profissionais WHERE usuario_id IS NOT NULL);
