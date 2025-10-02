async function testKuCoinEndpoints() {
  const baseUrl = 'http://localhost:8000';

  console.log('🔍 Probando endpoints de KuCoin...\n');

  // Test 1: Verificar estado general
  try {
    const testResponse = await fetch(`${baseUrl}/api/test`);
    const testData = await testResponse.json();
    console.log('✅ Estado general:', testData);
  } catch (error) {
    console.log('❌ Error en estado general:', error.message);
  }

  // Test 2: Verificar credenciales
  try {
    const credResponse = await fetch(`${baseUrl}/api/kucoin-credentials-check`);
    const credData = await credResponse.json();
    console.log('✅ Credenciales:', credData);
  } catch (error) {
    console.log('❌ Error en credenciales:', error.message);
  }

  // Test 3: Probar symbols (datos públicos)
  try {
    const symbolsResponse = await fetch(`${baseUrl}/api/kucoin-test-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testType: 'symbols', params: {} })
    });

    if (symbolsResponse.ok) {
      const symbolsData = await symbolsResponse.json();
      console.log('✅ Symbols: Éxito');
      if (symbolsData && symbolsData.data) {
        const symbolCount = Object.keys(symbolsData.data).length;
        console.log(`   - Símbolos disponibles: ${symbolCount}`);
      }
    } else {
      console.log('❌ Error en symbols:', symbolsResponse.status, symbolsResponse.statusText);
    }
  } catch (error) {
    console.log('❌ Error en symbols:', error.message);
  }

  // Test 4: Probar account overview (requiere permisos)
  try {
    const accountResponse = await fetch(`${baseUrl}/api/kucoin-test-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ testType: 'accountOverview', params: {} })
    });

    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('✅ Account Overview: Éxito');
    } else {
      const errorText = await accountResponse.text();
      console.log('❌ Error en account overview:', accountResponse.status, errorText);
    }
  } catch (error) {
    console.log('❌ Error en account overview:', error.message);
  }
}

testKuCoinEndpoints().catch(console.error);

