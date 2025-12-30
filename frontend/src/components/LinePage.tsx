import { ProductionLine } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Wifi } from 'lucide-react';
import { getRiskColor, getRiskLabel, formatDate } from '../lib/utils';

interface LinePageProps {
  line: ProductionLine;
  onBack: () => void;
  onSelectCompensator: (compensatorId: string) => void;
}

export function LinePage({ line, onBack, onSelectCompensator }: LinePageProps) {

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 mb-4 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Button>

          <Card className="border-0 shadow-lg overflow-hidden">
            <div 
              className="h-2 w-full"
              style={{ 
                background: `linear-gradient(to right, ${getRiskColor(line.riskLevel)}, ${getRiskColor(line.riskLevel)}dd)`
              }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl text-gray-900">{line.name}</h1>
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
                    <Badge variant="outline" className="gap-1.5 animate-pulse border-green-500 text-green-700">
                      <Wifi className="w-3 h-3" />
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-gray-600">{line.zone}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Score</p>
                  <p
                    className="text-4xl transition-all duration-500"
                    style={{ color: getRiskColor(line.riskLevel) }}
                  >
                    {(line.maxRiskScore * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Paramètres de la ligne */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">Pression:</span>
                <span className="text-gray-900 font-semibold">
                  {line.pressure.value.toFixed(1)} {line.pressure.unit}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">Température:</span>
                <span className="text-gray-900 font-semibold">
                  {line.temperature.value.toFixed(0)} {line.temperature.unit}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">pH:</span>
                <span className="text-gray-900 font-semibold">
                  {line.pH.value.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">Volume:</span>
                <span className="text-gray-900 font-semibold">
                  {line.volume.value.toFixed(0)} {line.volume.unit}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">Concentration:</span>
                <span className="text-gray-900 font-semibold">
                  {line.concentration.value.toFixed(0)} {line.concentration.unit}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded-lg">
                <span className="text-gray-600">Débit:</span>
                <span className="text-gray-900 font-semibold">
                  {line.flow.value.toFixed(0)} {line.flow.unit}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              Dernière mise à jour: {formatDate(line.lastUpdate)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
