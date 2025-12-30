import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getReportsSummary, downloadReportAsJSON, downloadReportAsCSV, getProductionReport, getAlertsDistribution, getInterventionsTypes, getAvailabilityReport } from '../lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { ProductionLine } from '../types';

export function ReportsView() {
  const [productionData, setProductionData] = useState<any[]>([]);
  const [alertsData, setAlertsData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [interventionsData, setInterventionsData] = useState<Array<{ type: string; count: number; color: string }>>([]);
  const [availabilityData, setAvailabilityData] = useState<Array<{ month: string; taux: number }>>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const { fetchDashboardData } = await import('../lib/api');
        const dashboardData = await fetchDashboardData();
        setLines(dashboardData.lines);

        const [production, alerts, interventions, availability] = await Promise.all([
          getProductionReport(selectedPeriod),
          getAlertsDistribution(),
          getInterventionsTypes(),
          getAvailabilityReport(6),
        ]);

        setProductionData(production);
        setAlertsData(alerts);
        setInterventionsData(interventions);
        setAvailabilityData(availability);
      } catch (error) {
        console.error('Erreur lors du chargement des rapports:', error);
        toast.error('Impossible de charger les rapports');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [selectedPeriod]);

  const handleGenerate = async () => {
    try {
      const summary = await getReportsSummary();
      downloadReportAsJSON(summary, `rapport_prisk_${new Date().toISOString().split('T')[0]}.json`);
      toast.success('Rapport JSON généré et téléchargé');
    } catch (err) {
      console.error('Report generation failed', err);
      toast.error('Impossible de générer le rapport');
    }
  };

  const handleGenerateCsv = async () => {
    try {
      const summary = await getReportsSummary();
      downloadReportAsCSV(summary);
      toast.success('Rapport CSV généré et téléchargé');
    } catch (err) {
      console.error('CSV report generation failed', err);
      toast.error('Impossible de générer le rapport CSV');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl text-gray-900 mb-2">Rapports & Analyses</h1>
          <p className="text-gray-600">Vue d'ensemble des performances et KPIs</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
            onClick={handleGenerate}
          >
            <Download className="w-4 h-4" />
            JSON
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleGenerateCsv}
          >
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all card-hover bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 dark:text-white">Disponibilité</p>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-3xl text-gray-900 dark:text-zinc-50 mb-1">96.8%</p>
            <p className="text-sm text-green-700">+2.3% ce mois</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-all card-hover bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-700 dark:text-white">MTBF</p>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl text-gray-900 dark:text-white mb-1">245h</p>
            <p className="text-xs text-gray-600 dark:text-zinc-400">Temps moyen entre pannes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-zinc-400">MTTR</p>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl text-gray-900 dark:text-white mb-1">2.4h</p>
            <p className="text-xs text-orange-600">+0.3h vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-zinc-400">Interventions</p>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl text-gray-900 dark:text-white mb-1">76</p>
            <p className="text-xs text-green-600">94% terminées à temps</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="production" className="space-y-4">
        <TabsList>
          <TabsTrigger value="production">Production</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="availability">Disponibilité</TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance hebdomadaire par ligne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="L1" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="L2" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="L3" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {lines.map((line) => {
              const latestData = productionData.length > 0 
                ? productionData[productionData.length - 1] 
                : null;
              const score = latestData ? latestData[line.id] : 0;
              return (
                <Card key={line.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm text-gray-600 dark:text-zinc-400">{line.name}</h3>
                      <Badge className={line.riskLevel === 'critical' ? 'bg-red-500' : line.riskLevel === 'high' ? 'bg-orange-500' : 'bg-green-500'}>
                        {line.riskLevel === 'critical' ? 'Critique' : line.riskLevel === 'high' ? 'Élevé' : 'Normal'}
                      </Badge>
                    </div>
                    <p className="text-3xl text-gray-900 dark:text-zinc-50 mb-1">{score ? `${score.toFixed(1)}%` : 'N/A'}</p>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Score de risque</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des alertes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={alertsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {alertsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {alertsData.map((alert) => (
                    <div key={alert.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: alert.color }}
                        />
                        <span className="text-gray-700 dark:text-white">{alert.name}</span>
                      </div>
                      <Badge variant="outline">{alert.value}</Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Total alertes</span>
                    <span className="text-gray-900">54</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-zinc-400">Temps moyen résolution</span>
                    <span className="text-gray-900 dark:text-white">1.8h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-zinc-400">Taux d'acquittement</span>
                    <span className="text-green-600">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des interventions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <p className="text-gray-600 dark:text-zinc-400">Chargement...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interventionsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="type" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6">
                      {interventionsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <h3 className="text-sm text-gray-600">Préventives</h3>
                </div>
                <p className="text-3xl text-gray-900 dark:text-zinc-50 mb-1">45</p>
                <p className="text-sm text-gray-600 dark:text-zinc-400">59% du total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <h3 className="text-sm text-gray-600">Correctives</h3>
                </div>
                <p className="text-3xl text-gray-900 dark:text-zinc-50 mb-1">23</p>
                <p className="text-sm text-gray-600 dark:text-zinc-400">30% du total</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <h3 className="text-sm text-gray-600 dark:text-zinc-400">Urgentes</h3>
                </div>
                <p className="text-3xl text-gray-900 mb-1">8</p>
                <p className="text-sm text-gray-600">11% du total</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution de la disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <p className="text-gray-600 dark:text-zinc-400">Chargement...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={availabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[90, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="taux" stroke="#10B981" strokeWidth={3} name="Taux de disponibilité %" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analyse détaillée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Disponibilité moyenne</span>
                  <span className="text-2xl text-gray-900">96.3%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Meilleur mois</span>
                  <span className="text-lg text-green-600">Juin - 98.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Temps d'arrêt total</span>
                  <span className="text-lg text-gray-900">142 heures</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Objectif annuel</span>
                  <Badge className="bg-green-500">95% atteint</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Reports */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapports prédéfinis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-between">
              <span>Rapport quotidien</span>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="justify-between">
              <span>Rapport hebdomadaire</span>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="justify-between">
              <span>Rapport mensuel</span>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="justify-between">
              <span>Rapport annuel</span>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
