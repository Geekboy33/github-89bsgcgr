import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Trade {
  id: string;
  order_id: string;
  exchange: string;
  symbol: string;
  side: string;
  type: string;
  amount: number;
  price: number;
  filled: number;
  fee: number;
  pnl: number | null;
  status: string;
  timestamp: string;
}

interface Order {
  id: string;
  order_id: string;
  exchange: string;
  symbol: string;
  side: string;
  type: string;
  amount: number;
  price: number;
  status: string;
  filled: number;
  timestamp: string;
}

interface Position {
  id: string;
  exchange: string;
  symbol: string;
  side: string;
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl: number;
  leverage: number;
  is_open: boolean;
}

interface Metrics {
  equity: number;
  totalPnl: number;
  dailyPnl: number;
  openOrders: number;
  openPositions: number;
  healthyExchanges?: number;
  openCircuits?: number;
  riskMode?: string;
}

const LiveTransactions: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    equity: 0,
    totalPnl: 0,
    dailyPnl: 0,
    openOrders: 0,
    openPositions: 0
  });

  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('initial_data', (data) => {
      console.log('Received initial data:', data);
      setTrades(data.trades || []);
      setOrders(data.orders || []);
      setPositions(data.positions || []);
      setMetrics(data.metrics || metrics);
    });

    newSocket.on('trade_created', (trade: Trade) => {
      console.log('New trade:', trade);
      setTrades(prev => [trade, ...prev].slice(0, 50));
    });

    newSocket.on('trade_updated', (trade: Trade) => {
      console.log('Trade updated:', trade);
      setTrades(prev => {
        const index = prev.findIndex(t => t.id === trade.id);
        if (index !== -1) {
          const newTrades = [...prev];
          newTrades[index] = trade;
          return newTrades;
        }
        return prev;
      });
    });

    newSocket.on('order_created', (order: Order) => {
      console.log('New order:', order);
      setOrders(prev => [order, ...prev].slice(0, 50));
    });

    newSocket.on('order_updated', (order: Order) => {
      console.log('Order updated:', order);
      setOrders(prev => {
        const index = prev.findIndex(o => o.id === order.id);
        if (index !== -1) {
          const newOrders = [...prev];
          newOrders[index] = order;
          return newOrders;
        }
        return prev;
      });
    });

    newSocket.on('position_updated', (position: Position) => {
      console.log('Position updated:', position);
      setPositions(prev => {
        const index = prev.findIndex(p => p.id === position.id);
        if (index !== -1) {
          const newPositions = [...prev];
          newPositions[index] = position;
          return newPositions;
        } else {
          return [position, ...prev];
        }
      });
    });

    newSocket.on('metrics_updated', (newMetrics: Metrics) => {
      console.log('Metrics updated:', newMetrics);
      setMetrics(newMetrics);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filled':
      case 'open':
        return 'text-emerald-400 bg-emerald-500/10';
      case 'partially_filled':
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'canceled':
      case 'expired':
        return 'text-slate-400 bg-slate-500/10';
      case 'rejected':
        return 'text-red-400 bg-red-500/10';
      default:
        return 'text-blue-400 bg-blue-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filled':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
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

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
        <span className="text-sm text-slate-400">
          {connected ? 'Live Updates Active' : 'Disconnected'}
        </span>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total Equity</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(metrics.equity)}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total PnL</span>
            {metrics.totalPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${metrics.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(metrics.totalPnl)}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Daily PnL</span>
            {metrics.dailyPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div className={`text-2xl font-bold ${metrics.dailyPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(metrics.dailyPnl)}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Open Positions</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{metrics.openPositions}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.openOrders} orders</div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Recent Trades</span>
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              Live
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Side
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  PnL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No trades yet. Waiting for market activity...
                  </td>
                </tr>
              ) : (
                trades.slice(0, 20).map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(trade.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{trade.symbol}</div>
                      <div className="text-xs text-slate-500">{trade.exchange}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          trade.side === 'buy'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {trade.amount.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatCurrency(trade.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {trade.pnl !== null && (
                        <span className={`text-sm font-medium ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(trade.pnl)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 text-xs rounded ${getStatusColor(trade.status)}`}>
                        {getStatusIcon(trade.status)}
                        <span>{trade.status}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Positions */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>Active Positions</span>
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
              {positions.filter(p => p.is_open).length}
            </span>
          </h2>
        </div>

        <div className="p-6">
          {positions.filter(p => p.is_open).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No open positions
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions
                .filter(p => p.is_open)
                .map((position) => (
                  <div
                    key={position.id}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-lg font-semibold text-white">{position.symbol}</div>
                        <div className="text-xs text-slate-500">{position.exchange}</div>
                      </div>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded ${
                          position.side === 'long'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {position.side.toUpperCase()} {position.leverage}x
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-400">Size</div>
                        <div className="text-white font-medium">{position.size.toFixed(4)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Entry</div>
                        <div className="text-white font-medium">{formatCurrency(position.entry_price)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Current</div>
                        <div className="text-white font-medium">{formatCurrency(position.current_price)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Unrealized PnL</div>
                        <div
                          className={`font-bold ${
                            position.unrealized_pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {formatCurrency(position.unrealized_pnl)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTransactions;
