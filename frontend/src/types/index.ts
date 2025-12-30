export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Sensor {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'ok' | 'warning' | 'error';
  threshold: number;
  lastUpdate: Date;
}

export interface HistoricalData {
  timestamp: Date;
  value: number;
}

export interface Intervention {
  id: string;
  date: Date;
  type: 'maintenance' | 'repair' | 'inspection' | 'alert';
  description: string;
  technician: string;
  status: 'pending' | 'in_progress' | 'completed';
  attachments?: string[];
}

export interface Compensator {
  id: string;
  name: string;
  lineId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  pressure: Sensor;
  temperature: Sensor;
  volume: Sensor;
  pH: Sensor;
  concentration: Sensor;
  flow: Sensor;
  viscosity: Sensor;
  level: Sensor;
  conductivity: Sensor;
  turbidity: Sensor;
  density: Sensor;
  vibration: Sensor;
  lastUpdate: Date;
  interventions: Intervention[];
}

export interface ProductionLine {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  maxRiskScore: number;
  // 4 capteurs directement intégrés dans la ligne
  pressure: Sensor;
  temperature: Sensor;
  vibration: Sensor;
  level: Sensor; // Extension
  lastUpdate: Date;
  zone?: string;
  interventions?: Intervention[];
  tbe?: number | null; // Temps Restant (TBE) en minutes avant d'atteindre 10 bars
}

export interface Alert {
  id: string;
  lineId: string;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}
