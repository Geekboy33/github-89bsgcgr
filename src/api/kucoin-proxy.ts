// Frontend proxy client - sends requests to backend instead of directly to KuCoin
const BASE_URL = 'http://localhost:8000';

export async function makeKuCoinRequest(testType: string, params: any = {}) {
  try {
    console.log(`Making request to backend proxy: ${testType}`);

    const response = await fetch(`${BASE_URL}/api/kucoin-test-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        testType,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);

    return data;
  } catch (error) {
    console.error('Backend Proxy Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Additional helper function for credentials check
export async function checkKuCoinCredentials() {
  try {
    const response = await fetch(`${BASE_URL}/api/kucoin-credentials-check`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Credentials check error:', error);
    return {
      api_key_configured: false,
      api_secret_configured: false,
      passphrase_configured: false,
      all_configured: false
    };
  }
}