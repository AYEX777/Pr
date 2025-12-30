import { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface PremiumCardProps {
  children: ReactNode;
  variant?: 'glass' | 'liquid' | 'frosted' | 'neon' | 'aurora' | 'holographic' | 'neumorphic';
  glow?: 'green' | 'red' | 'yellow' | 'none';
  blur?: boolean;
  hover3d?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PremiumCard({
  children,
  variant = 'glass',
  glow = 'none',
  blur = false,
  hover3d = false,
  className = '',
  onClick
}: PremiumCardProps) {
  const variantClasses = {
    glass: 'liquid-glass',
    liquid: 'liquid-glass-green',
    frosted: 'frosted-glass frosted-glass-hover',
    neon: 'border-2 border-green-400',
    aurora: 'aurora-background-subtle',
    holographic: 'holographic-border',
    neumorphic: 'neumorphic'
  };

  const glowClasses = {
    green: 'neon-glow-green',
    red: 'neon-glow-red',
    yellow: 'neon-glow-yellow',
    none: ''
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        'border-0 shadow-lg transition-all duration-300',
        variantClasses[variant],
        glowClasses[glow],
        blur && 'motion-blur-hover',
        hover3d && 'hover-3d',
        !hover3d && 'depth-layer-hover',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Card>
  );
}

interface GlowingBadgeProps {
  children: ReactNode;
  color?: 'green' | 'red' | 'yellow' | 'blue';
  pulse?: boolean;
  className?: string;
}

export function GlowingBadge({ 
  children, 
  color = 'green', 
  pulse = false,
  className = '' 
}: GlowingBadgeProps) {
  const colorClasses = {
    green: 'bg-green-500 text-white neon-glow-green',
    red: 'bg-red-500 text-white neon-glow-red',
    yellow: 'bg-yellow-400 text-gray-900 neon-glow-yellow',
    blue: 'bg-blue-500 text-white'
  };

  return (
    <span
      className={cn(
        'px-3 py-1 rounded-full text-xs font-semibold',
        colorClasses[color],
        pulse && 'animate-neon-pulse',
        className
      )}
    >
      {children}
    </span>
  );
}

interface AnimatedBackgroundProps {
  children: ReactNode;
  variant?: 'aurora' | 'gradient-mesh' | 'particles' | 'holographic';
  className?: string;
}

export function AnimatedBackground({
  children,
  variant = 'aurora',
  className = ''
}: AnimatedBackgroundProps) {
  const variantClasses = {
    aurora: 'aurora-background',
    'gradient-mesh': 'gradient-mesh',
    particles: 'particle-bg relative',
    holographic: 'holographic'
  };

  return (
    <div className={cn('rounded-2xl overflow-hidden', variantClasses[variant], className)}>
      {children}
    </div>
  );
}

interface LiquidButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function LiquidButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false
}: LiquidButtonProps) {
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 neon-glow-green',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 neon-glow-red',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-white rounded-xl font-semibold transition-all duration-300',
        'hover-3d active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </button>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FloatingElement({ 
  children, 
  delay = 0,
  className = '' 
}: FloatingElementProps) {
  return (
    <div
      className={cn('animate-float', className)}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

interface MorphingBlobProps {
  size?: number;
  color?: string;
  opacity?: number;
  className?: string;
}

export function MorphingBlob({
  size = 100,
  color = '#16A34A',
  opacity = 0.3,
  className = ''
}: MorphingBlobProps) {
  return (
    <div
      className={cn('morphing-blob absolute', className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        opacity: opacity,
        filter: 'blur(40px)'
      }}
    />
  );
}

interface ShimmerTextProps {
  children: ReactNode;
  className?: string;
}

export function ShimmerText({ children, className = '' }: ShimmerTextProps) {
  return (
    <span className={cn('text-shimmer', className)}>
      {children}
    </span>
  );
}

interface IridescentCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function IridescentCard({ children, className = '', onClick }: IridescentCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-6 rounded-2xl overflow-hidden group cursor-pointer',
        'transition-all duration-300 hover-3d',
        className
      )}
    >
      {/* Iridescent background layer */}
      <div className="absolute inset-0 iridescent opacity-10 group-hover:opacity-20 transition-opacity" />
      
      {/* Glass layer */}
      <div className="absolute inset-0 liquid-glass" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function EnergyFlowIndicator({ active = false }: { active?: boolean }) {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-gray-200">
      {active && (
        <div className="absolute inset-0 energy-flow" />
      )}
    </div>
  );
}
