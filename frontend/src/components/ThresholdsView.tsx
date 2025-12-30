import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { 
  Settings, 
  Gauge, 
  Thermometer, 
  Vibrate,
  Expand,
  Save,
  RotateCcw,
  Bell,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  Download,
} from 'lucide-react';
import { mockProductionLines } from '../lib/mockData';
import { ProductionLine, Sensor } from '../types';
import { toast } from 'sonner';
import { getLineSensorThresholds, updateSensorThresholdsConfig, SensorThresholdConfig } from '../lib/api';

interface ThresholdConfig {
  parameter: string;
  sensorKey: keyof ProductionLine;
  icon: any;
  unit: string;
  minWarning: number;
  maxWarning: number;
  minCritical: number;
  maxCritical: number;
  normalMin: number;
  normalMax: number;
  enabled: boolean;
}

const defaultThresholds: Record<string, Partial<ThresholdConfig>> = {
  pressure: {
    minWarning: 5.0,
    maxWarning: 7.5,
    minCritical: 3.0,
    maxCritical: 9.0,
    normalMin: 5.5,
    normalMax: 7.0,
  },
  temperature: {
    minWarning: 50,
    maxWarning: 80,
    minCritical: 40,
    maxCritical: 90,
    normalMin: 55,
    normalMax: 75,
  },
  vibration: {
    minWarning: 4.0,
    maxWarning: 6.5,
    minCritical: 2.0,
    maxCritical: 8.0,
    normalMin: 4.5,
    normalMax: 6.0,
  },
  level: {
    minWarning: 60,
    maxWarning: 85,
    minCritical: 50,
    maxCritical: 95,
    normalMin: 65,
    normalMax: 80,
  },
};

export function ThresholdsView() {
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([
    {
      parameter: 'Pression',
      sensorKey: 'pressure',
      icon: Gauge,
      unit: 'bar',
      minWarning: 5.0,
      maxWarning: 7.5,
      minCritical: 3.0,
      maxCritical: 9.0,
      normalMin: 5.5,
      normalMax: 7.0,
      enabled: true,
    },
    {
      parameter: 'Température',
      sensorKey: 'temperature',
      icon: Thermometer,
      unit: '°C',
      minWarning: 50,
      maxWarning: 80,
      minCritical: 40,
      maxCritical: 90,
      normalMin: 55,
      normalMax: 75,
      enabled: true,
    },
    {
      parameter: 'Vibration',
      sensorKey: 'vibration',
      icon: Vibrate,
      unit: 'mm/s',
      minWarning: 4.0,
      maxWarning: 6.5,
      minCritical: 2.0,
      maxCritical: 8.0,
      normalMin: 4.5,
      normalMax: 6.0,
      enabled: true,
    },
    {
      parameter: 'Extension',
      sensorKey: 'level',
      icon: Expand,
      unit: '%',
      minWarning: 60,
      maxWarning: 85,
      minCritical: 50,
      maxCritical: 95,
      normalMin: 65,
      normalMax: 80,
      enabled: true,
    },
  ]);

  const [selectedThreshold, setSelectedThreshold] = useState<ThresholdConfig | null>(thresholds[0] || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonctions helper - définies avant useEffect pour éviter les erreurs
  const getIconForType = (type: string) => {
    switch (type) {
      case 'pressure': return Gauge;
      case 'temperature': return Thermometer;
      case 'vibration': return Vibrate;
      case 'level': return Expand;
      default: return Gauge;
    }
  };

  const getUnitForType = (type: string) => {
    switch (type) {
      case 'pressure': return 'bar';
      case 'temperature': return '°C';
      case 'vibration': return 'mm/s';
      case 'level': return '%';
      default: return '';
    }
  };

  useEffect(() => {
    const loadThresholds = async () => {
      try {
        setLoading(true);
        // Charger les lignes depuis l'API
        const { fetchDashboardData } = await import('../lib/api');
        const dashboardData = await fetchDashboardData();
        setLines(dashboardData.lines);

        // Charger les seuils pour la première ligne par défaut
        if (dashboardData.lines.length > 0) {
          try {
            const lineId = dashboardData.lines[0].id;
            const sensorThresholds = await getLineSensorThresholds(lineId);

            // Convertir les seuils API en format ThresholdConfig
            const convertedThresholds: ThresholdConfig[] = sensorThresholds.map(st => {
              const type = st.type as keyof typeof defaultThresholds;
              const defaults = defaultThresholds[type] || defaultThresholds.pressure;

              const toNumber = (v: any, fallback: number) => {
                if (v === null || v === undefined || v === '') return fallback;
                const n = typeof v === 'number' ? v : parseFloat(v as string);
                return Number.isFinite(n) ? n : fallback;
              };

              return {
                parameter: st.name || st.type,
                sensorKey: st.type as keyof ProductionLine,
                icon: getIconForType(st.type),
                unit: getUnitForType(st.type),
                minWarning: toNumber(st.min_warning, defaults.minWarning),
                maxWarning: toNumber(st.max_warning, defaults.maxWarning),
                minCritical: toNumber(st.min_critical, defaults.minCritical),
                maxCritical: toNumber(st.max_critical, defaults.maxCritical),
                normalMin: toNumber(st.normal_min, defaults.normalMin),
                normalMax: toNumber(st.normal_max, defaults.normalMax),
                enabled: st.threshold_enabled !== false,
              };
            });

            if (convertedThresholds.length > 0) {
              setThresholds(convertedThresholds);
              setSelectedThreshold(convertedThresholds[0]);
              setError(null);
            } else {
              // Si aucun seuil n'est retourné, utiliser les seuils par défaut
              console.warn('Aucun seuil retourné par l\'API, utilisation des seuils par défaut');
              setError(null);
            }
          } catch (thresholdError: any) {
            console.warn('Erreur lors du chargement des seuils depuis l\'API, utilisation des seuils par défaut:', thresholdError);
            setError(`Impossible de charger les seuils depuis l'API: ${thresholdError?.message || 'Erreur inconnue'}. Utilisation des valeurs par défaut.`);
            // Continuer avec les seuils par défaut déjà initialisés
          }
        } else {
          setError('Aucune ligne de production trouvée');
        }
      } catch (error: any) {
        console.error('❌ Erreur lors du chargement des données:', error);
        console.error('Détails de l\'erreur:', error?.message, error?.stack);
        setError(`Impossible de charger les données: ${error?.message || 'Erreur inconnue'}`);
        toast.error(`Impossible de charger les seuils: ${error?.message || 'Erreur inconnue'}`);
      } finally {
        setLoading(false);
      }
    };

    loadThresholds();
  }, []);

  const handleThresholdChange = (field: keyof ThresholdConfig, value: any) => {
    if (!selectedThreshold) return;
    const updated = {
      ...selectedThreshold,
      [field]: value,
    };
    setSelectedThreshold(updated);
    setThresholds(thresholds.map(t => 
      t.parameter === selectedThreshold.parameter ? updated : t
    ));
  };

  const handleSave = async () => {
    if (!selectedThreshold) return;

    try {
      // Trouver le capteur correspondant
      const line = lines.find(l => {
        const sensor = l[selectedThreshold.sensorKey] as Sensor;
        return sensor && sensor.id;
      });

      if (!line) {
        toast.error('Ligne non trouvée');
        return;
      }

      const sensor = line[selectedThreshold.sensorKey] as Sensor;
      await updateSensorThresholdsConfig(sensor.id, {
        min_warning: selectedThreshold.minWarning,
        max_warning: selectedThreshold.maxWarning,
        min_critical: selectedThreshold.minCritical,
        max_critical: selectedThreshold.maxCritical,
        normal_min: selectedThreshold.normalMin,
        normal_max: selectedThreshold.normalMax,
        threshold_enabled: selectedThreshold.enabled,
      });

      toast.success('Seuils sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des seuils:', error);
      toast.error('Impossible de sauvegarder les seuils');
    }
  };

  const handleReset = () => {
    if (!selectedThreshold) return;
    const defaultConfig = defaultThresholds[selectedThreshold.sensorKey];
    if (defaultConfig) {
      const reset = {
        ...selectedThreshold,
        ...defaultConfig,
      };
      setSelectedThreshold(reset);
      setThresholds(thresholds.map(t => 
        t.parameter === selectedThreshold.parameter ? reset : t
      ));
      toast.success('Seuils réinitialisés');
    }
  };

  // Visualisation des seuils
  const renderThresholdScale = () => {
    if (!selectedThreshold) return null;
    
    const min = selectedThreshold.minCritical - (selectedThreshold.maxCritical - selectedThreshold.minCritical) * 0.2;
    const max = selectedThreshold.maxCritical + (selectedThreshold.maxCritical - selectedThreshold.minCritical) * 0.2;
    const range = max - min;

    const getPosition = (value: number) => ((value - min) / range) * 100;

    return (
      <div className="space-y-4">
        {/* Scale Bar */}
        <div className="relative h-24 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border-2 border-gray-200 dark:border-zinc-700 p-4 overflow-hidden">
          {/* Zones colorées */}
          <div className="absolute inset-0 flex">
            {/* Critique bas */}
            <div 
              className="bg-gradient-to-r from-red-600 to-red-500 opacity-30"
              style={{ width: `${getPosition(selectedThreshold.minCritical)}%` }}
            />
            {/* Avertissement bas */}
            <div 
              className="bg-gradient-to-r from-orange-500 to-orange-400 opacity-30"
              style={{ width: `${getPosition(selectedThreshold.minWarning) - getPosition(selectedThreshold.minCritical)}%` }}
            />
            {/* Normal */}
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 opacity-40 relative"
              style={{ width: `${getPosition(selectedThreshold.normalMax) - getPosition(selectedThreshold.normalMin)}%` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-green-800 dark:text-green-200 bg-white/90 dark:bg-zinc-800/90 px-2 py-1 rounded">
                  OPTIMAL
                </span>
              </div>
            </div>
            {/* Avertissement haut */}
            <div 
              className="bg-gradient-to-r from-orange-400 to-orange-500 opacity-30"
              style={{ width: `${getPosition(selectedThreshold.maxWarning) - getPosition(selectedThreshold.normalMax)}%` }}
            />
            {/* Critique haut */}
            <div 
              className="bg-gradient-to-r from-red-500 to-red-600 opacity-30"
              style={{ width: `${100 - getPosition(selectedThreshold.maxCritical)}%` }}
            />
          </div>

          {/* Marqueurs */}
          <div className="absolute inset-0">
            {[
              { value: selectedThreshold.minCritical, label: 'Crit. min', color: 'red' },
              { value: selectedThreshold.minWarning, label: 'Avert. min', color: 'orange' },
              { value: selectedThreshold.normalMin, label: 'Opt. min', color: 'green' },
              { value: selectedThreshold.normalMax, label: 'Opt. max', color: 'green' },
              { value: selectedThreshold.maxWarning, label: 'Avert. max', color: 'orange' },
              { value: selectedThreshold.maxCritical, label: 'Crit. max', color: 'red' },
            ].map((marker, idx) => (
              <div
                key={idx}
                className={`absolute top-0 bottom-0 w-0.5 ${
                  marker.color === 'red' ? 'bg-red-600' :
                  marker.color === 'orange' ? 'bg-orange-500' :
                  'bg-green-600'
                }`}
                style={{ left: `${getPosition(marker.value)}%` }}
              >
                <div className={`absolute -top-2 -left-2 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-800 shadow-lg ${
                  marker.color === 'red' ? 'bg-red-600' :
                  marker.color === 'orange' ? 'bg-orange-500' :
                  'bg-green-600'
                }`} />
                <div className={`absolute ${idx < 3 ? 'bottom-full mb-2' : 'top-full mt-2'} -left-12 w-24 text-center`}>
                  <div className={`text-xs font-bold ${
                    marker.color === 'red' ? 'text-red-600 dark:text-red-400' :
                    marker.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {marker.value.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-zinc-400">{marker.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-zinc-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00843D] dark:border-[#00c853] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-zinc-400">Chargement des seuils...</p>
        </div>
      </div>
    );
  }

  if (!selectedThreshold) {
    return (
      <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-zinc-900 min-h-screen">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">Aucun seuil disponible</h2>
          <p className="text-gray-600 dark:text-zinc-400 mb-4">
            {error || 'Aucun seuil n\'a pu être chargé. Veuillez vérifier votre connexion au serveur.'}
          </p>
          <Button onClick={() => window.location.reload()} className="gap-2 bg-[#00843D] hover:bg-[#00c853] text-white">
            <RotateCcw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  const Icon = selectedThreshold.icon;

  const handleExportThresholds = () => {
    if (thresholds.length === 0) {
      toast.error('Aucun seuil à exporter');
      return;
    }

    let csv = 'Paramètre,Type,Min avertissement,Max avertissement,Min critique,Max critique,Min normal,Max normal,Actif\n';

    thresholds.forEach((t) => {
      const cols = [
        t.parameter,
        t.sensorKey,
        t.minWarning,
        t.maxWarning,
        t.minCritical,
        t.maxCritical,
        t.normalMin,
        t.normalMax,
        t.enabled ? 'oui' : 'non',
      ].map((value) =>
        `"${(value ?? '')
          .toString()
          .replace(/"/g, '""')}"`
      );
      csv += cols.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seuils-prisk-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Seuils exportés en CSV');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-zinc-900 min-h-screen">
      {error && (
        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Seuils d'alerte</h1>
          <p className="text-gray-600 dark:text-zinc-400">
            Configuration des seuils d'alerte pour les paramètres de production
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 px-4 py-2 border-[#00843D] dark:border-[#00c853] text-[#00843D] dark:text-[#00c853]">
            <TrendingUp className="w-4 h-4" />
            {thresholds.filter(t => t.enabled).length} / {thresholds.length} actifs
          </Badge>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExportThresholds}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Paramètres Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {thresholds.map((threshold) => {
          const ThresholdIcon = threshold.icon;
          return (
            <Card
              key={threshold.parameter}
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedThreshold.parameter === threshold.parameter
                  ? 'ring-2 ring-[#00843D] dark:ring-[#00c853] shadow-lg bg-[#00843D]/5 dark:bg-[#00c853]/10 border-[#00843D] dark:border-[#00c853]'
                  : 'border-gray-200 dark:border-zinc-700 hover:border-[#00843D]/50 dark:hover:border-[#00c853]/50 bg-white dark:bg-zinc-800'
              }`}
              onClick={() => setSelectedThreshold(threshold)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
                    <ThresholdIcon className="w-5 h-5" />
                    <span className="font-semibold">{threshold.parameter}</span>
                  </div>
                  <Badge 
                    variant={threshold.enabled ? 'default' : 'outline'}
                    className={threshold.enabled ? 'bg-[#00843D] hover:bg-[#00c853] text-white' : ''}
                  >
                    {threshold.enabled ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                {/* Mini gradient bar */}
                <div className="relative h-2 rounded-full overflow-hidden mb-3 bg-gray-200 dark:bg-zinc-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-400 via-green-500 via-orange-400 to-red-500" />
                  <div 
                    className="absolute h-full bg-white/60 dark:bg-zinc-800/60 border-x-2 border-[#00843D] dark:border-[#00c853]"
                    style={{ 
                      left: `${((threshold.normalMin - threshold.minCritical) / (threshold.maxCritical - threshold.minCritical)) * 100}%`,
                      width: `${((threshold.normalMax - threshold.normalMin) / (threshold.maxCritical - threshold.minCritical)) * 100}%`
                    }}
                  />
                </div>

                <div className="text-xs text-gray-600 dark:text-zinc-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Optimal:</span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {threshold.normalMin.toFixed(1)} - {threshold.normalMax.toFixed(1)} {threshold.unit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <Card className="lg:col-span-2 shadow-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <CardHeader className="border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
              <Icon className="w-5 h-5 text-[#00843D] dark:text-[#00c853]" />
              Configuration - {selectedThreshold.parameter}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#00843D]/10 to-[#00c853]/10 dark:from-[#00843D]/20 dark:to-[#00c853]/20 rounded-xl border border-[#00843D]/20 dark:border-[#00c853]/20">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedThreshold.enabled ? 'bg-[#00843D] dark:bg-[#00c853]' : 'bg-gray-400'
                }`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Label className="text-base text-gray-900 dark:text-zinc-100">Activer les alertes</Label>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {selectedThreshold.enabled ? 'Les alertes sont actives' : 'Les alertes sont désactivées'}
                  </p>
                </div>
              </div>
              <Switch
                checked={selectedThreshold.enabled}
                onCheckedChange={(checked) => handleThresholdChange('enabled', checked)}
              />
            </div>

            {/* Normal Range */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00843D] dark:text-[#00c853]" />
                <h3 className="text-gray-900 dark:text-zinc-100 font-semibold">Zone optimale</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Minimum optimal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.normalMin}
                      onChange={(e) => handleThresholdChange('normalMin', parseFloat(e.target.value))}
                      className="flex-1 border-[#00843D]/30 dark:border-[#00c853]/30 focus:border-[#00843D] dark:focus:border-[#00c853]"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Maximum optimal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.normalMax}
                      onChange={(e) => handleThresholdChange('normalMax', parseFloat(e.target.value))}
                      className="flex-1 border-[#00843D]/30 dark:border-[#00c853]/30 focus:border-[#00843D] dark:focus:border-[#00c853]"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#00843D]/10 dark:bg-[#00c853]/10 border border-[#00843D]/20 dark:border-[#00c853]/20 rounded-lg">
                <p className="text-sm text-[#00843D] dark:text-[#00c853]">
                  <strong>Zone de sécurité optimale</strong> - Aucune alerte n'est générée dans cette plage
                </p>
              </div>
            </div>

            {/* Warning Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-gray-900 dark:text-zinc-100 font-semibold">Seuils d'avertissement</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Minimum avertissement</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.minWarning}
                      onChange={(e) => handleThresholdChange('minWarning', parseFloat(e.target.value))}
                      className="flex-1 border-orange-300 dark:border-orange-700 focus:border-orange-600 dark:focus:border-orange-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Maximum avertissement</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.maxWarning}
                      onChange={(e) => handleThresholdChange('maxWarning', parseFloat(e.target.value))}
                      className="flex-1 border-orange-300 dark:border-orange-700 focus:border-orange-600 dark:focus:border-orange-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  <strong>Surveillance accrue</strong> - Alertes d'avertissement pour prévenir les risques
                </p>
              </div>
            </div>

            {/* Critical Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-gray-900 dark:text-zinc-100 font-semibold">Seuils critiques</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Minimum critique</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.minCritical}
                      onChange={(e) => handleThresholdChange('minCritical', parseFloat(e.target.value))}
                      className="flex-1 border-red-300 dark:border-red-700 focus:border-red-600 dark:focus:border-red-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-zinc-300">Maximum critique</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedThreshold.maxCritical}
                      onChange={(e) => handleThresholdChange('maxCritical', parseFloat(e.target.value))}
                      className="flex-1 border-red-300 dark:border-red-700 focus:border-red-600 dark:focus:border-red-400"
                    />
                    <span className="text-sm text-gray-600 dark:text-zinc-400 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>Intervention immédiate</strong> - Alertes critiques nécessitant une action urgente
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-zinc-700">
              <Button 
                onClick={handleSave} 
                className="gap-2 bg-[#00843D] hover:bg-[#00c853] text-white"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card className="shadow-lg border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
          <CardHeader className="border-b border-gray-200 dark:border-zinc-700 bg-gradient-to-r from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-800">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
              <Settings className="w-5 h-5" />
              Visualisation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderThresholdScale()}
            
            {/* Legend */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200 dark:border-zinc-700 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-[#00843D] to-[#00c853] rounded shadow" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-400 rounded shadow" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Avertissement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-red-600 to-red-500 rounded shadow" />
                <span className="text-sm text-gray-700 dark:text-zinc-300">Critique</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-300">
                  <p className="font-semibold mb-1">Plages de fonctionnement</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Zone optimale :</strong> Fonctionnement idéal sans risque</li>
                    <li>• <strong>Avertissement :</strong> Surveillance accrue requise</li>
                    <li>• <strong>Critique :</strong> Intervention immédiate nécessaire</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
