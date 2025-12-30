/**
 * Mock API Client - Uses mockData instead of backend calls
 * All functions return mock data with simulated delays
 */

import { mockProductionLines, mockAlerts } from './mockData';
import { ProductionLine, Sensor, Alert } from '../types';

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Store for mock data that can be modified
let mockDataStore = {
  lines: [...mockProductionLines],
  alerts: [...mockAlerts],
  interventions: [
    {
      id: 'int-1',
      compensator_id: null,
      line_id: 'line-A',
      title: 'Maintenance préventive - Ligne A',
      type: 'preventive',
      status: 'planned',
      description: 'Vérification et nettoyage des capteurs de pression et température',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'int-2',
      compensator_id: null,
      line_id: 'line-B',
      title: 'Remplacement filtre - Ligne B',
      type: 'corrective',
      status: 'in_progress',
      description: 'Remplacement du filtre principal suite à détection de bouchage',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'int-3',
      compensator_id: null,
      line_id: 'line-C',
      title: 'Calibration capteurs - Ligne C',
      type: 'preventive',
      status: 'completed',
      description: 'Calibration complète de tous les capteurs de la ligne',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ] as any[],
  users: [] as any[],
  sensors: [] as any[],
};

// ---------------------------------------------------------------------------
// Dashboard Data
// ---------------------------------------------------------------------------
export interface DashboardResponse {
  success: boolean;
  data: {
    lines: ProductionLine[];
    alerts: Alert[];
  };
}

// ---------------------------------------------------------------------------
// Helpers: résolution de l'URL d'API et en-têtes communs
// ---------------------------------------------------------------------------

function resolveApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;

  // Environnement Capacitor natif (APK mobile)
  const isCapacitorNative =
    typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol === 'capacitor:';

  if (isCapacitorNative) {
    // Sur mobile, on passe par le tunnel Ngrok
    return 'https://troglodytical-elizbeth-meanwhile.ngrok-free.dev';
  }

  // Sur le web (PC), on se connecte au backend sur la machine locale
  // Cela évite les problèmes lorsque l'adresse IP du réseau (ex: 10.25.x.x) change
  return 'http://localhost:3000';
}

function buildJsonHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Fetch dashboard data from API
 */
export async function fetchDashboardData(): Promise<{ lines: ProductionLine[]; alerts: Alert[] }> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    console.log(`🔗 Tentative de connexion à: ${apiUrl}/api/lines`);

    // Récupérer les lignes depuis l'API
    const linesResponse = await fetch(`${apiUrl}/api/lines`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    }).catch((error) => {
      console.error('❌ Erreur de connexion fetch:', error);
      throw new Error(`Impossible de se connecter au serveur: ${error.message}. Vérifiez que le backend est démarré sur ${apiUrl}`);
    });

    if (!linesResponse.ok) {
      const errorText = await linesResponse.text().catch(() => 'Erreur inconnue');
      console.error(`❌ Erreur HTTP ${linesResponse.status}:`, errorText);
      throw new Error(`Erreur HTTP: ${linesResponse.status} - ${errorText}`);
    }

    const lines = await linesResponse.json();

    // Récupérer les alertes depuis l'API
    const alertsResponse = await fetch(`${apiUrl}/api/alerts`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    let alerts: Alert[] = [];
    if (alertsResponse.ok) {
      const alertsData = await alertsResponse.json();
      if (alertsData.success && alertsData.data) {
        // Convertir le format de l'API vers le format frontend
        alerts = alertsData.data.map((alert: any) => ({
          id: alert.id,
          lineId: alert.line_id,
          level: alert.severity as 'info' | 'warning' | 'critical',
          message: alert.message,
          timestamp: new Date(alert.created_at),
          acknowledged: alert.acknowledged,
        }));
      }
    }

    return {
      lines: lines,
      alerts: alerts,
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des données:', error);
    console.error('Message d\'erreur détaillé:', error?.message);
    // Fallback vers un tableau vide en cas d'erreur
    return {
      lines: [],
      alerts: [],
    };
  }
}

/**
 * Récupère toutes les alertes non acquittées depuis l'API
 */
export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/alerts`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return [];
    }

    // Convertir le format de l'API vers le format frontend
    return result.data.map((alert: any) => ({
      id: alert.id,
      lineId: alert.line_id,
      level: alert.severity as 'info' | 'warning' | 'critical',
      message: alert.message,
      timestamp: new Date(alert.created_at),
      acknowledged: alert.acknowledged,
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Interventions
// ---------------------------------------------------------------------------
export interface InterventionPayload {
  compensator_id?: string;
  line_id?: string;
  title?: string;
  type: string;
  status?: string;
  description?: string;
  technician_name?: string;
}

export interface Intervention {
  id: string;
  compensator_id: string | null;
  line_id?: string;
  title: string | null;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
}

export async function fetchInterventions(): Promise<Intervention[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/interventions`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return [];
    }

    // Convertir le format de l'API vers le format frontend
    return result.data.map((intervention: any) => ({
      id: intervention.id,
      compensator_id: null, // Plus utilisé
      line_id: intervention.line_id || null,
      title: intervention.description.substring(0, 50) + (intervention.description.length > 50 ? '...' : ''), // Utiliser description comme titre
      type: intervention.status === 'completed' ? 'preventive' : intervention.status === 'in_progress' ? 'corrective' : 'preventive', // Mapper le statut
      status: intervention.status === 'planned' ? 'planned' : intervention.status === 'in_progress' ? 'in_progress' : 'completed',
      description: intervention.description,
      created_at: new Date(intervention.date || intervention.created_at).toISOString(),
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des interventions:', error);
    // Fallback vers les données mockées en cas d'erreur
    return mockDataStore.interventions;
  }
}

export async function createIntervention(payload: InterventionPayload): Promise<Intervention> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    // Convertir le format frontend vers le format API
    const apiPayload = {
      line_id: payload.line_id || null,
      description: payload.description || payload.title || '',
      technician_name: payload.technician_name || 'Technicien', // Utiliser le technician_name du payload ou valeur par défaut
      status: payload.status || 'planned',
      date: new Date().toISOString(),
    };

    console.log('[API] Création intervention:', { apiUrl, payload: apiPayload, hasToken: !!token });

    // Vérifier que le token existe
    if (!token) {
      console.error('[API] Token manquant - l\'utilisateur doit être connecté');
      throw new Error('Vous devez être connecté pour créer une intervention');
    }

    console.log('[API] Création intervention - Token présent:', !!token);

    const response = await fetch(`${apiUrl}/api/interventions`, {
      method: 'POST',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify(apiPayload),
    }).catch((fetchError) => {
      console.error('[API] Erreur de fetch:', fetchError);
      throw new Error(`Impossible de se connecter au serveur. Vérifiez que le backend est démarré sur ${apiUrl}`);
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Erreur HTTP: ${response.status}`;
      console.error('[API] Erreur de réponse:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    // Convertir le format de l'API vers le format frontend
    const intervention = result.data;
    return {
      id: intervention.id,
      compensator_id: null,
      line_id: intervention.line_id || null,
      title: intervention.description.substring(0, 50) + (intervention.description.length > 50 ? '...' : ''),
      type: intervention.status === 'completed' ? 'preventive' : intervention.status === 'in_progress' ? 'corrective' : 'preventive',
      status: intervention.status === 'planned' ? 'planned' : intervention.status === 'in_progress' ? 'in_progress' : 'completed',
      description: intervention.description,
      created_at: new Date(intervention.date || intervention.created_at).toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'intervention:', error);
    throw error;
  }
}

export async function updateInterventionStatus(id: string, status: string): Promise<Intervention> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/interventions/${id}/status`, {
      method: 'PATCH',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    // Convertir le format de l'API vers le format frontend
    const intervention = result.data;
    return {
      id: intervention.id,
      compensator_id: null,
      line_id: intervention.line_id || null,
      title: intervention.description.substring(0, 50) + (intervention.description.length > 50 ? '...' : ''),
      type: intervention.status === 'completed' ? 'preventive' : intervention.status === 'in_progress' ? 'corrective' : 'preventive',
      status: intervention.status === 'planned' ? 'planned' : intervention.status === 'in_progress' ? 'in_progress' : 'completed',
      description: intervention.description,
      created_at: new Date(intervention.date || intervention.created_at).toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}

export async function updateIntervention(
  id: string,
  payload: { line_id?: string | null; description?: string; status?: string }
): Promise<Intervention> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/interventions/${id}`, {
      method: 'PUT',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    const intervention = result.data;
    return {
      id: intervention.id,
      compensator_id: null,
      line_id: intervention.line_id || null,
      title:
        intervention.description.substring(0, 50) +
        (intervention.description.length > 50 ? '...' : ''),
      type:
        intervention.status === 'completed'
          ? 'preventive'
          : intervention.status === 'in_progress'
          ? 'corrective'
          : 'preventive',
      status:
        intervention.status === 'planned'
          ? 'planned'
          : intervention.status === 'in_progress'
          ? 'in_progress'
          : 'completed',
      description: intervention.description,
      created_at: new Date(intervention.date || intervention.created_at).toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'intervention:', error);
    throw error;
  }
}

export async function deleteIntervention(id: string): Promise<void> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/interventions/${id}`, {
      method: 'DELETE',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'intervention:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export async function fetchUsers(): Promise<User[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data.map((user: any) => ({
      id: user.id,
      name: user.full_name || user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    throw error;
  }
}

export async function createUser(payload: UserPayload): Promise<User> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users`, {
      method: 'POST',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify({
        full_name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role || 'operator',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    const user = result.data;
    return {
      id: user.id,
      name: user.full_name || user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users/${id}`, {
      method: 'DELETE',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    throw error;
  }
}

export async function updateUserRole(id: string, role: string): Promise<User> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users/${id}/role`, {
      method: 'PATCH',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    const user = result.data;
    return {
      id: user.id,
      name: user.full_name || user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Risk Scoring (Mock - returns calculated values from mock data)
// ---------------------------------------------------------------------------
export interface RiskScoreResult {
  lineId: string;
  lineName?: string;
  location?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  maxCompensatorScore: number;
  compensators: Array<{
    compensatorId: string;
    compensatorName: string;
    riskScore: number;
    riskLevel: string;
    parameterScores: Record<string, any>;
  }>;
  parameters?: any[];
  calculatedAt: string;
}

export interface LineParameters {
  lineId: string;
  parameters: Array<{
    compensatorId: string;
    compensatorName: string;
    sensors: Record<string, {
      value: number;
      unit: string;
      threshold_warning: number;
      threshold_critical: number;
      last_updated: string;
    }>;
  }>;
  extractedAt: string;
}

export async function calculateLineRiskScore(lineId: string): Promise<RiskScoreResult> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/lines/${lineId}`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    const line = result.data;

    if (!line) {
      throw new Error('Ligne non trouvée');
    }

    const calculatedAt =
      line.lastUpdate ? new Date(line.lastUpdate).toISOString() : new Date().toISOString();

    return {
      lineId: line.id,
      lineName: line.name,
      location: line.zone,
      riskScore: line.maxRiskScore,
      riskLevel: line.riskLevel,
      maxCompensatorScore: line.maxRiskScore,
      compensators: [],
      calculatedAt,
    };
  } catch (error) {
    console.error(
      'Erreur lors du calcul du score de risque depuis l’API, utilisation des données mock:',
      error
    );
    await delay(300);
    const line = mockDataStore.lines.find(l => l.id === lineId);
    if (!line) {
      throw new Error('Line not found');
    }

    return {
      lineId: line.id,
      lineName: line.name,
      location: line.zone,
      riskScore: line.maxRiskScore,
      riskLevel: line.riskLevel,
      maxCompensatorScore: line.maxRiskScore,
      compensators: [],
      calculatedAt: new Date().toISOString(),
    };
  }
}

export async function calculateAllLinesRiskScores(): Promise<RiskScoreResult[]> {
  try {
    const { lines } = await fetchDashboardData();

    return lines.map((line: any) => {
      const calculatedAt =
        line.lastUpdate ? new Date(line.lastUpdate).toISOString() : new Date().toISOString();

      return {
        lineId: line.id,
        lineName: line.name,
        location: line.zone,
        riskScore: line.maxRiskScore,
        riskLevel: line.riskLevel,
        maxCompensatorScore: line.maxRiskScore,
        compensators: [],
        calculatedAt,
      };
    });
  } catch (error) {
    console.error(
      'Erreur lors du calcul des scores de risque depuis l’API, utilisation des données mock:',
      error
    );
    await delay(400);
    return mockDataStore.lines.map(line => ({
      lineId: line.id,
      lineName: line.name,
      location: line.zone,
      riskScore: line.maxRiskScore,
      riskLevel: line.riskLevel,
      maxCompensatorScore: line.maxRiskScore,
      compensators: [],
      calculatedAt: new Date().toISOString(),
    }));
  }
}

export async function extractLineParameters(lineId: string): Promise<LineParameters> {
  try {
    const { lines } = await fetchDashboardData();
    const line = lines.find((l: any) => l.id === lineId);

    if (!line) {
      throw new Error('Line not found');
    }

    const safeLastUpdate = (value: any) =>
      value ? new Date(value).toISOString() : new Date().toISOString();

    return {
      lineId: line.id,
      parameters: [
        {
          compensatorId: line.id,
          compensatorName: line.name,
          sensors: {
            pressure: {
              value: line.pressure.value,
              unit: line.pressure.unit,
              threshold_warning: line.pressure.threshold * 0.8,
              threshold_critical: line.pressure.threshold,
              last_updated: safeLastUpdate(line.pressure.lastUpdate),
            },
            temperature: {
              value: line.temperature.value,
              unit: line.temperature.unit,
              threshold_warning: line.temperature.threshold * 0.8,
              threshold_critical: line.temperature.threshold,
              last_updated: safeLastUpdate(line.temperature.lastUpdate),
            },
            vibration: {
              value: line.vibration.value,
              unit: line.vibration.unit,
              threshold_warning: line.vibration.threshold * 0.8,
              threshold_critical: line.vibration.threshold,
              last_updated: safeLastUpdate(line.vibration.lastUpdate),
            },
            level: {
              value: line.level.value,
              unit: line.level.unit,
              threshold_warning: line.level.threshold * 0.8,
              threshold_critical: line.level.threshold,
              last_updated: safeLastUpdate(line.level.lastUpdate),
            },
          },
        },
      ],
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      'Erreur lors de l’extraction des paramètres depuis l’API, utilisation des données mock:',
      error
    );
    await delay(300);
    const line = mockDataStore.lines.find(l => l.id === lineId);
    if (!line) {
      throw new Error('Line not found');
    }

    return {
      lineId: line.id,
      parameters: [
        {
          compensatorId: line.id,
          compensatorName: line.name,
          sensors: {
            pressure: {
              value: line.pressure.value,
              unit: line.pressure.unit,
              threshold_warning: line.pressure.threshold * 0.8,
              threshold_critical: line.pressure.threshold,
              last_updated: line.pressure.lastUpdate.toISOString(),
            },
            temperature: {
              value: line.temperature.value,
              unit: line.temperature.unit,
              threshold_warning: line.temperature.threshold * 0.8,
              threshold_critical: line.temperature.threshold,
              last_updated: line.temperature.lastUpdate.toISOString(),
            },
            vibration: {
              value: line.vibration.value,
              unit: line.vibration.unit,
              threshold_warning: line.vibration.threshold * 0.8,
              threshold_critical: line.vibration.threshold,
              last_updated: line.vibration.lastUpdate.toISOString(),
            },
            level: {
              value: line.level.value,
              unit: line.level.unit,
              threshold_warning: line.level.threshold * 0.8,
              threshold_critical: line.level.threshold,
              last_updated: line.level.lastUpdate.toISOString(),
            },
          },
        },
      ],
      extractedAt: new Date().toISOString(),
    };
  }
}

export async function updateRiskScores(lineId?: string): Promise<{ success: boolean; updated: number; timestamp: string }> {
  await delay(500);
  return {
    success: true,
    updated: lineId ? 1 : mockDataStore.lines.length,
    timestamp: new Date().toISOString(),
  };
}

export interface HistoryDataPoint {
  time: string; // Format HH:MM
  timestamp: string; // ISO string
  pressure: number | null;
  temperature: number | null;
  vibration: number | null;
  level: number | null;
}

export interface ParameterHistoryPoint {
  timestamp: Date;
  value: number;
  unit: string;
}

/**
 * Récupère l'historique complet des 4 capteurs d'une ligne
 * Formaté pour Recharts avec tous les paramètres dans un seul objet
 */
export async function getLineHistory(lineId: string): Promise<HistoryDataPoint[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/lines/${lineId}/history`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return [];
    }

    return result.data as HistoryDataPoint[];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    return [];
  }
}

export async function getParameterHistory(
  lineId: string,
  paramType: string,
  hours: number = 24,
  limit: number = 100
): Promise<ParameterHistoryPoint[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/lines/${lineId}/history`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      return [];
    }

    // Mapper les données de l'API vers le format ParameterHistoryPoint
    // L'API retourne un tableau avec time, timestamp, pressure, temperature, vibration, level
    const paramMap: Record<string, keyof typeof result.data[0]> = {
      'pression': 'pressure',
      'pressure': 'pressure',
      'temperature': 'temperature',
      'vibration': 'vibration',
      'extension': 'level',
      'level': 'level',
    };

    const paramKey = paramMap[paramType.toLowerCase()] || paramType.toLowerCase();
    
    return result.data
      .filter((point: any) => point[paramKey] !== null && point[paramKey] !== undefined)
      .map((point: any) => ({
        timestamp: new Date(point.timestamp),
        value: point[paramKey] as number,
        unit: '', // L'unité sera récupérée depuis le capteur
      }));
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
}

// ---------------------------------------------------------------------------
// Sensors / Thresholds
// ---------------------------------------------------------------------------
export interface SensorThreshold {
  id: string;
  compensator_id: string;
  type: string;
  unit: string;
  threshold_warning: number | null;
  threshold_critical: number | null;
  current_value: number | null;
  last_updated: string;
}

export async function fetchSensors(): Promise<SensorThreshold[]> {
  await delay(200);
  const sensors: SensorThreshold[] = [];
  mockDataStore.lines.forEach(line => {
    // 4 capteurs seulement : pressure, temperature, vibration, level
    const sensorTypes = ['pressure', 'temperature', 'vibration', 'level'] as const;
    sensorTypes.forEach(type => {
      const sensor = line[type] as Sensor;
      if (sensor) {
        sensors.push({
          id: sensor.id,
          compensator_id: line.id, // Utiliser line.id comme compensator_id pour compatibilité
          type: type,
          unit: sensor.unit,
          threshold_warning: sensor.threshold * 0.8,
          threshold_critical: sensor.threshold,
          current_value: sensor.value,
          last_updated: sensor.lastUpdate.toISOString(),
        });
      }
    });
  });
  return sensors;
}

export async function updateSensorThresholds(
  id: string,
  payload: { threshold_warning?: number; threshold_critical?: number }
): Promise<SensorThreshold> {
  await delay(300);
  // In a real implementation, this would update the sensor thresholds
  // For mock, we'll just return a mock sensor
  return {
    id,
    compensator_id: '',
    type: '',
    unit: '',
    threshold_warning: payload.threshold_warning || null,
    threshold_critical: payload.threshold_critical || null,
    current_value: null,
    last_updated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export interface Report {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface ReportsSummary {
  generated_at: string;
  period: {
    start: string;
    end: string;
  };
  alerts: {
    total: number;
    unacknowledged: number;
    critical: number;
    by_line: Array<{
      line_id: string;
      total: number;
      critical: number;
      warning: number;
      unacknowledged: number;
    }>;
  };
  interventions: {
    completed: number;
  };
  risk_scores: {
    global_average: number;
    by_line: Array<{
      line_id: string;
      avg_risk_score: number;
    }>;
  };
}

/**
 * Récupère le rapport de statistiques depuis l'API
 */
export async function getReportsSummary(): Promise<ReportsSummary> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/reports/summary`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    return result.data as ReportsSummary;
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error);
    throw error;
  }
}

/**
 * Télécharge le rapport au format JSON
 */
export function downloadReportAsJSON(data: ReportsSummary, fileName?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `rapport-prisk-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Télécharge le rapport au format CSV
 */
export function downloadReportAsCSV(data: ReportsSummary): void {
  let csv = 'Rapport PRISK - Statistiques\n';
  csv += `Généré le: ${new Date(data.generated_at).toLocaleString('fr-FR')}\n`;
  csv += `Période: ${new Date(data.period.start).toLocaleString('fr-FR')} - ${new Date(data.period.end).toLocaleString('fr-FR')}\n\n`;
  
  csv += 'Alertes\n';
  csv += `Total,Non acquittées,Critiques\n`;
  csv += `${data.alerts.total},${data.alerts.unacknowledged},${data.alerts.critical}\n\n`;
  
  csv += 'Alertes par ligne\n';
  csv += 'Ligne,Total,Critiques,Avertissements,Non acquittées\n';
  data.alerts.by_line.forEach(line => {
    csv += `${line.line_id},${line.total},${line.critical},${line.warning},${line.unacknowledged}\n`;
  });
  
  csv += '\nInterventions\n';
  csv += `Terminées\n${data.interventions.completed}\n\n`;
  
  csv += 'Scores de risque (moyenne 24h)\n';
  csv += `Moyenne globale,${(data.risk_scores.global_average * 100).toFixed(2)}%\n`;
  csv += 'Ligne,Score moyen\n';
  data.risk_scores.by_line.forEach(line => {
    csv += `${line.line_id},${(line.avg_risk_score * 100).toFixed(2)}%\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rapport-prisk-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function generateReport(payload: { name?: string; metadata?: any } = {}): Promise<Report> {
  await delay(1000);
  return {
    id: `report-${Date.now()}`,
    name: payload.name || `Report ${new Date().toLocaleDateString()}`,
    status: 'completed',
    created_at: new Date().toISOString(),
  };
}

export async function downloadReport(id: string): Promise<Blob> {
  await delay(500);
  // Return a mock PDF blob
  const content = `Mock Report ${id}\nGenerated at ${new Date().toISOString()}`;
  return new Blob([content], { type: 'text/plain' });
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------
export async function createAlert(payload: {
  compensator_id?: string | null;
  sensor_id?: string | null;
  severity?: 'info' | 'warning' | 'critical';
  message: string;
}): Promise<any> {
  await delay(300);
  const newAlert: Alert = {
    id: `alert-${Date.now()}`,
    lineId: '', // Aucun identifiant de ligne disponible dans le mock
    level: payload.severity || 'info',
    message: payload.message,
    timestamp: new Date(),
    acknowledged: false,
  };
  mockDataStore.alerts.push(newAlert);
  return newAlert;
}

export async function acknowledgeAlert(id: string): Promise<any> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/alerts/${id}/acknowledge`, {
      method: 'PATCH',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Réponse invalide du serveur');
    }

    // Convertir le format de l'API vers le format frontend
    return {
      id: result.data.id,
      lineId: result.data.line_id,
      level: result.data.severity as 'info' | 'warning' | 'critical',
      message: result.data.message,
      timestamp: new Date(result.data.created_at),
      acknowledged: result.data.acknowledged,
    };
  } catch (error) {
    console.error('Erreur lors de l\'acquittement de l\'alerte:', error);
    throw error;
  }
}

// Export acknowledgeAlert as apiAcknowledgeAlert for compatibility
export const apiAcknowledgeAlert = acknowledgeAlert;

// ---------------------------------------------------------------------------
// Auth (Mock - always succeeds)
// ---------------------------------------------------------------------------
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const apiUrl = resolveApiUrl();

  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `Erreur HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // ignore JSON parsing error, keep default message
    }
    throw new Error(message);
  }

  const data = await response.json();

  const token = data.token as string | undefined;
  if (!token) {
    throw new Error('Token manquant dans la réponse du serveur');
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('token', token);
  }

  return {
    token,
    user: {
      id: data.id,
      name: data.full_name || data.email,
      email: data.email,
      role: data.role,
    },
  };
}

export async function logout(): Promise<void> {
  await delay(200);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
  }
}

// ---------------------------------------------------------------------------
// Historical Data
// ---------------------------------------------------------------------------
export interface HistoricalDataPoint {
  id: string;
  line_id: string;
  line_name?: string;
  location?: string;
  timestamp: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  pressure: number | null;
  temperature: number | null;
  volume: number | null;
  ph: number | null;
  concentration: number | null;
  viscosity: number | null;
  density: number | null;
  vibration: number | null;
  level: number | null;
  compensator_count: number;
  created_at: string;
}

export interface ParameterStatistics {
  average: number | null;
  stddev: number | null;
  min: number | null;
  max: number | null;
  count: number;
}

export interface AggregatedStatistics {
  total_records: number;
  period_start: string | null;
  period_end: string | null;
  risk_score: {
    average: number;
    stddev: number;
    min: number;
    max: number;
  };
  parameters: {
    pressure: ParameterStatistics;
    temperature: ParameterStatistics;
    vibration: ParameterStatistics;
    level: ParameterStatistics;
  };
}

export interface HistoricalDataResponse {
  success: boolean;
  data: HistoricalDataPoint[];
  count: number;
  statistics?: AggregatedStatistics;
}

export interface HistoricalDataFilters {
  id_ligne?: string;
  date_debut?: string | Date;
  date_fin?: string | Date;
  limit?: number;
  include_statistics?: boolean;
}

export async function getHistoricalData(filters: HistoricalDataFilters = {}): Promise<HistoricalDataResponse> {
  await delay(400);
  const data: HistoricalDataPoint[] = [];
  
  // Generate mock historical data based on current lines
  mockDataStore.lines.forEach(line => {
    if (filters.id_ligne && line.id !== filters.id_ligne) return;
    
    for (let i = 0; i < (filters.limit || 10); i++) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000); // 1 hour intervals
      data.push({
        id: `hist-${line.id}-${i}`,
        line_id: line.id,
        line_name: line.name,
        location: line.zone,
        timestamp: timestamp.toISOString(),
        risk_score: line.maxRiskScore + (Math.random() - 0.5) * 0.1,
        risk_level: line.riskLevel,
        pressure: line.pressure.value || null,
        temperature: line.temperature.value || null,
        volume: null,
        ph: null,
        concentration: null,
        viscosity: null,
        density: null,
        vibration: line.vibration.value || null,
        level: line.level.value || null,
        compensator_count: 0,
        created_at: timestamp.toISOString(),
      });
    }
  });
  
  return {
    success: true,
    data,
    count: data.length,
  };
}

export async function getHistoricalStatistics(filters: Omit<HistoricalDataFilters, 'limit' | 'include_statistics'> = {}): Promise<AggregatedStatistics> {
  await delay(300);
  return {
    total_records: 0,
    period_start: null,
    period_end: null,
    risk_score: {
      average: 0.5,
      stddev: 0.2,
      min: 0.1,
      max: 0.9,
    },
    parameters: {
      pressure: { average: null, stddev: null, min: null, max: null, count: 0 },
      temperature: { average: null, stddev: null, min: null, max: null, count: 0 },
      vibration: { average: null, stddev: null, min: null, max: null, count: 0 },
      level: { average: null, stddev: null, min: null, max: null, count: 0 },
    },
  };
}

// ---------------------------------------------------------------------------
// User Profile
// ---------------------------------------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface UserStats {
  alerts_processed: number;
  interventions: number;
  avg_response_time_minutes: number;
  resolution_rate_percent: number;
}

export async function getCurrentUser(): Promise<UserProfile> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users/me`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    throw error;
  }
}

export async function getCurrentUserStats(): Promise<UserStats> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users/me/stats`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
}

export async function updateCurrentUserProfile(data: { full_name?: string; email?: string }): Promise<UserProfile> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/users/me`, {
      method: 'PATCH',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
export interface HistoryEvent {
  id: string;
  type: 'alert' | 'intervention' | 'info';
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  lineId?: string;
  user?: string;
  timestamp: string;
  acknowledged?: boolean;
  status?: string;
}

export async function getHistory(params?: {
  type?: 'alert' | 'intervention' | 'info' | 'all';
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<HistoryEvent[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${apiUrl}/api/history?${queryParams.toString()}`, {
      method: 'GET',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    throw error;
  }
}

export async function createHistoryEvent(data: {
  description: string;
  entity_type?: string;
  entity_id?: string;
  timestamp?: string;
}): Promise<HistoryEvent> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/history/events`, {
      method: 'POST',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
}

export async function deleteHistoryEvent(id: string): Promise<void> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/history/events/${id}`, {
      method: 'DELETE',
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Comparative History
// ---------------------------------------------------------------------------
export interface ComparativeHistoryData {
  comparative: Array<Record<string, any>>;
  lines: Array<{
    id: string;
    name: string;
    data: Array<{ date: string; fullDate: string; score: number; lineName: string }>;
  }>;
}

export async function getComparativeHistory(params?: {
  lines?: string[];
  startDate?: string;
  endDate?: string;
  days?: number;
}): Promise<ComparativeHistoryData> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const queryParams = new URLSearchParams();
    if (params?.lines && params.lines.length > 0) queryParams.append('lines', params.lines.join(','));
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.days) queryParams.append('days', params.days.toString());

    const response = await fetch(
      `${apiUrl}/api/lines/history/comparative?${queryParams.toString()}`,
      {
        headers: buildJsonHeaders(token || undefined),
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique comparatif:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Reports - Detailed
// ---------------------------------------------------------------------------
export async function getProductionReport(period: '7d' | '30d' | '90d' = '7d'): Promise<any[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/reports/production?period=${period}`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de production:', error);
    throw error;
  }
}

export async function getAlertsDistribution(): Promise<Array<{ name: string; value: number; color: string }>> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/reports/alerts/distribution`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération de la distribution des alertes:', error);
    throw error;
  }
}

export async function getInterventionsTypes(): Promise<Array<{ type: string; count: number; color: string }>> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/reports/interventions/types`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des types d\'interventions:', error);
    throw error;
  }
}

export async function getAvailabilityReport(months: number = 6): Promise<Array<{ month: string; taux: number }>> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/reports/availability?months=${months}`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport de disponibilité:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Sensor Thresholds
// ---------------------------------------------------------------------------
export interface SensorThresholdConfig {
  id: string;
  line_id: string;
  type: string;
  name: string;
  threshold: number;
  min_warning?: number;
  max_warning?: number;
  min_critical?: number;
  max_critical?: number;
  normal_min?: number;
  normal_max?: number;
  threshold_enabled?: boolean;
  last_calibration?: string;
  next_calibration?: string;
  accuracy?: number;
}

export async function getSensorThresholds(sensorId: string): Promise<SensorThresholdConfig> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/sensors/${sensorId}/thresholds`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des seuils:', error);
    throw error;
  }
}

export async function getLineSensorThresholds(lineId: string): Promise<SensorThresholdConfig[]> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/sensors/line/${lineId}`, {
      headers: buildJsonHeaders(token || undefined),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des seuils de ligne:', error);
    throw error;
  }
}

export async function updateSensorThresholdsConfig(
  sensorId: string,
  thresholds: {
    min_warning?: number;
    max_warning?: number;
    min_critical?: number;
    max_critical?: number;
    normal_min?: number;
    normal_max?: number;
    threshold_enabled?: boolean;
  }
): Promise<SensorThresholdConfig> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/sensors/${sensorId}/thresholds`, {
      method: 'PUT',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify(thresholds),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des seuils:', error);
    throw error;
  }
}

export async function calibrateSensor(
  sensorId: string,
  accuracy: number,
  next_calibration?: string
): Promise<SensorThresholdConfig> {
  try {
    const apiUrl = resolveApiUrl();
    const token = localStorage.getItem('token');

    const response = await fetch(`${apiUrl}/api/sensors/${sensorId}/calibrate`, {
      method: 'POST',
      headers: buildJsonHeaders(token || undefined),
      body: JSON.stringify({ accuracy, next_calibration }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la calibration:', error);
    throw error;
  }
}
