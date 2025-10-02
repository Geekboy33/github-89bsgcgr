import React, { useState } from 'react';
import { Shield, AlertTriangle, Settings, Save } from 'lucide-react';
import { useMarketMaker } from '../context/MarketMakerContext';

const RiskControls: React.FC = () => {
  const { metrics, updateRiskMode } = useMarketMaker();
  const [selectedMode, setSelectedMode] = useState(metrics.riskMode);
  const [maxInventory, setMaxInventory] = useState(50000);
  const [maxOrders, setMaxOrders] = useState(50);
  const [leverageLimit, setLeverageLimit] = useState(100);

  const handleSaveSettings = () => {
    updateRiskMode(selectedMode);
    // In real implementation, save other settings too
    console.log('Settings saved');
  };

  const riskModes = [
    {
      id: 'conservative' as const,
      name: 'Conservative',
      description: 'Low risk, stable returns with tight spreads',
      color: 'blue',
      features: ['1% margin', '1 ladder level', 'Tight risk limits']
    },
    {
      id: 'aggressive' as const,
      name: 'Aggressive',
      description: 'Medium risk with higher capital allocation',
      color: 'yellow',
      features: ['5% margin', '5 ladder levels', 'Relaxed thresholds']
    },
    {
      id: 'aggressive_plus' as const,
      name: 'Aggressive Plus',
      description: 'Maximum risk for highest potential returns',
      color: 'red',
      features: ['6% margin', '7 ladder levels', 'Maximum exposure']
    }
  ];

  return (
    <div className="space-y-6">
      {/* Risk Mode Selection */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-semibold text-white">Risk Mode Configuration</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskModes.map((mode) => (
              <div
                key={mode.id}
                className={`relative p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMode === mode.id
                    ? `border-${mode.color}-400 bg-${mode.color}-500/10`
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }`}
                onClick={() => setSelectedMode(mode.id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{mode.name}</h3>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedMode === mode.id
                      ? `border-${mode.color}-400 bg-${mode.color}-400`
                      : 'border-slate-400'
                  }`} />
                </div>
                <p className="text-slate-300 text-sm mb-4">{mode.description}</p>
                <ul className="space-y-1">
                  {mode.features.map((feature, index) => (
                    <li key={index} className="text-slate-400 text-xs flex items-center">
                      <div className="w-1 h-1 bg-slate-400 rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Position Limits</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Inventory per Symbol (USD)
              </label>
              <input
                type="number"
                value={maxInventory}
                onChange={(e) => setMaxInventory(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Orders per Symbol
              </label>
              <input
                type="number"
                value={maxOrders}
                onChange={(e) => setMaxOrders(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maximum Leverage
              </label>
              <input
                type="number"
                value={leverageLimit}
                onChange={(e) => setLeverageLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Circuit Breaker Settings</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Latency Threshold (ms)
              </label>
              <input
                type="number"
                defaultValue={500}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Spread Threshold (bps)
              </label>
              <input
                type="number"
                defaultValue={20}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Volatility Threshold (%)
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={5}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
};

export default RiskControls;