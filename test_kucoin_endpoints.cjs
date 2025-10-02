const axios = require('axios');

async function testKuCoinEndpoints() {
  const baseUrl = 'http://localhost:8000';

  console.log('🔍 Probando endpoints de KuCoin...\n');

  // Test 1: Verificar estado general
  try {
    const testResponse = await axios.get(`${baseUrl}/api/test`);
    console.log('✅ Estado general:', testResponse.data);
  } catch (error) {
    console.log('❌ Error en estado general:', error.message);
  }

  // Test 2: Verificar credenciales
  try {
    const credResponse = await axios.get(`${baseUrl}/api/kucoin-credentials-check`);
    console.log('✅ Credenciales:', credResponse.data);
  } catch (error) {
    console.log('❌ Error en credenciales:', error.message);
  }

  // Test 3: Probar symbols (datos públicos)
  try {
    const symbolsResponse = await axios.post(`${baseUrl}/api/kucoin-test-proxy`,
      { testType: 'symbols', params: {} }
    );
    console.log('✅ Symbols: Éxito');
    if (symbolsResponse.data && symbolsResponse.data.data) {
      const symbolCount = Object.keys(symbolsResponse.data.data).length;
      console.log(`   - Símbolos disponibles: ${symbolCount}`);
    }
  } catch (error) {
    console.log('❌ Error en symbols:', error.response?.data?.error || error.message);
  }

  // Test 4: Probar account overview (requiere permisos)
  try {
    const accountResponse = await axios.post(`${baseUrl}/api/kucoin-test-proxy`,
      { testType: 'accountOverview', params: {} }
    );
    console.log('✅ Account Overview: Éxito');
  } catch (error) {
    console.log('❌ Error en account overview:', error.response?.data?.error || error.message);
  }
}

testKuCoinEndpoints().catch(console.error);

