import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingDown, Target, Activity, DollarSign } from 'lucide-react';
import { makeKuCoinRequest } from '../../api/kucoin-proxy';

interface RiskSymbol {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  initialMargin: number;
  maintainMargin: number;
  maxLeverage: number;
  minRiskLimit: number;
  maxRiskLimit: number;
  isDeleverage: boolean;
  markPrice: number;
  lotSize: number;
  tickSize: number;
  fundingFeeRate: number;
  openInterest: string;
  volumeOf24h: number;
}

const RiskMetrics: React.FC = () => {
  const [symbols, setSymbols] = useState<RiskSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskView, setRiskView] = useState<'overview' | 'high-risk' | 'low-margin'>('overview');

  useEffect(() => {
    loadRiskData();
  }, []);

  const loadRiskData = async () => {
    try {
      setLoading(true);
      const response = await makeKuCoinRequest('symbols');

      if (response.success && response.data) {
        const riskSymbols: RiskSymbol[] = Object.values(response.data)
          .filter((symbol: any) => symbol.status === 'Open')
          .map((symbol: any) => ({
            symbol: symbol.symbol,
            baseCurrency: symbol.baseCurrency,
            quoteCurrency: symbol.quoteCurrency,
            initialMargin: symbol.initialMargin || 0,
            maintainMargin: symbol.maintainMargin || 0,
            maxLeverage: symbol.maxLeverage || 1,
            minRiskLimit: symbol.minRiskLimit || 0,
            maxRiskLimit: symbol.maxRiskLimit || 0,
            isDeleverage: symbol.isDeleverage || false,
            markPrice: symbol.markPrice || 0,
            lotSize: symbol.lotSize || 1,
            tickSize: symbol.tickSize || 0,
            fundingFeeRate: symbol.fundingFeeRate || 0,
            openInterest: symbol.openInterest || '0',
            volumeOf24h: symbol.volumeOf24h || 0
          }));

        setSymbols(riskSymbols);
      } else {
        setError(response.error || 'Error loading risk data');
      }
    } catch (err) {
      setError('Failed to load risk data');
      console.error('Risk data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatNumber = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(4) + '%';
  };

  const calculateRiskScore = (symbol: RiskSymbol) => {
    let score = 0;

    // High leverage increases risk
    if (symbol.maxLeverage >= 100) score += 30;
    else if (symbol.maxLeverage >= 50) score += 20;
    else if (symbol.maxLeverage >= 25) score += 10;

    // Low margin requirements increase risk
    if (symbol.initialMargin <= 0.01) score += 25;
    else if (symbol.initialMargin <= 0.02) score += 15;
    else if (symbol.initialMargin <= 0.05) score += 5;

    // High funding rate indicates risk
    if (Math.abs(symbol.fundingFeeRate) >= 0.001) score += 15;
    else if (Math.abs(symbol.fundingFeeRate) >= 0.0005) score += 10;

    // Deleverage enabled indicates higher risk
    if (symbol.isDeleverage) score += 20;

    return score;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'Very High', color: 'text-red-400', bgColor: 'bg-red-500/20' };
    if (score >= 50) return { level: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/20' };
    if (score >= 30) return { level: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    return { level: 'Low', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' };
  };

  const filteredSymbols = symbols.filter(symbol => {
    switch (riskView) {
      case 'high-risk':
        return calculateRiskScore(symbol) >= 50;
      case 'low-margin':
        return symbol.initialMargin <= 0.02;
      default:
        return true;
    }
  });

  const sortedSymbols = [...filteredSymbols].sort((a, b) => {
    return calculateRiskScore(b) - calculateRiskScore(a);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading risk metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Risk Data</h3>
        </div>
        <p className="text-red-300">{error}</p>
        <button
          onClick={loadRiskData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-red-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">KuCoin Risk Metrics</h2>
            <p className="text-slate-400 text-sm">Risk analysis and margin requirements</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Risk View Filter */}
          <select
            value={riskView}
            onChange={(e) => setRiskView(e.target.value as 'overview' | 'high-risk' | 'low-margin')}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="overview">All Symbols</option>
            <option value="high-risk">High Risk Only</option>
            <option value="low-margin">Low Margin Only</option>
          </select>

          <button
            onClick={loadRiskData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Symbols</p>
              <p className="text-2xl font-bold text-white">{symbols.length}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Risk</p>
              <p className="text-2xl font-bold text-red-400">
                {symbols.filter(s => calculateRiskScore(s) >= 50).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Avg Leverage</p>
              <p className="text-2xl font-bold text-white">
                {symbols.length > 0 ? (symbols.reduce((sum, s) => sum + s.maxLeverage, 0) / symbols.length).toFixed(0) : 0}x
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Lowest Margin</p>
              <p className="text-2xl font-bold text-orange-400">
                {symbols.length > 0 ? formatPercentage(Math.min(...symbols.map(s => s.initialMargin))) : '0.00%'}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Risk Score</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Leverage</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Initial Margin</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Maintenance</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Funding Rate</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Open Interest</th>
              </tr>
            </thead>
            <tbody>
              {sortedSymbols.map((symbol) => {
                const riskScore = calculateRiskScore(symbol);
                const riskLevel = getRiskLevel(riskScore);

                return (
                  <tr key={symbol.symbol} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-medium text-white">{symbol.symbol}</span>
                        <div className="text-xs text-slate-400">
                          {symbol.baseCurrency}/{symbol.quoteCurrency}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${riskLevel.bgColor} ${riskLevel.color}`}>
                          {riskLevel.level}
                        </span>
                        <span className="text-white font-mono">{riskScore}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-bold ${symbol.maxLeverage >= 100 ? 'text-red-400' : symbol.maxLeverage >= 50 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {symbol.maxLeverage}x
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-mono ${symbol.initialMargin <= 0.01 ? 'text-red-400' : symbol.initialMargin <= 0.02 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {formatPercentage(symbol.initialMargin)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-slate-300 font-mono">
                        {formatPercentage(symbol.maintainMargin)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className={`font-mono text-sm ${symbol.fundingFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercentage(symbol.fundingFeeRate)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="text-slate-300 font-mono">
                        {formatNumber(symbol.openInterest)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
          <div className="space-y-4">
            {[
              { label: 'Very High Risk (70+)', count: symbols.filter(s => calculateRiskScore(s) >= 70).length, color: 'bg-red-500' },
              { label: 'High Risk (50-69)', count: symbols.filter(s => calculateRiskScore(s) >= 50 && calculateRiskScore(s) < 70).length, color: 'bg-orange-500' },
              { label: 'Medium Risk (30-49)', count: symbols.filter(s => calculateRiskScore(s) >= 30 && calculateRiskScore(s) < 50).length, color: 'bg-yellow-500' },
              { label: 'Low Risk (0-29)', count: symbols.filter(s => calculateRiskScore(s) < 30).length, color: 'bg-emerald-500' }
            ].map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                  <span className="text-slate-300 text-sm">{category.label}</span>
                </div>
                <span className="text-white font-medium">{category.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Warnings</h3>
          <div className="space-y-4">
            {symbols
              .filter(s => calculateRiskScore(s) >= 50)
              .slice(0, 5)
              .map((symbol, index) => {
                const riskScore = calculateRiskScore(symbol);
                const riskLevel = getRiskLevel(riskScore);

                return (
                  <div key={symbol.symbol} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{symbol.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${riskLevel.bgColor} ${riskLevel.color}`}>
                        {riskLevel.level} Risk
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Leverage: {symbol.maxLeverage}x | Margin: {formatPercentage(symbol.initialMargin)} | Risk Score: {riskScore}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Risk Calculator */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Symbol</label>
            <select
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="calculator-symbol"
            >
              {symbols.map((symbol) => (
                <option key={symbol.symbol} value={symbol.symbol}>
                  {symbol.symbol} ({symbol.maxLeverage}x)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Position Size ($)</label>
            <input
              type="number"
              defaultValue={1000}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="position-size"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Leverage</label>
            <select
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              id="calculator-leverage"
            >
              <option value={1}>1x</option>
              <option value={5}>5x</option>
              <option value={10}>10x</option>
              <option value={25}>25x</option>
              <option value={50}>50x</option>
              <option value={100}>100x</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onclick="calculateRisk()"
            >
              Calculate
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
          <h4 className="text-white font-medium mb-3">Risk Analysis Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Margin Required:</span>
              <p className="text-blue-400 font-mono" id="calc-margin">$0</p>
            </div>
            <div>
              <span className="text-slate-400">Liquidation Risk:</span>
              <p className="text-red-400 font-mono" id="calc-liquidation">0%</p>
            </div>
            <div>
              <span className="text-slate-400">Risk Score:</span>
              <p className="text-purple-400 font-mono" id="calc-risk-score">0</p>
            </div>
            <div>
              <span className="text-slate-400">Risk Level:</span>
              <p className="text-emerald-400 font-mono" id="calc-risk-level">Low</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMetrics;

