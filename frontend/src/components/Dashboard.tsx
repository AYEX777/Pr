import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductionLine, RiskLevel } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, AlertTriangle, Activity, Wifi, FileText, Download, Hourglass } from 'lucide-react';
import { getRiskColor, getRiskLabel, formatDate, getRiskColorFromScore } from '../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { getReportsSummary, downloadReportAsJSON, downloadReportAsCSV, ReportsSummary } from '../lib/api';
import { toast } from 'sonner';
// Plus besoin de calculateAllLinesRiskScores - les scores viennent déjà de l'API

interface DashboardProps {
  lines: ProductionLine[];
  onSelectLine?: (lineId: string) => void;
  searchQuery?: string;
}

export function Dashboard({ lines, onSelectLine, searchQuery = '' }: DashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const riskParam = searchParams.get('risk');
  
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>(riskParam || 'all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportsSummary | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Mettre à jour le filtre si le paramètre URL change
  useEffect(() => {
    if (riskParam) {
      setSelectedRiskFilter(riskParam);
    }
  }, [riskParam]);

  // Auto-refresh timestamp every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Les scores sont déjà calculés par le ML dans l'API /api/lines
  // Plus besoin de charger séparément les scores

  // Les lignes viennent déjà de l'API avec les scores ML calculés
  const displayLines = useMemo(() => {
    return lines;
  }, [lines]);

  // Filtrer les lignes
  const filteredLines = useMemo(() => {
    let filtered = displayLines;

    if (searchQuery) {
      filtered = filtered.filter(line =>
        line.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        line.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRiskFilter !== 'all') {
      filtered = filtered.filter(line => line.riskLevel === selectedRiskFilter);
    }

    return filtered.sort((a, b) => b.maxRiskScore - a.maxRiskScore);
  }, [displayLines, searchQuery, selectedRiskFilter]);


  // Statistiques
  const stats = useMemo(() => {
    const critical = displayLines.filter(l => l.riskLevel === 'critical').length;
    const high = displayLines.filter(l => l.riskLevel === 'high').length;
    const medium = displayLines.filter(l => l.riskLevel === 'medium').length;
    const low = displayLines.filter(l => l.riskLevel === 'low').length;

    return { critical, high, medium, low, total: displayLines.length };
  }, [displayLines]);


  const handleRefresh = () => {
    setLastRefresh(new Date());
  };

  const handleSelectLine = (lineId: string) => {
    if (onSelectLine) {
      onSelectLine(lineId);
    } else {
      navigate(`/lines/${lineId}`);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoadingReport(true);
    try {
      const data = await getReportsSummary();
      setReportData(data);
      setIsReportDialogOpen(true);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.error('Impossible de générer le rapport');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleDownloadJSON = () => {
    if (reportData) {
      downloadReportAsJSON(reportData);
      toast.success('Rapport téléchargé en JSON');
    }
  };

  const handleDownloadCSV = () => {
    if (reportData) {
      downloadReportAsCSV(reportData);
      toast.success('Rapport téléchargé en CSV');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-white dark:bg-zinc-900">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-[1920px] mx-auto p-6 relative z-10">
        {/* Stats Cards - Plus petites */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card 
            className="border shadow-lg hover:shadow-xl overflow-hidden group relative transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 cursor-pointer"
            onClick={() => setSelectedRiskFilter('all')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#00843D]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Total
                </p>
                <p className="text-sm font-semibold mb-1 text-gray-900 dark:text-zinc-100">
                  Lignes
                </p>
                <p className={`mt-3 text-4xl font-black`} style={{ 
                  background: 'linear-gradient(135deg, #00843D, #00c853)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: '1'
                }}>
                  {stats.total}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-lg overflow-hidden group relative transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white dark:bg-zinc-800 border-red-300/30 dark:border-red-700/30 hover:shadow-red-500/50 cursor-pointer"
            onClick={() => setSelectedRiskFilter('critical')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 bg-red-400/20" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-900 dark:text-red-400">
                    Critique
                  </p>
                  <p className="mt-3 text-4xl font-black text-red-900 dark:text-red-400" style={{ lineHeight: '1' }}>
                    {stats.critical}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-lg overflow-hidden group relative transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white dark:bg-zinc-800 border-orange-300/30 dark:border-orange-700/30 hover:shadow-orange-500/50 cursor-pointer"
            onClick={() => setSelectedRiskFilter('high')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 bg-orange-400/20" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-orange-900 dark:text-orange-400">
                    Élevé
                  </p>
                  <p className="mt-3 text-4xl font-black text-orange-900 dark:text-orange-400" style={{ lineHeight: '1' }}>
                    {stats.high}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-lg overflow-hidden group relative transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white dark:bg-zinc-800 border-yellow-300/30 dark:border-yellow-700/30 hover:shadow-yellow-500/50 cursor-pointer"
            onClick={() => setSelectedRiskFilter('medium')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 bg-yellow-400/20" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-yellow-900 dark:text-yellow-400">
                    Moyen
                  </p>
                  <p className="mt-3 text-4xl font-black text-yellow-900 dark:text-yellow-400" style={{ lineHeight: '1' }}>
                    {stats.medium}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border shadow-lg overflow-hidden group relative transition-all duration-500 hover:scale-105 hover:-translate-y-2 bg-white dark:bg-zinc-800 border-green-300/30 dark:border-green-700/30 hover:shadow-green-500/50 cursor-pointer"
            onClick={() => setSelectedRiskFilter('low')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 bg-green-400/20" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-900 dark:text-green-400">
                    Normal
                  </p>
                  <p className="mt-3 text-4xl font-black text-green-900 dark:text-green-400" style={{ lineHeight: '1' }}>
                    {stats.low}
                  </p>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-[#00843D] to-[#00c853] rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 float-animation">
                  <Activity className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <Card className="mb-6 border shadow-lg bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="font-medium text-xs text-gray-700 dark:text-zinc-300">
                  Niveau de risque:
                </label>
                <Select value={selectedRiskFilter} onValueChange={setSelectedRiskFilter}>
                  <SelectTrigger className="w-48 h-8 border focus:border-indigo-500 focus:ring-indigo-500/20 rounded-md border-gray-200 bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border bg-white dark:bg-zinc-800">
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="critical">Critique</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="low">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-4">
                <Badge className="gap-2 animate-pulse bg-gradient-to-r from-[#00843D]/20 to-[#00c853]/20 dark:from-[#00843D]/30 dark:to-[#00c853]/30 text-[#00843D] dark:text-[#00c853] border border-[#00843D]/40 dark:border-[#00c853]/40 px-4 py-2 rounded-full shadow-lg backdrop-blur-sm font-semibold text-xs">
                  <Wifi className="w-4 h-4" />
                  LIVE
                </Badge>
                <span className="font-medium text-sm text-gray-700 dark:text-zinc-300">
                  Dernière mise à jour: {formatDate(lastRefresh)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2 h-10 hover:bg-[#00843D] hover:text-white hover:border-[#00843D] transition-all rounded-xl shadow-lg font-semibold bg-white dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-zinc-100"
                >
                  <RefreshCw className="w-4 h-4" />
                  Rafraîchir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={isLoadingReport}
                  className="gap-2 h-10 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all rounded-xl shadow-lg font-semibold bg-white dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-900 dark:text-zinc-100"
                >
                  <FileText className="w-4 h-4" />
                  {isLoadingReport ? 'Génération...' : 'Générer Rapport'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des lignes - Pleine largeur */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-4">
            Lignes de production ({filteredLines.length})
          </h2>
          <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
              {filteredLines.map((line) => (
                <Card
                  key={line.id}
                  className="cursor-pointer border shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden group rounded-2xl hover:scale-[1.02] hover:-translate-y-1 bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 relative"
                  style={{ 
                    boxShadow: `0 8px 32px ${getRiskColorFromScore(line.maxRiskScore)}20`
                  }}
                  onClick={() => handleSelectLine(line.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 z-10"
                    style={{
                      backgroundColor: getRiskColorFromScore(line.maxRiskScore),
                    }}
                  />
                  <CardContent className="p-6 relative z-20">
                    <div className="flex items-center gap-4 ml-4">
                      {/* Status Indicator - Cercle coloré */}
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: getRiskColorFromScore(line.maxRiskScore) + '20'
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: getRiskColorFromScore(line.maxRiskScore)
                          }}
                        />
                      </div>

                      {/* Line Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
                            {line.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="px-2 py-0.5 rounded text-xs font-medium border"
                            style={{
                              borderColor: getRiskColor(line.riskLevel) + '40',
                              color: getRiskColor(line.riskLevel),
                              backgroundColor: line.riskLevel === 'critical' ? '#fce7f3' : getRiskColor(line.riskLevel) + '10',
                            }}
                          >
                            {getRiskLabel(line.riskLevel)}
                          </Badge>
                        </div>
                            <div className="text-sm text-gray-600 dark:text-zinc-400">
                              <span className="font-mono font-semibold">
                                Score: {(line.maxRiskScore * 100).toFixed(0)}%
                              </span>
                            </div>
                            {/* Estimation Sécurité (TBE) */}
                            {line.maxRiskScore > 0.5 && (
                              <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                  <Hourglass className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Estimation Sécurité (TBE):</span>
                                </div>
                                {line.tbe !== null && line.tbe !== undefined && typeof line.tbe === 'number' && isFinite(line.tbe) && line.tbe > 0 ? (
                                  <div className="text-sm font-bold text-orange-900 dark:text-orange-300 mt-1">
                                    {Math.round(line.tbe)} min restantes
                                  </div>
                                ) : (
                                  <div className="text-sm font-bold text-green-700 dark:text-green-400 mt-1">
                                    État Stable
                                  </div>
                                )}
                              </div>
                            )}
                            {line.maxRiskScore <= 0.5 && (
                              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                  <span className="text-xs font-semibold">Estimation Sécurité (TBE):</span>
                                </div>
                                <div className="text-sm font-bold text-green-900 dark:text-green-300 mt-1">
                                  État Stable
                                </div>
                              </div>
                            )}
                          </div>

                      {/* Arrow */}
                      <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>

      {/* Modal Rapport */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rapport de Statistiques PRISK</DialogTitle>
            <DialogDescription className="sr-only">
              Statistiques détaillées du système
            </DialogDescription>
          </DialogHeader>
          
          {reportData && (
            <div className="space-y-6 py-4">
              {/* Informations générales */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-zinc-100">Informations générales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Généré le</p>
                    <p className="font-medium text-gray-900 dark:text-zinc-100">
                      {new Date(reportData.generated_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Période</p>
                    <p className="font-medium text-gray-900 dark:text-zinc-100">
                      {new Date(reportData.period.start).toLocaleString('fr-FR')} - {new Date(reportData.period.end).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alertes */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-zinc-100">Alertes</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <Card className="dark:bg-zinc-800 dark:border-zinc-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{reportData.alerts.total}</p>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-zinc-800 dark:border-zinc-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400">Non acquittées</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{reportData.alerts.unacknowledged}</p>
                    </CardContent>
                  </Card>
                  <Card className="dark:bg-zinc-800 dark:border-zinc-700">
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-600 dark:text-zinc-400">Critiques</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{reportData.alerts.critical}</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">Par ligne</p>
                  <div className="space-y-2">
                    {reportData.alerts.by_line.map((line) => (
                      <div key={line.line_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                        <span className="font-medium text-gray-900 dark:text-zinc-100">{line.line_id}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-gray-600 dark:text-zinc-400">Total: {line.total}</span>
                          <span className="text-red-600 dark:text-red-400">Critiques: {line.critical}</span>
                          <span className="text-orange-600 dark:text-orange-400">Non acquittées: {line.unacknowledged}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interventions */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-zinc-100">Interventions</h3>
                <Card className="dark:bg-zinc-800 dark:border-zinc-700">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Terminées</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reportData.interventions.completed}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Scores de risque */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-zinc-100">Scores de Risque (Moyenne 24h)</h3>
                <Card className="dark:bg-zinc-800 dark:border-zinc-700 mb-4">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 dark:text-zinc-400">Moyenne globale</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">
                      {(reportData.risk_scores.global_average * 100).toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
                <div>
                  <p className="text-sm font-medium mb-2 text-gray-700 dark:text-zinc-300">Par ligne</p>
                  <div className="space-y-2">
                    {reportData.risk_scores.by_line.map((line) => (
                      <div key={line.line_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-zinc-800 rounded">
                        <span className="font-medium text-gray-900 dark:text-zinc-100">{line.line_id}</span>
                        <span className="text-lg font-bold" style={{ color: getRiskColorFromScore(line.avg_risk_score) }}>
                          {(line.avg_risk_score * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDownloadJSON}
              disabled={!reportData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadCSV}
              disabled={!reportData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger CSV
            </Button>
            <Button
              onClick={() => setIsReportDialogOpen(false)}
              className="bg-[#00843D] hover:bg-[#006B32] text-white"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
