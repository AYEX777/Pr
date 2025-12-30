import pool from '../config/database';
import { findAll, findById } from '../models/productionLineModel';
import * as dotenv from 'dotenv';

dotenv.config();

const testAPI = async () => {
  try {
    console.log('🧪 Test de l\'API GET /api/lines\n');

    // Test findAll
    console.log('1. Test findAll() - Toutes les lignes:');
    const allLines = await findAll();
    console.log(`   ✅ ${allLines.length} lignes récupérées\n`);

    // Afficher la structure de la première ligne
    if (allLines.length > 0) {
      const firstLine = allLines[0];
      console.log('2. Structure de la première ligne (Ligne A):');
      console.log(`   - ID: ${firstLine.id}`);
      console.log(`   - Name: ${firstLine.name}`);
      console.log(`   - Zone: ${firstLine.zone}`);
      console.log(`   - Risk Level: ${firstLine.riskLevel}`);
      console.log(`   - Max Risk Score: ${firstLine.maxRiskScore}`);
      console.log(`   - Last Update: ${firstLine.lastUpdate}`);
      console.log(`   - Capteurs: 4 capteurs (Pression, Température, Vibration, Extension)`);
      console.log(`   - Pression: ${firstLine.pressure.value} ${firstLine.pressure.unit} (ID: ${firstLine.pressure.id})`);
      console.log(`   - Température: ${firstLine.temperature.value} ${firstLine.temperature.unit} (ID: ${firstLine.temperature.id})`);
      console.log(`   - Vibration: ${firstLine.vibration.value} ${firstLine.vibration.unit} (ID: ${firstLine.vibration.id})`);
      console.log(`   - Extension: ${firstLine.level.value} ${firstLine.level.unit} (ID: ${firstLine.level.id})\n`);

      // Vérifier que les IDs correspondent (4 capteurs seulement)
      const expectedIds = {
        pressure: 'line-A-pressure',
        temperature: 'line-A-temp',
        vibration: 'line-A-vib',
        level: 'line-A-level',
      };

      console.log('3. Vérification des IDs des capteurs:');
      let allMatch = true;
      for (const [key, expectedId] of Object.entries(expectedIds)) {
        const sensor = firstLine[key as keyof typeof firstLine] as any;
        if (sensor && sensor.id === expectedId) {
          console.log(`   ✅ ${key}: ${sensor.id}`);
        } else {
          console.log(`   ❌ ${key}: attendu ${expectedId}, obtenu ${sensor?.id}`);
          allMatch = false;
        }
      }

      if (allMatch) {
        console.log('\n   ✅ Tous les IDs correspondent à mockData.ts !\n');
      } else {
        console.log('\n   ⚠️  Certains IDs ne correspondent pas\n');
      }
    }

    // Test findById
    console.log('4. Test findById("line-B"):');
    const lineB = await findById('line-B');
    if (lineB) {
      console.log(`   ✅ Ligne B trouvée: ${lineB.name} (${lineB.zone})`);
      console.log(`   - Risk Level: ${lineB.riskLevel}`);
      console.log(`   - Max Risk Score: ${lineB.maxRiskScore}`);
    } else {
      console.log('   ❌ Ligne B non trouvée');
    }

    console.log('\n✅ Tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await pool.end();
  }
};

testAPI();

