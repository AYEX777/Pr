import { useState, useEffect } from 'react';
import { ProductionLine, Alert } from '../types';

/**
 * Hook to fetch production lines from backend API
 * Falls back to mock data simulation if API fails
 */
export function useRealtimeProductionLines(
  initialLines: ProductionLine[],
  updateInterval = 2000
): ProductionLine[] {
  const [lines, setLines] = useState<ProductionLine[]>(initialLines);

  useEffect(() => {
    // Mock simulation mode - no API calls
    const interval = setInterval(() => {
        setLines((prevLines) =>
          prevLines.map((line) => {
            const updateSensor = (sensor: any) => {
              const variance = sensor.value * 0.05;
              const change = (Math.random() - 0.5) * variance;
              const newValue = Math.max(0, sensor.value + change);
              
              let status: 'ok' | 'warning' | 'error' = 'ok';
              const ratio = newValue / sensor.threshold;
              if (ratio >= 1) status = 'error';
              else if (ratio >= 0.85) status = 'warning';
              
              return {
                ...sensor,
                value: newValue,
                status,
                lastUpdate: new Date(),
              };
            };

            const pressure = updateSensor(line.pressure);
            const temperature = updateSensor(line.temperature);
            const vibration = updateSensor(line.vibration);
            const level = updateSensor(line.level);

            const pressureRatio = pressure.value / pressure.threshold;
            const tempRatio = temperature.value / temperature.threshold;
            const levelRatio = level.value / level.threshold;
            const vibrationRatio = vibration.value / vibration.threshold;
            
            const maxRatio = Math.max(pressureRatio, tempRatio, levelRatio, vibrationRatio);
            const maxRiskScore = Math.min(maxRatio, 1);
            
            let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
            if (maxRiskScore >= 1) riskLevel = 'critical';
            else if (maxRiskScore >= 0.85) riskLevel = 'high';
            else if (maxRiskScore >= 0.65) riskLevel = 'medium';

            return {
              ...line,
              pressure,
              temperature,
              vibration,
              level,
              riskLevel,
              maxRiskScore,
              lastUpdate: new Date(),
            };
          })
        );
      }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return lines;
}

/**
 * Hook to get alerts - generates from lines data (mock mode only)
 */
export function useRealtimeAlerts(lines: ProductionLine[]): Alert[] {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Generate alerts from lines data (mock mode)
    const newAlerts: Alert[] = [];
    
    lines.forEach((line) => {
      if (line.riskLevel === 'critical') {
        newAlerts.push({
          id: `alert-${line.id}-${Date.now()}`,
          lineId: line.id,
          level: 'critical',
          message: `Température critique détectée - ${line.name}`,
          timestamp: new Date(),
          acknowledged: false,
        });
      } else if (line.riskLevel === 'high') {
        if (Math.random() > 0.7) {
          newAlerts.push({
            id: `alert-${line.id}-${Date.now()}`,
            lineId: line.id,
            level: 'warning',
            message: `Pression élevée - ${line.name}`,
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts((prev) => {
        const combined = [...newAlerts, ...prev];
        return combined.slice(0, 10);
      });
    }
  }, [lines]);

  return alerts;
}

// Legacy hooks for compatibility
export function useRealtimeSensor(initialSensor: any, updateInterval = 3000) {
  return initialSensor;
}

export function useRealtimeHistory(baseSensor: any, maxPoints = 50, updateInterval = 5000) {
  return [];
}

export function useRealtimeCompensator(initialCompensator: any, updateInterval = 3000) {
  return initialCompensator;
}

export function useRealtimeProductionLine(initialLine: ProductionLine, updateInterval = 3000) {
  return initialLine;
}
