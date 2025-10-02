import React from 'react';
import { TrendingUp, TrendingDown, X, BarChart3 } from 'lucide-react';
import { useMarketMaker } from '../context/MarketMakerContext';

const PositionManager: React.FC = () => {
  const { positions, orders, closePosition, cancelOrder } = useMarketMaker();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Positions Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Open Positions</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Side</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Size</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Entry Price</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Mark Price</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">PnL</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Unrealized</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.symbol} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-4 px-6">
                    <span className="font-medium text-white">{position.symbol}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      position.side === 'long' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {position.side === 'long' ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {position.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {position.size.toFixed(4)}
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {formatCurrency(position.entryPrice)}
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {formatCurrency(position.markPrice)}
                  </td>
                  <td className={`py-4 px-6 text-right font-mono font-medium ${
                    position.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(position.pnl)}
                  </td>
                  <td className={`py-4 px-6 text-right font-mono font-medium ${
                    position.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(position.unrealizedPnl)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => closePosition(position.symbol)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Close Position"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Orders Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">Open Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-4 px-6 text-slate-400 font-medium">Symbol</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Side</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Type</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Amount</th>
                <th className="text-right py-4 px-6 text-slate-400 font-medium">Price</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Status</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Time</th>
                <th className="text-center py-4 px-6 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="py-4 px-6">
                    <span className="font-medium text-white">{order.symbol}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.side === 'buy' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {order.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                      {order.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {order.amount.toFixed(4)}
                  </td>
                  <td className="py-4 px-6 text-right text-white font-mono">
                    {formatCurrency(order.price)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                      order.status === 'filled' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-slate-300 font-mono text-sm">
                    {formatTime(order.timestamp)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {order.status === 'open' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Cancel Order"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PositionManager;