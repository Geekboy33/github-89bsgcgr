import React, { useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { useMarketMaker } from '../context/MarketMakerContext';

const Dashboard: React.FC = React.memo(() => {
  const { marketData, positions, metrics, isConnected, isLoading, error } = useMarketMaker();

  // Memoizar funciones de formateo
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Memoizar datos ordenados
  const sortedMarketData = useMemo(() => {
    return [...marketData].sort((a, b) => b.volume - a.volume);
  }, [marketData]);

  if (isLoading && marketData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading market data...</p>
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
        <p className="text-red-300 text-sm mt-2">Please check your API connection and try again.</p>
      </div>
    );
  }

  if (marketData.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-slate-400">Connect to exchanges to start receiving market data.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Equity</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(metrics.equity)}</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Daily PnL</p>
              <p className={`text-2xl font-bold ${metrics.dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(metrics.dailyPnl)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${metrics.dailyPnl >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {metrics.dailyPnl >= 0 ? 
                <TrendingUp className="w-6 h-6 text-emerald-400" /> : 
                <TrendingDown className="w-6 h-6 text-red-400" />
              }
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Open Orders</p>
              <p className="text-2xl font-bold text-white">{metrics.openOrders}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">System Health</p>
              <p className="text-2xl font-bold text-white">{metrics.healthyExchanges}/2</p>
            </div>
            <div className={`p-3 rounded-lg ${metrics.openCircuits === 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {metrics.openCircuits === 0 ? 
                <CheckCircle className="w-6 h-6 text-emerald-400" /> : 
                <AlertCircle className="w-6 h-6 text-red-400" />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Market Data Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">Active Markets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">24h Change</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Volume</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Spread</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Volatility</th>
              </tr>
            </thead>
            <tbody>
              {sortedMarketData.map((market) => (
                <tr key={market.symbol} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-4 px-6">
                    <span className="font-medium text-white">{market.symbol}</span>
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {formatCurrency(market.price)}
                  </td>
                  <td className={`py-4 px-6 text-right font-medium ${
                    market.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(market.change24h)}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">
                    {market.volume.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">
                    {(market.spread * 100).toFixed(3)}%
                  </td>
                  <td className="py-4 px-6 text-right text-slate-300 font-mono">
                    {(market.volatility * 100).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Mode Indicator */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Risk Mode</h3>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                metrics.riskMode === 'conservative' ? 'bg-blue-500/20 text-blue-400' :
                metrics.riskMode === 'aggressive' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {metrics.riskMode.toUpperCase()}
              </span>
              <span className="text-slate-400 text-sm">
                {metrics.riskMode === 'conservative' && 'Low risk, stable returns'}
                {metrics.riskMode === 'aggressive' && 'Medium risk, higher returns'}
                {metrics.riskMode === 'aggressive_plus' && 'High risk, maximum returns'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">Open Circuits</p>
            <p className="text-2xl font-bold text-white">{metrics.openCircuits}</p>
          </div>
        </div>
      </div>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;