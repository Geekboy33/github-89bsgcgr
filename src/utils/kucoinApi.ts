import CryptoJS from 'crypto-js';

export interface KuCoinCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

export class KuCoinAPI {
  private baseUrl = 'https://api-futures.kucoin.com';
  private credentials: KuCoinCredentials;

  constructor(credentials: KuCoinCredentials) {
    this.credentials = credentials;
  }

  private generateSignature(timestamp: string, method: string, endpoint: string, body: string = ''): string {
    const message = timestamp + method + endpoint + body;
    return CryptoJS.HmacSHA256(message, this.credentials.apiSecret).toString(CryptoJS.enc.Base64);
  }

  private generatePassphraseSignature(): string {
    return CryptoJS.HmacSHA256(this.credentials.passphrase, this.credentials.apiSecret).toString(CryptoJS.enc.Base64);
  }

  private async makeRequest(method: string, endpoint: string, body?: any) {
    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : '';

    const signature = this.generateSignature(timestamp, method, endpoint, bodyStr);
    const passphraseSignature = this.generatePassphraseSignature();

    const headers: Record<string, string> = {
      'KC-API-KEY': this.credentials.apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphraseSignature,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers
    };

    if (body && method !== 'GET') {
      options.body = bodyStr;
    }

    try {
      const response = await fetch(this.baseUrl + endpoint, options);
      const data = await response.json();

      if (data.code === '200000') {
        return { success: true, data: data.data };
      } else {
        return {
          success: false,
          error: data.msg || 'Unknown error',
          code: data.code
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async getAccountOverview() {
    return this.makeRequest('GET', '/api/v1/account-overview');
  }

  async getActiveContracts() {
    return this.makeRequest('GET', '/api/v1/contracts/active');
  }

  async getTicker(symbol: string = 'XBTUSDTM') {
    return this.makeRequest('GET', `/api/v1/ticker?symbol=${symbol}`);
  }

  async getOrderBook(symbol: string) {
    return this.makeRequest('GET', `/api/v1/level2/depth20?symbol=${symbol}`);
  }

  async getPositions() {
    return this.makeRequest('GET', '/api/v1/positions');
  }

  async getOrders(status?: string) {
    const params = status ? `?status=${status}` : '';
    return this.makeRequest('GET', `/api/v1/orders${params}`);
  }

  async createOrder(params: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'limit' | 'market';
    size: number;
    price?: number;
    leverage?: number;
  }) {
    return this.makeRequest('POST', '/api/v1/orders', params);
  }

  async cancelOrder(orderId: string) {
    return this.makeRequest('DELETE', `/api/v1/orders/${orderId}`);
  }
}

export default KuCoinAPI;
