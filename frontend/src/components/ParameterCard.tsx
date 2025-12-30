import { Card, CardContent } from './ui/card';
import { getRiskColorFromScore } from '../lib/utils';
import { RiskGradientIndicator } from './RiskGradientIndicator';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ParameterCardProps {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  max: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
}

export function ParameterCard({
  name,
  value,
  unit,
  threshold,
  max,
  icon,
  trend = 'stable',
  trendValue = 0
}: ParameterCardProps) {
  const score = value / max;
  const color = getRiskColorFromScore(score);
  const isAboveThreshold = value > threshold;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return isAboveThreshold ? 'text-red-600' : 'text-green-600';
    if (trend === 'down') return isAboveThreshold ? 'text-green-600' : 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="border-0 shadow-md hover-lift overflow-hidden group transition-all">
      {/* Colored top border */}
      <div 
        className="h-1.5 w-full transition-all"
        style={{ 
          backgroundColor: color,
          boxShadow: `0 2px 8px ${color}40`
        }}
      />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: `${color}15`,
                  border: `2px solid ${color}30`
                }}
              >
                <div style={{ color }}>
                  {icon}
                </div>
              </div>
            )}
            <div>
              <h4 className="text-sm text-gray-600 mb-1">{name}</h4>
              <div className="flex items-baseline gap-2">
                <p 
                  className="text-3xl transition-all"
                  style={{ 
                    color,
                    textShadow: `0 0 20px ${color}30`
                  }}
                >
                  {value.toFixed(1)}
                </p>
                <span className="text-sm text-gray-500">{unit}</span>
              </div>
            </div>
          </div>

          {/* Trend indicator */}
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            {trendValue !== 0 && (
              <span>{Math.abs(trendValue).toFixed(1)}%</span>
            )}
          </div>
        </div>

        {/* Gradient indicator */}
        <RiskGradientIndicator
          score={score}
          size="sm"
          showLabel={false}
          showPercentage={false}
        />

        {/* Threshold info */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-gray-500">
            Seuil: <span className="font-medium text-gray-700">{threshold} {unit}</span>
          </span>
          {isAboveThreshold && (
            <span className="text-orange-600 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Au-dessus du seuil
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
