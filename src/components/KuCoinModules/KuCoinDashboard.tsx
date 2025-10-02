import React, { useState } from 'react';
import { BarChart3, Info, Calculator, Shield, Activity } from 'lucide-react';
import MarketOverview from './MarketOverview';
import SymbolDetails from './SymbolDetails';
import TradingInfo from './TradingInfo';
import RiskMetrics from './RiskMetrics';

type ModuleType = 'overview' | 'details' | 'trading' | 'risk';

const KuCoinDashboard: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');

  const modules = [
    {
      id: 'overview' as ModuleType,
      name: 'Market Overview',
      description: 'General market data and trends',
      icon: BarChart3,
      component: MarketOverview
    },
    {
      id: 'details' as ModuleType,
      name: 'Symbol Details',
      description: 'Detailed information for specific symbols',
      icon: Info,
      component: SymbolDetails
    },
    {
      id: 'trading' as ModuleType,
      name: 'Trading Info',
      description: 'Trading parameters and calculations',
      icon: Calculator,
      component: TradingInfo
    },
    {
      id: 'risk' as ModuleType,
      name: 'Risk Metrics',
      description: 'Risk analysis and margin requirements',
      icon: Shield,
      component: RiskMetrics
    }
  ];

  const ActiveComponent = modules.find(m => m.id === activeModule)?.component || MarketOverview;

  return (
    <div className="space-y-6">
      {/* Module Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">KuCoin Analytics</h2>
              <p className="text-slate-400 text-sm">Comprehensive market analysis and trading insights</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  activeModule === module.id
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-slate-600 bg-slate-700/30 hover:border-slate-500 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-5 h-5 ${activeModule === module.id ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <h3 className={`font-semibold ${activeModule === module.id ? 'text-emerald-400' : 'text-white'}`}>
                    {module.name}
                  </h3>
                </div>
                <p className={`text-sm ${activeModule === module.id ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Module Content */}
      <div className="min-h-[600px]">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default KuCoinDashboard;

