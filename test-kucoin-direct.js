#!/usr/bin/env node

import crypto from 'crypto';
import https from 'https';

// Credenciales de KuCoin
const API_KEY = '68da47b097abe30001b097a4';
const API_SECRET = '8a670bb1-44a2-43b6-97d6-f23922d77e97';
const PASSPHRASE = 'Eldiosdeacero34@';

function createSignature(timestamp, method, endpoint, body = '') {
    const message = timestamp + method + endpoint + body;
    const signature = crypto
        .createHmac('sha256', API_SECRET)
        .update(message)
        .digest('base64');
    
    const passphraseSignature = crypto
        .createHmac('sha256', API_SECRET)
        .update(PASSPHRASE)
        .digest('base64');
    
    return { signature, passphraseSignature };
}

function makeKuCoinRequest(endpoint, method = 'GET') {
    return new Promise((resolve, reject) => {
        const timestamp = Date.now().toString();
        const { signature, passphraseSignature } = createSignature(timestamp, method, endpoint);
        
        const options = {
            hostname: 'api-futures.kucoin.com',
            port: 443,
            path: endpoint,
            method: method,
            headers: {
                'KC-API-KEY': API_KEY,
                'KC-API-SIGN': signature,
                'KC-API-TIMESTAMP': timestamp,
                'KC-API-PASSPHRASE': passphraseSignature,
                'KC-API-KEY-VERSION': '2',
                'Content-Type': 'application/json',
                'User-Agent': 'MarketMaker-Pro/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: jsonData
                    });
                } catch (e) {
                    reject(new Error(`JSON Parse Error: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testKuCoinAPI() {
    console.log('🚀 Probando conexión directa con KuCoin API...\n');
    
    const tests = [
        {
            name: 'Account Overview',
            endpoint: '/api/v1/account-overview',
            description: 'Verificar acceso a cuenta'
        },
        {
            name: 'Active Contracts',
            endpoint: '/api/v1/contracts/active',
            description: 'Obtener contratos activos'
        },
        {
            name: 'BTC Ticker',
            endpoint: '/api/v1/ticker?symbol=XBTUSDTM',
            description: 'Datos de mercado BTC'
        }
    ];

    for (const test of tests) {
        try {
            console.log(`📊 ${test.name}: ${test.description}`);
            
            const result = await makeKuCoinRequest(test.endpoint);
            
            if (result.statusCode === 200 && result.data.code === '200000') {
                console.log(`✅ SUCCESS: ${test.name}`);
                
                if (test.name === 'Account Overview') {
                    const data = result.data.data;
                    console.log(`   💰 Account Equity: ${data.accountEquityTotal || 'N/A'} USDT`);
                    console.log(`   💵 Available Balance: ${data.availableBalance || 'N/A'} USDT`);
                } else if (test.name === 'Active Contracts') {
                    const contracts = result.data.data || [];
                    const usdtContracts = contracts.filter(c => c.quoteCurrency === 'USDT');
                    console.log(`   📈 Total contracts: ${contracts.length}`);
                    console.log(`   💱 USDT pairs: ${usdtContracts.length}`);
                } else if (test.name === 'BTC Ticker') {
                    const ticker = result.data.data;
                    console.log(`   💲 BTC Price: $${ticker.price || 'N/A'}`);
                    console.log(`   📊 24h Volume: ${ticker.vol || 'N/A'}`);
                }
                
            } else {
                console.log(`❌ ERROR: ${test.name}`);
                console.log(`   Status: ${result.statusCode}`);
                console.log(`   Code: ${result.data.code}`);
                console.log(`   Message: ${result.data.msg || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log(`💥 FAILED: ${test.name}`);
            console.log(`   Error: ${error.message}`);
        }
        
        console.log(''); // Línea en blanco
        
        // Pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🎉 Prueba de API completada!');
}

// Ejecutar prueba
testKuCoinAPI().catch(console.error);