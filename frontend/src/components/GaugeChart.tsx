import { getRiskColor, getRiskColorFromScore } from '../lib/utils';
import { RiskLevel } from '../types';

interface GaugeChartProps {
  value: number;
  max: number;
  threshold: number;
  unit: string;
  label: string;
  size?: number;
}

export function GaugeChart({ value, max, threshold, unit, label, size = 200 }: GaugeChartProps) {
  // Calculate percentage and angle
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180; // 180 degrees for semi-circle
  
  // Animation class for value changes
  const isHighRisk = value / threshold >= 0.85;
  
  // Determine risk level based on threshold
  const getRiskLevel = (): RiskLevel => {
    const ratio = value / threshold;
    if (ratio >= 1) return 'critical';
    if (ratio >= 0.85) return 'high';
    if (ratio >= 0.65) return 'medium';
    return 'low';
  };
  
  const riskLevel = getRiskLevel();
  // Utiliser le gradient de couleur basé sur le score
  const score = value / max;
  const color = getRiskColorFromScore(score);
  
  const radius = size / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Create arc path
  const startAngle = 180;
  const endAngle = 360;
  
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const currentRad = ((180 + angle) * Math.PI) / 180;
  
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);
  
  const backgroundPath = `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
  
  const xCurrent = centerX + radius * Math.cos(currentRad);
  const yCurrent = centerY + radius * Math.sin(currentRad);
  const largeArc = angle > 180 ? 1 : 0;
  const valuePath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${xCurrent} ${yCurrent}`;
  
  // Threshold indicator
  const thresholdPercentage = (threshold / max) * 100;
  const thresholdAngle = (thresholdPercentage / 100) * 180;
  const thresholdRad = ((180 + thresholdAngle) * Math.PI) / 180;
  const thresholdX = centerX + radius * Math.cos(thresholdRad);
  const thresholdY = centerY + radius * Math.sin(thresholdRad);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg width={size} height={size / 2 + 40}>
          {/* Background arc - Gradient */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
              <stop offset="33%" stopColor="#FBBF24" stopOpacity="0.2" />
              <stop offset="66%" stopColor="#FF9800" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          
          <path
            d={backgroundPath}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="20"
            strokeLinecap="round"
          />
          
          {/* Value arc with gradient color and glow */}
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`
            }}
          >
            {isHighRisk && (
              <animate
                attributeName="opacity"
                values="1;0.6;1"
                dur="2s"
                repeatCount="indefinite"
              />
            )}
          </path>
          
          {/* Threshold marker */}
          <line
            x1={thresholdX}
            y1={thresholdY}
            x2={centerX + (radius + 15) * Math.cos(thresholdRad)}
            y2={centerY + (radius + 15) * Math.sin(thresholdRad)}
            stroke="#D32F2F"
            strokeWidth="3"
          />
          
          {/* Center text - value with color */}
          <text
            x={centerX}
            y={centerY - 10}
            textAnchor="middle"
            className="transition-all duration-500"
            style={{ 
              fontSize: '28px', 
              fontWeight: 'bold',
              fill: color,
              filter: `drop-shadow(0 0 4px ${color}40)`
            }}
          >
            {value.toFixed(1)}
          </text>
          
          {/* Center text - unit */}
          <text
            x={centerX}
            y={centerY + 15}
            textAnchor="middle"
            className="fill-gray-600"
            style={{ fontSize: '14px' }}
          >
            {unit}
          </text>
          
          {/* Min label */}
          <text
            x={20}
            y={centerY + 25}
            textAnchor="start"
            className="fill-gray-500"
            style={{ fontSize: '12px' }}
          >
            0
          </text>
          
          {/* Max label */}
          <text
            x={size - 20}
            y={centerY + 25}
            textAnchor="end"
            className="fill-gray-500"
            style={{ fontSize: '12px' }}
          >
            {max}
          </text>
        </svg>
      </div>
      
      <div className="mt-2 text-center">
        <p className="text-gray-700">{label}</p>
        <p className="text-sm text-gray-500">Seuil: {threshold} {unit}</p>
      </div>
    </div>
  );
}
