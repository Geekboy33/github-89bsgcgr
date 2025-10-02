import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, AlertTriangle, Settings, Play, Pause, BarChart3, TestTube, Terminal, Wifi, FileText } from 'lucide-react';
import Dashboard from './components/Dashboard';
import RiskControls from './components/RiskControls';
import PositionManager from './components/PositionManager';
import MetricsPanel from './components/MetricsPanel';
import AlertsPanel from './components/AlertsPanel';
import BacktestPanel from './components/BacktestPanel';
import SystemLogs from './components/SystemLogs';
import ConfigManager from './components/ConfigManager';
import ExchangeConnections from './components/ExchangeConnections';
import KuCoinTest from './components/KuCoinTest';
import { MarketMakerProvider } from './context/MarketMakerContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'positions', label: 'Positions', icon: TrendingUp },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'backtest', label: 'Backtest', icon: TestTube },
    { id: 'exchanges', label: 'Exchanges', icon: Wifi },
    { id: 'kucoin-test', label: 'KuCoin Test', icon: Wifi },
    { id: 'config', label: 'Config', icon: FileText },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'risk', label: 'Risk Controls', icon: AlertTriangle },
    { id: 'alerts', label: 'Alerts', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'positions':
        return <PositionManager />;
      case 'metrics':
        return <MetricsPanel />;
      case 'backtest':
        return <BacktestPanel />;
      case 'exchanges':
        return <ExchangeConnections />;
      case 'kucoin-test':
        return <KuCoinTest />;
      case 'config':
        return <ConfigManager />;
      case 'logs':
        return <SystemLogs />;
      case 'risk':
        return <RiskControls />;
      case 'alerts':
        return <AlertsPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MarketMakerProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-emerald-400" />
                  <h1 className="text-xl font-bold text-white">Market Maker Pro</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-300">
                    {isRunning ? 'Active' : 'Stopped'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isRunning 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isRunning ? 'Stop' : 'Start'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-emerald-400 text-emerald-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </MarketMakerProvider>
  );
}

export default App;