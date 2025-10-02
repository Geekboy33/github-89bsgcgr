import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { useMarketMaker } from '../context/MarketMakerContext';

const MetricsPanel: React.FC = () => {
  const { metrics } = useMarketMaker();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const performanceMetrics = [
    { label: 'Total PnL', value: formatCurrency(metrics.totalPnl), change: '+12.5%', positive: true },
    { label: 'Daily PnL', value: formatCurrency(metrics.dailyPnl), change: '+8.2%', positive: true },
    { label: 'Total Fees', value: formatCurrency(metrics.totalFees), change: '-2.1%', positive: false },
    { label: 'Win Rate', value: '68.4%', change: '+1.2%', positive: true },
    { label: 'Sharpe Ratio', value: '2.34', change: '+0.15', positive: true },
    { label: 'Max Drawdown', value: '3.2%', change: '-0.5%', positive: true }
  ];

  const systemMetrics = [
    { label: 'Uptime', value: '99.8%', status: 'excellent' },
    { label: 'Avg Latency', value: '12ms', status: 'good' },
    { label: 'Order Fill Rate', value: '94.2%', status: 'good' },
    { label: 'API Errors', value: '0.1%', status: 'excellent' },
    { label: 'Circuit Breakers', value: metrics.openCircuits.toString(), status: metrics.openCircuits === 0 ? 'excellent' : 'warning' },
    { label: 'Active Symbols', value: '24', status: 'good' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Performance Metrics</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">{metric.label}</span>
                  <span className={`text-xs font-medium ${
                    metric.positive ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">System Health</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">{metric.label}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status === 'excellent' ? 'bg-emerald-400' :
                    metric.status === 'good' ? 'bg-blue-400' :
                    metric.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </div>
                <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Order Statistics</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Orders Placed Today</span>
              <span className="text-white font-mono">1,247</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Orders Filled</span>
              <span className="text-white font-mono">1,174</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Orders Canceled</span>
              <span className="text-white font-mono">73</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Fill Time</span>
              <span className="text-white font-mono">2.3s</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Financial Summary</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Volume (24h)</span>
              <span className="text-white font-mono">{formatCurrency(2847392)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Avg Spread Captured</span>
              <span className="text-white font-mono">0.08%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">ROI (Monthly)</span>
              <span className="text-emerald-400 font-mono">+15.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Risk-Adjusted Return</span>
              <span className="text-emerald-400 font-mono">+12.8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;