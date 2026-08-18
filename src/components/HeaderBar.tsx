import React from 'react';
import { AlertTriangle, Plus, RefreshCw, Languages } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../data/i18n';

interface HeaderBarProps {
  lang: Language;
  onToggleLang: () => void;
  criticalCount: number;
  trafficIn: number;
  trafficOut: number;
  isScanning: boolean;
  onStartScan: () => void;
  onOpenAddModal: () => void;
  onToggleAlerts: () => void;
  alertsOpen: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  lang,
  onToggleLang,
  criticalCount,
  trafficIn,
  trafficOut,
  isScanning,
  onStartScan,
  onOpenAddModal,
  onToggleAlerts,
  alertsOpen
}) => {
  const t = getTranslation(lang);

  return (
    <header className="h-12 bg-white border-b border-[#DEE2E6] flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-xs">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex flex-col">
          <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">{t.gateway}</span>
          <span className="text-xs font-mono font-bold text-green-600">10.10.0.1</span>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
        <div className="flex flex-col hidden sm:flex">
          <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">{t.uptime}</span>
          <span className="text-xs font-mono font-bold text-gray-800">142d 08h 12m</span>
        </div>
        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
        <div className="flex flex-col hidden md:flex">
          <span className="text-[9px] uppercase text-gray-400 font-bold tracking-wider">{t.trafficInOut}</span>
          <span className="text-xs font-mono font-bold text-blue-700">
            {trafficIn} Mbps / {trafficOut} Mbps
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-300"
          title="Switch Language / Changer de langue / تغيير اللغة"
        >
          <Languages className="w-3.5 h-3.5 text-gray-600" />
          <span className="font-mono uppercase">{lang === 'ar' ? 'English' : lang === 'en' ? 'Français' : 'العربية'}</span>
        </button>

        {/* Scan Network button */}
        <button
          onClick={onStartScan}
          disabled={isScanning}
          className="hidden lg:flex text-[10px] px-2.5 py-1 bg-[#212529] hover:bg-black text-white font-bold rounded items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? t.scanning : t.scanNetwork}</span>
        </button>

        {/* Critical Alert Badge */}
        {criticalCount > 0 && (
          <button
            onClick={onToggleAlerts}
            className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer border ${
              alertsOpen
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3 animate-pulse" />
            <span>{criticalCount} {t.criticalAlerts}</span>
          </button>
        )}

        {/* Add Device button */}
        <button
          onClick={onOpenAddModal}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.addNode}</span>
        </button>
      </div>
    </header>
  );
};
