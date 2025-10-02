import React, { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, DollarSign, Percent, Clock, Target } from 'lucide-react';
import { makeKuCoinRequest } from '../../api/kucoin-proxy';

interface SymbolDetail {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  settleCurrency: string;
  type: string;
  status: string;
  markPrice: number;
  indexPrice: number;
  lastTradePrice: number;
  priceChgPct: number;
  priceChg: number;
  volumeOf24h: number;
  turnoverOf24h: number;
  openInterest: string;
  maxLeverage: number;
  initialMargin: number;
  maintainMargin: number;
  makerFeeRate: number;
  takerFeeRate: number;
  fundingFeeRate: number;
  nextFundingRateTime: number;
  lowPrice: number;
  highPrice: number;
  lotSize: number;
  tickSize: number;
  maxOrderQty: number;
  minRiskLimit: number;
  maxRiskLimit: number;
  isDeleverage: boolean;
  isQuanto: boolean;
  isInverse: boolean;
  markMethod: string;
  fairMethod: string;
  sourceExchanges: string[];
}

const SymbolDetails: React.FC = () => {
  const [symbols, setSymbols] = useState<SymbolDetail[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [symbolDetails, setSymbolDetails] = useState<SymbolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSymbols();
  }, []);

  const loadSymbols = async () => {
    try {
      setLoading(true);
      const response = await makeKuCoinRequest('symbols');

      if (response.success && response.data) {
        const symbolList: SymbolDetail[] = Object.values(response.data)
          .filter((symbol: any) => symbol.status === 'Open')
          .map((symbol: any) => ({
            symbol: symbol.symbol,
            baseCurrency: symbol.baseCurrency,
            quoteCurrency: symbol.quoteCurrency,
            settleCurrency: symbol.settleCurrency,
            type: symbol.type,
            status: symbol.status,
            markPrice: symbol.markPrice || 0,
            indexPrice: symbol.indexPrice || 0,
            lastTradePrice: symbol.lastTradePrice || 0,
            priceChgPct: symbol.priceChgPct || 0,
            priceChg: symbol.priceChg || 0,
            volumeOf24h: symbol.volumeOf24h || 0,
            turnoverOf24h: symbol.turnoverOf24h || 0,
            openInterest: symbol.openInterest || '0',
            maxLeverage: symbol.maxLeverage || 1,
            initialMargin: symbol.initialMargin || 0,
            maintainMargin: symbol.maintainMargin || 0,
            makerFeeRate: symbol.makerFeeRate || 0,
            takerFeeRate: symbol.takerFeeRate || 0,
            fundingFeeRate: symbol.fundingFeeRate || 0,
            nextFundingRateTime: symbol.nextFundingRateTime || 0,
            lowPrice: symbol.lowPrice || 0,
            highPrice: symbol.highPrice || 0,
            lotSize: symbol.lotSize || 1,
            tickSize: symbol.tickSize || 0,
            maxOrderQty: symbol.maxOrderQty || 0,
            minRiskLimit: symbol.minRiskLimit || 0,
            maxRiskLimit: symbol.maxRiskLimit || 0,
            isDeleverage: symbol.isDeleverage || false,
            isQuanto: symbol.isQuanto || false,
            isInverse: symbol.isInverse || false,
            markMethod: symbol.markMethod || 'Unknown',
            fairMethod: symbol.fairMethod || 'Unknown',
            sourceExchanges: symbol.sourceExchanges || []
          }));

        setSymbols(symbolList);

        // Seleccionar el primer símbolo por defecto
        if (symbolList.length > 0) {
          setSelectedSymbol(symbolList[0].symbol);
          setSymbolDetails(symbolList[0]);
        }
      } else {
        setError(response.error || 'Error loading symbols');
      }
    } catch (err) {
      setError('Failed to load symbols');
      console.error('Symbols error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const details = symbols.find(s => s.symbol === symbol);
    setSymbolDetails(details || null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading KuCoin symbols...</p>
        </div>
      </div>
    );
  }

  if (error || symbols.length === 0) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Info className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-red-400">Error Loading Symbols</h3>
        </div>
        <p className="text-red-300">{error || 'No symbols available'}</p>
        <button
          onClick={loadSymbols}
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
          <Info className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">KuCoin Symbol Details</h2>
            <p className="text-slate-400 text-sm">Detailed information for KuCoin futures contracts</p>
          </div>
        </div>
        <button
          onClick={loadSymbols}
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
            onChange={(e) => handleSymbolChange(e.target.value)}
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

      {symbolDetails && (
        <>
          {/* Price Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Mark Price</span>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(symbolDetails.markPrice)}</p>
              <p className="text-slate-400 text-sm">Current mark price</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Index Price</span>
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{formatCurrency(symbolDetails.indexPrice)}</p>
              <p className="text-slate-400 text-sm">Spot index price</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">24h Change</span>
                {symbolDetails.priceChgPct >= 0 ?
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> :
                  <TrendingDown className="w-5 h-5 text-red-400" />
                }
              </div>
              <p className={`text-2xl font-bold ${symbolDetails.priceChgPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatPercentage(symbolDetails.priceChgPct)}
              </p>
              <p className={`text-slate-400 text-sm ${symbolDetails.priceChgPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${formatNumber(symbolDetails.priceChg)}
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">24h Volume</span>
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{formatNumber(symbolDetails.volumeOf24h)}</p>
              <p className="text-slate-400 text-sm">Contracts traded</p>
            </div>
          </div>

          {/* Trading Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Parameters</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lot Size:</span>
                  <span className="text-white font-mono">{symbolDetails.lotSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tick Size:</span>
                  <span className="text-white font-mono">{formatCurrency(symbolDetails.tickSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Order Qty:</span>
                  <span className="text-white font-mono">{formatNumber(symbolDetails.maxOrderQty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contract Type:</span>
                  <span className="text-white">{symbolDetails.isInverse ? 'Inverse' : 'Linear'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quanto:</span>
                  <span className={`font-medium ${symbolDetails.isQuanto ? 'text-emerald-400' : 'text-red-400'}`}>
                    {symbolDetails.isQuanto ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Risk & Margin</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Margin:</span>
                  <span className="text-white font-mono">{formatPercentage(symbolDetails.initialMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maintenance Margin:</span>
                  <span className="text-white font-mono">{formatPercentage(symbolDetails.maintainMargin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Leverage:</span>
                  <span className="text-blue-400 font-bold">{symbolDetails.maxLeverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Limits:</span>
                  <span className="text-white font-mono">
                    {formatNumber(symbolDetails.minRiskLimit)} - {formatNumber(symbolDetails.maxRiskLimit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deleverage:</span>
                  <span className={`font-medium ${symbolDetails.isDeleverage ? 'text-red-400' : 'text-emerald-400'}`}>
                    {symbolDetails.isDeleverage ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fees and Funding */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Trading Fees</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Maker Fee:</span>
                  <span className={`font-mono ${symbolDetails.makerFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(symbolDetails.makerFeeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Taker Fee:</span>
                  <span className={`font-mono ${symbolDetails.takerFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(symbolDetails.takerFeeRate)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Funding Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Funding Rate:</span>
                  <span className={`font-mono ${symbolDetails.fundingFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercentage(symbolDetails.fundingFeeRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Funding Time:</span>
                  <span className="text-white font-mono">
                    {symbolDetails.nextFundingRateTime ?
                      new Date(symbolDetails.nextFundingRateTime * 1000).toLocaleString() :
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mark Method:</span>
                  <span className="text-blue-400">{symbolDetails.markMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fair Method:</span>
                  <span className="text-purple-400">{symbolDetails.fairMethod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Market Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Price Range (24h)</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">High:</span>
                  <span className="text-emerald-400 font-mono">{formatCurrency(symbolDetails.highPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Low:</span>
                  <span className="text-red-400 font-mono">{formatCurrency(symbolDetails.lowPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-white font-mono">
                    {formatCurrency(symbolDetails.highPrice - symbolDetails.lowPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Market Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Open Interest:</span>
                  <span className="text-blue-400 font-mono">{formatNumber(symbolDetails.openInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turnover 24h:</span>
                  <span className="text-purple-400 font-mono">${formatNumber(symbolDetails.turnoverOf24h)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume 24h:</span>
                  <span className="text-emerald-400 font-mono">{formatNumber(symbolDetails.volumeOf24h)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Source Exchanges</h3>
              <div className="flex flex-wrap gap-2">
                {symbolDetails.sourceExchanges.map((exchange, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    {exchange}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-sm">Total Sources:</p>
                <p className="text-white font-bold">{symbolDetails.sourceExchanges.length}</p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Technical Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Symbol:</span>
                <p className="text-white font-mono">{symbolDetails.symbol}</p>
              </div>
              <div>
                <span className="text-slate-400">Type:</span>
                <p className="text-blue-400">{symbolDetails.type}</p>
              </div>
              <div>
                <span className="text-slate-400">Status:</span>
                <p className={`font-medium ${symbolDetails.status === 'Open' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {symbolDetails.status}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Settlement:</span>
                <p className="text-white font-mono">{symbolDetails.settleCurrency}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SymbolDetails;

