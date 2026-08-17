import React from 'react';
import {
  Monitor,
  Printer,
  Router,
  Server,
  HardDrive,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity
} from 'lucide-react';
import { NetworkDevice, Language } from '../types';
import { getTranslation } from '../data/i18n';

interface KpiDashboardViewProps {
  devices: NetworkDevice[];
  lang: Language;
  onSelectCategory: (category: 'computer' | 'printer' | 'network' | 'server') => void;
  onOpenDetails: (device: NetworkDevice) => void;
}

export const KpiDashboardView: React.FC<KpiDashboardViewProps> = ({
  devices = [],
  lang,
  onSelectCategory,
  onOpenDetails
}) => {
  const t = getTranslation(lang);

  const safeDevices = devices || [];
  const total = safeDevices.length;
  const onlineCount = safeDevices.filter((d) => d?.status === 'online').length;
  const warningCount = safeDevices.filter((d) => d?.status === 'warning').length;
  const criticalCount = safeDevices.filter((d) => d?.status === 'critical' || d?.status === 'offline').length;

  const totalRamGB = safeDevices.reduce((acc, d) => acc + (d?.hardware?.ramGB || 0), 0);
  const healthPercent = total > 0 ? Math.round((onlineCount / total) * 100) : 0;

  // OS Distribution calculation
  const osCounts: Record<string, number> = {};
  safeDevices.forEach((d) => {
    const os = d?.software?.osName || 'Unknown OS';
    // Group simplified
    let key = 'Other / Embedded';
    if (os.includes('Windows')) key = 'Windows OS';
    else if (os.includes('Ubuntu') || os.includes('Linux')) key = 'Linux Server';
    else if (os.includes('Cisco') || os.includes('Forti')) key = 'Network Firmware';
    else if (os.includes('HP') || os.includes('Canon')) key = 'Printer Firmware';

    osCounts[key] = (osCounts[key] || 0) + 1;
  });

  const computersList = safeDevices.filter((d) => d?.category === 'computer');
  const printersList = safeDevices.filter((d) => d?.category === 'printer');
  const networkList = safeDevices.filter((d) => d?.category === 'network');
  const serversList = safeDevices.filter((d) => d?.category === 'server');

  return (
    <div className="space-y-4">
      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white p-3.5 rounded shadow-xs border border-[#DEE2E6] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500">{t.totalDevices}</span>
            <HardDrive className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-bold font-mono text-gray-900">{total}</span>
            <span className="text-[10px] text-green-600 font-bold font-mono">100% Tracked</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-xs mt-3 overflow-hidden flex">
            <div
              className="bg-green-500 h-full"
              style={{ width: `${(onlineCount / total) * 100}%` }}
              title="Online"
            ></div>
            <div
              className="bg-yellow-500 h-full"
              style={{ width: `${(warningCount / total) * 100}%` }}
              title="Warning"
            ></div>
            <div
              className="bg-red-500 h-full"
              style={{ width: `${(criticalCount / total) * 100}%` }}
              title="Critical"
            ></div>
          </div>
        </div>

        {/* Active vs Warning */}
        <div className="bg-white p-3.5 rounded shadow-xs border border-[#DEE2E6] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500">{t.activeNodes}</span>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-bold font-mono text-green-600">{onlineCount}</span>
            <span className="text-[10px] text-gray-400 font-mono font-bold">
              {((onlineCount / total) * 100).toFixed(0)}% Operational
            </span>
          </div>
          <div className="text-[10px] mt-2 text-gray-500 font-mono flex justify-between">
            <span>Latency Avg: {total > 0 ? (devices.reduce((s: number, d: any) => s + (d.latencyMs || 0), 0) / (onlineCount || 1)).toFixed(1) : '0.0'}ms</span>
            <span className={`${healthPercent >= 90 ? 'text-green-600' : healthPercent >= 70 ? 'text-amber-600' : 'text-red-600'} font-bold`}>Health {healthPercent}%</span>
          </div>
        </div>

        {/* Critical & Issues */}
        <div className="bg-white p-3.5 rounded shadow-xs border border-[#DEE2E6] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500">{t.criticalNodes}</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-bold font-mono text-red-600">{criticalCount + warningCount}</span>
            <span className="text-[10px] text-red-500 font-bold font-mono">
              {criticalCount} Critical, {warningCount} Warn
            </span>
          </div>
          <div className="text-[10px] mt-2 text-red-600 font-mono italic truncate">
            {criticalCount > 0 ? 'Requires technician inspection' : 'All systems clear'}
          </div>
        </div>

        {/* Total Hardware Specs Provisioned */}
        <div className="bg-white p-3.5 rounded shadow-xs border border-[#DEE2E6] flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-bold text-gray-500">{t.totalRam}</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-3xl font-bold font-mono text-purple-700">{totalRamGB} GB</span>
            <span className="text-[10px] text-purple-600 font-bold">RAM Inventory</span>
          </div>
          <div className="text-[10px] mt-2 text-gray-500 font-mono flex justify-between">
            <span>Avg Storage: 58%</span>
            <span className="font-bold text-gray-700">DDR4/DDR5 ECC</span>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Categories Quick Cards Grid (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded border border-[#DEE2E6] p-4 shadow-xs">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Category Inventory Breakdown & Specifications
              </h2>
              <span className="text-[10px] font-mono text-gray-400">Jakob UI Layout</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Category Card 1: Computers */}
              <div
                onClick={() => onSelectCategory('computer')}
                className="p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-400 rounded cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-600" />
                    <span className="font-bold text-xs text-gray-800">{t.computers}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-gray-900">{computersList.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Desktops, Workstations & Laptops with OS & software specs
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-gray-600 border-t border-gray-200 pt-2">
                  <span>
                    Online:{' '}
                    <strong className="text-green-600">
                      {computersList.filter((d) => d.status === 'online').length}
                    </strong>
                  </span>
                  <span className="text-blue-600 underline font-bold">View List →</span>
                </div>
              </div>

              {/* Category Card 2: Printers */}
              <div
                onClick={() => onSelectCategory('printer')}
                className="p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-400 rounded cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-xs text-gray-800">{t.printers}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-gray-900">{printersList.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  LaserJet, Color MFP, and Network Label printers
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-gray-600 border-t border-gray-200 pt-2">
                  <span>
                    Warning:{' '}
                    <strong className="text-yellow-600">
                      {printersList.filter((d) => d.status === 'warning').length}
                    </strong>
                  </span>
                  <span className="text-blue-600 underline font-bold">View List →</span>
                </div>
              </div>

              {/* Category Card 3: Network Devices */}
              <div
                onClick={() => onSelectCategory('network')}
                className="p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-400 rounded cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Router className="w-4 h-4 text-green-600" />
                    <span className="font-bold text-xs text-gray-800">{t.network}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-gray-900">{networkList.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Core Switches, FortiGate Firewalls, WAN Routers
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-gray-600 border-t border-gray-200 pt-2">
                  <span>
                    Operational:{' '}
                    <strong className="text-green-600">
                      {networkList.filter((d) => d.status === 'online').length}
                    </strong>
                  </span>
                  <span className="text-blue-600 underline font-bold">View List →</span>
                </div>
              </div>

              {/* Category Card 4: Servers */}
              <div
                onClick={() => onSelectCategory('server')}
                className="p-3 bg-gray-50 hover:bg-blue-50/50 border border-gray-200 hover:border-blue-400 rounded cursor-pointer transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs text-gray-800">{t.servers}</span>
                  </div>
                  <span className="text-sm font-bold font-mono text-gray-900">{serversList.length}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Database clusters, NAS storage, virtual hosts
                </p>
                <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-gray-600 border-t border-gray-200 pt-2">
                  <span>
                    Online:{' '}
                    <strong className="text-green-600">
                      {serversList.filter((d) => d.status === 'online').length}
                    </strong>
                  </span>
                  <span className="text-blue-600 underline font-bold">View List →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Hardware Spotlight */}
          <div className="bg-white rounded border border-[#DEE2E6] p-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase text-gray-700 mb-3 tracking-wider">
              Critical & Flagged Assets Requiring Attention
            </h3>
            <div className="space-y-2">
              {safeDevices
                .filter((d) => d?.status === 'critical' || d?.status === 'warning')
                .map((dev) => (
                  <div
                    key={dev.id}
                    onClick={() => onOpenDetails(dev)}
                    className="p-2.5 bg-red-50/50 hover:bg-red-100/60 border border-red-200 rounded flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          dev.status === 'critical' ? 'bg-red-600 animate-ping' : 'bg-yellow-500'
                        }`}
                      ></span>
                      <div>
                        <div className="font-bold text-xs font-mono text-gray-900">{dev.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          IP: {dev.ip} • MAC: {dev.mac} • Dept: {dev.department}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-red-700 underline font-mono">
                        Inspect Specs →
                      </span>
                      <div className="text-[9px] text-gray-500 italic truncate max-w-[150px]">
                        {dev.notes}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column: OS Distribution & Security Overview */}
        <div className="space-y-4">
          <div className="bg-white rounded border border-[#DEE2E6] p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 border-b border-gray-100 pb-2">
              {t.topOsTitle}
            </h2>

            <div className="space-y-3 font-mono text-xs">
              {Object.entries(osCounts).map(([osGroup, count]) => {
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={osGroup}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-gray-700 font-bold">{osGroup}</span>
                      <span className="text-gray-500">
                        {count} nodes ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-xs overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-xs"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded border border-[#DEE2E6] p-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 border-b border-gray-100 pb-2">
              Security & Patch Compliance
            </h2>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-600">Antivirus Active:</span>
                <span className="text-green-600 font-bold">90% Compliant</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-600">Local Firewall Enabled:</span>
                <span className="text-green-600 font-bold">100% Active</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded border border-gray-200">
                <span className="text-gray-600">Latest OS Patches:</span>
                <span className="text-blue-600 font-bold">Aug 2026 Rollout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
