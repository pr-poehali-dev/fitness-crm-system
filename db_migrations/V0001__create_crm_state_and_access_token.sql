CREATE TABLE IF NOT EXISTS t_p77908769_fitness_crm_system.crm_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p77908769_fitness_crm_system.crm_access_token (
  id TEXT PRIMARY KEY DEFAULT 'main',
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);