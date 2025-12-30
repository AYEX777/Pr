import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Wrench, Clock, CheckCircle, AlertCircle, Plus, User, Calendar, FileText, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { createIntervention, fetchInterventions, updateInterventionStatus, updateIntervention, deleteIntervention, Intervention as InterventionDto } from '../lib/api';
import { mockProductionLines } from '../lib/mockData';
import { toast } from 'sonner';

interface UiIntervention extends InterventionDto {
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export function InterventionsView() {
  const [interventions, setInterventions] = useState<UiIntervention[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState('preventive');
  const [formLineId, setFormLineId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<UiIntervention | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UiIntervention | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLineId, setEditLineId] = useState('');


  const loadInterventions = async () => {
    try {
      setLoading(true);
      const data = await fetchInterventions();
      setInterventions(
        (data || []).map((item) => ({
          ...item,
          priority: item.type === 'urgent' ? 'critical' : item.type === 'corrective' ? 'high' : 'medium',
        }))
      );
    } catch (err) {
      console.error('Failed to load interventions', err);
      toast.error('Impossible de charger les interventions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterventions();
    const interval = setInterval(loadInterventions, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'planned':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'preventive':
        return 'Préventive';
      case 'corrective':
        return 'Corrective';
      case 'urgent':
        return 'Urgente';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'planned':
        return 'Planifiée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const filteredInterventions = useMemo(() => {
    return interventions.filter((intervention) => {
      if (selectedTab !== 'all' && intervention.status !== selectedTab) return false;
      if (searchQuery && !(`${intervention.title || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [interventions, searchQuery, selectedTab]);

  const stats = useMemo(() => {
    return {
      total: interventions.length,
      in_progress: interventions.filter((i) => i.status === 'in_progress').length,
      planned: interventions.filter((i) => i.status === 'planned').length,
      completed: interventions.filter((i) => i.status === 'completed').length,
    };
  }, [interventions]);

  const handleCreate = async () => {
    if (!formTitle.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    try {
      const created = await createIntervention({
        title: formTitle,
        type: formType,
        line_id: formLineId || undefined,
        description: formDescription || formTitle,
        status: 'planned',
        technician_name: 'Technicien', // À améliorer avec authentification
      });
      setInterventions((prev) => [
        {
          ...created,
          priority: created.type === 'urgent' ? 'critical' : created.type === 'corrective' ? 'high' : 'medium',
        },
        ...prev,
      ]);
      toast.success('Intervention créée avec succès');
      setIsDialogOpen(false);
      setFormTitle('');
      setFormDescription('');
      setFormType('preventive');
      setFormLineId('');
    } catch (err: any) {
      console.error('Failed to create intervention', err);
      const errorMessage = err?.message || 'Création impossible';
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateInterventionStatus(id, status);
      setInterventions((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated, priority: i.priority } : i))
      );
      toast.success(`Statut mis à jour: ${status}`);
    } catch (err) {
      console.error('Failed to update intervention', err);
      toast.error('Mise à jour impossible');
    }
  };

  const openEdit = (intervention: UiIntervention) => {
    setEditTarget(intervention);
    setEditDescription(intervention.description || '');
    setEditLineId(intervention.line_id || '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;

    try {
      const updated = await updateIntervention(editTarget.id, {
        line_id: editLineId || null,
        description: editDescription || editTarget.description || '',
      });

      setInterventions((prev) =>
        prev.map((i) =>
          i.id === updated.id
            ? {
                ...i,
                ...updated,
                priority: i.priority,
              }
            : i
        )
      );

      toast.success('Intervention mise à jour avec succès');
      setEditOpen(false);
      setEditTarget(null);
    } catch (err: any) {
      console.error('Failed to update intervention', err);
      const errorMessage = err?.message || 'Mise à jour impossible';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    const toDelete = interventions.find((i) => i.id === id);
    const label = toDelete?.description || toDelete?.title || id;
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer cette intervention ?\n\n${label}`
    );
    if (!confirmed) return;

    try {
      await deleteIntervention(id);
      setInterventions((prev) => prev.filter((i) => i.id !== id));
      toast.success('Intervention supprimée avec succès');
    } catch (err: any) {
      console.error('Failed to delete intervention', err);
      const errorMessage = err?.message || 'Suppression impossible';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Interventions</h1>
          <p className="text-gray-600 dark:text-zinc-400">Gestion des interventions de maintenance</p>
        </div>
        <Button 
          className="gap-2 bg-[#00843D] hover:bg-[#00c853] text-white rounded-lg px-4 py-2"
          onClick={() => setIsDialogOpen(true)}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Nouvelle intervention
        </Button>
        <Dialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Planifier une intervention</DialogTitle>
              <DialogDescription className="sr-only">
                Formulaire pour créer une nouvelle intervention de maintenance
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Ex: Remplacement filtre..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formType} onValueChange={setFormType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Préventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priorité</Label>
                  <Select>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="line">Ligne (optionnel)</Label>
                <Select value={formLineId || "none"} onValueChange={(value) => setFormLineId(value === "none" ? "" : value)}>
                  <SelectTrigger id="line">
                    <SelectValue placeholder="Sélectionner une ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune ligne spécifique</SelectItem>
                    {mockProductionLines.map(line => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Détails de l'intervention..."
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={!formTitle.trim() || loading} className="bg-[#00843D] hover:bg-[#00c853]">
                Créer l'intervention
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Total</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">En cours</p>
                <p className="text-2xl text-blue-600">{stats.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Planifiées</p>
                <p className="text-2xl text-gray-900 dark:text-white">{stats.planned}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Terminées</p>
                <p className="text-2xl text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Input
            placeholder="Rechercher une intervention..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="in_progress">En cours</TabsTrigger>
          <TabsTrigger value="planned">Planifiées</TabsTrigger>
          <TabsTrigger value="completed">Terminées</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab}>
          <div className="space-y-4">
            {filteredInterventions.map((intervention) => (
              <Card key={intervention.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Priority indicator */}
                    <div className={`w-1 h-full ${getPriorityColor(intervention.priority)} rounded`} />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg text-gray-900 dark:text-white">{intervention.title}</h3>
                            <Badge variant="outline" className={getStatusColor(intervention.status)}>
                              {getStatusLabel(intervention.status)}
                            </Badge>
                            <Badge variant="outline">
                              {getTypeLabel(intervention.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-2">{intervention.description}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">{intervention.id}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                          <User className="w-4 h-4" />
                          <span>{intervention.line_id ? mockProductionLines.find(l => l.id === intervention.line_id)?.name || intervention.line_id : 'Toutes lignes'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(new Date(intervention.created_at))}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(intervention.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-zinc-400">
                          <FileText className="w-4 h-4" />
                          <span>{intervention.type}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedIntervention(intervention);
                            setDetailOpen(true);
                          }}
                        >
                          Voir détails
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(intervention)}
                        >
                          Modifier
                        </Button>
                        {intervention.status === 'planned' && (
                          <Button size="sm" onClick={() => handleStatusChange(intervention.id, 'in_progress')}>
                            Démarrer
                          </Button>
                        )}
                        {intervention.status === 'in_progress' && (
                          <Button size="sm" onClick={() => handleStatusChange(intervention.id, 'completed')}>
                            Terminer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleDelete(intervention.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInterventions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-zinc-400">Aucune intervention trouvée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      {/* Dialog Détails */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'intervention</DialogTitle>
            <DialogDescription className="sr-only">
              Informations détaillées sur l'intervention sélectionnée
            </DialogDescription>
          </DialogHeader>
          {selectedIntervention && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-zinc-400">ID</p>
                <p className="text-sm font-mono text-gray-800 dark:text-zinc-100">
                  {selectedIntervention.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-zinc-400">Titre</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {selectedIntervention.title || '(Sans titre)'}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Type</p>
                  <p className="text-sm text-gray-800 dark:text-zinc-100">
                    {getTypeLabel(selectedIntervention.type)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Statut</p>
                  <p className="text-sm text-gray-800 dark:text-zinc-100">
                    {getStatusLabel(selectedIntervention.status)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Date</p>
                  <p className="text-sm text-gray-800 dark:text-zinc-100">
                    {formatDate(new Date(selectedIntervention.created_at))}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-zinc-400">Ligne</p>
                <p className="text-sm text-gray-800 dark:text-zinc-100">
                  {selectedIntervention.line_id
                    ? mockProductionLines.find((l) => l.id === selectedIntervention.line_id)?.name ||
                      selectedIntervention.line_id
                    : 'Toutes lignes'}
                </p>
              </div>
              {selectedIntervention.description && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 dark:text-zinc-400">Description</p>
                  <p className="text-sm text-gray-800 dark:text-zinc-100 whitespace-pre-line">
                    {selectedIntervention.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Modification */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier l'intervention</DialogTitle>
            <DialogDescription className="sr-only">
              Modifier la description et la ligne de l'intervention sélectionnée
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-line">Ligne (optionnel)</Label>
                <Select
                  value={editLineId || 'none'}
                  onValueChange={(value) => setEditLineId(value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="edit-line">
                    <SelectValue placeholder="Sélectionner une ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune ligne spécifique</SelectItem>
                    {mockProductionLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editTarget}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
