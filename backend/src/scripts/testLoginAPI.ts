import * as dotenv from 'dotenv';
dotenv.config();

const testLoginAPI = async () => {
  const apiUrl = process.env.API_URL || 'http://localhost:3000';
  
  console.log('🧪 Test de l\'API de login...\n');
  
  try {
    // Test avec les bonnes credentials
    console.log('1. Test avec admin@prisk.local / admin123:');
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@prisk.local',
        password: 'admin123',
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('   ✅ Login réussi !');
      console.log(`   - Token: ${data.token.substring(0, 20)}...`);
      console.log(`   - Email: ${data.email}`);
      console.log(`   - Nom: ${data.full_name}`);
      console.log(`   - Rôle: ${data.role}`);
    } else {
      console.log(`   ❌ Erreur: ${data.error}`);
    }

    // Test avec de mauvaises credentials
    console.log('\n2. Test avec mauvais mot de passe:');
    const badResponse = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@prisk.local',
        password: 'wrongpassword',
      }),
    });

    const badData = await badResponse.json();
    
    if (!badResponse.ok) {
      console.log(`   ✅ Erreur attendue: ${badData.error}`);
    } else {
      console.log('   ❌ Le login aurait dû échouer !');
    }

    console.log('\n✅ Tests terminés !');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testLoginAPI();



