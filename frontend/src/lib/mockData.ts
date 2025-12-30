import { ProductionLine, Compensator, RiskLevel, Intervention, Alert } from '../types';

// Helper function to generate historical data
export const generateHistoricalData = (baseValue: number, variance: number, points: number = 50) => {
  const data = [];
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    data.push({
      timestamp: new Date(now.getTime() - i * 15 * 60 * 1000), // 15 min intervals
      value: baseValue + (Math.random() - 0.5) * variance,
    });
  }
  return data;
};

// Mock interventions
const mockInterventions: Intervention[] = [
  {
    id: 'int-1',
    date: new Date('2025-10-18T14:30:00'),
    type: 'maintenance',
    description: 'Maintenance préventive - Vérification des joints',
    technician: 'Younes Jeddou',
    status: 'completed',
  },
  {
    id: 'int-2',
    date: new Date('2025-10-15T09:15:00'),
    type: 'repair',
    description: 'Remplacement du capteur de pression',
    technician: 'Fatima Zahra',
    status: 'completed',
  },
  {
    id: 'int-3',
    date: new Date('2025-10-12T16:45:00'),
    type: 'inspection',
    description: 'Inspection de routine - RAS',
    technician: 'Mohammed Alami',
    status: 'completed',
  },
  {
    id: 'int-4',
    date: new Date('2025-10-19T08:00:00'),
    type: 'alert',
    description: 'Alerte température élevée - Investigation en cours',
    technician: 'Youssef Kadiri',
    status: 'in_progress',
  },
];

// Helper pour créer les 4 capteurs d'une ligne
const createLineSensors = (lineId: string, riskLevel: RiskLevel) => ({
  pressure: {
    id: `${lineId}-pressure`,
    name: 'Pression',
    value: riskLevel === 'critical' ? 8.9 : riskLevel === 'high' ? 7.2 : riskLevel === 'medium' ? 5.5 : 3.2,
    unit: 'bar',
    status: riskLevel === 'critical' || riskLevel === 'high' ? 'warning' : 'ok',
    threshold: 8.0,
    lastUpdate: new Date(),
  },
  temperature: {
    id: `${lineId}-temp`,
    name: 'Température',
    value: riskLevel === 'critical' ? 92 : riskLevel === 'high' ? 78 : riskLevel === 'medium' ? 65 : 45,
    unit: '°C',
    status: riskLevel === 'critical' ? 'error' : riskLevel === 'high' ? 'warning' : 'ok',
    threshold: 85,
    lastUpdate: new Date(),
  },
  vibration: {
    id: `${lineId}-vib`,
    name: 'Vibration',
    value: riskLevel === 'critical' ? 8.5 : riskLevel === 'high' ? 6.8 : riskLevel === 'medium' ? 4.2 : 2.5,
    unit: 'mm/s',
    status: riskLevel === 'critical' || riskLevel === 'high' ? 'warning' : 'ok',
    threshold: 7.5,
    lastUpdate: new Date(),
  },
  level: {
    id: `${lineId}-level`,
    name: 'Extension',
    value: riskLevel === 'critical' ? 94 : riskLevel === 'high' ? 82 : riskLevel === 'medium' ? 68 : 55,
    unit: '%',
    status: riskLevel === 'critical' || riskLevel === 'high' ? 'warning' : 'ok',
    threshold: 90,
    lastUpdate: new Date(),
  },
});

// Mock production lines - Seulement A, B, C, D avec capteurs intégrés
export const mockProductionLines: ProductionLine[] = [
  {
    id: 'line-A',
    name: 'Ligne A',
    zone: 'Zone Nord',
    riskLevel: 'critical',
    maxRiskScore: 0.89,
    lastUpdate: new Date(),
    ...createLineSensors('line-A', 'critical'),
    interventions: mockInterventions.slice(0, 4),
  },
  {
    id: 'line-B',
    name: 'Ligne B',
    zone: 'Zone Sud',
    riskLevel: 'high',
    maxRiskScore: 0.75,
    lastUpdate: new Date(),
    ...createLineSensors('line-B', 'high'),
    interventions: mockInterventions.slice(0, 2),
  },
  {
    id: 'line-C',
    name: 'Ligne C',
    zone: 'Zone Est',
    riskLevel: 'medium',
    maxRiskScore: 0.52,
    lastUpdate: new Date(),
    ...createLineSensors('line-C', 'medium'),
    interventions: mockInterventions.slice(0, 2),
  },
  {
    id: 'line-D',
    name: 'Ligne D',
    zone: 'Zone Ouest',
    riskLevel: 'low',
    maxRiskScore: 0.25,
    lastUpdate: new Date(),
    ...createLineSensors('line-D', 'low'),
    interventions: mockInterventions.slice(0, 2),
  },
];

// Mock alerts - Plus de compensatorId, seulement lineId
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    lineId: 'line-A',
    level: 'critical',
    message: 'Température critique détectée - Ligne A',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: 'alert-2',
    lineId: 'line-B',
    level: 'warning',
    message: 'Pression élevée - Ligne B',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    acknowledged: false,
  },
  {
    id: 'alert-3',
    lineId: 'line-A',
    level: 'warning',
    message: 'Débit anormal détecté - Ligne A',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    acknowledged: true,
  },
];
