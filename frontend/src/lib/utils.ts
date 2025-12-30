import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RiskLevel } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calcule la couleur en fonction d'un score de risque (0-1)
 * Gradient fluide: Vert (0%) -> Jaune (50%) -> Orange (75%) -> Rouge (100%)
 */
export const getRiskColorFromScore = (score: number): string => {
  // Normaliser le score entre 0 et 1
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  if (normalizedScore <= 0.25) {
    // Vert à Vert clair (0% - 25%)
    const t = normalizedScore / 0.25;
    const r = Math.round(16 + (76 - 16) * t);
    const g = Math.round(185 + (200 - 185) * t);
    const b = Math.round(129 + (80 - 129) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedScore <= 0.5) {
    // Vert clair à Jaune (25% - 50%)
    const t = (normalizedScore - 0.25) / 0.25;
    const r = Math.round(76 + (251 - 76) * t);
    const g = Math.round(200 + (191 - 200) * t);
    const b = Math.round(80 + (36 - 80) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (normalizedScore <= 0.75) {
    // Jaune à Orange (50% - 75%)
    const t = (normalizedScore - 0.5) / 0.25;
    const r = Math.round(251 + (255 - 251) * t);
    const g = Math.round(191 + (152 - 191) * t);
    const b = Math.round(36 + (0 - 36) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange à Rouge (75% - 100%)
    const t = (normalizedScore - 0.75) / 0.25;
    const r = Math.round(255 + (220 - 255) * t);
    const g = Math.round(152 + (38 - 152) * t);
    const b = Math.round(0 + (38 - 0) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
};

export const getRiskColor = (level: RiskLevel): string => {
  switch (level) {
    case 'low':
      return '#10B981'; // Vert
    case 'medium':
      return '#FBBF24'; // Jaune
    case 'high':
      return '#FF9800'; // Orange
    case 'critical':
      return '#DC2626'; // Rouge
    default:
      return '#757575';
  }
};

export const getRiskLabel = (level: RiskLevel): string => {
  switch (level) {
    case 'low':
      return 'Faible';
    case 'medium':
      return 'Moyen';
    case 'high':
      return 'Élevé';
    case 'critical':
      return 'Critique';
    default:
      return 'Inconnu';
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
};

/**
 * Obtient la couleur de fond en fonction du score de risque
 */
export const getRiskBackgroundColor = (score: number): string => {
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  if (normalizedScore <= 0.25) {
    return 'from-green-50 to-green-100';
  } else if (normalizedScore <= 0.5) {
    return 'from-yellow-50 to-yellow-100';
  } else if (normalizedScore <= 0.75) {
    return 'from-orange-50 to-orange-100';
  } else {
    return 'from-red-50 to-red-100';
  }
};

/**
 * Obtient la couleur de texte en fonction du score de risque
 */
export const getRiskTextColor = (score: number): string => {
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  if (normalizedScore <= 0.25) {
    return 'text-green-800';
  } else if (normalizedScore <= 0.5) {
    return 'text-yellow-800';
  } else if (normalizedScore <= 0.75) {
    return 'text-orange-800';
  } else {
    return 'text-red-800';
  }
};

/**
 * Obtient la classe de badge en fonction du score de risque
 */
export const getRiskBadgeClass = (score: number): string => {
  const normalizedScore = Math.max(0, Math.min(1, score));
  
  if (normalizedScore <= 0.25) {
    return 'bg-green-100 text-green-700 border-green-300';
  } else if (normalizedScore <= 0.5) {
    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  } else if (normalizedScore <= 0.75) {
    return 'bg-orange-100 text-orange-700 border-orange-300';
  } else {
    return 'bg-red-100 text-red-700 border-red-300';
  }
};

/**
 * Formate une valeur numérique en affichant "NaN" si la valeur est null, undefined, ou NaN
 * @param value - Valeur à formater
 * @param decimals - Nombre de décimales (optionnel, défaut: 2)
 * @param unit - Unité à ajouter (optionnel)
 * @returns String formatée ou "NaN"
 */
export const formatNumber = (value: number | null | undefined, decimals: number = 2, unit: string = ''): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'NaN' + (unit ? ` ${unit}` : '');
  }
  const formatted = value.toFixed(decimals);
  return formatted + (unit ? ` ${unit}` : '');
};

/**
 * Formate une valeur numérique en pourcentage, affiche "NaN" si la valeur est invalide
 * @param value - Valeur à formater (0-1 ou 0-100)
 * @param decimals - Nombre de décimales (optionnel, défaut: 1)
 * @returns String formatée avec % ou "NaN"
 */
export const formatPercent = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return 'NaN';
  }
  // Si la valeur est entre 0 et 1, multiplier par 100
  const percentValue = value <= 1 ? value * 100 : value;
  return percentValue.toFixed(decimals) + '%';
};

/**
 * Vérifie si une valeur est valide (pas null, undefined, ou NaN)
 */
export const isValidNumber = (value: number | null | undefined): boolean => {
  return value !== null && value !== undefined && !isNaN(value);
};
