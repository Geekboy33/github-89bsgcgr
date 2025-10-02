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
      // Check backend health first
      const healthResponse = await fetch('http://localhost:8000/health');
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        setIsConnected(health.status === 'healthy');
      } else {
        setIsConnected(false);
      }

      // Note: The /api/v1/* endpoints are not yet implemented
      // This is a placeholder for future implementation
      // For now, we'll use mock data or skip these calls

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend server not available');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRiskMode = (mode: 'conservative' | 'aggressive' | 'aggressive_plus') => {
    // Update local state immediately
    setMetrics(prev => ({ ...prev, riskMode: mode }));

    // API endpoint not yet implemented
    console.log('Risk mode updated locally:', mode);
  };

  const cancelOrder = (orderId: string) => {
    // Update local state immediately
    setOrders(prev => prev.filter(order => order.id !== orderId));

    // API endpoint not yet implemented
    console.log('Order cancelled locally:', orderId);
  };

  const closePosition = (symbol: string) => {
    // Update local state immediately
    setPositions(prev => prev.filter(pos => pos.symbol !== symbol));

    // API endpoint not yet implemented
    console.log('Position closed locally:', symbol);
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