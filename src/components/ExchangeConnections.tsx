import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Settings, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ExchangeStatus {
  name: string;
  connected: boolean;
  latency: number;
  lastPing: number;
  errorCount: number;
  apiLimits: {
    used: number;
    limit: number;
    resetTime: number;
  };
  features: {
    spot: boolean;
    futures: boolean;
    margin: boolean;
    hedgeMode: boolean;
  };
  balances: Record<string, number>;
}

const ExchangeConnections: React.FC = () => {
  const [exchanges, setExchanges] = useState<Record<string, ExchangeStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Fetch real exchange data
  useEffect(() => {
    fetchExchangeData();
    const interval = setInterval(fetchExchangeData, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchExchangeData = async () => {
    try {
      setError(null);
      // Check backend health
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        // Backend is available but exchange status endpoint not yet implemented
        setExchanges({});
      } else {
        throw new Error('Backend server not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (exchangeName: string) => {
    setTestingConnection(exchangeName);

    try {
      // API endpoint not yet implemented
      console.log('Test connection:', exchangeName);
      await fetchExchangeData();
    } catch (err) {
      setError(`Failed to test ${exchangeName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const getStatusColor = (exchange: ExchangeStatus) => {
    if (!exchange.connected) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (exchange.latency > 200) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const getStatusIcon = (exchange: ExchangeStatus) => {
    if (!exchange.connected) return <WifiOff className="w-5 h-5 text-red-400" />;
    if (exchange.latency > 200) return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    return <Wifi className="w-5 h-5 text-emerald-400" />;
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading exchange connections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Connection Error</h3>
        </div>
        <p className="text-red-300">{error}</p>
        <button
          onClick={fetchExchangeData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (Object.keys(exchanges).length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Exchanges Connected</h3>
          <p className="text-slate-400">Configure exchange credentials to start trading.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Exchange Connections</h2>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                {Object.values(exchanges).filter(e => e.connected).length} connected
              </span>
            </div>
            <button
              onClick={fetchExchangeData}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Exchange Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(exchanges).map(([key, exchange]) => (
          <div key={key} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            {/* Exchange Header */}
            <div className="p-6 border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(exchange)}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{exchange.name}</h3>
                    <p className="text-sm text-slate-400">
                      {exchange.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testConnection(key)}
                    disabled={testingConnection === key}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${testingConnection === key ? 'animate-spin' : ''}`} />
                  </button>
                  <button className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Connection Metrics */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-lg border ${getStatusColor(exchange)}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Latency</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold mt-1">
                    {exchange.connected ? `${Math.round(exchange.latency)}ms` : 'N/A'}
                  </div>
                </div>

                <div className="p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Last Ping</span>
                    <CheckCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-lg font-bold text-white mt-1">
                    {formatTime(exchange.lastPing)}
                  </div>
                </div>
              </div>

              {/* API Limits */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">API Rate Limit</span>
                  <span className="text-sm text-slate-400">
                    {exchange.apiLimits.used}/{exchange.apiLimits.limit}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      exchange.apiLimits.used / exchange.apiLimits.limit > 0.8
                        ? 'bg-red-500'
                        : exchange.apiLimits.used / exchange.apiLimits.limit > 0.6
                        ? 'bg-yellow-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${(exchange.apiLimits.used / exchange.apiLimits.limit) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-300">Supported Features</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(exchange.features).map(([feature, supported]) => (
                    <span
                      key={feature}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        supported
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-600/50 text-slate-500'
                      }`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Balances */}
              {Object.keys(exchange.balances).length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-300">Account Balances</span>
                  <div className="space-y-1">
                    {Object.entries(exchange.balances).map(([asset, balance]) => (
                      <div key={asset} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{asset}</span>
                        <span className="text-white font-mono">
                          {asset === 'USDT' ? formatCurrency(balance) : balance.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Count */}
              {exchange.errorCount > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">
                      {exchange.errorCount} recent error{exchange.errorCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Connection Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {Object.values(exchanges).filter(e => e.connected).length}
              </div>
              <div className="text-sm text-slate-400">Connected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round(
                  Object.values(exchanges)
                    .filter(e => e.connected)
                    .reduce((sum, e) => sum + e.latency, 0) /
                  Object.values(exchanges).filter(e => e.connected).length || 0
                )}ms
              </div>
              <div className="text-sm text-slate-400">Avg Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Object.values(exchanges).reduce((sum, e) => sum + e.errorCount, 0)}
              </div>
              <div className="text-sm text-slate-400">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {Object.values(exchanges).reduce((sum, e) => sum + e.apiLimits.used, 0)}
              </div>
              <div className="text-sm text-slate-400">API Calls Used</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeConnections;