import { useParams, useNavigate } from 'react-router-dom';
import { ProductionLine } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Wifi, Gauge, Thermometer, Vibrate, Expand } from 'lucide-react';
import { getRiskColor, getRiskLabel, formatDate } from '../lib/utils';

interface LineDetailPageProps {
  lines: ProductionLine[];
}

export function LineDetailPage({ lines }: LineDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const line = lines.find(l => l.id === id);

  if (!line) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <Card className="border shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-base font-medium text-gray-500 dark:text-zinc-400">Ligne non trouvée</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Liste des paramètres à afficher avec leurs icônes
  const parameters = [
    { name: 'Pression', sensor: line.pressure, icon: Gauge, color: 'text-blue-600 dark:text-blue-400' },
    { name: 'Température', sensor: line.temperature, icon: Thermometer, color: 'text-red-600 dark:text-red-400' },
    { name: 'Vibration', sensor: line.vibration, icon: Vibrate, color: 'text-orange-600 dark:text-orange-400' },
    { name: 'Extension', sensor: line.level, icon: Expand, color: 'text-green-600 dark:text-green-400' }, // Utilisation du niveau comme "Extension"
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 mb-4 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>

          <Card className="border shadow-lg overflow-hidden bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <div
              className="h-2 w-full"
              style={{
                background: `linear-gradient(to right, ${getRiskColor(line.riskLevel)}, ${getRiskColor(line.riskLevel)}dd)`,
              }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                      {line.name}
                    </h1>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getRiskColor(line.riskLevel),
                        color: getRiskColor(line.riskLevel),
                        backgroundColor: getRiskColor(line.riskLevel) + '10',
                      }}
                    >
                      {getRiskLabel(line.riskLevel)}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 animate-pulse border-[#00843D] dark:border-[#00c853] text-[#00843D] dark:text-[#00c853]">
                      <Wifi className="w-3 h-3" />
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-zinc-400">{line.zone}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Score</p>
                  <p
                    className="text-4xl font-black transition-all duration-500"
                    style={{ color: getRiskColor(line.riskLevel) }}
                  >
                    {(line.maxRiskScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des paramètres - Chaque paramètre dans une carte avec icône */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parameters.map((param) => {
            const Icon = param.icon;
            return (
              <Card
                key={param.sensor.id}
                className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 cursor-pointer hover:scale-105"
                onClick={() => {
                  // Mapping des noms vers les slugs
                  const paramSlugMap: Record<string, string> = {
                    'Pression': 'pression',
                    'Température': 'temperature',
                    'Vibration': 'vibration',
                    'Extension': 'extension',
                  };
                  const paramSlug = paramSlugMap[param.name] || param.name.toLowerCase();
                  navigate(`/lines/${line.id}/parameter/${paramSlug}`);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Icône */}
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-zinc-900 ${param.color}`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    
                    {/* Informations */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
                        {param.name}
                      </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                        {param.sensor.value.toFixed(param.sensor.unit === '' ? 1 : param.sensor.unit === '°C' ? 0 : 1)}
                        {param.sensor.unit && <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400 font-normal">{param.sensor.unit}</span>}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-2 ${
                          param.sensor.status === 'error'
                            ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                            : param.sensor.status === 'warning'
                            ? 'border-yellow-500 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-green-500 text-green-500 bg-green-50 dark:bg-green-900/20'
                        }`}
                      >
                        {param.sensor.status === 'error'
                          ? 'Erreur'
                          : param.sensor.status === 'warning'
                          ? 'Avertissement'
                          : 'OK'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

