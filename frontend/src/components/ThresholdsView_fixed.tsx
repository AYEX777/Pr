import { useEffect, useState } from 'react';
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
  Droplet, 
  Activity, 
  Save,
  RotateCcw,
  Bell,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';
import { fetchSensors, updateSensorThresholds } from '../lib/api';
import { toast } from 'sonner';
import { formatNumber } from '../lib/utils';

interface Threshold {
  id: string;
  sensorType: string;
  parameter: string;
  unit: string;
  minWarning: number;
  maxWarning: number;
  minCritical: number;
  maxCritical: number;
  normalMin: number;
  normalMax: number;
  enabled: boolean;
  autoAck: boolean;
}

export function ThresholdsView() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [selectedThreshold, setSelectedThreshold] = useState<Threshold | null>(null);

  const load = async () => {
    try {
      const sensors = await fetchSensors();
      const mapped: Threshold[] = (sensors || []).map((s) => ({
        id: s.id,
        sensorType: s.type,
        parameter: s.type.charAt(0).toUpperCase() + s.type.slice(1),
        unit: s.unit,
        minWarning: s.threshold_warning ?? 0,
        maxWarning: s.threshold_warning ?? 0,
        minCritical: s.threshold_critical ?? 0,
        maxCritical: s.threshold_critical ?? 0,
        normalMin: s.threshold_warning ?? 0,
        normalMax: s.threshold_warning ?? 0,
        enabled: true,
        autoAck: false,
      }));
      setThresholds(mapped || []);
      setSelectedThreshold(mapped && mapped.length > 0 ? mapped[0] : null);
    } catch (err) {
      console.error('Failed to load sensors', err);
      toast.error('Impossible de charger les seuils');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'pressure':
        return <Gauge className="w-5 h-5" />;
      case 'temperature':
        return <Thermometer className="w-5 h-5" />;
      case 'volume':
        return <Droplet className="w-5 h-5" />;
      case 'pH':
        return <Activity className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const handleThresholdChange = (field: string, value: any) => {
    if (!selectedThreshold) return;
    setSelectedThreshold({
      ...selectedThreshold,
      [field]: value,
    });
  };

  const handleSave = () => {
    if (!selectedThreshold) return;
    setThresholds(thresholds.map(t => 
      t.id === selectedThreshold.id ? selectedThreshold : t
    ));
    updateSensorThresholds(selectedThreshold.id, {
      threshold_warning: selectedThreshold.maxWarning,
      threshold_critical: selectedThreshold.maxCritical,
    })
      .then(() => toast.success('Seuils sauvegardés'))
      .catch((err) => {
        console.error('Failed to save thresholds', err);
        toast.error('Échec de la sauvegarde');
      });
  };

  const handleReset = () => {
    if (!selectedThreshold) return;
    const original = thresholds.find(t => t.id === selectedThreshold.id);
    if (original) setSelectedThreshold(original);
  };

  // Calculate scale for visualization
  const getScalePosition = (value: number, min: number, max: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const renderThresholdVisualization = () => {
    if (!selectedThreshold) return null;
    const min = selectedThreshold.minCritical - 10;
    const max = selectedThreshold.maxCritical + 10;
    
    const criticalMinPos = getScalePosition(selectedThreshold.minCritical || 0, min, max);
    const warningMinPos = getScalePosition(selectedThreshold.minWarning || 0, min, max);
    const normalMinPos = getScalePosition(selectedThreshold.normalMin || 0, min, max);
    const normalMaxPos = getScalePosition(selectedThreshold.normalMax || 0, min, max);
    const warningMaxPos = getScalePosition(selectedThreshold.maxWarning || 0, min, max);
    const criticalMaxPos = getScalePosition(selectedThreshold.maxCritical || 100, min, max);

    return (
      <div className="space-y-6">
        {/* Horizontal Scale Visualization */}
        <div className="relative h-32 bg-gradient-to-b from-gray-50 to-white rounded-xl border-2 border-gray-200 p-4">
          <div className="relative h-full">
            {/* Scale background */}
            <div className="absolute inset-0 flex">
              {/* Critical low zone */}
              <div 
                style={{ width: `${criticalMinPos}%` }}
                className="bg-gradient-to-r from-red-600 to-red-500 opacity-20"
              />
              {/* Warning low zone */}
              <div 
                style={{ width: `${warningMinPos - criticalMinPos}%` }}
                className="bg-gradient-to-r from-orange-500 to-yellow-400 opacity-20"
              />
              {/* Pre-normal zone */}
              <div 
                style={{ width: `${normalMinPos - warningMinPos}%` }}
                className="bg-gradient-to-r from-yellow-400 to-green-400 opacity-20"
              />
              {/* Normal zone */}
              <div 
                style={{ width: `${normalMaxPos - normalMinPos}%` }}
                className="bg-green-500 opacity-30 relative"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-800 bg-white/80 px-2 py-1 rounded">
                    ZONE OPTIMALE
                  </span>
                </div>
              </div>
              {/* Post-normal zone */}
              <div 
                style={{ width: `${warningMaxPos - normalMaxPos}%` }}
                className="bg-gradient-to-r from-green-400 to-yellow-400 opacity-20"
              />
              {/* Warning high zone */}
              <div 
                style={{ width: `${criticalMaxPos - warningMaxPos}%` }}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20"
              />
              {/* Critical high zone */}
              <div 
                style={{ width: `${100 - criticalMaxPos}%` }}
                className="bg-gradient-to-r from-orange-500 to-red-600 opacity-20"
              />
            </div>

            {/* Threshold markers */}
            <div className="absolute inset-0">
              {/* Critical Min */}
              <div 
                className="absolute h-full w-0.5 bg-red-600"
                style={{ left: `${criticalMinPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute bottom-full mb-1 -left-8 w-16 text-center">
                  <div className="text-xs font-bold text-red-600">{selectedThreshold.minCritical}</div>
                  <div className="text-[10px] text-gray-600 dark:text-zinc-400">Crit. min</div>
                </div>
              </div>

              {/* Warning Min */}
              <div 
                className="absolute h-full w-0.5 bg-orange-500"
                style={{ left: `${warningMinPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute top-full mt-1 -left-8 w-16 text-center">
                  <div className="text-xs font-bold text-orange-600">{formatNumber(selectedThreshold.minWarning, 1)}</div>
                  <div className="text-[10px] text-gray-600">Avert. min</div>
                </div>
              </div>

              {/* Normal Min */}
              <div 
                className="absolute h-full w-0.5 bg-green-600"
                style={{ left: `${normalMinPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg" />
              </div>

              {/* Normal Max */}
              <div 
                className="absolute h-full w-0.5 bg-green-600"
                style={{ left: `${normalMaxPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow-lg" />
              </div>

              {/* Warning Max */}
              <div 
                className="absolute h-full w-0.5 bg-orange-500"
                style={{ left: `${warningMaxPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute top-full mt-1 -left-8 w-16 text-center">
                  <div className="text-xs font-bold text-orange-600">{formatNumber(selectedThreshold.maxWarning, 1)}</div>
                  <div className="text-[10px] text-gray-600 dark:text-zinc-400">Avert. max</div>
                </div>
              </div>

              {/* Critical Max */}
              <div 
                className="absolute h-full w-0.5 bg-red-600"
                style={{ left: `${criticalMaxPos}%` }}
              >
                <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-lg" />
                <div className="absolute bottom-full mb-1 -left-8 w-16 text-center">
                  <div className="text-xs font-bold text-red-600">{formatNumber(selectedThreshold.maxCritical, 1)}</div>
                  <div className="text-[10px] text-gray-600 dark:text-zinc-400">Crit. max</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value labels */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <span className="text-gray-600 dark:text-zinc-400">Valeur min</span>
            <span className="font-bold">{formatNumber(min, 1)} {selectedThreshold.unit || ''}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <span className="text-gray-600 dark:text-zinc-400">Valeur max</span>
            <span className="font-bold">{formatNumber(max, 1)} {selectedThreshold.unit || ''}</span>
          </div>
        </div>

        {/* Vertical Bar Visualization */}
        <div className="border-t pt-6">
          <div className="flex items-end justify-center gap-4 h-64">
            {/* Critical Min Bar */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-center text-gray-600 dark:text-zinc-400 mb-1">Critique<br/>min</div>
              <div className="w-12 bg-gradient-to-t from-red-600 to-red-500 rounded-t-lg shadow-lg flex items-end justify-center pb-2" 
                   style={{ height: `${maxCritical > 0 ? ((minCritical / maxCritical) * 100) : 0}%` }}>
                <span className="text-xs font-bold text-white transform -rotate-90 whitespace-nowrap origin-center translate-y-4">
                  {formatNumber(selectedThreshold.minCritical, 1)}
                </span>
              </div>
            </div>

            {/* Warning Min Bar */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-center text-gray-600 mb-1">Avert.<br/>min</div>
              <div className="w-12 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg shadow-lg flex items-end justify-center pb-2" 
                   style={{ height: `${maxCritical > 0 ? (((selectedThreshold.minWarning || 0) / maxCritical) * 100) : 0}%` }}>
                <span className="text-xs font-bold text-white transform -rotate-90 whitespace-nowrap origin-center translate-y-4">
                  {formatNumber(selectedThreshold.minWarning, 1)}
                </span>
              </div>
            </div>

            {/* Normal Range Bar */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-center text-green-700 mb-1 font-bold">Zone<br/>optimale</div>
              <div className="w-16 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg shadow-xl relative" 
                   style={{ height: `${maxCritical > 0 ? ((((selectedThreshold.normalMin || 0) + (selectedThreshold.normalMax || 0)) / 2 / maxCritical) * 100) : 0}%` }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6 mb-1" />
                  <span className="text-xs font-bold">{formatNumber(selectedThreshold.normalMin, 1)}</span>
                  <span className="text-[10px]">à</span>
                  <span className="text-xs font-bold">{formatNumber(selectedThreshold.normalMax, 1)}</span>
                </div>
              </div>
            </div>

            {/* Warning Max Bar */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-center text-gray-600 dark:text-zinc-400 mb-1">Avert.<br/>max</div>
              <div className="w-12 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg shadow-lg flex items-end justify-center pb-2" 
                   style={{ height: `${maxCritical > 0 ? (((selectedThreshold.maxWarning || 0) / maxCritical) * 100) : 0}%` }}>
                <span className="text-xs font-bold text-white transform -rotate-90 whitespace-nowrap origin-center translate-y-4">
                  {selectedThreshold.maxWarning}
                </span>
              </div>
            </div>

            {/* Critical Max Bar */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs text-center text-gray-600 dark:text-zinc-400 mb-1">Critique<br/>max</div>
              <div className="w-12 bg-gradient-to-t from-red-600 to-red-500 rounded-t-lg shadow-lg flex items-end justify-center pb-2" 
                   style={{ height: `100%` }}>
                <span className="text-xs font-bold text-white transform -rotate-90 whitespace-nowrap origin-center translate-y-4">
                  {formatNumber(selectedThreshold.maxCritical, 1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-green-600 to-green-400 rounded shadow" />
            <span className="text-sm text-gray-700 dark:text-white">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-400 rounded shadow" />
            <span className="text-sm text-gray-700 dark:text-white">Avertissement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-red-600 to-red-500 rounded shadow" />
            <span className="text-sm text-gray-700 dark:text-white">Critique</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Plages de fonctionnement</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Zone optimale :</strong> Fonctionnement idéal sans risque</li>
                <li>• <strong>Avertissement :</strong> Surveillance accrue requise</li>
                <li>• <strong>Critique :</strong> Intervention immédiate nécessaire</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedThreshold) {
    return (
      <div className="p-6">
        <p className="text-gray-600 dark:text-zinc-400">Chargement des seuils...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900 mb-2">Configuration des seuils d'alerte</h1>
            <p className="text-gray-600">
              Gestion des seuils d'alerte pour les capteurs industriels
            </p>
          </div>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <TrendingUp className="w-4 h-4" />
            {(thresholds?.filter(t => t.enabled).length || 0)} / {thresholds?.length || 0} actifs
          </Badge>
        </div>
      </div>

      {/* Sensor Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {(!thresholds || thresholds.length === 0) ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Aucun seuil configuré</p>
            </CardContent>
          </Card>
        ) : (
          thresholds.map((threshold) => (
                      <Card
            key={threshold.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedThreshold.id === threshold.id
                ? 'ring-2 ring-green-600 shadow-lg bg-gradient-to-br from-white to-green-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedThreshold(threshold)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-900">
                  {getSensorIcon(threshold.sensorType)}
                  <span className="font-semibold">{threshold.parameter}</span>
                </div>
                <Badge 
                  variant={threshold.enabled ? 'default' : 'outline'}
                  className={threshold.enabled ? 'bg-green-600' : ''}
                >
                  {threshold.enabled ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              
              {/* Mini gradient bar */}
              <div className="relative h-3 rounded-full overflow-hidden mb-3 shadow-inner">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-yellow-400 to-red-500" />
                {/* Normal range indicator */}
                <div 
                  className="absolute h-full bg-white/40 border-x-2 border-green-600"
                  style={{ 
                    left: `${(threshold.maxCritical || 100) > 0 ? (((threshold.normalMin || 0) / (threshold.maxCritical || 100)) * 100) : 0}%`,
                    width: `${(threshold.maxCritical || 100) > 0 ? ((((threshold.normalMax || 0) - (threshold.normalMin || 0)) / (threshold.maxCritical || 100)) * 100) : 0}%`
                  }}
                />
              </div>

              <div className="text-xs text-gray-600 dark:text-zinc-400 space-y-1.5">
                <div className="flex justify-between items-center bg-green-50 rounded px-2 py-1">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Optimal:
                  </span>
                  <span className="font-semibold text-green-700">
                    {formatNumber(threshold.normalMin, 1)} - {formatNumber(threshold.normalMax, 1)} {threshold.unit || ''}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-orange-50 rounded px-2 py-1">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Avert.:
                  </span>
                  <span className="font-semibold text-orange-700">
                    {threshold.minWarning} - {threshold.maxWarning} {threshold.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-red-50 rounded px-2 py-1">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                    Critique:
                  </span>
                  <span className="font-semibold text-red-700">
                    {"<"} {formatNumber(threshold.minCritical, 1)} ou {">"} {formatNumber(threshold.maxCritical, 1)} {threshold.unit || ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
            </Card>
          ))
        )}
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings */}
        <Card className="lg:col-span-3 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center gap-2">
              {getSensorIcon(selectedThreshold.sensorType)}
              Configuration - {selectedThreshold.parameter}
              <span className="text-sm text-gray-500 ml-2">({selectedThreshold.id})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedThreshold.enabled ? 'bg-green-600' : 'bg-gray-400'
                }`}>
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <Label className="text-base text-gray-900 dark:text-white">Activer les alertes</Label>
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
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="text-gray-900 font-semibold">Zone optimale de fonctionnement</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-white">Minimum optimal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.normalMin}
                      onChange={(e) => handleThresholdChange('normalMin', parseFloat(e.target.value))}
                      className="flex-1 border-green-300 focus:border-green-600 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-white">Maximum optimal</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.normalMax}
                      onChange={(e) => handleThresholdChange('normalMax', parseFloat(e.target.value))}
                      className="flex-1 border-green-300 focus:border-green-600 focus:ring-green-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Zone de sécurité optimale</strong> - Aucune alerte n'est générée dans cette plage
                </p>
              </div>
            </div>

            {/* Warning Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-600" />
                <h3 className="text-gray-900 dark:text-white font-semibold">Seuils d'avertissement</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700 dark:text-white">Minimum avertissement</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.minWarning}
                      onChange={(e) => handleThresholdChange('minWarning', parseFloat(e.target.value))}
                      className="flex-1 border-orange-300 focus:border-orange-600 focus:ring-orange-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Maximum avertissement</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.maxWarning}
                      onChange={(e) => handleThresholdChange('maxWarning', parseFloat(e.target.value))}
                      className="flex-1 border-orange-300 focus:border-orange-600 focus:ring-orange-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Surveillance accrue</strong> - Alertes d'avertissement pour prévenir les risques
                </p>
              </div>
            </div>

            {/* Critical Thresholds */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-gray-900 font-semibold">Seuils critiques</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Minimum critique</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.minCritical}
                      onChange={(e) => handleThresholdChange('minCritical', parseFloat(e.target.value))}
                      className="flex-1 border-red-300 focus:border-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-700">Maximum critique</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={selectedThreshold.maxCritical}
                      onChange={(e) => handleThresholdChange('maxCritical', parseFloat(e.target.value))}
                      className="flex-1 border-red-300 focus:border-red-600 focus:ring-red-600"
                    />
                    <span className="text-sm text-gray-600 w-12 font-semibold">{selectedThreshold.unit}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Intervention immédiate</strong> - Alertes critiques nécessitant une action urgente
                </p>
              </div>
            </div>

            {/* Auto-acknowledgement */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <Label className="text-base text-gray-900">Acquittement automatique</Label>
                <p className="text-sm text-gray-600">
                  Acquitter automatiquement lorsque la valeur revient à la normale
                </p>
              </div>
              <Switch
                checked={selectedThreshold.autoAck}
                onCheckedChange={(checked) => handleThresholdChange('autoAck', checked)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={handleSave} 
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Enregistrer les modifications
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Visualisation des seuils
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {renderThresholdVisualization()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
