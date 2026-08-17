import React from 'react';
import {
  Activity,
  Shield,
  Server,
  Printer,
  Monitor,
  Router,
  Radio,
  Zap,
  Globe,
  HardDrive
} from 'lucide-react';
import { NavSection, Language, NetworkDevice } from '../types';
import { getTranslation } from '../data/i18n';

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  lang: Language;
  devices: NetworkDevice[];
  cpuLoad: number;
  memLoad: number;
  criticalCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeSection,
  onSelectSection,
  lang,
  devices = [],
  cpuLoad = 14,
  memLoad = 48,
  criticalCount = 0
}) => {
  const t = getTranslation(lang);

  const safeDevices = devices || [];
  const computersCount = safeDevices.filter((d) => d?.category === 'computer').length;
  const printersCount = safeDevices.filter((d) => d?.category === 'printer').length;
  const networkCount = safeDevices.filter((d) => d?.category === 'network').length;
  const serversCount = safeDevices.filter((d) => d?.category === 'server').length;

  return (
    <aside className="w-56 bg-[#1A1C23] text-white flex flex-col shrink-0 border-r border-[#2D303E]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2D303E]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="font-bold text-sm tracking-tight uppercase italic text-white">
            {t.appTitle}
          </span>
        </div>
        <div className="text-[9px] font-mono text-gray-400 mt-1">{t.subTitle}</div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1 tracking-wider">
          {t.navInfrastructure}
        </div>

        {/* Overview Dashboard */}
        <button
          onClick={() => onSelectSection('dashboard')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'dashboard'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            {t.dashboard}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-900/60 text-blue-300 rounded font-bold">
            {safeDevices.length}
          </span>
        </button>

        {/* All Asset Inventory */}
        <button
          onClick={() => onSelectSection('inventory')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'inventory'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            {t.inventory}
          </span>
        </button>

        {/* Category View 1: Computers */}
        <button
          onClick={() => onSelectSection('computers')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'computers'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            {t.computers}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded">
            {computersCount}
          </span>
        </button>

        {/* Category View 2: Printers */}
        <button
          onClick={() => onSelectSection('printers')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'printers'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Printer className="w-3.5 h-3.5 text-yellow-400" />
            {t.printers}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded">
            {printersCount}
          </span>
        </button>

        {/* Category View 3: Network Devices */}
        <button
          onClick={() => onSelectSection('network')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'network'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Router className="w-3.5 h-3.5 text-green-400" />
            {t.network}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded">
            {networkCount}
          </span>
        </button>

        {/* Category View 4: Servers */}
        <button
          onClick={() => onSelectSection('servers')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'servers'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            {t.servers}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 bg-gray-800 text-gray-300 rounded">
            {serversCount}
          </span>
        </button>

        <div className="mt-4 text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1 tracking-wider">
          {t.navOperations}
        </div>

        {/* Topology Map */}
        <button
          onClick={() => onSelectSection('topology')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'topology'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          {t.topology}
        </button>

        {/* Security Syslogs */}
        <button
          onClick={() => onSelectSection('security')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'security'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            {t.security}
          </span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] font-bold rounded-full">
              {criticalCount}
            </span>
          )}
        </button>

        {/* Ports View */}
        <button
          onClick={() => onSelectSection('ports')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
            activeSection === 'ports'
              ? 'bg-[#343A40] text-white font-semibold'
              : 'text-gray-400 hover:text-white hover:bg-[#252834]'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {t.ports}
        </button>
      </nav>

      {/* Telemetry Footer */}
      <div className="p-3 text-[11px] text-gray-400 border-t border-[#2D303E] bg-[#14161C] space-y-2">
        <div>
          <div className="flex justify-between mb-1 text-[10px]">
            <span>CPU Load</span>
            <span className="font-mono text-white font-bold">{cpuLoad}%</span>
          </div>
          <div className="w-full bg-[#2D303E] h-1 rounded overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${cpuLoad}%` }}
            ></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-1 text-[10px]">
            <span>RAM Alloc</span>
            <span className="font-mono text-white font-bold">{memLoad}%</span>
          </div>
          <div className="w-full bg-[#2D303E] h-1 rounded overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${memLoad}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
