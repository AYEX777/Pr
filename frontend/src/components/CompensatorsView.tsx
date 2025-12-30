import { useState, useMemo } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Gauge, AlertCircle, Thermometer, Droplet, Activity, Filter } from 'lucide-react';
import { ProductionLine } from '../types';
import { getRiskColor, getRiskLabel } from '../lib/utils';

interface CompensatorsViewProps {
  lines: ProductionLine[];
  onSelectCompensator: (lineId: string, compensatorId: string) => void;
}

export function CompensatorsView({ lines, onSelectCompensator }: CompensatorsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [lineFilter, setLineFilter] = useState<string>('all');

  // Flatten all compensators
  const allCompensators = useMemo(() => {
    return lines.flatMap(line =>
      line.compensators.map(comp => ({
        ...comp,
        lineId: line.id,
        lineName: line.name,
        zone: line.zone,
      }))
    );
  }, [lines]);

  // Apply filters
  const filteredCompensators = useMemo(() => {
    return allCompensators.filter(comp => {
      if (searchQuery && !comp.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !comp.lineName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (riskFilter !== 'all' && comp.riskLevel !== riskFilter) return false;
      if (lineFilter !== 'all' && comp.lineId !== lineFilter) return false;
      return true;
    });
  }, [allCompensators, searchQuery, riskFilter, lineFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: allCompensators.length,
      critical: allCompensators.filter(c => c.riskLevel === 'critical').length,
      high: allCompensators.filter(c => c.riskLevel === 'high').length,
      medium: allCompensators.filter(c => c.riskLevel === 'medium').length,
      low: allCompensators.filter(c => c.riskLevel === 'low').length,
    };
  }, [allCompensators]);

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'pressure':
        return <Gauge className="w-4 h-4" />;
      case 'temperature':
        return <Thermometer className="w-4 h-4" />;
      case 'volume':
        return <Droplet className="w-4 h-4" />;
      case 'pH':
        return <Activity className="w-4 h-4" />;
      default:
        return <Gauge className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 mb-2">Tous les compensateurs</h1>
        <p className="text-gray-600">
          Vue d'ensemble de {allCompensators.length} compensateurs sur {lines.length} lignes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl text-gray-900">{stats.total}</p>
              </div>
              <Gauge className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critiques</p>
                <p className="text-2xl text-red-600">{stats.critical}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Élevés</p>
                <p className="text-2xl text-orange-600">{stats.high}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Moyens</p>
                <p className="text-2xl text-yellow-600">{stats.medium}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Normaux</p>
                <p className="text-2xl text-green-600">{stats.low}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher un compensateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Toutes les lignes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les lignes</SelectItem>
                {lines.map(line => (
                  <SelectItem key={line.id} value={line.id}>
                    {line.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Niveau de risque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Compensators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCompensators.map((compensator) => (
          <Card
            key={`${compensator.lineId}-${compensator.id}`}
            className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
            style={{ borderLeftColor: getRiskColor(compensator.riskLevel) }}
            onClick={() => onSelectCompensator(compensator.lineId, compensator.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg text-gray-900 mb-1">{compensator.id}</h3>
                  <p className="text-sm text-gray-600">{compensator.lineName}</p>
                  <p className="text-xs text-gray-500">{compensator.zone}</p>
                </div>
                <Badge
                  style={{
                    backgroundColor: getRiskColor(compensator.riskLevel),
                    color: 'white',
                  }}
                >
                  {getRiskLabel(compensator.riskLevel)}
                </Badge>
              </div>

              {/* Risk Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Score de risque</span>
                  <span className="text-sm" style={{ color: getRiskColor(compensator.riskLevel) }}>
                    {(compensator.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${compensator.riskScore * 100}%`,
                      backgroundColor: getRiskColor(compensator.riskLevel),
                    }}
                  />
                </div>
              </div>

              {/* Sensors Grid */}
              <div className="grid grid-cols-2 gap-2">
                {compensator.sensors && compensator.sensors.length > 0 ? (
                  compensator.sensors.map((sensor) => (
                    <div
                      key={sensor.id}
                      className="p-2 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {getSensorIcon(sensor.type)}
                        <span className="text-xs text-gray-600">{sensor.name}</span>
                      </div>
                      <p className="text-sm text-gray-900">
                        {sensor.value} {sensor.unit}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-xs text-gray-500 py-2">
                    Aucun capteur disponible
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCompensator(compensator.lineId, compensator.id);
                }}
              >
                Voir détails
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCompensators.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Gauge className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Aucun compensateur trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
