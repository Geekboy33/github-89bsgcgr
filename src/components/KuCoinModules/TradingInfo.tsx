import React, { useState, useEffect } from 'react';
import { DollarSign, Percent, TrendingUp, Calculator, Target, AlertTriangle } from 'lucide-react';
import { makeKuCoinRequest } from '../../api/kucoin-proxy';

interface TradingInfo {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  markPrice: number;
  initialMargin: number;
  maintainMargin: number;
  maxLeverage: number;
  makerFeeRate: number;
  takerFeeRate: number;
  fundingFeeRate: number;
  lotSize: number;
  tickSize: number;
  maxOrderQty: number;
  minRiskLimit: number;
  maxRiskLimit: number;
  isDeleverage: boolean;
  isQuanto: boolean;
  markMethod: string;
  fairMethod: string;
}

const TradingInfo: React.FC = () => {
  const [symbols, setSymbols] = useState<TradingInfo[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTradingData();
  }, []);

  const loadTradingData = async () => {
    try {
      setLoading(true);
      const response = await makeKuCoinRequest('symbols');

      if (response.success && response.data) {
        const tradingSymbols: TradingInfo[] = Object.values(response.data)
          .filter((symbol: any) => symbol.status === 'Open')
          .map((symbol: any) => ({
            symbol: symbol.symbol,
            baseCurrency: symbol.baseCurrency,
            quoteCurrency: symbol.quoteCurrency,
            markPrice: symbol.markPrice || 0,
            initialMargin: symbol.initialMargin || 0,
            maintainMargin: symbol.maintainMargin || 0,
            maxLeverage: symbol.maxLeverage || 1,
            makerFeeRate: symbol.makerFeeRate || 0,
            takerFeeRate: symbol.takerFeeRate || 0,
            fundingFeeRate: symbol.fundingFeeRate || 0,
            lotSize: symbol.lotSize || 1,
            tickSize: symbol.tickSize || 0,
            maxOrderQty: symbol.maxOrderQty || 0,
            minRiskLimit: symbol.minRiskLimit || 0,
            maxRiskLimit: symbol.maxRiskLimit || 0,
            isDeleverage: symbol.isDeleverage || false,
            isQuanto: symbol.isQuanto || false,
            markMethod: symbol.markMethod || 'Unknown',
            fairMethod: symbol.fairMethod || 'Unknown'
          }))
          .sort((a, b) => b.volumeOf24h - a.volumeOf24h)
          .slice(0, 20); // Top 20

        setSymbols(tradingSymbols);

        if (tradingSymbols.length > 0) {
          setSelectedSymbol(tradingSymbols[0].symbol);
        }
      } else {
        setError(response.error || 'Error loading trading data');
      }
    } catch (err) {
      setError('Failed to load trading data');
      console.error('Trading data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTradingInfo = symbols.find(s => s.symbol === selectedSymbol);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
    if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
    return value.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(4) + '%';
  };

  const calculateNotionalValue = (symbol: TradingInfo, contracts: number) => {
    return symbol.markPrice * symbol.lotSize * contracts;
  };

  const calculateMarginRequired = (symbol: TradingInfo, contracts: number, leverage: number) => {
    const notional = calculateNotionalValue(symbol, contracts);
    return notional / leverage;
  };

  const calculateLiquidationPrice = (symbol: TradingInfo, entryPrice: number, positionSize: number, isLong: boolean) => {
    const maintenanceMargin = symbol.maintainMargin;
    if (isLong) {
      return entryPrice * (1 - maintenanceMargin);
    } else {
      return entryPrice * (1 + maintenanceMargin);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading trading information...</p>
        </div>
      </div>
    );
  }

  if (error || symbols.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Trading Data</h3>
        </div>
        <p className="text-red-300">{error || 'No trading data available'}</p>
        <button
          onClick={loadTradingData}
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
          <Calculator className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">KuCoin Trading Information</h2>
            <p className="text-slate-400 text-sm">Detailed trading parameters and calculations</p>
          </div>
        </div>
        <button
          onClick={loadTradingData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Symbol Selector */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center space-x-4">
          <label className="text-white font-medium">Select Symbol:</label>
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {symbols.map((symbol) => (
              <option key={symbol.symbol} value={symbol.symbol}>
                {symbol.symbol} - {symbol.baseCurrency}/{symbol.quoteCurrency}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTradingInfo && (
        <>
          {/* Trading Parameters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Parameters</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lot Size:</span>
                  <span className="text-white font-mono">{selectedTradingInfo.lotSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tick Size:</span>
                  <span className="text-white font-mono">{formatCurrency(selectedTradingInfo.tickSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Order Qty:</span>
                  <span className="text-white font-mono">{formatNumber(selectedTradingInfo.maxOrderQty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Type:</span>
                  <span className={`font-medium ${selectedTradingInfo.isInverse ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {selectedTradingInfo.isInverse ? 'Inverse' : 'Linear'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quanto:</span>
                  <span className={`font-medium ${selectedTradingInfo.isQuanto ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTradingInfo.isQuanto ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Risk Parameters</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Margin:</span>
                  <span className="text-white font-mono">{formatPercentage(selectedTradingInfo.initialMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maintenance Margin:</span>
                  <span className="text-white font-mono">{formatPercentage(selectedTradingInfo.maintainMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Leverage:</span>
                  <span className="text-blue-400 font-bold">{selectedTradingInfo.maxLeverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Limits:</span>
                  <span className="text-white font-mono">
                    {formatNumber(selectedTradingInfo.minRiskLimit)} - {formatNumber(selectedTradingInfo.maxRiskLimit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deleverage:</span>
                  <span className={`font-medium ${selectedTradingInfo.isDeleverage ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedTradingInfo.isDeleverage ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fees and Funding */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Fees</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Maker Fee:</span>
                  <span className={`font-mono ${selectedTradingInfo.makerFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedTradingInfo.makerFeeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taker Fee:</span>
                  <span className={`font-mono ${selectedTradingInfo.takerFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedTradingInfo.takerFeeRate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Funding Rate</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Rate:</span>
                  <span className={`font-mono ${selectedTradingInfo.fundingFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(selectedTradingInfo.fundingFeeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mark Method:</span>
                  <span className="text-blue-400">{selectedTradingInfo.markMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fair Method:</span>
                  <span className="text-purple-400">{selectedTradingInfo.fairMethod}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Price Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mark Price:</span>
                  <span className="text-white font-mono">{formatCurrency(selectedTradingInfo.markPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Value:</span>
                  <span className="text-emerald-400 font-mono">
                    {formatCurrency(selectedTradingInfo.markPrice * selectedTradingInfo.lotSize)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Order:</span>
                  <span className="text-blue-400 font-mono">
                    {formatCurrency(selectedTradingInfo.markPrice * selectedTradingInfo.lotSize)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Calculator */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Trading Calculator</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Contracts</label>
                <input
                  type="number"
                  defaultValue={1}
                  min={1}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="contracts-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Entry Price</label>
                <input
                  type="number"
                  defaultValue={selectedTradingInfo.markPrice}
                  step={selectedTradingInfo.tickSize}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="entry-price-input"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Leverage</label>
                <select
                  defaultValue={selectedTradingInfo.maxLeverage}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="leverage-select"
                >
                  {[1, 2, 5, 10, 25, 50, 75, 100, 125].map(lev => (
                    <option key={lev} value={lev}>{lev}x</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <h4 className="text-white font-medium mb-3">Calculation Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Notional Value:</span>
                  <p className="text-emerald-400 font-mono" id="notional-value">$0</p>
                </div>
                <div>
                  <span className="text-slate-400">Margin Required:</span>
                  <p className="text-blue-400 font-mono" id="margin-required">$0</p>
                </div>
                <div>
                  <span className="text-slate-400">Liq. Price (Long):</span>
                  <p className="text-red-400 font-mono" id="liq-price-long">$0</p>
                </div>
                <div>
                  <span className="text-slate-400">Liq. Price (Short):</span>
                  <p className="text-purple-400 font-mono" id="liq-price-short">$0</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Risk Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-medium mb-3">Position Limits</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Position:</span>
                    <span className="text-white">{formatNumber(selectedTradingInfo.maxOrderQty)} contracts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Notional:</span>
                    <span className="text-emerald-400">
                      ${formatNumber(selectedTradingInfo.maxOrderQty * selectedTradingInfo.markPrice * selectedTradingInfo.lotSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Limits:</span>
                    <span className="text-blue-400">
                      ${formatNumber(selectedTradingInfo.minRiskLimit)} - ${formatNumber(selectedTradingInfo.maxRiskLimit)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">Margin Requirements</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Initial Margin:</span>
                    <span className="text-orange-400">{formatPercentage(selectedTradingInfo.initialMargin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Maintenance Margin:</span>
                    <span className="text-red-400">{formatPercentage(selectedTradingInfo.maintainMargin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Margin Ratio:</span>
                    <span className="text-white">
                      {(selectedTradingInfo.maintainMargin / selectedTradingInfo.initialMargin * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TradingInfo;

