/**
 * Historical Data Analysis View Component
 * Analyse comparative des lignes de production sur une période
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { formatDate, getRiskColor, getRiskLabel } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, TrendingUp, BarChart3, Activity, Target, AlertTriangle, Download } from 'lucide-react';
import { ProductionLine } from '../types';
import { mockProductionLines } from '../lib/mockData';
import { getComparativeHistory } from '../lib/api';

interface HistoricalDataViewProps {
  lines?: ProductionLine[];
}

export function HistoricalDataView({ lines = mockProductionLines }: HistoricalDataViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [dateDebut, setDateDebut] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [comparativeData, setComparativeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getDaysFromPeriod = (period: string) => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 7;
    }
  };

  const days = getDaysFromPeriod(selectedPeriod);

  // Quand on change la période (7j, 30j, 90j), recalcule automatiquement les dates
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    switch (selectedPeriod) {
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '7d':
      default:
        start.setDate(end.getDate() - 7);
        break;
    }
    setDateDebut(start.toISOString().split('T')[0]);
    setDateFin(end.toISOString().split('T')[0]);
  }, [selectedPeriod]);

  // Filtrer les lignes à analyser
  const linesToAnalyze = useMemo(() => {
    if (selectedLines.length === 0) {
      return lines;
    }
    return lines.filter(line => selectedLines.includes(line.id));
  }, [lines, selectedLines]);

  useEffect(() => {
    const loadComparativeData = async () => {
      if (linesToAnalyze.length === 0) {
        return;
      }

      try {
        setLoading(true);
        const lineIds = linesToAnalyze.map(l => l.id);
        const startDate = new Date(dateDebut);
        const endDate = new Date(dateFin);

        const result = await getComparativeHistory({
          lines: lineIds,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days: days,
        });

        setComparativeData(result.comparative || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données comparatives:', error);
        setComparativeData([]);
      } finally {
        setLoading(false);
      }
    };

    loadComparativeData();
  }, [selectedLines, dateDebut, dateFin, days, linesToAnalyze]);

  // Statistiques globales
  const statistics = useMemo(() => {
    const totalAlerts = linesToAnalyze.filter(l => l.riskLevel === 'critical' || l.riskLevel === 'high').length;
    const avgScore = linesToAnalyze.reduce((sum, l) => sum + l.maxRiskScore, 0) / linesToAnalyze.length;
    const maxScore = Math.max(...linesToAnalyze.map(l => l.maxRiskScore));
    const minScore = Math.min(...linesToAnalyze.map(l => l.maxRiskScore));

    return {
      totalLines: linesToAnalyze.length,
      totalAlerts,
      avgScore: Number((avgScore * 100).toFixed(1)),
      maxScore: Number((maxScore * 100).toFixed(1)),
      minScore: Number((minScore * 100).toFixed(1)),
    };
  }, [linesToAnalyze]);

  // Données pour le graphique en barres (répartition par niveau de risque)
  const riskDistribution = useMemo(() => {
    const distribution = {
      critical: linesToAnalyze.filter(l => l.riskLevel === 'critical').length,
      high: linesToAnalyze.filter(l => l.riskLevel === 'high').length,
      medium: linesToAnalyze.filter(l => l.riskLevel === 'medium').length,
      low: linesToAnalyze.filter(l => l.riskLevel === 'low').length,
    };

    return [
      { name: 'Critique', value: distribution.critical, color: '#EF4444' },
      { name: 'Élevé', value: distribution.high, color: '#F59E0B' },
      { name: 'Moyen', value: distribution.medium, color: '#FCD34D' },
      { name: 'Faible', value: distribution.low, color: '#10B981' },
    ];
  }, [linesToAnalyze]);

  const COLORS = ['#00843D', '#00c853', '#F59E0B', '#EF4444', '#3B82F6'];

  // Export JSON des données comparatives
  const handleExportJSON = () => {
    if (!comparativeData || comparativeData.length === 0) return;

    const payload = {
      period: selectedPeriod,
      date_start: dateDebut,
      date_end: dateFin,
      lines: linesToAnalyze.map((l) => ({ id: l.id, name: l.name })),
      data: comparativeData,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-prisk-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export CSV des scores comparatifs
  const handleExportCSV = () => {
    if (!comparativeData || comparativeData.length === 0) return;

    const lineHeaders = linesToAnalyze.map((l) => l.name);
    let csv = 'Date,' + lineHeaders.join(',') + '\n';

    comparativeData.forEach((row: any) => {
      const date = row.date ?? '';
      const values = linesToAnalyze.map((l) => {
        const v = row[l.id];
        return v === null || v === undefined ? '' : v;
      });
      csv += [date, ...values].join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique-prisk-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
              Analyse Historique
            </h1>
            <p className="text-gray-600 dark:text-zinc-400">
              Analyse comparative des performances et tendances des lignes de production
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportCSV}
              disabled={comparativeData.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              onClick={handleExportJSON}
              disabled={comparativeData.length === 0}
            >
              <Download className="w-4 h-4" />
              Exporter JSON
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6 border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period">Période</Label>
                <Select value={selectedPeriod} onValueChange={(value: '7d' | '30d' | '90d') => setSelectedPeriod(value)}>
                  <SelectTrigger id="period" className="bg-white dark:bg-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                    <SelectItem value="90d">90 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-debut">Date de début</Label>
                <Input
                  id="date-debut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="bg-white dark:bg-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-fin">Date de fin</Label>
                <Input
                  id="date-fin"
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="bg-white dark:bg-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Lignes à analyser</Label>
                <Select 
                  value={selectedLines.length > 0 ? selectedLines[0] : 'all'} 
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedLines([]);
                    } else {
                      setSelectedLines([value]);
                    }
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-zinc-700">
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Lignes analysées</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{statistics.totalLines}</p>
                </div>
                <Activity className="w-8 h-8 text-[#00843D] dark:text-[#00c853]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Score moyen</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{statistics.avgScore}%</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                    Min: {statistics.minScore}% | Max: {statistics.maxScore}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Lignes à risque</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.totalAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 mb-1">Période</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    {formatDate(new Date(dateDebut))}
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                    {formatDate(new Date(dateFin))}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique comparatif des scores */}
        <Card className="mb-6 border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-zinc-100">
              <TrendingUp className="w-5 h-5" />
              Évolution comparative des scores de risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={comparativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  className="dark:stroke-zinc-400"
                  tick={{ fill: '#6b7280' }}
                  className="dark:[&>text]:fill-zinc-400"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="#6b7280"
                  className="dark:stroke-zinc-400"
                  tick={{ fill: '#6b7280' }}
                  className="dark:[&>text]:fill-zinc-400"
                  label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                  className="dark:!bg-zinc-800 dark:!border-zinc-700"
                  formatter={(value: any) => [`${value}%`, 'Score']}
                />
                <Legend />
                {linesToAnalyze.map((line, index) => (
                  <Line
                    key={line.id}
                    type="monotone"
                    dataKey={line.id}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    name={line.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique de répartition des risques */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-zinc-100">Répartition par niveau de risque</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-zinc-100">Scores moyens par ligne</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={linesToAnalyze.map(line => ({
                  name: line.name,
                  score: Number((line.maxRiskScore * 100).toFixed(1)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    className="dark:stroke-zinc-400"
                    tick={{ fill: '#6b7280' }}
                    className="dark:[&>text]:fill-zinc-400"
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke="#6b7280"
                    className="dark:stroke-zinc-400"
                    tick={{ fill: '#6b7280' }}
                    className="dark:[&>text]:fill-zinc-400"
                    label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                    className="dark:!bg-zinc-800 dark:!border-zinc-700"
                    formatter={(value: any) => [`${value}%`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#00843D" className="dark:fill-[#00c853]" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tableau comparatif */}
        <Card className="border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-zinc-100">Comparaison détaillée des lignes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-zinc-300">Ligne</th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-zinc-300">Score</th>
                    <th className="text-center p-3 font-semibold text-gray-700 dark:text-zinc-300">Niveau</th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-zinc-300">Pression</th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-zinc-300">Température</th>
                    <th className="text-right p-3 font-semibold text-gray-700 dark:text-zinc-300">Vibration</th>
                  </tr>
                </thead>
                <tbody>
                  {linesToAnalyze.map((line) => (
                    <tr key={line.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      <td className="p-3 font-medium text-gray-900 dark:text-zinc-100">{line.name}</td>
                      <td className="p-3 text-right text-gray-700 dark:text-zinc-300 font-semibold">
                        {(line.maxRiskScore * 100).toFixed(1)}%
                      </td>
                      <td className="p-3 text-center">
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
                      </td>
                      <td className="p-3 text-right text-gray-700 dark:text-zinc-300">
                        {line.pressure.value.toFixed(1)} {line.pressure.unit}
                      </td>
                      <td className="p-3 text-right text-gray-700 dark:text-zinc-300">
                        {line.temperature.value.toFixed(0)} {line.temperature.unit}
                      </td>
                      <td className="p-3 text-right text-gray-700 dark:text-zinc-300">
                        {line.vibration.value.toFixed(1)} {line.vibration.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
