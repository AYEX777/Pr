import { getRiskColorFromScore } from '../lib/utils';

interface RiskGradientIndicatorProps {
  score: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
}

export function RiskGradientIndicator({ 
  score, 
  size = 'md', 
  showLabel = true, 
  showPercentage = true,
  label
}: RiskGradientIndicatorProps) {
  const percentage = Math.round(score * 100);
  const color = getRiskColorFromScore(score);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const getRiskLevel = (score: number): string => {
    if (score <= 0.25) return 'Faible';
    if (score <= 0.5) return 'Moyen';
    if (score <= 0.75) return 'Élevé';
    return 'Critique';
  };

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`${textSizeClasses[size]} text-gray-700`}>
            {label || getRiskLevel(score)}
          </span>
          {showPercentage && (
            <span 
              className={`${textSizeClasses[size]} font-semibold`}
              style={{ color }}
            >
              {percentage}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative">
        {/* Background gradient bar */}
        <div className={`w-full ${sizeClasses[size]} bg-gradient-to-r from-green-200 via-yellow-200 via-orange-200 to-red-200 rounded-full overflow-hidden`}>
          {/* Active fill */}
          <div
            className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}40`
            }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          </div>
        </div>
        
        {/* Indicator dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-500 ease-out animate-pulse-subtle"
          style={{
            left: `${percentage}%`,
            transform: `translate(-50%, -50%)`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}

interface RiskGaugeProps {
  score: number; // 0 to 1
  size?: number;
  showLabel?: boolean;
}

export function RiskGauge({ score, size = 120, showLabel = true }: RiskGaugeProps) {
  const percentage = Math.round(score * 100);
  const color = getRiskColorFromScore(score);
  const circumference = 2 * Math.PI * 45; // rayon de 45
  const offset = circumference - (score * circumference);

  const getRiskLevel = (score: number): string => {
    if (score <= 0.25) return 'Faible';
    if (score <= 0.5) return 'Moyen';
    if (score <= 0.75) return 'Élevé';
    return 'Critique';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`riskGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="33%" stopColor="#FBBF24" />
              <stop offset="66%" stopColor="#FF9800" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`
            }}
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color }}>
              {percentage}%
            </p>
          </div>
        </div>
      </div>
      
      {showLabel && (
        <p className="text-sm text-gray-600">
          {getRiskLevel(score)}
        </p>
      )}
    </div>
  );
}
