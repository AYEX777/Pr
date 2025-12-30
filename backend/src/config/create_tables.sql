-- Table production_lines
CREATE TABLE IF NOT EXISTS production_lines (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  zone VARCHAR(100),
  risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  max_risk_score DECIMAL(5, 2) DEFAULT 0.00,
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table sensors
CREATE TABLE IF NOT EXISTS sensors (
  id VARCHAR(100) PRIMARY KEY,
  line_id VARCHAR(50) NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'pressure', 'temperature', 'volume', 'ph', 'concentration', 'flow', 'viscosity', 'level', 'conductivity', 'turbidity', 'density', 'vibration'
  name VARCHAR(100) NOT NULL,
  value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'error')),
  threshold DECIMAL(10, 2) NOT NULL,
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(line_id, type) -- Un seul capteur de chaque type par ligne
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_sensors_line_id ON sensors(line_id);
CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);



