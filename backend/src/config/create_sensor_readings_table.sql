-- Table sensor_readings pour stocker l'historique des valeurs des capteurs
-- Utilise UUID pour l'ID comme spécifié
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id VARCHAR(100) NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created_at ON sensor_readings(created_at);

