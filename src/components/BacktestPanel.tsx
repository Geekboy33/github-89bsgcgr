import React, { useState } from 'react';
import { Play, Download, Search, FileText, BarChart3, Settings, Calendar, DollarSign } from 'lucide-react';

interface BacktestConfig {
  exchange: string;
  timeframe: string;
  since_days: number;
  limit_per_symbol: number;
  quote: string;
  min_quote_volume_usd: number;
  max_symbols: number;
  fee_bps: number;
  funding_bps_per8h: number;
  initial_usd: number;
  inventory_cap_usd_per_symbol: number;
}

interface BacktestResult {
  symbols: string[];
  summary: {
    cash: number;
    realized_pnl: number;
    unrealized_pnl: number;
    fees: number;
    equity: number;
  };
  per_symbol: Record<string, {
    realized_pnl: number;
    unrealized_pnl: number;
    fees: number;
    position: number;
  }>;
}

const BacktestPanel: React.FC = () => {
  const [config, setConfig] = useState<BacktestConfig>({
    exchange: 'binance',
    timeframe: '1m',
    since_days: 7,
    limit_per_symbol: 2000,
    quote: 'USDT',
    min_quote_volume_usd: 1000000,
    max_symbols: 25,
    fee_bps: 1.0,
    funding_bps_per8h: 0.0,
    initial_usd: 100000,
    inventory_cap_usd_per_symbol: 50000
  });

  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'scanning' | 'downloading' | 'backtesting' | 'completed'>('idle');
  const [results, setResults] = useState<BacktestResult | null>(null);
  const [scannedSymbols, setScannedSymbols] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number, base: number) => {
    if (base === 0) return '0.00%';
    return `${((value / base) * 100).toFixed(2)}%`;
  };

  const simulateBacktest = async () => {
    setIsRunning(true);
    setProgress(0);

    // Step 1: Scanning
    setCurrentStep('scanning');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate scanning results
    const mockSymbols = [
      'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT', 
      'MATIC/USDT', 'DOT/USDT', 'AVAX/USDT', 'LINK/USDT', 'UNI/USDT',
      'ATOM/USDT', 'FTM/USDT', 'NEAR/USDT', 'ALGO/USDT', 'VET/USDT'
    ].slice(0, config.max_symbols);
    
    setScannedSymbols(mockSymbols);
    setProgress(25);

    // Step 2: Downloading
    setCurrentStep('downloading');
    for (let i = 0; i < mockSymbols.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(25 + (i / mockSymbols.length) * 25);
    }

    // Step 3: Backtesting
    setCurrentStep('backtesting');
    await new Promise(resolve => setTimeout(resolve, 3000));
    setProgress(75);

    // Generate mock results
    const mockResults: BacktestResult = {
      symbols: mockSymbols,
      summary: {
        cash: config.initial_usd * (0.95 + Math.random() * 0.15),
        realized_pnl: (Math.random() - 0.3) * config.initial_usd * 0.1,
        unrealized_pnl: (Math.random() - 0.5) * config.initial_usd * 0.05,
        fees: config.initial_usd * 0.002 * Math.random(),
        equity: 0
      },
      per_symbol: {}
    };

    // Calculate equity
    mockResults.summary.equity = mockResults.summary.cash + mockResults.summary.unrealized_pnl;

    // Generate per-symbol results
    mockSymbols.forEach(symbol => {
      mockResults.per_symbol[symbol] = {
        realized_pnl: (Math.random() - 0.5) * 2000,
        unrealized_pnl: (Math.random() - 0.5) * 1000,
        fees: Math.random() * 100,
        position: (Math.random() - 0.5) * 10
      };
    });

    setResults(mockResults);
    setProgress(100);
    setCurrentStep('completed');
    setIsRunning(false);
  };

  const resetBacktest = () => {
    setCurrentStep('idle');
    setResults(null);
    setScannedSymbols([]);
    setProgress(0);
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'scanning': return <Search className="w-4 h-4" />;
      case 'downloading': return <Download className="w-4 h-4" />;
      case 'backtesting': return <BarChart3 className="w-4 h-4" />;
      case 'completed': return <FileText className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const getStepColor = (step: string) => {
    if (currentStep === step) return 'text-blue-400 bg-blue-500/20';
    if (progress >= getStepProgress(step)) return 'text-emerald-400 bg-emerald-500/20';
    return 'text-slate-400 bg-slate-700/30';
  };

  const getStepProgress = (step: string) => {
    switch (step) {
      case 'scanning': return 25;
      case 'downloading': return 50;
      case 'backtesting': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Backtest Configuration</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Exchange</label>
              <select
                value={config.exchange}
                onChange={(e) => setConfig(prev => ({ ...prev, exchange: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
              >
                <option value="binance">Binance</option>
                <option value="bybit">Bybit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
              <select
                value={config.timeframe}
                onChange={(e) => setConfig(prev => ({ ...prev, timeframe: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Days Back</label>
              <input
                type="number"
                value={config.since_days}
                onChange={(e) => setConfig(prev => ({ ...prev, since_days: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
                min="1"
                max="30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Max Symbols</label>
              <input
                type="number"
                value={config.max_symbols}
                onChange={(e) => setConfig(prev => ({ ...prev, max_symbols: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
                min="5"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Initial Capital (USD)</label>
              <input
                type="number"
                value={config.initial_usd}
                onChange={(e) => setConfig(prev => ({ ...prev, initial_usd: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Fee (bps)</label>
              <input
                type="number"
                value={config.fee_bps}
                onChange={(e) => setConfig(prev => ({ ...prev, fee_bps: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isRunning}
                min="0"
                step="0.1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Panel */}
      {(isRunning || currentStep !== 'idle') && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Backtest Progress</h3>
              <span className="text-sm text-slate-400">{progress}%</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2 mb-6">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { key: 'scanning', label: 'Scanning Universe', desc: 'Finding top symbols by volume' },
                { key: 'downloading', label: 'Downloading Data', desc: 'Fetching OHLCV candles' },
                { key: 'backtesting', label: 'Running Backtest', desc: 'Simulating market making' },
                { key: 'completed', label: 'Generating Reports', desc: 'Creating results summary' }
              ].map((step) => (
                <div key={step.key} className={`p-4 rounded-lg border ${getStepColor(step.key)} border-slate-600`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {getStepIcon(step.key)}
                    <span className="font-medium">{step.label}</span>
                  </div>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>

            {scannedSymbols.length > 0 && (
              <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
                <p className="text-sm text-slate-300 mb-2">Scanned Symbols ({scannedSymbols.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {scannedSymbols.slice(0, 10).map(symbol => (
                    <span key={symbol} className="px-2 py-1 bg-slate-600 text-xs rounded">
                      {symbol}
                    </span>
                  ))}
                  {scannedSymbols.length > 10 && (
                    <span className="px-2 py-1 bg-slate-600 text-xs rounded">
                      +{scannedSymbols.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Panel */}
      {results && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Final Equity</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(results.summary.equity)}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                ROI: {formatPercentage(results.summary.equity - config.initial_usd, config.initial_usd)}
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Realized PnL</p>
                  <p className={`text-2xl font-bold ${results.summary.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(results.summary.realized_pnl)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${results.summary.realized_pnl >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  <BarChart3 className={`w-6 h-6 ${results.summary.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Unrealized PnL</p>
                  <p className={`text-2xl font-bold ${results.summary.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(results.summary.unrealized_pnl)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${results.summary.unrealized_pnl >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  <Calendar className={`w-6 h-6 ${results.summary.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Fees</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(results.summary.fees)}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Per-Symbol Results */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-white">Per-Symbol Results</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Realized PnL</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Unrealized PnL</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Fees</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Position</th>
                    <th className="text-right py-4 px-6 text-slate-400 font-medium">Net PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results.per_symbol).map(([symbol, data]) => {
                    const netPnl = data.realized_pnl + data.unrealized_pnl - data.fees;
                    return (
                      <tr key={symbol} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-4 px-6">
                          <span className="font-medium text-white">{symbol}</span>
                        </td>
                        <td className={`py-4 px-6 text-right font-mono ${data.realized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(data.realized_pnl)}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono ${data.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(data.unrealized_pnl)}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-red-400">
                          {formatCurrency(data.fees)}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono ${data.position >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {data.position.toFixed(4)}
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${netPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(netPnl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {currentStep === 'idle' ? (
          <button
            onClick={simulateBacktest}
            disabled={isRunning}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            <span>Run Backtest</span>
          </button>
        ) : currentStep === 'completed' ? (
          <button
            onClick={resetBacktest}
            className="flex items-center space-x-2 px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>New Backtest</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default BacktestPanel;