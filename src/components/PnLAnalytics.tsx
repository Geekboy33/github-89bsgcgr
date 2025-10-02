import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, BarChart3, PieChart } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface PnLData {
  totalPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  monthlyPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  sharpeRatio: number;
}

interface Trade {
  id: string;
  symbol: string;
  side: string;
  pnl: number | null;
  timestamp: string;
  status: string;
}

const PnLAnalytics: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [pnlData, setPnlData] = useState<PnLData>({
    totalPnl: 0,
    dailyPnl: 0,
    weeklyPnl: 0,
    monthlyPnl: 0,
    winRate: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    sharpeRatio: 0
  });

  useEffect(() => {
    const newSocket = io('http://localhost:8000');

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('initial_data', (data) => {
      if (data.trades) {
        setTrades(data.trades);
        calculatePnL(data.trades);
      }
    });

    newSocket.on('trade_created', (trade: Trade) => {
      setTrades(prev => {
        const newTrades = [trade, ...prev];
        calculatePnL(newTrades);
        return newTrades;
      });
    });

    newSocket.on('trade_updated', (trade: Trade) => {
      setTrades(prev => {
        const index = prev.findIndex(t => t.id === trade.id);
        if (index !== -1) {
          const newTrades = [...prev];
          newTrades[index] = trade;
          calculatePnL(newTrades);
          return newTrades;
        }
        return prev;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const calculatePnL = (allTrades: Trade[]) => {
    const filledTrades = allTrades.filter(t => t.status === 'filled' && t.pnl !== null);

    if (filledTrades.length === 0) {
      return;
    }

    const totalPnl = filledTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dailyTrades = filledTrades.filter(t => new Date(t.timestamp) > oneDayAgo);
    const weeklyTrades = filledTrades.filter(t => new Date(t.timestamp) > oneWeekAgo);
    const monthlyTrades = filledTrades.filter(t => new Date(t.timestamp) > oneMonthAgo);

    const dailyPnl = dailyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const weeklyPnl = weeklyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthlyPnl = monthlyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const winningTrades = filledTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = filledTrades.filter(t => (t.pnl || 0) < 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

    const largestWin = winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnl || 0))
      : 0;

    const largestLoss = losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnl || 0))
      : 0;

    const winRate = filledTrades.length > 0
      ? (winningTrades.length / filledTrades.length) * 100
      : 0;

    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const returns = filledTrades.map(t => t.pnl || 0);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    setPnlData({
      totalPnl,
      dailyPnl,
      weeklyPnl,
      monthlyPnl,
      winRate,
      totalTrades: filledTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      profitFactor,
      sharpeRatio
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-white">PnL Analytics</h2>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            connected ? 'bg-emerald-500/20' : 'bg-red-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className={`text-xs font-medium ${
              connected ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Main PnL Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-300">Total PnL</span>
            <DollarSign className="w-5 h-5 text-blue-400" />
          </div>
          <div className={`text-3xl font-bold ${pnlData.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(pnlData.totalPnl)}
          </div>
          <div className="mt-2 text-xs text-blue-300">
            {pnlData.totalTrades} trades
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Daily PnL</span>
            {pnlData.dailyPnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${pnlData.dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(pnlData.dailyPnl)}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Weekly PnL</span>
            {pnlData.weeklyPnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${pnlData.weeklyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(pnlData.weeklyPnl)}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Monthly PnL</span>
            {pnlData.monthlyPnl >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className={`text-3xl font-bold ${pnlData.monthlyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(pnlData.monthlyPnl)}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Percent className="w-5 h-5 text-blue-400" />
              <span>Win Rate Analysis</span>
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Win Rate</span>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  pnlData.winRate >= 50 ? 'text-emerald-400' : 'text-yellow-400'
                }`}>
                  {formatPercent(pnlData.winRate)}
                </div>
              </div>
            </div>

            <div className="w-full bg-slate-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  pnlData.winRate >= 50 ? 'bg-emerald-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(pnlData.winRate, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="text-2xl font-bold text-emerald-400">{pnlData.winningTrades}</div>
                <div className="text-xs text-emerald-300">Winning Trades</div>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{pnlData.losingTrades}</div>
                <div className="text-xs text-red-300">Losing Trades</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              <span>Trade Statistics</span>
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Average Win</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(pnlData.avgWin)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Average Loss</span>
              <span className="text-red-400 font-bold">{formatCurrency(pnlData.avgLoss)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Largest Win</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(pnlData.largestWin)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Largest Loss</span>
              <span className="text-red-400 font-bold">{formatCurrency(pnlData.largestLoss)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">Profit Factor</span>
              <span className={`font-bold ${
                pnlData.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-yellow-400'
              }`}>
                {pnlData.profitFactor.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Advanced Risk Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-slate-900/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">Sharpe Ratio</div>
              <div className={`text-3xl font-bold ${
                pnlData.sharpeRatio >= 1 ? 'text-emerald-400' : 'text-yellow-400'
              }`}>
                {pnlData.sharpeRatio.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {pnlData.sharpeRatio >= 2 ? 'Excellent' :
                 pnlData.sharpeRatio >= 1 ? 'Good' : 'Needs Improvement'}
              </div>
            </div>

            <div className="text-center p-6 bg-slate-900/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">Total Trades</div>
              <div className="text-3xl font-bold text-blue-400">{pnlData.totalTrades}</div>
              <div className="text-xs text-slate-500 mt-2">All Time</div>
            </div>

            <div className="text-center p-6 bg-slate-900/50 rounded-lg">
              <div className="text-sm text-slate-400 mb-2">Risk/Reward</div>
              <div className={`text-3xl font-bold ${
                pnlData.avgLoss > 0 && (pnlData.avgWin / pnlData.avgLoss) >= 2
                  ? 'text-emerald-400'
                  : 'text-yellow-400'
              }`}>
                {pnlData.avgLoss > 0 ? (pnlData.avgWin / pnlData.avgLoss).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-slate-500 mt-2">Avg Win / Avg Loss</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PnLAnalytics;
