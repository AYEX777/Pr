import { spawn } from 'child_process';
import path from 'path';
import pool from '../config/database';
import { getSensorHistory } from '../models/sensorHistoryModel';

/**
 * Service pour exécuter les prédictions ML via le script Python
 */
export class MLService {
  private pythonScriptPath: string;
  private pythonCommand: string;

  private predictRiskScriptPath: string;

  constructor() {
    // Chemin vers le script Python (ancien avec 4 arguments)
    this.pythonScriptPath = path.join(__dirname, '../ml/predict.py');
    
    // Chemin vers le nouveau script avec seulement Pression et Température
    this.predictRiskScriptPath = path.join(__dirname, '../ml/predict_risk.py');
    
    // Commande Python (essayer 'python3' d'abord, puis 'python')
    // Sur Windows, cela sera généralement 'python'
    this.pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
  }

  /**
   * Effectue une prédiction de score de risque à partir des valeurs des capteurs
   * @param pressure Valeur de pression (bar)
   * @param temperature Valeur de température (°C)
   * @param vibration Valeur de vibration (mm/s)
   * @param level Valeur de niveau/extension (%)
   * @returns Promise<number> Score de risque entre 0 et 1
   */
  async predictRiskScore(
    pressure: number,
    temperature: number,
    vibration: number,
    level: number
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // Valider les entrées
      if (
        typeof pressure !== 'number' ||
        typeof temperature !== 'number' ||
        typeof vibration !== 'number' ||
        typeof level !== 'number' ||
        isNaN(pressure) ||
        isNaN(temperature) ||
        isNaN(vibration) ||
        isNaN(level)
      ) {
        reject(new Error('Tous les paramètres doivent être des nombres valides'));
        return;
      }

      // Lancer le script Python avec les arguments
      const pythonProcess = spawn(this.pythonCommand, [
        this.pythonScriptPath,
        pressure.toString(),
        temperature.toString(),
        vibration.toString(),
        level.toString(),
      ]);

      let stdout = '';
      let stderr = '';

      // Collecter la sortie standard
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collecter les erreurs
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Gérer la fin du processus
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          const errorMessage = stderr || `Processus Python terminé avec le code ${code}`;
          console.error(`Erreur ML Service: ${errorMessage}`);
          reject(new Error(`Erreur lors de l'exécution du modèle ML: ${errorMessage}`));
          return;
        }

        // Parser le résultat
        const result = parseFloat(stdout.trim());
        
        if (isNaN(result)) {
          reject(new Error(`Résultat invalide du modèle ML: "${stdout.trim()}"`));
          return;
        }

        // S'assurer que le résultat est entre 0 et 1
        const clampedResult = Math.max(0, Math.min(1, result));
        resolve(clampedResult);
      });

      // Gérer les erreurs de spawn
      pythonProcess.on('error', (error) => {
        console.error(`Erreur lors du lancement du processus Python: ${error.message}`);
        reject(
          new Error(
            `Impossible d'exécuter Python. Vérifiez que Python est installé et accessible via "${this.pythonCommand}". Erreur: ${error.message}`
          )
        );
      });
    });
  }

  /**
   * Effectue une prédiction de score de risque à partir de Pression et Température uniquement
   * Utilise le modèle XGBoost optimisé
   * @param pressure Valeur de pression (bar)
   * @param temperature Valeur de température (°C)
   * @returns Promise<number> Score de risque entre 0 et 1
   */
  async predictRiskScoreFromPressureAndTemperature(
    pressure: number,
    temperature: number
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // Valider les entrées
      if (
        typeof pressure !== 'number' ||
        typeof temperature !== 'number' ||
        isNaN(pressure) ||
        isNaN(temperature)
      ) {
        reject(new Error('Pression et température doivent être des nombres valides'));
        return;
      }

      // Lancer le script Python avec les 2 arguments
      const pythonProcess = spawn(this.pythonCommand, [
        this.predictRiskScriptPath,
        pressure.toString(),
        temperature.toString(),
      ]);

      let stdout = '';
      let stderr = '';

      // Collecter la sortie standard
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collecter les erreurs
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Gérer la fin du processus
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          const errorMessage = stderr || `Processus Python terminé avec le code ${code}`;
          console.error(`Erreur ML Service (predict_risk): ${errorMessage}`);
          reject(new Error(`Erreur lors de l'exécution du modèle ML: ${errorMessage}`));
          return;
        }

        // Parser le résultat
        const result = parseFloat(stdout.trim());
        
        if (isNaN(result)) {
          reject(new Error(`Résultat invalide du modèle ML: "${stdout.trim()}"`));
          return;
        }

        // S'assurer que le résultat est entre 0 et 1
        const clampedResult = Math.max(0, Math.min(1, result));
        resolve(clampedResult);
      });

      // Gérer les erreurs de spawn
      pythonProcess.on('error', (error) => {
        console.error(`Erreur lors du lancement du processus Python: ${error.message}`);
        reject(
          new Error(
            `Impossible d'exécuter Python. Vérifiez que Python est installé et accessible via "${this.pythonCommand}". Erreur: ${error.message}`
          )
        );
      });
    });
  }

  /**
   * Récupère les 30 dernières minutes de données pour une ligne et calcule les 7 features
   * @param lineId ID de la ligne
   * @param currentPressure Pression actuelle
   * @param currentTemperature Température actuelle
   * @returns Promise avec les 7 features calculées
   */
  async calculateFeatures(
    lineId: string,
    currentPressure: number,
    currentTemperature: number
  ): Promise<{
    P: number;
    T: number;
    Vit_P: number;
    Vit_T: number;
    Instab_P: number;
    Ratio_PT: number;
    Corr_PT: number;
  }> {
    try {
      // Récupérer les IDs des capteurs de pression et température
      const sensorsResult = await pool.query(
        `SELECT id, type FROM sensors WHERE line_id = $1 AND type IN ('pressure', 'temperature')`,
        [lineId]
      );

      const sensorMap = new Map<string, string>();
      sensorsResult.rows.forEach((row: { id: string; type: string }) => {
        sensorMap.set(row.type, row.id);
      });

      const pressureSensorId = sensorMap.get('pressure');
      const temperatureSensorId = sensorMap.get('temperature');

      if (!pressureSensorId || !temperatureSensorId) {
        throw new Error(`Capteurs manquants pour la ligne ${lineId}`);
      }

      // Récupérer les 30 dernières minutes de données (0.5 heures)
      const pressureHistory = await getSensorHistory(pressureSensorId, 0.5, 100);
      const temperatureHistory = await getSensorHistory(temperatureSensorId, 0.5, 100);

      // Si pas assez de données, utiliser des valeurs par défaut
      if (pressureHistory.length < 2 || temperatureHistory.length < 2) {
        console.log(`⚠️  Pas assez de données historiques pour la ligne ${lineId} (P: ${pressureHistory.length}, T: ${temperatureHistory.length})`);
        return {
          P: currentPressure,
          T: currentTemperature,
          Vit_P: 0,
          Vit_T: 0,
          Instab_P: 0,
          Ratio_PT: currentTemperature > 0 ? currentPressure / currentTemperature : 0,
          Corr_PT: 0,
        };
      }

      // Calculer Vit_P (Vitesse de variation de la Pression)
      // Utiliser une régression linéaire simple sur les dernières valeurs pour une meilleure estimation
      // Si moins de 3 points, utiliser la différence simple
      let Vit_P = 0;
      if (pressureHistory.length >= 3) {
        // Utiliser les 3 dernières valeurs pour calculer la tendance
        const recentPoints = pressureHistory.slice(-3);
        const times = recentPoints.map((p, i) => i);
        const values = recentPoints.map(p => p.value);
        
        // Régression linéaire simple: y = ax + b
        const n = times.length;
        const sumX = times.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumX2 = times.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        // Convertir la pente en bar/min (chaque point représente ~15 min d'intervalle)
        // Utiliser l'intervalle moyen entre les points
        const avgIntervalMinutes = (recentPoints[recentPoints.length - 1].timestamp.getTime() - recentPoints[0].timestamp.getTime()) / (1000 * 60) / (recentPoints.length - 1);
        Vit_P = slope / avgIntervalMinutes;
      } else if (pressureHistory.length >= 2) {
        // Utiliser la différence simple entre la première et la dernière valeur
        const oldestPressure = pressureHistory[0];
        const newestPressure = pressureHistory[pressureHistory.length - 1];
        const timeDiffMinutes = (newestPressure.timestamp.getTime() - oldestPressure.timestamp.getTime()) / (1000 * 60);
        Vit_P = timeDiffMinutes > 0 
          ? (currentPressure - oldestPressure.value) / timeDiffMinutes 
          : 0;
      }
      
      console.log(`📊 Ligne ${lineId} - Vit_P: ${Vit_P.toFixed(4)} bar/min (P_actuelle: ${currentPressure}, historique: ${pressureHistory.length} points)`);

      // Calculer Vit_T (Vitesse de variation de la Température)
      let Vit_T = 0;
      if (temperatureHistory.length >= 3) {
        // Utiliser les 3 dernières valeurs pour calculer la tendance
        const recentPoints = temperatureHistory.slice(-3);
        const times = recentPoints.map((p, i) => i);
        const values = recentPoints.map(p => p.value);
        
        // Régression linéaire simple: y = ax + b
        const n = times.length;
        const sumX = times.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumX2 = times.reduce((sum, x) => sum + x * x, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        
        // Convertir la pente en °C/min
        const avgIntervalMinutes = (recentPoints[recentPoints.length - 1].timestamp.getTime() - recentPoints[0].timestamp.getTime()) / (1000 * 60) / (recentPoints.length - 1);
        Vit_T = slope / avgIntervalMinutes;
      } else if (temperatureHistory.length >= 2) {
        // Utiliser la différence simple entre la première et la dernière valeur
        const oldestTemperature = temperatureHistory[0];
        const newestTemperature = temperatureHistory[temperatureHistory.length - 1];
        const timeDiffMinutes = (newestTemperature.timestamp.getTime() - oldestTemperature.timestamp.getTime()) / (1000 * 60);
        Vit_T = timeDiffMinutes > 0 
          ? (newestTemperature.value - oldestTemperature.value) / timeDiffMinutes 
          : 0;
      }

      // Calculer Instab_P (Instabilité de la Pression = écart-type)
      const pressureValues = pressureHistory.map(r => r.value);
      const pressureMean = pressureValues.reduce((sum, val) => sum + val, 0) / pressureValues.length;
      const pressureVariance = pressureValues.reduce((sum, val) => sum + Math.pow(val - pressureMean, 2), 0) / pressureValues.length;
      const Instab_P = Math.sqrt(pressureVariance);

      // Calculer Ratio_PT
      const Ratio_PT = currentTemperature > 0 ? currentPressure / currentTemperature : 0;

      // Calculer Corr_PT (Corrélation Pression-Température)
      // Aligner les timestamps pour calculer la corrélation
      const alignedData: Array<{ pressure: number; temperature: number }> = [];
      const tempMap = new Map<number, number>();
      temperatureHistory.forEach(t => {
        tempMap.set(t.timestamp.getTime(), t.value);
      });

      pressureHistory.forEach(p => {
        const tempValue = tempMap.get(p.timestamp.getTime());
        if (tempValue !== undefined) {
          alignedData.push({ pressure: p.value, temperature: tempValue });
        }
      });

      let Corr_PT = 0;
      if (alignedData.length >= 2) {
        const pMean = alignedData.reduce((sum, d) => sum + d.pressure, 0) / alignedData.length;
        const tMean = alignedData.reduce((sum, d) => sum + d.temperature, 0) / alignedData.length;
        
        const numerator = alignedData.reduce((sum, d) => 
          sum + (d.pressure - pMean) * (d.temperature - tMean), 0
        );
        const pStd = Math.sqrt(
          alignedData.reduce((sum, d) => sum + Math.pow(d.pressure - pMean, 2), 0) / alignedData.length
        );
        const tStd = Math.sqrt(
          alignedData.reduce((sum, d) => sum + Math.pow(d.temperature - tMean, 2), 0) / alignedData.length
        );

        if (pStd > 0 && tStd > 0) {
          Corr_PT = numerator / (alignedData.length * pStd * tStd);
        }
      }

      return {
        P: currentPressure,
        T: currentTemperature,
        Vit_P,
        Vit_T,
        Instab_P,
        Ratio_PT,
        Corr_PT: Math.max(-1, Math.min(1, Corr_PT)), // Clamper entre -1 et 1
      };
    } catch (error) {
      console.error(`Erreur lors du calcul des features pour la ligne ${lineId}:`, error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        P: currentPressure,
        T: currentTemperature,
        Vit_P: 0,
        Vit_T: 0,
        Instab_P: 0,
        Ratio_PT: currentTemperature > 0 ? currentPressure / currentTemperature : 0,
        Corr_PT: 0,
      };
    }
  }

  /**
   * Calcule le Temps Restant (TBE) avant d'atteindre 10 bars
   * @param currentPressure Pression actuelle (bar)
   * @param Vit_P Vitesse de variation de la Pression (bar/min)
   * @returns Temps en minutes ou null si Vit_P <= 0 ou si la pression est déjà au-dessus du seuil
   */
  calculateTBE(currentPressure: number, Vit_P: number): number | null {
    // Si la pression est déjà au-dessus ou égale à 10 bars, pas de TBE
    if (currentPressure >= 10) {
      return null;
    }
    
    // Si Vit_P <= 0, la pression ne monte pas, donc TBE infini (état stable)
    if (Vit_P <= 0) {
      return null; // Retourner null pour indiquer "État Stable"
    }
    
    const targetPressure = 10; // Seuil de sécurité
    const TBE = (targetPressure - currentPressure) / Vit_P;
    
    // Si le TBE est négatif (pression qui descend), retourner null
    if (TBE < 0) {
      return null;
    }
    
    return TBE;
  }

  /**
   * Effectue une prédiction de score de risque avec les 7 features calculées
   * @param lineId ID de la ligne
   * @param currentPressure Pression actuelle
   * @param currentTemperature Température actuelle
   * @returns Promise<{ score: number; tbe: number | null }> Score de risque et TBE
   */
  async predictRiskScoreWithFeatures(
    lineId: string,
    currentPressure: number,
    currentTemperature: number
  ): Promise<{ score: number; tbe: number | null }> {
    // Calculer les 7 features
    const features = await this.calculateFeatures(lineId, currentPressure, currentTemperature);

    // Calculer le TBE
    const tbe = this.calculateTBE(features.P, features.Vit_P);
    console.log(`⏱️  Ligne ${lineId} - TBE calculé: ${tbe !== null ? `${tbe.toFixed(2)} min` : 'null (État Stable)'} (P: ${features.P}, Vit_P: ${features.Vit_P.toFixed(4)})`);

    // Appeler le script Python avec les 7 arguments
    const score = await this.predictRiskScoreFrom7Features(
      features.P,
      features.T,
      features.Vit_P,
      features.Vit_T,
      features.Instab_P,
      features.Ratio_PT,
      features.Corr_PT
    );

    console.log(`🎯 Ligne ${lineId} - Score ML: ${(score * 100).toFixed(2)}%, TBE: ${tbe !== null ? `${tbe.toFixed(2)} min` : 'null'}`);

    return { score, tbe };
  }

  /**
   * Effectue une prédiction de score de risque à partir des 7 features
   * @param P Pression actuelle
   * @param T Température actuelle
   * @param Vit_P Vitesse de variation de la Pression
   * @param Vit_T Vitesse de variation de la Température
   * @param Instab_P Instabilité de la Pression
   * @param Ratio_PT Ratio Pression/Température
   * @param Corr_PT Corrélation Pression-Température
   * @returns Promise<number> Score de risque entre 0 et 1
   */
  async predictRiskScoreFrom7Features(
    P: number,
    T: number,
    Vit_P: number,
    Vit_T: number,
    Instab_P: number,
    Ratio_PT: number,
    Corr_PT: number
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      // Valider les entrées
      if (
        typeof P !== 'number' || typeof T !== 'number' ||
        typeof Vit_P !== 'number' || typeof Vit_T !== 'number' ||
        typeof Instab_P !== 'number' || typeof Ratio_PT !== 'number' ||
        typeof Corr_PT !== 'number' ||
        isNaN(P) || isNaN(T) || isNaN(Vit_P) || isNaN(Vit_T) ||
        isNaN(Instab_P) || isNaN(Ratio_PT) || isNaN(Corr_PT)
      ) {
        reject(new Error('Tous les paramètres doivent être des nombres valides'));
        return;
      }

      // Lancer le script Python avec les 7 arguments
      const pythonProcess = spawn(this.pythonCommand, [
        this.predictRiskScriptPath,
        P.toString(),
        T.toString(),
        Vit_P.toString(),
        Vit_T.toString(),
        Instab_P.toString(),
        Ratio_PT.toString(),
        Corr_PT.toString(),
      ]);

      let stdout = '';
      let stderr = '';

      // Collecter la sortie standard
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Collecter les erreurs
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Gérer la fin du processus
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          const errorMessage = stderr || `Processus Python terminé avec le code ${code}`;
          console.error(`Erreur ML Service (predict_risk 7 features): ${errorMessage}`);
          reject(new Error(`Erreur lors de l'exécution du modèle ML: ${errorMessage}`));
          return;
        }

        // Parser le résultat
        const result = parseFloat(stdout.trim());
        
        if (isNaN(result)) {
          reject(new Error(`Résultat invalide du modèle ML: "${stdout.trim()}"`));
          return;
        }

        // S'assurer que le résultat est entre 0 et 1
        const clampedResult = Math.max(0, Math.min(1, result));
        resolve(clampedResult);
      });

      // Gérer les erreurs de spawn
      pythonProcess.on('error', (error) => {
        console.error(`Erreur lors du lancement du processus Python: ${error.message}`);
        reject(
          new Error(
            `Impossible d'exécuter Python. Vérifiez que Python est installé et accessible via "${this.pythonCommand}". Erreur: ${error.message}`
          )
        );
      });
    });
  }

  /**
   * Détermine le niveau de risque à partir du score
   * @param score Score de risque entre 0 et 1
   * @returns 'low' | 'medium' | 'high' | 'critical'
   */
  getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 1.0 || score >= 0.85) {
      return 'critical';
    } else if (score >= 0.65) {
      return 'high';
    } else if (score >= 0.35) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

// Instance singleton
export const mlService = new MLService();
