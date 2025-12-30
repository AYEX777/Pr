import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Radio, 
  Gauge, 
  Thermometer, 
  Droplet, 
  Activity,
  CheckCircle,
  AlertCircle,
  Settings,
  Calendar,
  TrendingUp,
  Download,
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { ProductionLine } from '../types';
import { getLineSensorThresholds, calibrateSensor } from '../lib/api';
import { toast } from 'sonner';

interface SensorStatus {
  status: 'operational' | 'warning' | 'error';
  lastCalibration: Date;
  nextCalibration: Date;
  accuracy: number;
}

interface SensorsViewProps {
  lines: ProductionLine[];
}

export function SensorsView({ lines }: SensorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sensorMetadata, setSensorMetadata] = useState<Map<string, { lastCalibration?: Date; nextCalibration?: Date; accuracy?: number }>>(new Map());

  useEffect(() => {
    const loadSensorMetadata = async () => {
      try {
        const metadataMap = new Map();
        for (const line of lines) {
          try {
            const thresholds = await getLineSensorThresholds(line.id);
            thresholds.forEach(st => {
              metadataMap.set(st.id, {
                lastCalibration: st.last_calibration ? new Date(st.last_calibration) : undefined,
                nextCalibration: st.next_calibration ? new Date(st.next_calibration) : undefined,
                accuracy: st.accuracy,
              });
            });
          } catch (error) {
            console.error(`Erreur lors du chargement des métadonnées pour la ligne ${line.id}:`, error);
          }
        }
        setSensorMetadata(metadataMap);
      } catch (error) {
        console.error('Erreur lors du chargement des métadonnées des capteurs:', error);
      }
    };

    if (lines.length > 0) {
      loadSensorMetadata();
    }
  }, [lines]);

  // Flatten all sensors with additional metadata - Directly from lines (4 capteurs seulement)
  const allSensors = useMemo(() => {
    return lines.flatMap(line => {
      // Extract individual sensors directly from line (4 capteurs)
      const sensors = [
        { ...line.pressure, type: 'pressure' },
        { ...line.temperature, type: 'temperature' },
        { ...line.vibration, type: 'vibration' },
        { ...line.level, type: 'level' }, // Extension
      ];
      
      return sensors.map(sensor => ({
        ...sensor,
        lineId: line.id,
        lineName: line.name,
        status: {
          status: sensor.status === 'error' ? 'error' as const : 
                  sensor.status === 'warning' ? 'warning' as const : 
                  'operational' as const,
          lastCalibration: new Date(), // Sera chargé depuis l'API
          nextCalibration: new Date(), // Sera chargé depuis l'API
          accuracy: 95, // Sera chargé depuis l'API
        } as SensorStatus
      }));
    });
  }, [lines]);

  // Apply filters
  const filteredSensors = useMemo(() => {
    return allSensors.filter(sensor => {
      if (searchQuery && !sensor.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !sensor.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && sensor.type !== typeFilter) return false;
      if (statusFilter !== 'all' && sensor.status.status !== statusFilter) return false;
      return true;
    });
  }, [allSensors, searchQuery, typeFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allSensors.length,
      operational: allSensors.filter(s => s.status.status === 'operational').length,
      warning: allSensors.filter(s => s.status.status === 'warning').length,
      error: allSensors.filter(s => s.status.status === 'error').length,
    };
  }, [allSensors]);

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
      case 'concentration':
        return <Activity className="w-5 h-5" />;
      case 'flow':
        return <TrendingUp className="w-5 h-5" />;
      case 'viscosity':
        return <Droplet className="w-5 h-5" />;
      case 'level':
        return <Gauge className="w-5 h-5" />;
      case 'conductivity':
        return <Activity className="w-5 h-5" />;
      case 'turbidity':
        return <Droplet className="w-5 h-5" />;
      case 'density':
        return <Gauge className="w-5 h-5" />;
      case 'vibration':
        return <Activity className="w-5 h-5" />;
      default:
        return <Radio className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'warning':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Opérationnel';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Erreur';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pressure':
        return 'Pression';
      case 'temperature':
        return 'Température';
      case 'volume':
        return 'Volume';
      case 'pH':
        return 'pH';
      case 'concentration':
        return 'Concentration';
      case 'flow':
        return 'Débit';
      case 'viscosity':
        return 'Viscosité';
      case 'level':
        return 'Niveau';
      case 'conductivity':
        return 'Conductivité';
      case 'turbidity':
        return 'Turbidité';
      case 'density':
        return 'Densité';
      case 'vibration':
        return 'Vibration';
      default:
        return type;
    }
  };

  const sensorsByType = useMemo(() => {
    const types = ['pressure', 'temperature', 'volume', 'pH', 'concentration', 'flow', 'viscosity', 'level', 'conductivity', 'turbidity', 'density', 'vibration'];
    return types.map(type => ({
      type,
      label: getTypeLabel(type),
      count: allSensors.filter(s => s.type === type).length,
    }));
  }, [allSensors]);

  const handleExportSensors = () => {
    if (filteredSensors.length === 0) {
      toast.error('Aucun capteur à exporter');
      return;
    }

    let csv = 'ID,Ligne,Nom,Type,Statut,Valeur,Unité,Dernière calibration,Prochaine calibration,Précision\n';

    filteredSensors.forEach(sensor => {
      const meta = sensorMetadata.get(sensor.id) || {};
      const cols = [
        sensor.id,
        sensor.lineName || '',
        sensor.name || '',
        getTypeLabel(sensor.type),
        getStatusLabel(sensor.status.status),
        sensor.value ?? '',
        sensor.unit ?? '',
        meta.lastCalibration ? meta.lastCalibration.toISOString() : '',
        meta.nextCalibration ? meta.nextCalibration.toISOString() : '',
        meta.accuracy ?? '',
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
    a.download = `capteurs-prisk-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Capteurs exportés en CSV');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Configuration des capteurs</h1>
          <p className="text-gray-600 dark:text-zinc-300">
            Gestion et calibration de {allSensors.length} capteurs
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={handleExportSensors}
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Total capteurs</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Radio className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Opérationnels</p>
                <p className="text-2xl text-green-600 dark:text-green-400">{stats.operational}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-300">Attention</p>
                <p className="text-2xl text-orange-600 dark:text-orange-400">{stats.warning}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-300">En erreur</p>
                <p className="text-2xl text-red-600 dark:text-red-400">{stats.error}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sensors by Type */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Répartition par type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sensorsByType.map((item) => (
              <div key={item.type} className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700">
                <div className="flex items-center gap-2 mb-2">
                  {getSensorIcon(item.type)}
                  <span className="text-sm text-gray-700 dark:text-white">{item.label}</span>
                </div>
                <p className="text-2xl text-gray-900 dark:text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher un capteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type de capteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="pressure">Pression</SelectItem>
                <SelectItem value="temperature">Température</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="pH">pH</SelectItem>
                <SelectItem value="concentration">Concentration</SelectItem>
                <SelectItem value="flow">Débit</SelectItem>
                <SelectItem value="viscosity">Viscosité</SelectItem>
                <SelectItem value="level">Niveau</SelectItem>
                <SelectItem value="conductivity">Conductivité</SelectItem>
                <SelectItem value="turbidity">Turbidité</SelectItem>
                <SelectItem value="density">Densité</SelectItem>
                <SelectItem value="vibration">Vibration</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="operational">Opérationnel</SelectItem>
                <SelectItem value="warning">Attention</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sensors List */}
      <div className="space-y-4">
        {filteredSensors.map((sensor) => (
          <Card key={`${sensor.lineId}-${sensor.id}`} className="hover:shadow-md transition-shadow bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  {getSensorIcon(sensor.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg text-gray-900 dark:text-zinc-100">{sensor.name}</h3>
                        <Badge variant="outline" className={getStatusColor(sensor.status.status)}>
                          {getStatusLabel(sensor.status.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(sensor.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        {sensor.lineName}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Valeur actuelle</p>
                        <p className="text-gray-900 dark:text-zinc-100 font-semibold">
                          {sensor.value.toFixed(2)} {sensor.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600 dark:text-zinc-400">Précision</p>
                        <p className="text-gray-900 dark:text-zinc-100">{sensor.status.accuracy.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600 dark:text-zinc-400">Dernière calibration</p>
                        <p className="text-gray-900 dark:text-zinc-100">{formatDate(sensor.status.lastCalibration)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-600 dark:text-zinc-400">Prochaine calibration</p>
                        <p className="text-gray-900 dark:text-zinc-100">{formatDate(sensor.status.nextCalibration)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurer
                    </Button>
                    <Button size="sm" variant="outline">
                      Calibrer maintenant
                    </Button>
                    <Button size="sm" variant="outline">
                      Voir historique
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSensors.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Radio className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun capteur trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
