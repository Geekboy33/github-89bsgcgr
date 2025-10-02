import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Wifi, BarChart3, AlertTriangle, Shield } from 'lucide-react';
import { makeKuCoinRequest, checkKuCoinCredentials } from '../api/kucoin-proxy';
import KuCoinDashboard from './KuCoinModules/KuCoinDashboard';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const KuCoinTest: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    symbols: boolean;
    credentials: boolean;
    connection: boolean;
  }>({
    symbols: false,
    credentials: false,
    connection: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales cuando el componente se monte
  useEffect(() => {
    runQuickTest();
  }, []);

  const runQuickTest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Test credentials (más rápido)
      const credResponse = await checkKuCoinCredentials();
      const credentialsOk = credResponse?.all_configured || false;

      // Actualizar estado de credenciales inmediatamente
      setTestResults(prev => ({ ...prev, credentials: credentialsOk }));

      // Test symbols (datos públicos) - puede tomar más tiempo
      try {
        const symbolsResponse = await makeKuCoinRequest('symbols');
        const symbolsOk = symbolsResponse?.success && symbolsResponse?.data;
        setTestResults(prev => ({ ...prev, symbols: symbolsOk }));
      } catch (symbolsError) {
        console.warn('Symbols test failed:', symbolsError);
        setTestResults(prev => ({ ...prev, symbols: false }));
      }

      // Test connection (último, puede requerir permisos adicionales)
      try {
        const connectionResponse = await makeKuCoinRequest('connection-test');
        const connectionOk = connectionResponse?.connected || false;
        setTestResults(prev => ({ ...prev, connection: connectionOk }));
      } catch (connectionError) {
        console.warn('Connection test failed:', connectionError);
        setTestResults(prev => ({ ...prev, connection: false }));
      }

    } catch (error) {
      console.error('Quick test error:', error);
      setError('Error al verificar conexión con KuCoin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Test Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wifi className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">KuCoin Quick Test</h2>
            </div>
            <button
              onClick={runQuickTest}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wifi className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Testing...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg">
              {testResults.credentials ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Credentials</p>
                <p className="text-slate-400 text-sm">
                  {testResults.credentials ? '✅ Configured' : '❌ Not configured'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg">
              {testResults.symbols ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Market Data</p>
                <p className="text-slate-400 text-sm">
                  {testResults.symbols ? '✅ Connected' : '❌ Not connected'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-lg">
              {testResults.connection ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
              <div>
                <p className="text-white font-medium">Account Access</p>
                <p className="text-slate-400 text-sm">
                  {testResults.connection ? '✅ Full access' : '⚠️ Limited access'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              💡 <strong>Tip:</strong> If Account Access shows "Limited", you need to enable "Account" permissions in your KuCoin API key settings.
            </p>
          </div>
        </div>
      </div>

      {/* KuCoin Analytics Dashboard */}
      <KuCoinDashboard />

      {/* API Information */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">API Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-white font-medium mb-2">Connection Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">API Key:</span>
                <span className="text-white font-mono">68dd1c23...2862b</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passphrase:</span>
                <span className="text-white font-mono">Eldiosdelacero34@</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Backend:</span>
                <span className="text-emerald-400">✅ Node.js (Port 8000)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2">Available Modules</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Market Overview</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">Symbol Details</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300">Trading Information</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-slate-300">Risk Metrics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KuCoinTest;