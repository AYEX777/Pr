import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { ArrowLeft, Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getRiskColor, getRiskLabel, getRiskColorFromScore } from '../lib/utils';
import { calculateLineRiskScore, extractLineParameters, RiskScoreResult, getParameterHistory, ParameterHistoryPoint } from '../lib/api';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ParameterDisplay {
  name: string;
  value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  ratio: number;
  score: number;
  weightedScore: number;
  weight: number;
}

export function LineRiskDetailView() {
  const { id: lineId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [riskData, setRiskData] = useState<RiskScoreResult | null>(null);
  const [parameters, setParameters] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedParameter, setSelectedParameter] = useState<ParameterDisplay | null>(null);
  const [parameterHistory, setParameterHistory] = useState<ParameterHistoryPoint[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Socket.io pour les mises à jour en temps réel
  useEffect(() => {
    if (!lineId) return;

    const socket = io(
      (import.meta as any).env?.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000",
      { transports: ["websocket"] }
    );

    socket.on('connect', () => {
      console.log('[LineRiskDetail] Socket connected');
    });

    // Écouter les mises à jour de score pour cette ligne
    socket.on('risk_score_updated', (data: RiskScoreResult) => {
      if (data.lineId === lineId) {
        console.log('[LineRiskDetail] Risk score updated via Socket.io', data);
        setRiskData(data);
        setLastUpdate(new Date());
        toast.success('Score de risque mis à jour', { duration: 2000 });
      }
    });

    // Écouter les mises à jour globales
    socket.on('risk_scores_updated', (data: { lines: RiskScoreResult[] }) => {
      const lineData = data.lines.find(l => l.lineId === lineId);
      if (lineData) {
        console.log('[LineRiskDetail] Risk score updated from global update', lineData);
        setRiskData(lineData);
        setLastUpdate(new Date());
      }
    });

    return () => {
      socket.off('risk_score_updated');
      socket.off('risk_scores_updated');
      socket.disconnect();
    };
  }, [lineId]);

  // Charger les données initiales
  useEffect(() => {
    if (!lineId) return;

    const loadData = async (isInitialLoad = false) => {
      // Seulement afficher le loading lors du premier chargement
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      }

      try {
        // Charger le score de risque et les paramètres en parallèle
        const [riskResult, paramsResult] = await Promise.all([
          calculateLineRiskScore(lineId),
          extractLineParameters(lineId),
        ]);

        setRiskData(riskResult);
        setParameters(paramsResult);
        setLastUpdate(new Date());
      } catch (err: any) {
        console.error('Error loading line risk data:', err);
        // Seulement afficher l'erreur lors du premier chargement
        if (isInitialLoad) {
          setError(err.message || 'Erreur lors du chargement des données');
          toast.error('Impossible de charger les données de risque');
        }
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
        }
      }
    };

    // Chargement initial avec loading
    loadData(true);

    // Rafraîchir toutes les 5 secondes SANS recharger l'interface
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, [lineId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:!bg-zinc-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si pas de données, afficher NaN au lieu d'une erreur
  const riskScorePercent = riskData ? Math.round(riskData.riskScore * 100) : NaN;
  const riskColor = riskData ? getRiskColor(riskData.riskLevel) : '#757575';
  const riskScoreColor = riskData ? getRiskColorFromScore(riskData.riskScore) : '#757575';

  // Extraire tous les paramètres de tous les compensateurs
  const allParameters: ParameterDisplay[] = [];
  if (riskData && riskData.compensators && riskData.compensators.length > 0) {
    riskData.compensators.forEach(comp => {
      if (comp.parameterScores) {
        Object.entries(comp.parameterScores).forEach(([key, param]: [string, any]) => {
          allParameters.push({
            name: getParameterLabel(key),
            value: param.value,
            unit: param.unit,
            threshold_warning: 0,
            threshold_critical: 0,
            ratio: param.ratio,
            score: param.score,
            weightedScore: param.weightedScore,
            weight: param.weight,
          });
        });
      }
    });
  }
  
  // Si aucun paramètre, créer des paramètres avec NaN
  if (allParameters.length === 0) {
    const requiredParams = ['pressure', 'temperature', 'volume', 'pH', 'concentration', 'viscosity', 'density', 'level'];
    requiredParams.forEach(param => {
      allParameters.push({
        name: getParameterLabel(param),
        value: NaN,
        unit: getDefaultUnit(param),
        threshold_warning: NaN,
        threshold_critical: NaN,
        ratio: NaN,
        score: NaN,
        weightedScore: NaN,
        weight: NaN,
      });
    });
  }

  // Grouper les paramètres par nom (moyenne si plusieurs compensateurs)
  const groupedParams = new Map<string, ParameterDisplay>();
  allParameters.forEach(param => {
    const existing = groupedParams.get(param.name);
    if (existing) {
      // Moyenne des valeurs si plusieurs compensateurs
      existing.value = (existing.value + param.value) / 2;
      existing.ratio = (existing.ratio + param.ratio) / 2;
      existing.score = (existing.score + param.score) / 2;
      existing.weightedScore = (existing.weightedScore + param.weightedScore) / 2;
    } else {
      groupedParams.set(param.name, { ...param });
    }
  });

  const parameterList = Array.from(groupedParams.values());

  // Fonction pour ouvrir le graphique d'un paramètre
  const handleParameterClick = async (param: ParameterDisplay) => {
    if (!lineId) return;
    
    setSelectedParameter(param);
    setIsDialogOpen(true);
    setIsHistoryLoading(true);
    
    try {
      // Convertir le nom du paramètre en type (ex: "Pression" -> "pressure")
      const paramTypeMap: Record<string, string> = {
        'Pression': 'pressure',
        'Température': 'temperature',
        'Volume': 'volume',
        'pH': 'pH',
        'Concentration': 'concentration',
        'Viscosité': 'viscosity',
        'Densité': 'density',
        'Niveau': 'level',
      };
      
      const paramType = paramTypeMap[param.name] || param.name.toLowerCase();
      const history = await getParameterHistory(lineId, paramType, 24, 200);
      setParameterHistory(history);
    } catch (err: any) {
      console.error('Error loading parameter history:', err);
      toast.error('Impossible de charger l\'historique');
      setParameterHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Données par défaut pour afficher le graphique vide
  const defaultChartData = [
    { 
      timeLabel: '00:00', 
      value: 0, 
      timestamp: Date.now() - 86400000, 
      date: new Date(Date.now() - 86400000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), 
      time: '00:00', 
      fullTime: new Date(Date.now() - 86400000).toLocaleString('fr-FR')
    },
    { 
      timeLabel: '12:00', 
      value: 0, 
      timestamp: Date.now() - 43200000, 
      date: new Date(Date.now() - 43200000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), 
      time: '12:00', 
      fullTime: new Date(Date.now() - 43200000).toLocaleString('fr-FR')
    },
    { 
      timeLabel: '23:59', 
      value: 0, 
      timestamp: Date.now(), 
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), 
      time: '23:59', 
      fullTime: new Date().toLocaleString('fr-FR')
    }
  ];

  // Formater les données pour le graphique - trier par temps croissant
  const chartData = parameterHistory.length > 0
    ? parameterHistory
        .map(point => {
          const date = new Date(point.timestamp);
          return {
            time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
            timestamp: date.getTime(),
            value: parseFloat(point.value.toFixed(2)),
            fullTime: date.toLocaleString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            }),
            // Format pour l'axe X : heure:minute
            timeLabel: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp)
    : defaultChartData;
  
  const hasData = parameterHistory.length > 0; // Tri chronologique strict

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 dark:!bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/lines')}
            className="dark:text-white dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux lignes
          </Button>
          <div className="text-sm text-gray-500 dark:text-zinc-400">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </div>
        </div>

        {/* Score de Risque Principal */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl dark:text-white flex items-center gap-3">
              <Activity className="h-6 w-6" style={{ color: riskColor }} />
              {riskData?.lineName || `Ligne ${lineId || 'NaN'}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Principal */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">
                  Score de Risque Prédictif
                </p>
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-5xl font-bold"
                    style={{ color: riskScoreColor }}
                  >
                    {isNaN(riskScorePercent) ? 'NaN' : riskScorePercent}
                  </span>
                  <span className="text-2xl text-gray-500 dark:text-zinc-400">/ 100</span>
                </div>
              </div>
              <Badge
                className="text-lg px-4 py-2"
                style={{
                  borderColor: riskColor + '40',
                  color: riskColor,
                  backgroundColor: riskColor + '10',
                }}
              >
                {riskData?.riskLevel ? getRiskLabel(riskData.riskLevel) : 'NaN'}
              </Badge>
            </div>

            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${isNaN(riskScorePercent) ? 0 : riskScorePercent}%`,
                    backgroundColor: riskScoreColor,
                    boxShadow: `0 0 20px ${riskScoreColor}40`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400">
                <span>Faible (0-50)</span>
                <span>Moyen (50-65)</span>
                <span>Élevé (65-85)</span>
                <span>Critique (85-100)</span>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t dark:border-zinc-800">
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Compensateurs</p>
                <p className="text-lg font-semibold dark:text-white">
                  {riskData?.compensators?.length ?? 'NaN'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Score</p>
                <p className="text-lg font-semibold dark:text-white">
                  {riskData?.maxCompensatorScore ? Math.round(riskData.maxCompensatorScore * 100) + '%' : 'NaN'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Paramètres</p>
                <p className="text-lg font-semibold dark:text-white">
                  {parameterList.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mb-1">Calculé le</p>
                <p className="text-sm font-semibold dark:text-white">
                  {riskData?.calculatedAt ? new Date(riskData.calculatedAt).toLocaleTimeString('fr-FR') : 'NaN'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres Détaillés */}
        <Card className="dark:bg-zinc-900 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-xl dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Paramètres d'Entrée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {parameterList.map((param, index) => {
                const paramRatio = param.ratio || 0;
                const paramScore = param.score || 0;
                const isWarning = paramRatio >= 0.5 && paramRatio < 0.85;
                const isCritical = paramRatio >= 0.85;
                
                // Couleur de glow basée sur le score
                const glowColor = isNaN(paramScore) 
                  ? '#757575' 
                  : getRiskColorFromScore(paramScore);

                return (
                  <Card
                    key={index}
                    className="dark:bg-zinc-800 dark:border-zinc-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    style={{
                      boxShadow: isNaN(paramScore) 
                        ? 'none' 
                        : `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, 0 0 60px ${glowColor}08`,
                      borderColor: isNaN(paramScore) 
                        ? 'rgb(63 63 70)' 
                        : `${glowColor}40`,
                    }}
                    onClick={() => handleParameterClick(param)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm dark:text-white">
                          {param.name}
                        </h3>
                        {isCritical ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold dark:text-white">
                            {isNaN(param.value) ? 'NaN' : param.value.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-zinc-400">
                            {param.unit || ''}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-zinc-400">Score de Risque</span>
                            <span className="dark:text-white font-semibold">
                              {isNaN(paramScore) ? 'NaN' : (paramScore * 100).toFixed(1) + '%'}
                            </span>
                          </div>
                        </div>
                        {/* Barre de progression pour le paramètre */}
                        <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 mt-2">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${isNaN(paramRatio) ? 0 : Math.min(paramRatio * 100, 100)}%`,
                              backgroundColor: isNaN(paramRatio) ? '#757575' : isCritical
                                ? '#DC2626'
                                : isWarning
                                ? '#FBBF24'
                                : '#10B981',
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Détails des Compensateurs */}
        {riskData?.compensators && riskData.compensators.length > 0 && (
          <Card className="dark:bg-zinc-900 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-xl dark:text-white">
                Compensateurs ({riskData.compensators.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskData.compensators.map((comp, index) => {
                  const compScorePercent = Math.round(comp.riskScore * 100);
                  const compColor = getRiskColor(comp.riskLevel as any);

                  return (
                    <Card
                      key={index}
                      className="dark:bg-zinc-800 dark:border-zinc-700"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold dark:text-white">
                              {comp.compensatorName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-zinc-400">
                              ID: {comp.compensatorId}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold" style={{ color: compColor }}>
                              {compScorePercent}%
                            </div>
                            <Badge
                              className="mt-1"
                              style={{
                                borderColor: compColor + '40',
                                color: compColor,
                                backgroundColor: compColor + '10',
                              }}
                            >
                              {getRiskLabel(comp.riskLevel as any)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog pour afficher le graphique d'évolution */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] dark:bg-zinc-900 dark:border-zinc-800 max-h-[95vh] h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution de {selectedParameter?.name || 'Paramètre'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {isHistoryLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-pulse text-gray-500 dark:text-zinc-400">
                    Chargement de l'historique...
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {!hasData && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-500 dark:text-yellow-400">
                        ⚠️ Aucune donnée historique disponible - Le graphique s'affichera lorsque des données seront disponibles
                      </p>
                    </div>
                  )}
                  <div className="w-full border border-zinc-700 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900" style={{ height: hasData ? 'calc(95vh - 280px)' : 'calc(95vh - 280px)', minHeight: hasData ? '500px' : '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={chartData}
                        margin={hasData ? { top: 10, right: 20, left: 20, bottom: 60 } : { top: 10, right: 20, left: 20, bottom: 40 }}
                      >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop 
                            offset="5%" 
                            stopColor={selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6'} 
                            stopOpacity={0.3}
                          />
                          <stop 
                            offset="95%" 
                            stopColor={selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6'} 
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis 
                        dataKey="timeLabel" 
                        stroke="#a1a1aa"
                        style={{ fontSize: hasData ? '11px' : '10px' }}
                        tick={{ fill: '#a1a1aa' }}
                        interval={hasData ? Math.max(1, Math.floor(chartData.length / 12)) : 'preserveStartEnd'}
                        angle={hasData ? -45 : 0}
                        textAnchor={hasData ? "end" : "middle"}
                        height={hasData ? 70 : 35}
                        label={{ 
                          value: 'Temps (heures)', 
                          position: 'insideBottom', 
                          offset: hasData ? -10 : -3,
                          style: { fill: '#a1a1aa', fontSize: hasData ? '11px' : '10px', fontWeight: 'bold' }
                        }}
                      />
                      <YAxis 
                        stroke="#a1a1aa"
                        style={{ fontSize: hasData ? '11px' : '10px' }}
                        tick={{ fill: '#a1a1aa' }}
                        width={hasData ? 55 : 45}
                        label={{ 
                          value: `Valeur (${selectedParameter?.unit || ''})`, 
                          angle: -90, 
                          position: 'insideLeft',
                          offset: hasData ? -8 : -3,
                          style: { fill: '#a1a1aa', fontSize: hasData ? '11px' : '10px', fontWeight: 'bold' }
                        }}
                        domain={hasData ? ['dataMin - 5', 'dataMax + 5'] : [0, 100]}
                        ticks={hasData ? undefined : [0, 50, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          color: '#fafafa',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontWeight: 'bold' }}
                        formatter={(value: any) => [
                          <span key="value" style={{ color: selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6', fontWeight: 'bold' }}>
                            {value} {selectedParameter?.unit || ''}
                          </span>,
                          'Valeur'
                        ]}
                        labelFormatter={(label) => {
                          const point = chartData.find(d => d.timeLabel === label || d.time === label);
                          return point ? (
                            <div>
                              <div style={{ marginBottom: '4px' }}>{point.date || point.fullTime}</div>
                              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>{point.time || point.timeLabel}</div>
                            </div>
                          ) : label;
                        }}
                        cursor={{ stroke: selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6', strokeWidth: 2 }}
                      />
                      <Legend 
                        wrapperStyle={{ color: '#fafafa', paddingTop: hasData ? '10px' : '8px', fontSize: hasData ? '11px' : '10px' }}
                        iconType="line"
                      />
                      {hasData ? (
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6'}
                          strokeWidth={3}
                          dot={{ r: 4, fill: selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6', strokeWidth: 2, stroke: '#18181b' }}
                          activeDot={{ r: 7, fill: selectedParameter ? getRiskColorFromScore(selectedParameter.score) : '#3b82f6' }}
                          name={`${selectedParameter?.name} (${selectedParameter?.unit || ''})`}
                          fill="url(#colorValue)"
                          animationDuration={500}
                        />
                      ) : (
                        <Line 
                          type="linear" 
                          dataKey="value" 
                          stroke="#757575"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          activeDot={false}
                          name={`${selectedParameter?.name || 'Paramètre'} (${selectedParameter?.unit || ''}) - Aucune donnée`}
                          animationDuration={0}
                          connectNulls={true}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              )}
              {selectedParameter && (
                <div className="mt-4 p-4 bg-zinc-800 dark:bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-zinc-400 mb-1">Valeur Actuelle</p>
                      <p className="text-lg font-semibold dark:text-white">
                        {isNaN(selectedParameter.value) ? 'NaN' : selectedParameter.value.toFixed(2)} {selectedParameter.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-zinc-400 mb-1">Score de Risque</p>
                      <p className="text-lg font-semibold dark:text-white">
                        {isNaN(selectedParameter.score) ? 'NaN' : (selectedParameter.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-zinc-400 mb-1">Points de Données</p>
                      <p className="text-lg font-semibold dark:text-white">
                        {parameterHistory.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-zinc-400 mb-1">Période</p>
                      <p className="text-lg font-semibold dark:text-white">
                        Dernières 24h
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function getParameterLabel(key: string): string {
  const labels: Record<string, string> = {
    pressure: 'Pression',
    temperature: 'Température',
    volume: 'Volume',
    pH: 'pH',
    concentration: 'Concentration',
    viscosity: 'Viscosité',
    density: 'Densité',
    level: 'Niveau',
  };
  return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function getDefaultUnit(param: string): string {
  const units: Record<string, string> = {
    pressure: 'bar',
    temperature: '°C',
    volume: 'L',
    pH: '',
    concentration: '%',
    viscosity: 'cP',
    density: 'g/cm³',
    level: '%',
  };
  return units[param] || '';
}



