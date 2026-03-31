-- Удаляем старых bor_ клиентов и добавляем все новые из обновлённого кода
-- Шаг 1: Удалить старых bor_ клиентов из БД
UPDATE t_p77908769_fitness_crm_system.crm_state
SET data = jsonb_set(
  data,
  '{clients}',
  (
    SELECT jsonb_agg(c)
    FROM jsonb_array_elements(data->'clients') c
    WHERE NOT (c->>'id' LIKE 'bor_%')
  )
),
updated_at = NOW()
WHERE id = 'main';

-- Шаг 2: Сбросить оба флага чтобы фронтенд переимпортировал при следующей загрузке
UPDATE t_p77908769_fitness_crm_system.crm_state
SET data = data - 'importedBorV1' - 'importedBorV2',
    updated_at = NOW()
WHERE id = 'main';