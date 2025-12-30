import { useParams, useNavigate } from 'react-router-dom';
import { ProductionLine, Sensor } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Wifi } from 'lucide-react';
import { getRiskColor, getRiskLabel, formatDate } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useMemo } from 'react';

interface ParameterHistoryPageProps {
  lines: ProductionLine[];
}

export function ParameterHistoryPage({ lines }: ParameterHistoryPageProps) {
  const { id: lineId, paramName } = useParams<{ id: string; paramName: string }>();
  const navigate = useNavigate();
  const [historyData, setHistoryData] = useState<any[]>([]);

  const line = lines.find(l => l.id === lineId);

  // Mapping des noms de paramètres vers les capteurs
  const paramMap: Record<string, keyof ProductionLine> = {
    'pression': 'pressure',
    'temperature': 'temperature',
    'vibration': 'vibration',
    'extension': 'level',
  };

  const paramDisplayNames: Record<string, string> = {
    'pression': 'Pression',
    'temperature': 'Température',
    'vibration': 'Vibration',
    'extension': 'Extension',
  };

  const paramIcons: Record<string, string> = {
    'pression': '📊',
    'temperature': '🌡️',
    'vibration': '📳',
    'extension': '📏',
  };

  if (!line || !paramName || !paramMap[paramName]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
        <Card className="border shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-base font-medium text-gray-500 dark:text-zinc-400">Paramètre non trouvé</p>
            <Button onClick={() => navigate(`/lines/${lineId}`)} className="mt-4">
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sensorKey = paramMap[paramName] as keyof ProductionLine;
  const sensor = line[sensorKey] as Sensor;
  const displayName = paramDisplayNames[paramName] || paramName;

  // Charger les données historiques depuis l'API
  useEffect(() => {
    const loadHistory = async () => {
      if (!lineId || !paramName) return;

      try {
        // Utiliser la fonction API pour récupérer l'historique
        const { getParameterHistory } = await import('../lib/api');
        const historyPoints = await getParameterHistory(lineId, paramName, 24, 1000);

        // Convertir en format pour le graphique
        const formattedData = historyPoints.map((point) => {
          const timestamp = new Date(point.timestamp);
          const hours = timestamp.getHours();
          const minutes = timestamp.getMinutes();
          const timeLabel = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

          return {
            time: timeLabel,
            fullTime: timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            date: timestamp.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            timestamp: timestamp.toISOString(),
            value: point.value,
          };
        });

        setHistoryData(formattedData);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        // En cas d'erreur, garder un tableau vide
        setHistoryData([]);
      }
    };

    loadHistory();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadHistory, 30000);

    return () => clearInterval(interval);
  }, [lineId, paramName, sensor.value]); // Recharger si le capteur change

  // Calculer les statistiques
  const stats = useMemo(() => {
    if (historyData.length === 0) return null;
    
    const values = historyData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const current = values[values.length - 1];
    
    return { min, max, avg, current };
  }, [historyData]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/lines/${lineId}`)}
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
                      {line.name} - {displayName}
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
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Valeur actuelle</p>
                  <p className="text-3xl font-black text-gray-900 dark:text-zinc-100">
                    {sensor.value.toFixed(sensor.unit === '' ? 1 : sensor.unit === '°C' ? 0 : 1)}
                    {sensor.unit && <span className="ml-1 text-lg text-gray-600 dark:text-zinc-400 font-normal">{sensor.unit}</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Valeur actuelle</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {stats.current.toFixed(2)}
                  {sensor.unit && <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400 font-normal">{sensor.unit}</span>}
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Moyenne</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {stats.avg.toFixed(2)}
                  {sensor.unit && <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400 font-normal">{sensor.unit}</span>}
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Minimum</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {stats.min.toFixed(2)}
                  {sensor.unit && <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400 font-normal">{sensor.unit}</span>}
                </p>
              </CardContent>
            </Card>
            <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Maximum</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                  {stats.max.toFixed(2)}
                  {sensor.unit && <span className="ml-1 text-sm text-gray-600 dark:text-zinc-400 font-normal">{sensor.unit}</span>}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Graphique */}
        <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-zinc-100">
              Historique 24h - {displayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    className="dark:stroke-zinc-400"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    className="dark:[&>text]:fill-zinc-400"
                    interval={47} // Afficher environ 6 labels (288 points / 47 = ~6 labels)
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    stroke="#6b7280"
                    className="dark:stroke-zinc-400"
                    tick={{ fill: '#6b7280' }}
                    className="dark:[&>text]:fill-zinc-400"
                    label={{ value: `${displayName} (${sensor.unit})`, angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    className="dark:!bg-zinc-800 dark:!border-zinc-700"
                    formatter={(value: any) => [
                      `${value} ${sensor.unit}`,
                      displayName
                    ]}
                    labelFormatter={(label) => `Heure: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00843D"
                    className="dark:stroke-[#00c853]"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={displayName}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-400 flex items-center justify-center text-gray-500 dark:text-zinc-400">
                Chargement des données...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

