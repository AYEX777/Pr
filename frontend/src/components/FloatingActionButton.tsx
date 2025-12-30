import { motion } from 'motion/react';
import { Plus, X, AlertCircle, FileText, Wrench, Bell } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { generateReport, createAlert, createIntervention } from '../lib/api';
import { toast } from 'sonner';

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [interventionDialogOpen, setInterventionDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  // Form states
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [interventionTitle, setInterventionTitle] = useState('');
  const [interventionType, setInterventionType] = useState('corrective');
  const [interventionDescription, setInterventionDescription] = useState('');
  const [reportName, setReportName] = useState('');

  const handleReport = () => {
    setIsOpen(false);
    setReportDialogOpen(true);
  };

  const handleReportSubmit = async () => {
    try {
      await generateReport({ name: reportName || 'Rapport via FAB' });
      toast.success('Rapport généré avec succès');
      setReportDialogOpen(false);
      setReportName('');
    } catch (err) {
      console.error('Report generation failed', err);
      toast.error('Impossible de générer le rapport');
    }
  };

  const handleAlert = () => {
    setIsOpen(false);
    setAlertDialogOpen(true);
  };

  const handleAlertSubmit = async () => {
    if (!alertMessage.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }
    try {
      await createAlert({ 
        message: alertMessage, 
        severity: alertSeverity 
      });
      toast.success('Alerte créée avec succès');
      setAlertDialogOpen(false);
      setAlertMessage('');
      setAlertSeverity('warning');
    } catch (err) {
      console.error('Alert creation failed', err);
      toast.error('Impossible de créer l\'alerte');
    }
  };

  const handleIntervention = () => {
    setIsOpen(false);
    setInterventionDialogOpen(true);
  };

  const handleInterventionSubmit = async () => {
    if (!interventionTitle.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }
    try {
      await createIntervention({ 
        title: interventionTitle, 
        type: interventionType, 
        status: 'planned', 
        description: interventionDescription 
      });
      toast.success('Intervention créée avec succès');
      setInterventionDialogOpen(false);
      setInterventionTitle('');
      setInterventionType('corrective');
      setInterventionDescription('');
    } catch (err) {
      console.error('Intervention creation failed', err);
      toast.error('Impossible de créer l\'intervention');
    }
  };

  const handleNotification = () => {
    setIsOpen(false);
    toast.info('Fonctionnalité de notification à venir');
  };

  const actions: FloatingAction[] = [
    {
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Nouvelle alerte',
      onClick: handleAlert,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      label: 'Intervention',
      onClick: handleIntervention,
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'Rapport',
      onClick: handleReport,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Notification',
      onClick: handleNotification,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action buttons */}
      {isOpen && (
        <motion.div
          className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 group"
            >
              <motion.span
                className="bg-white px-3 py-1.5 rounded-lg shadow-lg text-sm text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
              >
                {action.label}
              </motion.span>
              <motion.button
                onClick={action.onClick}
                className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.icon}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main FAB */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-br from-[#00843D] to-[#006B32] text-white rounded-full shadow-xl flex items-center justify-center hover-glow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isOpen ? { rotate: 45 } : { rotate: 0 }}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </motion.button>

      {/* Alert Dialog */}
      <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nouvelle alerte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-message">Message</Label>
              <Textarea
                id="alert-message"
                placeholder="Saisissez le message de l'alerte..."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alert-severity">Sévérité</Label>
              <Select value={alertSeverity} onValueChange={(value: 'info' | 'warning' | 'critical') => setAlertSeverity(value)}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setAlertDialogOpen(false)} className="border border-gray-300">
              Annuler
            </Button>
            <Button onClick={handleAlertSubmit} className="bg-[#00843D] hover:bg-[#006B32]">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Intervention Dialog */}
      <Dialog open={interventionDialogOpen} onOpenChange={setInterventionDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nouvelle intervention</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="intervention-title">Titre</Label>
              <Input
                id="intervention-title"
                placeholder="Saisissez le titre de l'intervention..."
                value={interventionTitle}
                onChange={(e) => setInterventionTitle(e.target.value)}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervention-type">Type</Label>
              <Select value={interventionType} onValueChange={setInterventionType}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="preventive">Préventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
                  <SelectItem value="predictive">Prédictive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervention-description">Description</Label>
              <Textarea
                id="intervention-description"
                placeholder="Saisissez la description de l'intervention..."
                value={interventionDescription}
                onChange={(e) => setInterventionDescription(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInterventionDialogOpen(false)} className="border border-gray-300">
              Annuler
            </Button>
            <Button onClick={handleInterventionSubmit} className="bg-[#00843D] hover:bg-[#006B32]">
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Générer un rapport</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Nom du rapport (optionnel)</Label>
              <Input
                id="report-name"
                placeholder="Saisissez le nom du rapport..."
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setReportDialogOpen(false)} className="border border-gray-300">
              Annuler
            </Button>
            <Button onClick={handleReportSubmit} className="bg-[#00843D] hover:bg-[#006B32]">
              Générer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
