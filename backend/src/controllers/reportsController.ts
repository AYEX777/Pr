import { Request, Response } from 'express';
import pool from '../config/database';

/**
 * GET /api/reports/production
 * Récupère les données de performance de production par ligne
 */
export const getProductionReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = '7d' } = req.query;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Calculer les scores moyens par jour pour chaque ligne
    const result = await pool.query(
      `SELECT 
        s.line_id,
        pl.name as line_name,
        DATE(sr.created_at) as date,
        AVG(
          CASE
            WHEN sr.value >= s.threshold THEN 100.0
            WHEN sr.value >= s.threshold * 0.85 THEN 85.0
            WHEN sr.value >= s.threshold * 0.65 THEN 65.0
            ELSE 25.0
          END
        ) as avg_score
      FROM sensor_readings sr
      JOIN sensors s ON sr.sensor_id = s.id
      JOIN production_lines pl ON s.line_id = pl.id
      WHERE sr.created_at >= $1
      GROUP BY s.line_id, pl.name, DATE(sr.created_at)
      ORDER BY date ASC, s.line_id`,
      [startDate]
    );

    // Organiser par ligne
    const lineDataMap = new Map<string, any[]>();
    result.rows.forEach(row => {
      const lineId = row.line_id;
      if (!lineDataMap.has(lineId)) {
        lineDataMap.set(lineId, []);
      }
      const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      const date = new Date(row.date);
      lineDataMap.get(lineId)!.push({
        date: dayNames[date.getDay()],
        [lineId]: Number(row.avg_score.toFixed(1)),
      });
    });

    // Créer le format pour Recharts
    const allDates = new Set<string>();
    lineDataMap.forEach(data => {
      data.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dayOrder = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });

    const productionData = sortedDates.map(date => {
      const point: any = { date };
      lineDataMap.forEach((data, lineId) => {
        const dataPoint = data.find(d => d.date === date);
        point[lineId] = dataPoint ? dataPoint[lineId] : null;
      });
      return point;
    });

    res.status(200).json({
      success: true,
      data: productionData,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de production:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la génération du rapport',
    });
  }
};

/**
 * GET /api/reports/alerts/distribution
 * Récupère la répartition des alertes par sévérité
 */
export const getAlertsDistribution = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT 
        severity,
        COUNT(*) as count
      FROM alerts
      GROUP BY severity`
    );

    const distribution = result.rows.map(row => ({
      name: row.severity === 'critical' ? 'Critiques' : row.severity === 'warning' ? 'Avertissements' : 'Info',
      value: parseInt(row.count),
      color: row.severity === 'critical' ? '#EF4444' : row.severity === 'warning' ? '#F59E0B' : '#3B82F6',
    }));

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la distribution des alertes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
};

/**
 * GET /api/reports/interventions/types
 * Récupère la répartition des interventions par type
 */
export const getInterventionsTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT 
        status,
        COUNT(*) as count
      FROM interventions
      GROUP BY status`
    );

    const distribution = result.rows.map(row => ({
      type: row.status === 'completed' ? 'Préventives' : row.status === 'in_progress' ? 'Correctives' : 'Urgentes',
      count: parseInt(row.count),
      color: row.status === 'completed' ? '#10B981' : row.status === 'in_progress' ? '#F59E0B' : '#EF4444',
    }));

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des types d\'interventions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
};

/**
 * GET /api/reports/availability
 * Récupère l'évolution de la disponibilité mensuelle
 */
export const getAvailabilityReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months as string));

    // Calculer la disponibilité basée sur les alertes critiques et les interventions
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('month', sr.created_at) as month,
        COUNT(DISTINCT CASE WHEN a.severity = 'critical' THEN a.id END) as critical_alerts,
        COUNT(DISTINCT CASE WHEN i.status = 'in_progress' THEN i.id END) as active_interventions,
        COUNT(DISTINCT sr.id) as total_readings
      FROM sensor_readings sr
      LEFT JOIN alerts a ON a.line_id = (SELECT line_id FROM sensors WHERE id = sr.sensor_id LIMIT 1)
        AND DATE_TRUNC('month', a.created_at) = DATE_TRUNC('month', sr.created_at)
      LEFT JOIN interventions i ON i.line_id = (SELECT line_id FROM sensors WHERE id = sr.sensor_id LIMIT 1)
        AND DATE_TRUNC('month', i.date) = DATE_TRUNC('month', sr.created_at)
      WHERE sr.created_at >= $1
      GROUP BY DATE_TRUNC('month', sr.created_at)
      ORDER BY month ASC`,
      [startDate]
    );

    const availabilityData = result.rows.map(row => {
      const month = new Date(row.month);
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      // Calculer la disponibilité (100% - % de temps d'arrêt estimé)
      const downtimePercent = Math.min(10, (row.critical_alerts * 2 + row.active_interventions * 5));
      const availability = Math.max(90, 100 - downtimePercent);

      return {
        month: monthNames[month.getMonth()],
        taux: Number(availability.toFixed(1)),
      };
    });

    res.status(200).json({
      success: true,
      data: availabilityData,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de disponibilité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
};

/**
 * GET /api/reports/summary
 * Calcule des statistiques simples :
 * - Nombre d'alertes par ligne
 * - Nombre d'interventions terminées
 * - Moyenne du risque sur les dernières 24h
 */
export const getReportsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Calculer le nombre d'alertes par ligne
    const alertsByLineResult = await pool.query(`
      SELECT 
        line_id,
        COUNT(*) as alert_count,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN acknowledged = false THEN 1 END) as unacknowledged_count
      FROM alerts
      GROUP BY line_id
      ORDER BY line_id
    `);

    const alertsByLine = alertsByLineResult.rows.map(row => ({
      line_id: row.line_id,
      total: parseInt(row.alert_count),
      critical: parseInt(row.critical_count),
      warning: parseInt(row.warning_count),
      unacknowledged: parseInt(row.unacknowledged_count),
    }));

    // Calculer le nombre d'interventions terminées
    const completedInterventionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM interventions
      WHERE status = 'completed'
    `);

    const completedInterventions = parseInt(completedInterventionsResult.rows[0]?.count || '0');

    // Calculer la moyenne du risque sur les dernières 24h
    // On utilise les données de sensor_readings pour calculer une moyenne approximative
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Récupérer les seuils des capteurs
    const sensorsResult = await pool.query(`
      SELECT line_id, type, threshold
      FROM sensors
    `);
    
    // Créer un map des seuils par ligne et type
    const thresholdsByLine: { [key: string]: { [key: string]: number } } = {};
    sensorsResult.rows.forEach((row: any) => {
      if (!thresholdsByLine[row.line_id]) {
        thresholdsByLine[row.line_id] = {};
      }
      thresholdsByLine[row.line_id][row.type] = parseFloat(row.threshold);
    });
    
    // Calculer les scores de risque par ligne
    const riskScoreResult = await pool.query(`
      SELECT 
        s.line_id,
        s.type,
        AVG(sr.value) as avg_value
      FROM sensor_readings sr
      JOIN sensors s ON sr.sensor_id = s.id
      WHERE sr.created_at >= $1
      GROUP BY s.line_id, s.type
    `, [twentyFourHoursAgo]);
    
    // Calculer le score de risque moyen par ligne
    const riskScoresByLineMap: { [key: string]: number[] } = {};
    riskScoreResult.rows.forEach((row: any) => {
      const lineId = row.line_id;
      const sensorType = row.type;
      const avgValue = parseFloat(row.avg_value);
      const threshold = thresholdsByLine[lineId]?.[sensorType] || 1;
      
      let riskScore = 0.25;
      if (avgValue >= threshold) {
        riskScore = 1.0;
      } else if (avgValue >= threshold * 0.85) {
        riskScore = 0.85;
      } else if (avgValue >= threshold * 0.65) {
        riskScore = 0.65;
      }
      
      if (!riskScoresByLineMap[lineId]) {
        riskScoresByLineMap[lineId] = [];
      }
      riskScoresByLineMap[lineId].push(riskScore);
    });
    
    const riskScoresByLine = Object.entries(riskScoresByLineMap).map(([lineId, scores]) => ({
      line_id: lineId,
      avg_risk_score: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
    }));

    // Calculer la moyenne globale du risque
    const globalAvgRisk = riskScoresByLine.length > 0
      ? riskScoresByLine.reduce((sum, line) => sum + line.avg_risk_score, 0) / riskScoresByLine.length
      : 0;

    // Statistiques globales
    const totalAlertsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN acknowledged = false THEN 1 END) as unacknowledged,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical
      FROM alerts
    `);

    const totalAlerts = totalAlertsResult.rows[0] || { total: 0, unacknowledged: 0, critical: 0 };

    const summary = {
      generated_at: new Date().toISOString(),
      period: {
        start: twentyFourHoursAgo.toISOString(),
        end: new Date().toISOString(),
      },
      alerts: {
        total: parseInt(totalAlerts.total),
        unacknowledged: parseInt(totalAlerts.unacknowledged),
        critical: parseInt(totalAlerts.critical),
        by_line: alertsByLine,
      },
      interventions: {
        completed: completedInterventions,
      },
      risk_scores: {
        global_average: globalAvgRisk,
        by_line: riskScoresByLine,
      },
    };

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la génération du rapport',
    });
  }
};

