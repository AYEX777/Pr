import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertCircle, CheckCircle, Clock, Download, Filter, Calendar as CalendarIcon, TrendingUp, Wrench, AlertTriangle, Plus, Info, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Alert } from '../types';
import { toast } from 'sonner';
import { getHistory, createHistoryEvent, deleteHistoryEvent as apiDeleteHistoryEvent } from '../lib/api';

interface HistoryEvent {
  id: string;
  timestamp: Date;
  type: 'alert' | 'intervention' | 'info';
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  lineId?: string;
  user?: string;
}

interface HistoryViewProps {
  alerts?: Alert[];
}

const mockHistory: HistoryEvent[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    type: 'alert',
    level: 'critical',
    title: 'Pression critique détectée',
    description: 'Ligne A - Pression à 95 bar (seuil: 90 bar)',
    lineId: 'line-A',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'intervention',
    level: 'info',
    title: 'Maintenance préventive terminée',
    description: 'Remplacement du filtre ligne B',
    lineId: 'line-B',
    user: 'Younes Jeddou',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: 'alert',
    level: 'warning',
    title: 'Température élevée',
    description: 'Ligne C - Température à 78°C',
    lineId: 'line-C',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    type: 'info',
    level: 'info',
    title: 'Modification des seuils',
    description: 'Seuil de pression modifié de 85 à 90 bar',
    user: 'Fatima El Amrani',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    type: 'info',
    level: 'info',
    title: 'Calibration capteur',
    description: 'Capteur de pH ligne A calibré avec succès',
    lineId: 'line-A',
    user: 'System',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: 'alert',
    level: 'critical',
    title: 'Arrêt urgence ligne',
    description: 'Ligne D arrêtée suite à détection de fuite',
    lineId: 'line-D',
    user: 'Mohammed Tahiri',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    type: 'intervention',
    level: 'info',
    title: 'Intervention corrective',
    description: 'Réparation vanne ligne C',
    lineId: 'line-C',
    user: 'Younes Jeddou',
  },
];

export function HistoryView({ alerts = [] }: HistoryViewProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<'intervention' | 'info'>('intervention');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventLevel, setNewEventLevel] = useState<'info' | 'warning' | 'critical'>('info');
  const [newEventTimestamp, setNewEventTimestamp] = useState<string>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
  });
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const type = filter === 'all' ? 'all' : filter as 'alert' | 'intervention' | 'info';
        const startDate = dateRange ? dateRange.toISOString() : undefined;
        const apiEvents = await getHistory({ type, startDate, limit: 100 });

        // Convertir les événements API en format HistoryEvent
        const convertedEvents: HistoryEvent[] = apiEvents.map(event => ({
          id: event.id,
          timestamp: new Date(event.timestamp),
          type: event.type,
          level: event.level,
          title: event.title,
          description: event.description,
          lineId: event.lineId,
          user: event.user,
        }));

        setHistoryEvents(convertedEvents);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        toast.error('Impossible de charger l\'historique');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [filter, dateRange]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      case 'intervention':
        return <Wrench className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getEventColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warning':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  // Les événements sont déjà chargés depuis l'API dans historyEvents
  const allEvents = historyEvents.sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const filteredHistory = allEvents.filter(event => {
    if (filter !== 'all' && event.type !== filter) return false;
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const stats = {
    total: allEvents.length,
    alerts: allEvents.filter(e => e.type === 'alert').length,
    interventions: allEvents.filter(e => e.type === 'intervention').length,
    critical: allEvents.filter(e => e.level === 'critical').length,
  };

  const handleExportHistory = () => {
    if (filteredHistory.length === 0) {
      toast.error('Aucun événement à exporter');
      return;
    }

    let csv = 'Date,Type,Niveau,Titre,Description,Ligne,Utilisateur\n';

    filteredHistory.forEach((event) => {
      const dateStr = formatDate(event.timestamp);
      const cols = [
        dateStr,
        event.type,
        event.level,
        event.title || '',
        event.description || '',
        event.lineId || '',
        event.user || '',
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
    a.download = `historique-prisk-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Historique exporté en CSV');
  };

  const handleDeleteEvent = async (event: HistoryEvent) => {
    // Pour l'instant, on ne supprime que les événements de type "info" (user_activity_log)
    if (event.type !== 'info') {
      toast.error('Seuls les événements d\'information peuvent être supprimés.');
      return;
    }

    try {
      await apiDeleteHistoryEvent(event.id);
      setHistoryEvents(prev => prev.filter(e => e.id !== event.id));
      toast.success('Événement supprimé');
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'événement:', error);
      toast.error(error?.message || 'Impossible de supprimer l\'événement');
    }
  };

  const handleAddEvent = async () => {
    if (!newEventDescription.trim()) {
      toast.error('La description est requise');
      return;
    }

    if (!newEventTimestamp) {
      toast.error('La date et l\'heure sont requises');
      return;
    }

    try {
      const event = await createHistoryEvent({
        description: newEventDescription || newEventTitle,
        entity_type: newEventType === 'intervention' ? 'intervention' : 'info',
        timestamp: new Date(newEventTimestamp).toISOString(),
      });

      const newEvent: HistoryEvent = {
        id: event.id,
        timestamp: new Date(event.timestamp),
        type: event.type,
        level: event.level,
        title: event.title,
        description: event.description,
        lineId: event.lineId,
        user: event.user,
      };

      setHistoryEvents(prev => [newEvent, ...prev]);
      toast.success('Événement ajouté avec succès');
      setIsDialogOpen(false);
      setNewEventDescription('');
      setNewEventTitle('');
      setNewEventType('intervention');
      setNewEventLevel('info');
      setNewEventTimestamp(() => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        return new Date(now.getTime() - offset).toISOString().slice(0, 16);
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      toast.error('Impossible d\'ajouter l\'événement');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-zinc-950 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Historique</h1>
        <p className="text-gray-600 dark:text-zinc-400">
          Suivi complet des événements et interventions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Total événements</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Alertes</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.alerts}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Interventions</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.interventions}</p>
              </div>
              <Wrench className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Critiques</p>
                <p className="text-2xl text-red-600 dark:text-red-400">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher dans l'historique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type d'événement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="alert">Alertes</SelectItem>
                <SelectItem value="intervention">Interventions</SelectItem>
                <SelectItem value="info">Informations</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {dateRange ? formatDate(dateRange) : 'Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExportHistory}
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-[#00843D] hover:bg-[#00c853] text-white">
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Ajouter un événement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Type</Label>
                    <Select value={newEventType} onValueChange={(value: 'intervention' | 'info') => setNewEventType(value)}>
                      <SelectTrigger id="event-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="intervention">Intervention</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-level">Niveau</Label>
                    <Select value={newEventLevel} onValueChange={(value: 'info' | 'warning' | 'critical') => setNewEventLevel(value)}>
                      <SelectTrigger id="event-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-datetime">Date et heure</Label>
                    <Input
                      id="event-datetime"
                      type="datetime-local"
                      value={newEventTimestamp}
                      onChange={(e) => setNewEventTimestamp(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-title">Titre *</Label>
                    <Input
                      id="event-title"
                      placeholder="Ex: Maintenance préventive terminée"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event-description">Description</Label>
                    <Textarea
                      id="event-description"
                      placeholder="Détails de l'événement..."
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleAddEvent} className="bg-[#00843D] hover:bg-[#00c853]">
                    Ajouter
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Clock className="w-5 h-5" />
            Timeline des événements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(event.level)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  {index < filteredHistory.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-200 dark:bg-zinc-700 my-2" />
                  )}
                </div>

                {/* Event content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-900 dark:text-white">{event.title}</h3>
                        <Badge variant="outline" className={getBadgeColor(event.level)}>
                          {event.level === 'critical' ? 'CRITIQUE' : event.level === 'warning' ? 'ATTENTION' : 'INFO'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-zinc-400">{event.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                        {formatDate(event.timestamp)}
                      </span>
                      {event.type === 'info' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500 dark:text-zinc-400">
                    {event.lineId && <span>Ligne: {event.lineId}</span>}
                    {event.user && <span>Par: {event.user}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
              Aucun événement trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
