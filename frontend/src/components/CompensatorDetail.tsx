// @ts-nocheck
import { useState } from 'react';
import { Compensator } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowLeft, Phone, AlertCircle, Wrench, CheckCircle, Clock, Wifi } from 'lucide-react';
import { getRiskColor, getRiskLabel, formatDate, getRiskColorFromScore } from '../lib/utils';
import { GaugeChart } from './GaugeChart';
import { RiskGradientIndicator, RiskGauge } from './RiskGradientIndicator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { createIntervention } from '../lib/api';
import { useRealtimeHistory } from '../hooks/useRealtimeData';

interface CompensatorDetailProps {
  compensator: Compensator;
  onBack: () => void;
}

export function CompensatorDetail({ compensator, onBack }: CompensatorDetailProps) {
  const [timePeriod, setTimePeriod] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  
  // Real-time historical data for charts
  const pressureHistory = useRealtimeHistory(compensator.pressure, 48, 3000);
  const temperatureHistory = useRealtimeHistory(compensator.temperature, 48, 3000);
  const volumeHistory = useRealtimeHistory(compensator.volume, 48, 3000);

  const handleAction = async (action: string) => {
    const mapType = () => {
      if (action.toLowerCase().includes('urgente')) return 'urgent';
      if (action.toLowerCase().includes('préventive')) return 'preventive';
      if (action.toLowerCase().includes('ticket')) return 'corrective';
      return 'corrective';
    };

    const description = `${action} pour ${compensator.name}`;

    try {
      await createIntervention({
        compensator_id: compensator.id,
        title: action,
        type: mapType(),
        status: 'planned',
        description,
      });
      toast.success('Intervention créée', {
        description,
      });
    } catch (err) {
      console.error('Intervention creation failed', err);
      toast.error('Impossible de créer l’intervention');
    }
  };

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'repair':
        return <AlertCircle className="w-4 h-4" />;
      case 'inspection':
        return <CheckCircle className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'in_progress':
        return 'En cours';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 mb-4 hover:bg-blue-50 dark:hover:bg-zinc-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors text-gray-900 dark:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la ligne
          </Button>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl text-gray-900 dark:text-white">{compensator.name}</h1>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getRiskColor(compensator.riskLevel),
                        color: getRiskColor(compensator.riskLevel),
                        backgroundColor: getRiskColor(compensator.riskLevel) + '10',
                      }}
                    >
                      {getRiskLabel(compensator.riskLevel)}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 animate-pulse border-green-500 dark:border-green-400 text-green-700 dark:text-green-400">
                      <Wifi className="w-3 h-3" />
                      LIVE
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    Dernière mise à jour: {formatDate(compensator.lastUpdate)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleAction('Appeler technicien')}
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => handleAction('Créer ticket')}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Créer ticket
                  </Button>
                  <Button
                    className="gap-2 bg-[#00695C] hover:bg-[#004D40]"
                    onClick={() => handleAction('Maintenance préventive')}
                  >
                    <Wrench className="w-4 h-4" />
                    Maintenance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Gauges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Gauges */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  Paramètres critiques
                  <span className="text-sm font-normal text-gray-500 dark:text-zinc-400">
                    (Gradient de risque: Vert → Rouge)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Gauges principaux - Pression et Température */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <GaugeChart
                    value={compensator.pressure.value}
                    max={10}
                    threshold={compensator.pressure.threshold}
                    unit={compensator.pressure.unit}
                    label={compensator.pressure.name}
                  />
                  <GaugeChart
                    value={compensator.temperature.value}
                    max={100}
                    threshold={compensator.temperature.threshold}
                    unit={compensator.temperature.unit}
                    label={compensator.temperature.name}
                  />
                </div>

                {/* Gauges secondaires - Niveau et Vibration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <GaugeChart
                    value={compensator.level.value}
                    max={100}
                    threshold={compensator.level.threshold}
                    unit={compensator.level.unit}
                    label={compensator.level.name}
                  />
                  <GaugeChart
                    value={compensator.vibration.value}
                    max={10}
                    threshold={compensator.vibration.threshold}
                    unit={compensator.vibration.unit}
                    label={compensator.vibration.name}
                  />
                </div>

                {/* Gauges tertiaires - Viscosité et pH */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <GaugeChart
                    value={compensator.viscosity.value}
                    max={2000}
                    threshold={compensator.viscosity.threshold}
                    unit={compensator.viscosity.unit}
                    label={compensator.viscosity.name}
                  />
                  <GaugeChart
                    value={compensator.pH.value}
                    max={14}
                    threshold={compensator.pH.threshold}
                    unit={compensator.pH.unit}
                    label={compensator.pH.name}
                  />
                </div>

                {/* Gauges quaternaires - Densité et Conductivité */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <GaugeChart
                    value={compensator.density.value}
                    max={2}
                    threshold={compensator.density.threshold}
                    unit={compensator.density.unit}
                    label={compensator.density.name}
                  />
                  <GaugeChart
                    value={compensator.conductivity.value}
                    max={80}
                    threshold={compensator.conductivity.threshold}
                    unit={compensator.conductivity.unit}
                    label={compensator.conductivity.name}
                  />
                </div>

                {/* Indicateurs de gradient de risque */}
                <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-white mb-4">Niveaux de risque par paramètre</h4>
                  
                  <RiskGradientIndicator
                    score={compensator.pressure.value / 10}
                    label={`Pression (${compensator.pressure.value} ${compensator.pressure.unit})`}
                    size="md"
                  />
                  
                  <RiskGradientIndicator
                    score={compensator.temperature.value / 100}
                    label={`Température (${compensator.temperature.value} ${compensator.temperature.unit})`}
                    size="md"
                  />
                  
                  <RiskGradientIndicator
                    score={compensator.level.value / 100}
                    label={`Niveau (${compensator.level.value} ${compensator.level.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.vibration.value / 10}
                    label={`Vibration (${compensator.vibration.value} ${compensator.vibration.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.volume.value / 1000}
                    label={`Volume (${compensator.volume.value} ${compensator.volume.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={(compensator.pH.value - 7) / 7}
                    label={`pH (${compensator.pH.value})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.viscosity.value / 2000}
                    label={`Viscosité (${compensator.viscosity.value} ${compensator.viscosity.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.density.value / 2}
                    label={`Densité (${compensator.density.value} ${compensator.density.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.conductivity.value / 80}
                    label={`Conductivité (${compensator.conductivity.value} ${compensator.conductivity.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.turbidity.value / 150}
                    label={`Turbidité (${compensator.turbidity.value} ${compensator.turbidity.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.concentration.value / 100}
                    label={`Concentration (${compensator.concentration.value} ${compensator.concentration.unit})`}
                    size="md"
                  />

                  <RiskGradientIndicator
                    score={compensator.flow.value / 150}
                    label={`Débit (${compensator.flow.value} ${compensator.flow.unit})`}
                    size="md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Historical Charts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-gray-900 dark:text-white">Historique temporel</CardTitle>
                  <div className="flex gap-2">
                    {(['1h', '6h', '24h', '7d'] as const).map((period) => (
                      <Button
                        key={period}
                        variant={timePeriod === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimePeriod(period)}
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pressure" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pressure">Pression</TabsTrigger>
                    <TabsTrigger value="temperature">Température</TabsTrigger>
                    <TabsTrigger value="volume">Volume</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pressure" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={pressureHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDate(new Date(value))}
                          formatter={(value: number) => [`${value.toFixed(2)} bar`, 'Pression']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={getRiskColor(compensator.riskLevel)}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="temperature" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={temperatureHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDate(new Date(value))}
                          formatter={(value: number) => [`${value.toFixed(1)} °C`, 'Température']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#FF6F00"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="volume" className="mt-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={volumeHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="timestamp"
                          tickFormatter={(value) => new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis />
                        <Tooltip
                          labelFormatter={(value) => formatDate(new Date(value))}
                          formatter={(value: number) => [`${value.toFixed(0)} L`, 'Volume']}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#00695C"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Info and History */}
          <div className="space-y-6">
            {/* Sensor Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">État des capteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  compensator.pressure,
                  compensator.temperature,
                  compensator.volume,
                  compensator.pH,
                  compensator.concentration,
                  compensator.flow,
                  compensator.viscosity,
                  compensator.level,
                  compensator.conductivity,
                  compensator.turbidity,
                  compensator.density,
                  compensator.vibration,
                ].map((sensor) => (
                  <div key={sensor.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{sensor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Seuil: {sensor.threshold} {sensor.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white">
                        {sensor.value.toFixed(sensor.name === 'pH' ? 1 : 0)} {sensor.unit}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${
                          sensor.status === 'ok'
                            ? 'border-green-500 text-green-700'
                            : sensor.status === 'warning'
                            ? 'border-orange-500 text-orange-700'
                            : 'border-red-500 text-red-700'
                        }`}
                      >
                        {sensor.status === 'ok' ? 'OK' : sensor.status === 'warning' ? 'Attention' : 'Défaut'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Interventions History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Historique des interventions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compensator.interventions.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-zinc-400 text-center py-4">
                      Aucune intervention enregistrée
                    </p>
                  ) : (
                    compensator.interventions.map((intervention) => (
                      <div
                        key={intervention.id}
                        className="p-3 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded ${getStatusColor(intervention.status)}`}>
                            {getInterventionIcon(intervention.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm text-gray-900 dark:text-white truncate">
                                {intervention.description}
                              </p>
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {getStatusLabel(intervention.status)}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-zinc-400">
                              {formatDate(intervention.date)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                              Par: {intervention.technician}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => handleAction('Ajouter intervention')}
                >
                  Ajouter une intervention
                </Button>
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Actions recommandées</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {compensator.riskLevel === 'critical' && (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => handleAction('Évacuation immédiate')}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Évacuation immédiate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => handleAction('Isolation du système')}
                    >
                      Isoler le système
                    </Button>
                  </>
                )}
                {(compensator.riskLevel === 'high' || compensator.riskLevel === 'critical') && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => handleAction('Maintenance urgente')}
                  >
                    <Wrench className="w-4 h-4" />
                    Maintenance urgente
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => handleAction('Inspection visuelle')}
                >
                  <CheckCircle className="w-4 h-4" />
                  Inspection visuelle
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompensatorDetail;
