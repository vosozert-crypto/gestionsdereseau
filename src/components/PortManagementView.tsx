import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Loader2, RefreshCw } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../data/i18n';
import { api } from '../services/api.ts';

interface PortData {
  number: number;
  status: 'active' | 'poe' | 'critical' | 'inactive';
  speed: string;
  vlan: number;
  poeWatts: number;
  rxBytes: number;
  txBytes: number;
  deviceName?: string;
  deviceIp?: string;
}

interface PortStats {
  total: number;
  active: number;
  poe: number;
  critical: number;
  inactive: number;
  poeBudgetUsed: number;
  poeBudgetMax: number;
}

interface PortManagementViewProps {
  lang: Language;
}

export const PortManagementView: React.FC<PortManagementViewProps> = ({ lang }) => {
  const t = getTranslation(lang);
  const [selectedPort, setSelectedPort] = useState<number>(1);
  const [ports, setPorts] = useState<PortData[]>([]);
  const [stats, setStats] = useState<PortStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPorts = useCallback(async () => {
    try {
      const data = await api.getPorts();
      setPorts(data.ports);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch ports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPorts();
  }, [fetchPorts]);

  const activePortInfo = ports.find((p) => p.number === selectedPort) || ports[0];

  if (loading) {
    return (
      <div className="bg-[#111520] rounded border border-[#1E2536] p-4 flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }

  return (
    <div className="bg-[#111520] rounded border border-[#1E2536] p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1E2536]">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            {t.portManagement}
          </h2>
          <p className="text-[10px] text-gray-600 font-mono">
            SW-CORE-48P — Cisco Catalyst 3850-48P
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> {t.activePorts}: {stats?.active}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> PoE: {stats?.poe}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-500"></span> {t.criticalPorts}: {stats?.critical}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-gray-600"></span> {t.inactivePorts}: {stats?.inactive}
            </span>
          </div>
          <button onClick={fetchPorts} className="p-1 rounded hover:bg-[#1E2536] text-gray-500 hover:text-cyan-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 font-mono">
        <div className="lg:col-span-2 bg-[#0A0D14] p-4 rounded border border-[#1E2536] flex flex-col justify-between">
          <div>
            <div className="text-[10px] text-gray-600 uppercase font-bold mb-3 flex justify-between">
              <span>Switch Front Panel — Ports 1-{ports.length}</span>
              {stats && <span>PoE Budget: {stats.poeBudgetUsed.toFixed(0)}W / {stats.poeBudgetMax}W</span>}
            </div>

            <div className="grid grid-cols-12 gap-1.5">
              {ports.map((p) => (
                <button
                  key={p.number}
                  onClick={() => setSelectedPort(p.number)}
                  className={`h-9 rounded text-[10px] font-bold flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 border ${
                    selectedPort === p.number ? 'ring-2 ring-cyan-400 scale-105' : ''
                  } ${
                    p.status === 'critical'
                      ? 'bg-red-600/90 text-white border-red-500/50'
                      : p.status === 'poe'
                      ? 'bg-amber-500/90 text-black border-amber-400/50'
                      : p.status === 'active'
                      ? 'bg-emerald-600/90 text-white border-emerald-500/50'
                      : 'bg-[#1E2536] text-gray-600 border-[#2D323E]'
                  }`}
                >
                  <span>{p.number}</span>
                  <span className="text-[7px] opacity-70">{p.status === 'poe' ? 'PoE' : ''}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {activePortInfo && (
          <div className="bg-[#151A25] border border-[#1E2536] rounded p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start border-b border-[#1E2536] pb-2 mb-3">
                <div>
                  <span className="text-[10px] text-gray-600 uppercase font-bold">Port Inspector</span>
                  <h3 className="text-base font-bold text-gray-200">Port #{activePortInfo.number}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  activePortInfo.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : activePortInfo.status === 'poe' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : activePortInfo.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[#1E2536] text-gray-500 border border-[#2D323E]'
                }`}>
                  {activePortInfo.status}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-bold text-gray-300">{activePortInfo.speed}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                  <span className="text-gray-600">VLAN:</span>
                  <span className="font-bold text-cyan-400">VLAN-{activePortInfo.vlan}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                  <span className="text-gray-600">PoE Output:</span>
                  <span className="font-bold text-amber-400">{activePortInfo.poeWatts > 0 ? `${activePortInfo.poeWatts}W` : 'N/A'}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                  <span className="text-gray-600">RX:</span>
                  <span className="font-bold text-gray-300">{formatBytes(activePortInfo.rxBytes)}</span>
                </div>
                <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                  <span className="text-gray-600">TX:</span>
                  <span className="font-bold text-gray-300">{formatBytes(activePortInfo.txBytes)}</span>
                </div>
                {activePortInfo.deviceName && (
                  <div className="flex justify-between p-2 bg-[#0A0D14] rounded border border-[#1E2536]">
                    <span className="text-gray-600">Connected:</span>
                    <span className="font-bold text-emerald-400">{activePortInfo.deviceName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
