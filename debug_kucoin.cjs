// Script de diagnóstico para el componente KuCoinTest
const fs = require('fs');

// Simular el comportamiento del componente
async function debugKuCoinTest() {
  console.log('🔍 Diagnóstico del componente KuCoinTest\n');

  // 1. Verificar estado de servidores
  console.log('1. Verificando servidores...');
  try {
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    console.log('✅ Backend:', data);
  } catch (error) {
    console.log('❌ Backend error:', error.message);
  }

  try {
    const response = await fetch('http://localhost:5173');
    console.log('✅ Frontend: Status', response.status);
  } catch (error) {
    console.log('❌ Frontend error:', error.message);
  }

  // 2. Verificar credenciales
  console.log('\n2. Verificando credenciales...');
  try {
    const response = await fetch('http://localhost:8000/api/kucoin-credentials-check');
    const data = await response.json();
    console.log('✅ Credenciales:', data);
  } catch (error) {
    console.log('❌ Credenciales error:', error.message);
  }

  // 3. Verificar endpoints específicos
  console.log('\n3. Verificando endpoints...');

  const endpoints = [
    { name: 'symbols', testType: 'symbols' },
    { name: 'accountOverview', testType: 'accountOverview' },
    { name: 'btcTicker', testType: 'btcTicker' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch('http://localhost:8000/api/kucoin-test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: endpoint.testType, params: {} })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint.name}: Success`);
        if (data.data && typeof data.data === 'object') {
          const count = Object.keys(data.data).length;
          console.log(`   Datos: ${count} elementos`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }

  // 4. Verificar archivos del frontend
  console.log('\n4. Verificando archivos del frontend...');
  const files = [
    'src/components/KuCoinTest.tsx',
    'src/components/KuCoinModules/MarketOverview.tsx',
    'src/components/KuCoinModules/SymbolDetails.tsx'
  ];

  files.forEach(file => {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file}: ${stats.size} bytes`);
    } else {
      console.log(`❌ ${file}: No encontrado`);
    }
  });
}

debugKuCoinTest().catch(console.error);

