import React, { useState } from 'react';
import { Settings, Save, Upload, Download, RotateCcw, AlertTriangle } from 'lucide-react';

interface ConfigSection {
  id: string;
  name: string;
  description: string;
  settings: ConfigSetting[];
}

interface ConfigSetting {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select' | 'text' | 'array';
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  unit?: string;
}

const ConfigManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('trading');
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [config, setConfig] = useState<Record<string, ConfigSection>>({
    trading: {
      id: 'trading',
      name: 'Trading Parameters',
      description: 'Core market making configuration',
      settings: [
        {
          key: 'mm_spread_bps',
          label: 'Market Making Spread',
          type: 'number',
          value: 6.0,
          min: 1.0,
          max: 50.0,
          step: 0.1,
          unit: 'bps',
          description: 'Base spread for market making orders'
        },
        {
          key: 'ladder_levels',
          label: 'Ladder Levels',
          type: 'number',
          value: 5,
          min: 1,
          max: 20,
          step: 1,
          description: 'Number of price levels in the order ladder'
        },
        {
          key: 'ladder_step_bps',
          label: 'Ladder Step Size',
          type: 'number',
          value: 1.6,
          min: 0.1,
          max: 10.0,
          step: 0.1,
          unit: 'bps',
          description: 'Price step between ladder levels'
        },
        {
          key: 'leverage',
          label: 'Maximum Leverage',
          type: 'number',
          value: 100,
          min: 1,
          max: 125,
          step: 1,
          unit: 'x',
          description: 'Maximum leverage for positions'
        },
        {
          key: 'hedge_mode',
          label: 'Hedge Mode',
          type: 'boolean',
          value: true,
          description: 'Enable hedge mode for simultaneous long/short positions'
        }
      ]
    },
    risk: {
      id: 'risk',
      name: 'Risk Management',
      description: 'Risk limits and safety parameters',
      settings: [
        {
          key: 'max_inventory_per_symbol',
          label: 'Max Inventory per Symbol',
          type: 'number',
          value: 50000,
          min: 1000,
          max: 1000000,
          step: 1000,
          unit: 'USD',
          description: 'Maximum inventory value per trading symbol'
        },
        {
          key: 'max_open_orders',
          label: 'Max Open Orders',
          type: 'number',
          value: 50,
          min: 1,
          max: 200,
          step: 1,
          description: 'Maximum number of open orders per symbol'
        },
        {
          key: 'circuit_breaker_enabled',
          label: 'Circuit Breaker',
          type: 'boolean',
          value: true,
          description: 'Enable automatic circuit breaker protection'
        },
        {
          key: 'latency_threshold',
          label: 'Latency Threshold',
          type: 'number',
          value: 500,
          min: 100,
          max: 2000,
          step: 50,
          unit: 'ms',
          description: 'Maximum acceptable API latency'
        }
      ]
    },
    symbols: {
      id: 'symbols',
      name: 'Symbol Configuration',
      description: 'Trading pairs and universe settings',
      settings: [
        {
          key: 'active_symbols',
          label: 'Active Symbols',
          type: 'array',
          value: ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'],
          description: 'Currently active trading symbols'
        },
        {
          key: 'quote_currency',
          label: 'Quote Currency',
          type: 'select',
          value: 'USDT',
          options: ['USDT', 'USD', 'BUSD'],
          description: 'Base quote currency for trading pairs'
        },
        {
          key: 'universe_enabled',
          label: 'Dynamic Universe',
          type: 'boolean',
          value: true,
          description: 'Enable automatic symbol universe selection'
        },
        {
          key: 'min_volume_usd',
          label: 'Minimum Volume',
          type: 'number',
          value: 1000000,
          min: 100000,
          max: 10000000,
          step: 100000,
          unit: 'USD',
          description: 'Minimum 24h volume for symbol inclusion'
        }
      ]
    },
    system: {
      id: 'system',
      name: 'System Settings',
      description: 'Performance and monitoring configuration',
      settings: [
        {
          key: 'refresh_rate',
          label: 'Refresh Rate',
          type: 'number',
          value: 250,
          min: 100,
          max: 5000,
          step: 50,
          unit: 'ms',
          description: 'Main loop refresh interval'
        },
        {
          key: 'batch_size',
          label: 'Batch Size',
          type: 'number',
          value: 12,
          min: 1,
          max: 50,
          step: 1,
          description: 'Number of symbols processed per batch'
        },
        {
          key: 'prometheus_enabled',
          label: 'Prometheus Metrics',
          type: 'boolean',
          value: true,
          description: 'Enable Prometheus metrics collection'
        },
        {
          key: 'log_level',
          label: 'Log Level',
          type: 'select',
          value: 'INFO',
          options: ['DEBUG', 'INFO', 'WARNING', 'ERROR'],
          description: 'System logging verbosity level'
        }
      ]
    }
  });

  const updateSetting = (sectionId: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        settings: prev[sectionId].settings.map(setting =>
          setting.key === key ? { ...setting, value } : setting
        )
      }
    }));
    setHasChanges(true);
  };

  const saveConfig = async () => {
    // In real app, this would call the API
    console.log('Saving configuration:', config);
    setHasChanges(false);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const resetConfig = () => {
    // Reset to defaults - in real app, fetch from server
    setHasChanges(false);
  };

  const exportConfig = () => {
    const configData = Object.values(config).reduce((acc, section) => {
      acc[section.id] = section.settings.reduce((sectionAcc, setting) => {
        sectionAcc[setting.key] = setting.value;
        return sectionAcc;
      }, {} as Record<string, any>);
      return acc;
    }, {} as Record<string, any>);

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market-maker-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        // Update config with imported values
        console.log('Importing configuration:', importedConfig);
        setHasChanges(true);
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  };

  const renderSetting = (sectionId: string, setting: ConfigSetting) => {
    const value = setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => updateSetting(sectionId, setting.key, e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">Enabled</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateSetting(sectionId, setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={value}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              onChange={(e) => updateSetting(sectionId, setting.key, parseFloat(e.target.value))}
              className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {setting.unit && (
              <span className="text-sm text-slate-400">{setting.unit}</span>
            )}
          </div>
        );

      case 'array':
        return (
          <div className="space-y-2">
            {value.map((item: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...value];
                    newArray[index] = e.target.value;
                    updateSetting(sectionId, setting.key, newArray);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={() => {
                    const newArray = value.filter((_: any, i: number) => i !== index);
                    updateSetting(sectionId, setting.key, newArray);
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => updateSetting(sectionId, setting.key, [...value, ''])}
              className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm"
            >
              Add Item
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateSetting(sectionId, setting.key, e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        );
    }
  };

  const activeConfig = config[activeSection];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-white">Configuration Manager</h2>
              {hasChanges && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Unsaved changes</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={importConfig}
                className="hidden"
                id="config-import"
              />
              <label
                htmlFor="config-import"
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </label>
              <button
                onClick={exportConfig}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={resetConfig}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={saveConfig}
                disabled={!hasChanges}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-6">
          <div className="flex space-x-1">
            {Object.values(config).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">{activeConfig.name}</h3>
          <p className="text-slate-400 text-sm mt-1">{activeConfig.description}</p>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {activeConfig.settings.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    {setting.label}
                  </label>
                  {setting.description && (
                    <span className="text-xs text-slate-500">
                      {setting.description}
                    </span>
                  )}
                </div>
                {renderSetting(activeSection, setting)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigManager;