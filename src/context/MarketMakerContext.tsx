import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  spread: number;
  volatility: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  unrealizedPnl: number;
}

interface OrderData {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  amount: number;
  price: number;
  status: 'open' | 'filled' | 'canceled';
  timestamp: number;
}

interface SystemMetrics {
  equity: number;
  totalPnl: number;
  dailyPnl: number;
  totalFees: number;
  openOrders: number;
  healthyExchanges: number;
  openCircuits: number;
  riskMode: 'conservative' | 'aggressive' | 'aggressive_plus';
}

interface MarketMakerContextType {
  marketData: MarketData[];
  positions: Position[];
  orders: OrderData[];
  metrics: SystemMetrics;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  updateRiskMode: (mode: 'conservative' | 'aggressive' | 'aggressive_plus') => void;
  cancelOrder: (orderId: string) => void;
  closePosition: (symbol: string) => void;
  refreshData: () => Promise<void>;
}

const MarketMakerContext = createContext<MarketMakerContextType | undefined>(undefined);

export const useMarketMaker = () => {
  const context = useContext(MarketMakerContext);
  if (!context) {
    throw new Error('useMarketMaker must be used within a MarketMakerProvider');
  }
  return context;
};

interface MarketMakerProviderProps {
  children: ReactNode;
}

export const MarketMakerProvider: React.FC<MarketMakerProviderProps> = ({ children }) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    equity: 0,
    totalPnl: 0,
    dailyPnl: 0,
    totalFees: 0,
    openOrders: 0,
    healthyExchanges: 0,
    openCircuits: 0,
    riskMode: 'conservative'
  });
  const [isConnected, setIsConnected] = useState(false);

  // Fetch real data from API
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch market data
      const marketResponse = await fetch('/api/v1/market-data');
      if (marketResponse.ok) {
        const marketData = await marketResponse.json();
        setMarketData(marketData);
      }

      // Fetch positions
      const positionsResponse = await fetch('/api/v1/positions');
      if (positionsResponse.ok) {
        const positions = await positionsResponse.json();
        setPositions(positions);
      }

      // Fetch orders
      const ordersResponse = await fetch('/api/v1/orders');
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        setOrders(orders);
      }

      // Fetch metrics
      const metricsResponse = await fetch('/api/v1/metrics');
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json();
        setMetrics(metrics);
      }

      // Check system status
      const statusResponse = await fetch('/api/v1/system/status');
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        setIsConnected(status.connected);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRiskMode = (mode: 'conservative' | 'aggressive' | 'aggressive_plus') => {
    fetch('/api/v1/risk/mode', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    }).then(() => {
      setMetrics(prev => ({ ...prev, riskMode: mode }));
    }).catch(err => {
      setError(`Failed to update risk mode: ${err.message}`);
    });
  };

  const cancelOrder = (orderId: string) => {
    fetch(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST'
    }).then(() => {
      setOrders(prev => prev.filter(order => order.id !== orderId));
    }).catch(err => {
      setError(`Failed to cancel order: ${err.message}`);
    });
  };

  const closePosition = (symbol: string) => {
    fetch(`/api/v1/positions/${symbol}/close`, {
      method: 'POST'
    }).then(() => {
      setPositions(prev => prev.filter(pos => pos.symbol !== symbol));
    }).catch(err => {
      setError(`Failed to close position: ${err.message}`);
    });
  };

  const value: MarketMakerContextType = {
    marketData,
    positions,
    orders,
    metrics,
    isConnected,
    isLoading,
    error,
    updateRiskMode,
    cancelOrder,
    closePosition,
    refreshData
  };

  return (
    <MarketMakerContext.Provider value={value}>
      {children}
    </MarketMakerContext.Provider>
  );
};