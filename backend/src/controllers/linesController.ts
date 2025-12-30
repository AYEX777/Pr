import { Request, Response } from 'express';
import { findAll, findById, updateRiskScore } from '../models/productionLineModel';
import { mlService } from '../services/mlService';
import { create as createAlert } from '../models/alertsModel';
import { getLineHistory as getLineHistoryModel } from '../models/sensorHistoryModel';
import pool from '../config/database';

/**
 * GET /api/lines
 * Récupère toutes les lignes de production avec leurs capteurs
 * Calcule le score de risque pour chaque ligne en utilisant le modèle ML (7 features)
 * Calcule le TBE (Temps Avant Événement)
 * Met à jour le score et le niveau de risque en DB
 * Retourne un tableau de lignes avec le TBE inclus
 */
export const getAllLines = async (req: Request, res: Response): Promise<void> => {
  try {
    const lines = await findAll();

    const linesWithMLScoresAndTBE = await Promise.all(
      lines.map(async (line) => {
        let mlScore = line.maxRiskScore; // Valeur par défaut
        let riskLevel = line.riskLevel; // Valeur par défaut
        let tbeMinutes: number | null = null;

        try {
          // 1. Calculer les 7 features
          const features = await mlService.calculateFeatures(line.id, line.pressure.value, line.temperature.value);
          const { P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT } = features;

          // 2. Prédire le score de risque avec les 7 features
          mlScore = await mlService.predictRiskScoreFrom7Features(P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT);

          // 3. Déterminer le niveau de risque
          riskLevel = mlService.getRiskLevel(mlScore);

          // 4. Calculer le TBE (Temps Avant Événement)
          tbeMinutes = mlService.calculateTBE(P, Vit_P);

          // 5. Mettre à jour le risk_score et risk_level en base de données
          await updateRiskScore(line.id, mlScore, riskLevel);

          // 6. Si le score est élevé (> 85%), créer automatiquement une alerte
          if (mlScore > 0.85) {
            try {
              const alertSeverity = mlScore >= 0.95 ? 'critical' : 'warning';
              const tbeMessage = tbeMinutes !== null && isFinite(tbeMinutes)
                ? `TBE estimé: ${tbeMinutes.toFixed(0)} min`
                : 'TBE non applicable';
              await createAlert(
                line.id,
                alertSeverity,
                `DANGER : Seuil de sécurité 10 bars imminent. Score IA: ${(mlScore * 100).toFixed(0)}%. ${tbeMessage}`
              );
              console.log(`✅ Alerte automatique créée pour la ligne ${line.id} (score: ${mlScore.toFixed(4)}, TBE: ${tbeMinutes !== null ? tbeMinutes.toFixed(0) : 'N/A'} min)`);
            } catch (alertError) {
              console.error(`Erreur lors de la création de l'alerte pour la ligne ${line.id}:`, alertError);
              // Ne pas bloquer le processus si l'alerte échoue
            }
          }
        } catch (mlError) {
          console.error(`Erreur ML/Feature pour la ligne ${line.id}:`, mlError);
          // Utiliser les valeurs de la base de données si le ML échoue
        }

        return {
          ...line,
          maxRiskScore: mlScore,
          riskLevel: riskLevel,
          tbeMinutes: tbeMinutes,
        };
      })
    );

    res.status(200).json(linesWithMLScoresAndTBE);
  } catch (error) {
    console.error('Erreur lors de la récupération des lignes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des lignes',
    });
  }
};

/**
 * GET /api/lines/:id
 * Récupère une ligne de production par son ID avec ses capteurs
 * Calcule le score de risque en utilisant le modèle ML (7 features)
 * Calcule le TBE (Temps Avant Événement)
 * Met à jour le score et le niveau de risque en DB
 * Retourne la ligne avec le TBE inclus
 */
export const getLineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'ID de ligne requis' });
      return;
    }

    const line = await findById(id);

    if (!line) {
      res.status(404).json({ success: false, error: 'Ligne non trouvée' });
      return;
    }

    let mlScore = line.maxRiskScore;
    let riskLevel = line.riskLevel;
    let tbeMinutes: number | null = null;

    try {
      // 1. Calculer les 7 features
      const features = await mlService.calculateFeatures(line.id, line.pressure.value, line.temperature.value);
      const { P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT } = features;

      // 2. Prédire le score de risque avec les 7 features
      mlScore = await mlService.predictRiskScoreFrom7Features(P, T, Vit_P, Vit_T, Instab_P, Ratio_PT, Corr_PT);

      // 3. Déterminer le niveau de risque
      riskLevel = mlService.getRiskLevel(mlScore);

      // 4. Calculer le TBE (Temps Avant Événement)
      tbeMinutes = mlService.calculateTBE(P, Vit_P);

      // 5. Mettre à jour le risk_score et risk_level en base de données
      await updateRiskScore(line.id, mlScore, riskLevel);

      // 6. Si le score est élevé (> 85%), créer automatiquement une alerte
      if (mlScore > 0.85) {
        try {
          const alertSeverity = mlScore >= 0.95 ? 'critical' : 'warning';
          const tbeMessage = tbeMinutes !== null && isFinite(tbeMinutes)
            ? `TBE estimé: ${tbeMinutes.toFixed(0)} min`
            : 'TBE non applicable';
          await createAlert(
            line.id,
            alertSeverity,
            `DANGER : Seuil de sécurité 10 bars imminent. Score IA: ${(mlScore * 100).toFixed(0)}%. ${tbeMessage}`
          );
          console.log(`✅ Alerte automatique créée pour la ligne ${line.id} (score: ${mlScore.toFixed(4)}, TBE: ${tbeMinutes !== null ? tbeMinutes.toFixed(0) : 'N/A'} min)`);
        } catch (alertError) {
          console.error(`Erreur lors de la création de l'alerte pour la ligne ${line.id}:`, alertError);
        }
      }
    } catch (mlError) {
      console.error(`Erreur ML/Feature pour la ligne ${id}:`, mlError);
      // Utiliser les valeurs de la base de données si le ML échoue
    }

    const lineWithMLScoreAndTBE = {
      ...line,
      maxRiskScore: mlScore,
      riskLevel: riskLevel,
      tbe: tbeMinutes,
    };

    res.status(200).json({ success: true, data: lineWithMLScoreAndTBE });
  } catch (error) {
    console.error('Erreur lors de la récupération de la ligne:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la récupération de la ligne' });
  }
};

/**
 * GET /api/lines/history/comparative
 * Récupère l'historique comparatif des scores de risque pour plusieurs lignes
 */
export const getComparativeHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lines, startDate, endDate, days = 7 } = req.query;

    const lineIds = lines ? (lines as string).split(',') : [];
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Récupérer les scores de risque historiques depuis sensor_readings
    // On calcule un score approximatif basé sur les valeurs des capteurs
    const query = `
      SELECT 
        s.line_id,
        DATE(sr.created_at) as date,
        AVG(
          CASE
            WHEN sr.value >= s.threshold THEN 1.0
            WHEN sr.value >= s.threshold * 0.85 THEN 0.85
            WHEN sr.value >= s.threshold * 0.65 THEN 0.65
            ELSE 0.25
          END
        ) as avg_score
      FROM sensor_readings sr
      JOIN sensors s ON sr.sensor_id = s.id
      WHERE sr.created_at >= $1 AND sr.created_at <= $2
        ${lineIds.length > 0 ? 'AND s.line_id = ANY($3::varchar[])' : ''}
      GROUP BY s.line_id, DATE(sr.created_at)
      ORDER BY date ASC, s.line_id
    `;

    const params = lineIds.length > 0 ? [start, end, lineIds] : [start, end];
    const result = await pool.query(query, params);

    // Organiser les données par ligne et date
    const lineDataMap = new Map<string, any[]>();
    const allDates = new Set<string>();

    result.rows.forEach(row => {
      const lineId = row.line_id;
      const dateStr = new Date(row.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      allDates.add(dateStr);

      if (!lineDataMap.has(lineId)) {
        lineDataMap.set(lineId, []);
      }

      lineDataMap.get(lineId)!.push({
        date: dateStr,
        fullDate: row.date,
        score: Number((row.avg_score * 100).toFixed(1)),
        lineName: lineId,
      });
    });

    // Créer le format comparatif pour Recharts
    const sortedDates = Array.from(allDates).sort();
    const comparativeData = sortedDates.map(date => {
      const point: any = { date };
      lineDataMap.forEach((data, lineId) => {
        const dataPoint = data.find(d => d.date === date);
        point[lineId] = dataPoint ? dataPoint.score : null;
      });
      return point;
    });

    // Récupérer les noms des lignes
    const linesResult = await pool.query(
      'SELECT id, name FROM production_lines WHERE id = ANY($1::varchar[])',
      [lineIds.length > 0 ? lineIds : await pool.query('SELECT id FROM production_lines').then(r => r.rows.map(row => row.id))]
    );
    const lineNames = new Map(linesResult.rows.map(row => [row.id, row.name]));

    res.status(200).json({
      success: true,
      data: {
        comparative: comparativeData,
        lines: Array.from(lineDataMap.keys()).map(lineId => ({
          id: lineId,
          name: lineNames.get(lineId) || lineId,
          data: lineDataMap.get(lineId) || [],
        })),
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique comparatif:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'historique comparatif',
    });
  }
};

/**
 * GET /api/lines/:id/history
 * Récupère l'historique des 4 capteurs d'une ligne
 */
export const getLineHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'ID de ligne requis' });
      return;
    }

    const historyData = await getLineHistoryModel(id);

    res.status(200).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique de la ligne:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'historique',
    });
  }
};
