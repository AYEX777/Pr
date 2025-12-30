import { Alert } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, Clock, CheckCircle2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface AlertsViewProps {
  alerts: Alert[];
  onSelectLine?: (lineId: string) => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

export function AlertsView({ alerts, onSelectLine, onAcknowledgeAlert }: AlertsViewProps) {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Trier les alertes par gravité : critical > warning > info
  const sortBySeverity = (a: Alert, b: Alert) => {
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    return (severityOrder[b.level] || 0) - (severityOrder[a.level] || 0);
  };

  const getAlertColor = (level: string, acknowledged: boolean) => {
    if (acknowledged) {
      return 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400';
    }
    switch (level) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100';
      default:
        return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
    }
  };

  const getAlertBadgeColor = (level: string, acknowledged: boolean) => {
    if (acknowledged) {
      return 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600';
    }
    switch (level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    setProcessingIds(prev => new Set(prev).add(alertId));
    try {
      await onAcknowledgeAlert?.(alertId);
      toast.success('Alerte acquittée avec succès', {
        description: 'L\'alerte a été prise en compte',
      });
    } catch (error) {
      toast.error('Erreur lors de l\'acquittement', {
        description: 'Impossible d\'acquitter l\'alerte. Veuillez réessayer.',
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  // Trier toutes les alertes par gravité
  const sortedAlerts = [...alerts].sort(sortBySeverity);
  const activeAlerts = sortedAlerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = sortedAlerts.filter(a => a.acknowledged);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-zinc-950 min-h-screen">
      <div className="mb-6 animate-slide-up">
        <h1 className="text-3xl text-gray-900 dark:text-zinc-50 mb-2 font-bold">Gestion d'Incidents</h1>
        <p className="text-gray-600 dark:text-zinc-400">
          {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} non acquittée{activeAlerts.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Active Alerts */}
      <div className="mb-8">
        <h2 className="text-xl text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
          Alertes non acquittées
        </h2>
        {activeAlerts.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl text-gray-900 dark:text-white mb-2">Tout est sous contrôle</p>
              <p className="text-gray-600 dark:text-zinc-400">Aucune alerte active à signaler</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alert, index) => (
              <Card
                key={alert.id}
                className={`border shadow-lg dark:shadow-zinc-900/50 hover:shadow-xl transition-all animate-slide-in ${getAlertColor(alert.level, false)}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5 relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{
                      background: alert.level === 'critical' 
                        ? 'linear-gradient(to bottom, #EF4444, #DC2626)'
                        : 'linear-gradient(to bottom, #F59E0B, #D97706)'
                    }}
                  />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className={`w-5 h-5 ${alert.level === 'critical' ? 'text-red-500 dark:text-red-400' : 'text-orange-500 dark:text-orange-400'}`} />
                        <Badge variant="outline" className={getAlertBadgeColor(alert.level, false)}>
                          {alert.level === 'critical' ? 'CRITIQUE' : alert.level === 'warning' ? 'AVERTISSEMENT' : 'INFO'}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-zinc-400">
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-900 dark:text-zinc-100 mb-1 font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">
                        Ligne: {alert.lineId}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        onClick={() => onSelectLine?.(alert.lineId)}
                        className="h-8 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
                      >
                        Voir détails
                      </Button>
                      <Button 
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={processingIds.has(alert.id)}
                        className="h-8 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all min-w-[120px] text-sm"
                      >
                        {processingIds.has(alert.id) ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Acquitter
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Acknowledged Alerts */}
      {acknowledgedAlerts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg text-gray-900 dark:text-zinc-50 mb-4 flex items-center gap-2 font-semibold">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            Alertes acquittées
          </h2>
          <div className="space-y-3">
            {acknowledgedAlerts.map((alert) => (
              <Card 
                key={alert.id} 
                className={`border shadow-sm ${getAlertColor(alert.level, true)} opacity-75 hover:opacity-100 transition-opacity`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <Badge variant="outline" className={getAlertBadgeColor(alert.level, true)}>
                          Acquittée
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-zinc-500">
                          {formatDate(alert.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-zinc-300 line-through">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                        Ligne: {alert.lineId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
