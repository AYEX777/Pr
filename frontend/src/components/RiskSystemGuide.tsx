import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RiskGradientIndicator, RiskGauge } from './RiskGradientIndicator';
import { getRiskColorFromScore } from '../lib/utils';
import { Thermometer, Droplet, Gauge, AlertCircle } from 'lucide-react';

export function RiskSystemGuide() {
  const exampleScores = [0.15, 0.35, 0.65, 0.9];
  
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-green-600" />
            Système de Gradient de Risque - PRISK
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Introduction */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Représentation visuelle des niveaux de risque
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Le système PRISK utilise un gradient de couleur fluide pour représenter visuellement 
              le niveau de risque de chaque paramètre industriel. Les couleurs évoluent 
              progressivement du <span className="text-green-600 font-semibold">vert</span> (sécurité) 
              au <span className="text-red-600 font-semibold">rouge</span> (danger critique), 
              permettant une identification immédiate de l'état des équipements.
            </p>
          </div>

          {/* Color Scale */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Échelle de couleurs</h4>
            <div className="space-y-6">
              {exampleScores.map((score, index) => (
                <div key={index} className="flex items-center gap-6">
                  <div 
                    className="w-24 h-12 rounded-lg shadow-md flex items-center justify-center font-bold text-white"
                    style={{ 
                      backgroundColor: getRiskColorFromScore(score),
                      boxShadow: `0 4px 12px ${getRiskColorFromScore(score)}40`
                    }}
                  >
                    {Math.round(score * 100)}%
                  </div>
                  <div className="flex-1">
                    <RiskGradientIndicator
                      score={score}
                      size="md"
                      showLabel={true}
                      showPercentage={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Examples */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Exemples visuels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Droplet className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-green-900">0-25%</p>
                <p className="text-xs text-green-700 mt-1">Niveau Faible</p>
                <p className="text-xs text-gray-600 mt-2">Conditions normales</p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Thermometer className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-yellow-900">25-50%</p>
                <p className="text-xs text-yellow-700 mt-1">Niveau Moyen</p>
                <p className="text-xs text-gray-600 mt-2">Surveillance requise</p>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Gauge className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-orange-900">50-75%</p>
                <p className="text-xs text-orange-700 mt-1">Niveau Élevé</p>
                <p className="text-xs text-gray-600 mt-2">Attention nécessaire</p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-red-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm font-semibold text-red-900">75-100%</p>
                <p className="text-xs text-red-700 mt-1">Niveau Critique</p>
                <p className="text-xs text-gray-600 mt-2">Action immédiate</p>
              </div>
            </div>
          </div>

          {/* Gauge Examples */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Jauges circulaires</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {exampleScores.map((score, index) => (
                <div key={index}>
                  <RiskGauge score={score} size={100} showLabel={true} />
                </div>
              ))}
            </div>
          </div>

          {/* Applications */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">Applications du système</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Surveillance en temps réel de la pression, température, volume et pH</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Identification rapide des équipements nécessitant une intervention</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Priorisation automatique des alertes selon le niveau de risque</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Visualisation cohérente à travers toute l'application</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
