/*
  # MarketMaker Pro Database Schema

  1. New Tables
    - `trades` - Trading history with full execution details
    - `positions` - Current and historical positions
    - `orders` - Order management and tracking
    - `system_metrics` - Performance and health metrics over time
    - `circuit_breaker_events` - Circuit breaker activation history
    - `exchange_health` - Exchange connection health logs
    - `alerts` - System alerts and notifications
    - `balance_snapshots` - Account balance history
    - `strategy_state` - Market making strategy state

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users only
    - Secure sensitive trading data

  3. Indexes
    - Optimized for real-time queries
    - Time-based indexes for historical analysis
*/

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id text UNIQUE NOT NULL,
  exchange text NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  type text NOT NULL CHECK (type IN ('limit', 'market', 'stop_loss', 'take_profit')),
  amount numeric NOT NULL CHECK (amount > 0),
  price numeric NOT NULL CHECK (price >= 0),
  filled numeric DEFAULT 0 CHECK (filled >= 0),
  fee numeric DEFAULT 0,
  fee_currency text DEFAULT 'USDT',
  pnl numeric,
  status text DEFAULT 'open' CHECK (status IN ('open', 'filled', 'partially_filled', 'canceled', 'rejected', 'expired')),
  timestamp timestamptz DEFAULT now(),
  filled_at timestamptz,
  trade_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_exchange ON trades(exchange);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_order_id ON trades(order_id);

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  exchange text NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('long', 'short')),
  size numeric NOT NULL CHECK (size > 0),
  entry_price numeric NOT NULL CHECK (entry_price > 0),
  current_price numeric NOT NULL CHECK (current_price > 0),
  liquidation_price numeric,
  leverage numeric DEFAULT 1.0 CHECK (leverage > 0),
  margin numeric NOT NULL CHECK (margin >= 0),
  unrealized_pnl numeric DEFAULT 0,
  realized_pnl numeric DEFAULT 0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  is_open boolean DEFAULT true,
  position_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_exchange ON positions(exchange);
CREATE INDEX IF NOT EXISTS idx_positions_is_open ON positions(is_open);
CREATE INDEX IF NOT EXISTS idx_positions_opened_at ON positions(opened_at DESC);

-- Create orders table (separate from trades for better tracking)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  order_id text UNIQUE NOT NULL,
  exchange text NOT NULL,
  symbol text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy', 'sell')),
  type text NOT NULL CHECK (type IN ('limit', 'market', 'stop_loss', 'take_profit')),
  amount numeric NOT NULL CHECK (amount > 0),
  price numeric CHECK (price >= 0),
  stop_price numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'filled', 'partially_filled', 'canceled', 'rejected', 'expired')),
  filled numeric DEFAULT 0,
  remaining numeric,
  timestamp timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  order_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_exchange ON orders(exchange);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at DESC);

-- Create system metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  equity numeric NOT NULL,
  total_pnl numeric DEFAULT 0,
  daily_pnl numeric DEFAULT 0,
  weekly_pnl numeric DEFAULT 0,
  monthly_pnl numeric DEFAULT 0,
  total_fees numeric DEFAULT 0,
  open_orders integer DEFAULT 0,
  open_positions integer DEFAULT 0,
  healthy_exchanges integer DEFAULT 0,
  total_exchanges integer DEFAULT 0,
  open_circuits integer DEFAULT 0,
  risk_mode text DEFAULT 'conservative',
  trades_count_24h integer DEFAULT 0,
  win_rate numeric DEFAULT 0,
  sharpe_ratio numeric,
  max_drawdown numeric,
  metric_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- Create circuit breaker events table
CREATE TABLE IF NOT EXISTS circuit_breaker_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  exchange text NOT NULL,
  symbol text,
  breaker_type text NOT NULL CHECK (breaker_type IN ('latency', 'spread', 'volatility', 'error_rate', 'drawdown')),
  trigger_value numeric NOT NULL,
  threshold numeric NOT NULL,
  duration_seconds integer,
  resolved_at timestamptz,
  is_resolved boolean DEFAULT false,
  event_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_circuit_breaker_timestamp ON circuit_breaker_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_exchange ON circuit_breaker_events(exchange);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_type ON circuit_breaker_events(breaker_type);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_resolved ON circuit_breaker_events(is_resolved);

-- Create exchange health table
CREATE TABLE IF NOT EXISTS exchange_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  exchange text NOT NULL,
  connected boolean DEFAULT false,
  latency_ms numeric DEFAULT 0,
  success_rate numeric DEFAULT 1.0,
  error_count integer DEFAULT 0,
  api_calls_used integer DEFAULT 0,
  api_calls_limit integer DEFAULT 600,
  health_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_exchange_health_timestamp ON exchange_health(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_health_exchange ON exchange_health(exchange);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  level text NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
  message text NOT NULL,
  source text NOT NULL,
  exchange text,
  symbol text,
  sent_telegram boolean DEFAULT false,
  sent_at timestamptz,
  read boolean DEFAULT false,
  read_at timestamptz,
  alert_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON alerts(level);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_source ON alerts(source);

-- Create balance snapshots table
CREATE TABLE IF NOT EXISTS balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz DEFAULT now(),
  exchange text NOT NULL,
  currency text NOT NULL,
  free numeric NOT NULL DEFAULT 0,
  used numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  usd_value numeric,
  snapshot_metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_balance_snapshots_timestamp ON balance_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_exchange ON balance_snapshots(exchange);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_currency ON balance_snapshots(currency);

-- Create strategy state table (for market making bot state)
CREATE TABLE IF NOT EXISTS strategy_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at timestamptz DEFAULT now(),
  exchange text NOT NULL,
  symbol text NOT NULL,
  strategy_name text NOT NULL DEFAULT 'market_maker',
  is_active boolean DEFAULT true,
  bid_price numeric,
  ask_price numeric,
  bid_size numeric,
  ask_size numeric,
  spread_bps numeric,
  inventory numeric DEFAULT 0,
  target_inventory numeric DEFAULT 0,
  last_trade_at timestamptz,
  profit_target numeric,
  stop_loss numeric,
  state_metadata jsonb,
  UNIQUE(exchange, symbol, strategy_name)
);

CREATE INDEX IF NOT EXISTS idx_strategy_state_updated ON strategy_state(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_state_exchange ON strategy_state(exchange);
CREATE INDEX IF NOT EXISTS idx_strategy_state_symbol ON strategy_state(symbol);
CREATE INDEX IF NOT EXISTS idx_strategy_state_active ON strategy_state(is_active);

-- Enable Row Level Security on all tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Allow authenticated users to read trades"
  ON trades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read positions"
  ON positions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert positions"
  ON positions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update positions"
  ON positions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read system_metrics"
  ON system_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert system_metrics"
  ON system_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read circuit_breaker_events"
  ON circuit_breaker_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert circuit_breaker_events"
  ON circuit_breaker_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update circuit_breaker_events"
  ON circuit_breaker_events FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read exchange_health"
  ON exchange_health FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert exchange_health"
  ON exchange_health FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read balance_snapshots"
  ON balance_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert balance_snapshots"
  ON balance_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read strategy_state"
  ON strategy_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert strategy_state"
  ON strategy_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update strategy_state"
  ON strategy_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create functions for real-time updates
CREATE OR REPLACE FUNCTION notify_trade_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('trade_updates', json_build_object(
    'action', 'INSERT',
    'data', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_position_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('position_updates', json_build_object(
    'action', TG_OP,
    'data', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_order_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('order_updates', json_build_object(
    'action', TG_OP,
    'data', row_to_json(NEW)
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for real-time notifications
CREATE TRIGGER trade_insert_trigger
  AFTER INSERT ON trades
  FOR EACH ROW
  EXECUTE FUNCTION notify_trade_insert();

CREATE TRIGGER position_update_trigger
  AFTER INSERT OR UPDATE ON positions
  FOR EACH ROW
  EXECUTE FUNCTION notify_position_update();

CREATE TRIGGER order_update_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_update();
