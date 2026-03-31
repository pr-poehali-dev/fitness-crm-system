-- Убедиться что флаг importedTsentrV1 не выставлен, чтобы фронтенд запустил импорт
UPDATE t_p77908769_fitness_crm_system.crm_state
SET data = data - 'importedTsentrV1',
    updated_at = NOW()
WHERE id = 'main';