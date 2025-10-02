import React, { useState, useEffect } from 'react';
import { List, X, Clock, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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
  remaining: number;
  timestamp: string;
  updated_at: string;
}

const LiveOrders: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSide, setFilterSide] = useState<string>('all');

  useEffect(() => {
    const newSocket = io('http://localhost:8000');

    newSocket.on('connect', () => {
      console.log('Orders WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Orders WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('initial_data', (data) => {
      setOrders(data.orders || []);
    });

    newSocket.on('order_created', (order: Order) => {
      setOrders(prev => [order, ...prev]);
    });

    newSocket.on('order_updated', (order: Order) => {
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

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const cancelOrder = async (orderId: string, symbol: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/orders/${orderId}/cancel?symbol=${symbol}`, {
        method: 'POST'
      });

      if (response.ok) {
        console.log('Order cancelled successfully');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterSide !== 'all' && order.side !== filterSide) return false;
    return true;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'pending':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'filled':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'partially_filled':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'canceled':
      case 'expired':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <List className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Live Orders</h2>
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
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full font-medium">
                {filteredOrders.length} orders
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filters:</span>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="open">Open</option>
              <option value="partially_filled">Partially Filled</option>
              <option value="filled">Filled</option>
              <option value="canceled">Canceled</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filterSide}
              onChange={(e) => setFilterSide(e.target.value)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Sides</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Filled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <List className="w-12 h-12 text-slate-600" />
                      <div className="text-slate-500">No orders found</div>
                      <div className="text-sm text-slate-600">
                        Orders will appear here as they are created
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(order.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{order.symbol}</div>
                      <div className="text-xs text-slate-500">{order.exchange}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {order.side === 'buy' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            order.side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {order.side.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-300">{order.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {order.amount.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatCurrency(order.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-white">
                          {((order.filled / order.amount) * 100).toFixed(1)}%
                        </div>
                        <div className="w-16 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(order.filled / order.amount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(order.status === 'open' || order.status === 'pending') && (
                        <button
                          onClick={() => cancelOrder(order.order_id, order.symbol)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Cancel Order"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Total Orders</div>
          <div className="text-2xl font-bold text-white">{orders.length}</div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Open Orders</div>
          <div className="text-2xl font-bold text-blue-400">
            {orders.filter(o => o.status === 'open' || o.status === 'pending').length}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Filled Today</div>
          <div className="text-2xl font-bold text-emerald-400">
            {orders.filter(o => o.status === 'filled').length}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="text-sm text-slate-400 mb-1">Canceled</div>
          <div className="text-2xl font-bold text-slate-400">
            {orders.filter(o => o.status === 'canceled').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveOrders;
