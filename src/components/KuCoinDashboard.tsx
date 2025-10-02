import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, RefreshCw, CheckCircle, XCircle, Zap } from 'lucide-react';

interface AccountData {
  availableBalance: number;
  accountEquity: number;
  unrealisedPNL: number;
  marginBalance: number;
  positionMargin: number;
  orderMargin: number;
  frozenFunds: number;
}

interface Contract {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  multiplier: number;
  firstOpenDate: number;
  expireDate: number | null;
  status: string;
}

interface TickerData {
  symbol: string;
  sequence: number;
  side: string;
  size: number;
  price: string;
  bestBidSize: number;
  bestBidPrice: string;
  bestAskPrice: string;
  bestAskSize: number;
  ts: number;
}

const KuCoinDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const [error, setError] = useState<string>('');

  const testConnection = async () => {
    setLoading(true);
    setError('');

    try {
      // Check credentials
      const credResponse = await fetch('http://localhost:8000/api/kucoin-credentials-check');
      const credData = await credResponse.json();

      if (!credData.all_configured) {
        setError('KuCoin credentials not configured');
        setConnected(false);
        return;
      }

      // Test account overview
      const accountResponse = await fetch('http://localhost:8000/api/kucoin-test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'accountOverview', params: {} })
      });

      const accountResult = await accountResponse.json();

      if (accountResult.success) {
        setAccountData(accountResult.data);
        setConnected(true);
      } else {
        setError(`Account Error: ${accountResult.error}`);
        setConnected(false);
      }

      // Get active contracts
      const contractsResponse = await fetch('http://localhost:8000/api/kucoin-test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'symbols', params: {} })
      });

      const contractsResult = await contractsResponse.json();

      if (contractsResult.success && Array.isArray(contractsResult.data)) {
        setContracts(contractsResult.data.slice(0, 10));
      }

      // Get BTC ticker
      const tickerResponse = await fetch('http://localhost:8000/api/kucoin-test-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'btcTicker', params: { symbol: 'XBTUSDTM' } })
      });

      const tickerResult = await tickerResponse.json();

      if (tickerResult.success) {
        setTicker(tickerResult.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-8 h-8 text-blue-400" />
          <h1 className="text-3xl font-bold text-white">KuCoin Futures Dashboard</h1>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            connected ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            {connected ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-medium ${
              connected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <button
          onClick={testConnection}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-400">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Account Overview */}
      {accountData && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Account Overview</span>
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 rounded-lg p-6 border border-emerald-500/30">
                <div className="text-sm text-emerald-300 mb-2">Account Equity</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(accountData.accountEquity || 0)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
                <div className="text-sm text-slate-400 mb-2">Available Balance</div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(accountData.availableBalance || 0)}
                </div>
              </div>

              <div className={`rounded-lg p-6 border ${
                (accountData.unrealisedPNL || 0) >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className={`text-sm mb-2 ${
                  (accountData.unrealisedPNL || 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
                }`}>
                  Unrealized PnL
                </div>
                <div className={`text-3xl font-bold ${
                  (accountData.unrealisedPNL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {formatCurrency(accountData.unrealisedPNL || 0)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-400">Margin Balance</div>
                <div className="text-xl font-semibold text-white">
                  {formatCurrency(accountData.marginBalance || 0)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-400">Position Margin</div>
                <div className="text-xl font-semibold text-white">
                  {formatCurrency(accountData.positionMargin || 0)}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-400">Order Margin</div>
                <div className="text-xl font-semibold text-white">
                  {formatCurrency(accountData.orderMargin || 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Ticker */}
      {ticker && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Live Market Data - {ticker.symbol}</span>
            </h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-400">Last Price</div>
                <div className="text-2xl font-bold text-white">{formatCurrency(parseFloat(ticker.price))}</div>
              </div>

              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <div className="text-sm text-emerald-300">Best Bid</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(parseFloat(ticker.bestBidPrice))}
                </div>
                <div className="text-xs text-emerald-300 mt-1">Size: {ticker.bestBidSize}</div>
              </div>

              <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
                <div className="text-sm text-red-300">Best Ask</div>
                <div className="text-2xl font-bold text-red-400">
                  {formatCurrency(parseFloat(ticker.bestAskPrice))}
                </div>
                <div className="text-xs text-red-300 mt-1">Size: {ticker.bestAskSize}</div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <div className="text-sm text-slate-400">Spread</div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(parseFloat(ticker.bestAskPrice) - parseFloat(ticker.bestBidPrice))}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {(((parseFloat(ticker.bestAskPrice) - parseFloat(ticker.bestBidPrice)) / parseFloat(ticker.price)) * 100).toFixed(3)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Contracts */}
      {contracts.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Active Contracts ({contracts.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Quote</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Multiplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {contracts.map((contract, index) => (
                  <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-white">{contract.symbol}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {contract.baseCurrency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {contract.quoteCurrency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {contract.multiplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                        contract.status === 'Open'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {contract.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default KuCoinDashboard;
