import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react';
import { makeKuCoinRequest } from '../../api/kucoin-proxy';

interface MarketSymbol {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  markPrice: number;
  indexPrice: number;
  priceChgPct: number;
  volumeOf24h: number;
  turnoverOf24h: number;
  openInterest: string;
  maxLeverage: number;
  fundingFeeRate: number;
  status: string;
}

const MarketOverview: React.FC = () => {
  const [symbols, setSymbols] = useState<MarketSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price'>('volume');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Cargando datos de mercado desde KuCoin...');

      const response = await makeKuCoinRequest('symbols');

      if (response && response.success && response.data) {
        console.log('✅ Datos de símbolos recibidos correctamente');

        // Convertir los datos al formato que necesitamos
        const formattedSymbols: MarketSymbol[] = Object.values(response.data)
          .filter((symbol: any) => symbol.status === 'Open' && symbol.quoteCurrency === 'USDT')
          .map((symbol: any) => ({
            symbol: symbol.symbol,
            baseCurrency: symbol.baseCurrency,
            quoteCurrency: symbol.quoteCurrency,
            markPrice: symbol.markPrice || 0,
            indexPrice: symbol.indexPrice || 0,
            priceChgPct: symbol.priceChgPct || 0,
            volumeOf24h: symbol.volumeOf24h || 0,
            turnoverOf24h: symbol.turnoverOf24h || 0,
            openInterest: symbol.openInterest || '0',
            maxLeverage: symbol.maxLeverage || 1,
            fundingFeeRate: symbol.fundingFeeRate || 0,
            status: symbol.status || 'Unknown'
          }))
          .sort((a, b) => b.volumeOf24h - a.volumeOf24h)
          .slice(0, 50); // Top 50 por volumen

        console.log(`✅ Procesados ${formattedSymbols.length} símbolos`);
        setSymbols(formattedSymbols);
      } else {
        const errorMsg = response?.error || 'Error loading market data';
        console.error('❌ Error en respuesta de símbolos:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Failed to load market data from KuCoin';
      console.error('❌ Error de conexión:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
    const formatted = (value * 100).toFixed(3);
    return `${value >= 0 ? '+' : ''}${formatted}%`;
  };

  const filteredSymbols = symbols.filter(symbol =>
    symbol.symbol.toLowerCase().includes(filter.toLowerCase()) ||
    symbol.baseCurrency.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedSymbols = [...filteredSymbols].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.volumeOf24h - a.volumeOf24h;
      case 'change':
        return Math.abs(b.priceChgPct) - Math.abs(a.priceChgPct);
      case 'price':
        return b.markPrice - a.markPrice;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading KuCoin market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          <h3 className="text-lg font-semibold text-red-400">Error Loading Market Data</h3>
        </div>
        <p className="text-red-300">{error}</p>
        <button
          onClick={loadMarketData}
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
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="text-xl font-semibold text-white">KuCoin Market Overview</h2>
            <p className="text-slate-400 text-sm">Real-time market data from KuCoin futures</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search symbols..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'volume' | 'change' | 'price')}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="volume">Sort by Volume</option>
            <option value="change">Sort by Change</option>
            <option value="price">Sort by Price</option>
          </select>

          <button
            onClick={loadMarketData}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
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
              <p className="text-slate-400 text-sm">24h Volume</p>
              <p className="text-2xl font-bold text-white">
                ${formatNumber(symbols.reduce((sum, s) => sum + s.volumeOf24h, 0))}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
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
            <DollarSign className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Top Gainer</p>
              <p className="text-lg font-bold text-emerald-400">
                {symbols.length > 0 ?
                  formatPercentage(Math.max(...symbols.map(s => s.priceChgPct))) :
                  '+0.000%'
                }
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Market Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">24h Change</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Volume 24h</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Open Interest</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Max Leverage</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Funding Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedSymbols.map((symbol) => (
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
                    <span className="font-mono text-white">
                      {formatCurrency(symbol.markPrice)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-medium ${symbol.priceChgPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPercentage(symbol.priceChgPct)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-slate-300 font-mono">
                      ${formatNumber(symbol.volumeOf24h)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-slate-300 font-mono">
                      {formatNumber(symbol.openInterest)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-blue-400 font-medium">
                      {symbol.maxLeverage}x
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`font-mono text-sm ${symbol.fundingFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(symbol.fundingFeeRate * 100).toFixed(4)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedSymbols.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">No symbols found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Top Volume Symbols</h3>
          <div className="space-y-3">
            {symbols.slice(0, 5).map((symbol, index) => (
              <div key={symbol.symbol} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-sm">#{index + 1}</span>
                  <span className="text-white font-medium">{symbol.symbol}</span>
                </div>
                <span className="text-emerald-400 font-mono">
                  ${formatNumber(symbol.volumeOf24h)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Highest Leverage</h3>
          <div className="space-y-3">
            {symbols
              .sort((a, b) => b.maxLeverage - a.maxLeverage)
              .slice(0, 5)
              .map((symbol, index) => (
                <div key={symbol.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-sm">#{index + 1}</span>
                    <span className="text-white font-medium">{symbol.symbol}</span>
                  </div>
                  <span className="text-blue-400 font-medium">
                    {symbol.maxLeverage}x
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Best Funding Rates</h3>
          <div className="space-y-3">
            {symbols
              .sort((a, b) => b.fundingFeeRate - a.fundingFeeRate)
              .slice(0, 5)
              .map((symbol, index) => (
                <div key={symbol.symbol} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400 text-sm">#{index + 1}</span>
                    <span className="text-white font-medium">{symbol.symbol}</span>
                  </div>
                  <span className={`font-mono text-sm ${symbol.fundingFeeRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {(symbol.fundingFeeRate * 100).toFixed(4)}%
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;

