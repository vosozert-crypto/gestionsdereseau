import React, { useState } from 'react';
import {
  X,
  Cpu,
  HardDrive,
  Monitor,
  Shield,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Package,
  Key,
  Server,
  Zap,
  Tag,
  MapPin,
  UserCheck,
  Loader2
} from 'lucide-react';
import { NetworkDevice, Language } from '../types';
import { getTranslation } from '../data/i18n';
import { api } from '../services/api.ts';

interface DeviceDetailModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
  lang
}) => {
  if (!isOpen || !device) return null;

  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'hardware' | 'software' | 'diagnostics'>('hardware');
  const [appSearch, setAppSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Diagnostic Ping state
  const [pingOutput, setPingOutput] = useState<string[]>([
    `[SYS-DIAG] Initializing ICMP echo request for [${device.name}] @ ${device.ip}...`,
    `[NET-IF] Interface: eth0 (MAC: ${device.mac})`
  ]);
  const [pinging, setPinging] = useState<boolean>(false);

  // Copy asset tag function
  const handleCopyTag = () => {
    const tagText = `ASSET TAG: ${device.name}\nIP: ${device.ip}\nMAC: ${device.mac}\nSERIAL: ${device.hardware?.serialNumber || 'N/A'}\nUSER: ${device.assignedUser || 'N/A'}`;
    navigator.clipboard.writeText(tagText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run ping test via real backend API
  const handlePingTest = async () => {
    setPinging(true);
    setPingOutput([
      `Pinging ${device.ip.split('/')[0]} with 32 bytes of payload data...`,
      `Waiting for ICMP response from ${device.name}...`
    ]);

    try {
      const result = await api.pingDevice(device.ip);
      setPingOutput(result.output.length > 0 ? result.output : [
        `Pinging ${device.ip.split('/')[0]}...`,
        result.reachable
          ? `Reply from ${device.ip.split('/')[0]}: time=${result.latencyMs}ms`
          : `Request timed out. Host unreachable.`
      ]);
    } catch (err) {
      setPingOutput([
        `Pinging ${device.ip.split('/')[0]}...`,
        `[ERROR] ${err instanceof Error ? err.message : 'Ping failed'}`,
        `--- ${device.ip.split('/')[0]} ping statistics ---`,
        `0 packets transmitted, 0 received, 100% packet loss.`
      ]);
    } finally {
      setPinging(false);
    }
  };

  // Filter installed apps
  const installedApps = device.software?.installedApps || [];
  const filteredApps = installedApps.filter(
    (a) =>
      a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.publisher.toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded border border-[#DEE2E6] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn font-sans">
        {/* Modal Header */}
        <div className="bg-[#1A1C23] text-white p-4 border-b border-[#2D303E] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                device.status === 'online'
                  ? 'bg-green-500'
                  : device.status === 'warning'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500 animate-ping'
              }`}
            ></span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white tracking-tight">
                  {device.name}
                </h2>
                <span className="px-2 py-0.5 bg-[#343A40] text-gray-300 text-[10px] font-mono rounded uppercase">
                  {device.type}
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                IP: <strong className="text-blue-400">{device.ip.includes('/') ? device.ip : `${device.ip}/24`}</strong> • MAC:{' '}
                <strong className="text-gray-300">{device.mac}</strong> • S/N:{' '}
                <strong className="text-amber-300">{device.hardware?.serialNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTag}
              className="px-2.5 py-1 bg-[#343A40] hover:bg-[#495057] text-white text-[10px] font-mono font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy Asset Information"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'COPIED!' : 'ASSET TAG'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tabs Bar */}
        <div className="bg-[#F8F9FA] px-4 py-2 border-b border-[#DEE2E6] flex gap-2 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'hardware'
                ? 'bg-[#212529] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            {t.tabHardware}
          </button>
          <button
            onClick={() => setActiveTab('software')}
            className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'software'
                ? 'bg-[#212529] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            {t.tabSoftware} ({installedApps.length})
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded font-bold cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'diagnostics'
                ? 'bg-[#212529] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {t.tabNetworkPing}
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans text-xs">
          {/* TAB 1: HARDWARE SPECS */}
          {activeTab === 'hardware' && (
            <div className="space-y-4">
              {/* Hardware Highlights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">{t.cpuModel}</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {device.hardware?.cpu || 'Standard Processor'}
                  </div>
                  <div className="text-[10px] text-blue-700 font-bold mt-1">
                    {device.hardware?.cpuCores || 4} Physical Cores
                  </div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">{t.ramCapacity}</div>
                  <div className="text-base font-bold text-purple-700 mt-1">
                    {device.hardware?.ramGB || 8} GB {device.hardware?.ramType || 'DDR4'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">System Memory Bank</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">{t.storageSpecs}</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {device.hardware?.storage || 'Primary Drive'}
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-xs mt-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${device.hardware?.diskUsagePercent || 45}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Hardware Detailed Grid Table */}
              <div className="bg-white border border-[#DEE2E6] rounded overflow-hidden">
                <div className="bg-[#F8F9FA] px-3 py-2 border-b border-[#DEE2E6] font-bold uppercase text-[11px] text-gray-700 font-mono">
                  Hardware Specifications & Peripheral Assignment
                </div>
                <div className="divide-y divide-gray-100 font-mono text-[11px]">
                  <div className="grid grid-cols-3 p-2.5">
                    <span className="text-gray-500 font-bold">{t.serialNumber}:</span>
                    <span className="col-span-2 font-bold text-amber-700">
                      {device.hardware?.serialNumber || 'N/A'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-gray-50/50">
                    <span className="text-gray-500 font-bold">{t.location}:</span>
                    <span className="col-span-2 text-gray-900 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" />
                      {device.location}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <span className="text-gray-500 font-bold">{t.assignedUser}:</span>
                    <span className="col-span-2 text-gray-900 font-bold flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      {device.assignedUser || device.department}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-gray-50/50">
                    <span className="text-gray-500 font-bold">{t.gpuModel}:</span>
                    <span className="col-span-2 text-gray-800">
                      {device.hardware?.gpu || 'Integrated Display Adapter'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5">
                    <span className="text-gray-500 font-bold">{t.powerSupply}:</span>
                    <span className="col-span-2 text-gray-800">
                      {device.hardware?.powerSupply || 'Standard Internal PSU'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-2.5 bg-gray-50/50">
                    <span className="text-gray-500 font-bold">VLAN & Network Interface:</span>
                    <span className="col-span-2 text-gray-800">
                      VLAN-{device.vlan} • {device.hardware?.portsCount || 1} Physical NIC Ports
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOFTWARE SPECS & INSTALLED APPLICATIONS */}
          {activeTab === 'software' && (
            <div className="space-y-4">
              {/* Operating System Overview Card */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded font-mono space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">{t.osName}</div>
                    <div className="text-sm font-bold text-gray-900">
                      {device.software?.osName}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded">
                    {device.software?.osArchitecture || '64-bit'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-gray-200 text-[10px]">
                  <div>
                    <span className="text-gray-400 block">{t.kernelVer}:</span>
                    <span className="font-bold text-gray-700">
                      {device.software?.kernelVersion || device.software?.firmwareVersion || '10.0.22631'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">{t.antivirusStatus}:</span>
                    <span className="font-bold text-green-600">
                      {device.software?.antivirusStatus || 'Active'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">{t.firewallState}:</span>
                    <span className="font-bold text-blue-600">
                      {device.software?.firewallEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">{t.lastPatchDate}:</span>
                    <span className="font-bold text-gray-700">
                      {device.software?.lastPatchDate || '2026-08-01'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Searchable Installed Software Table */}
              <div className="bg-white border border-[#DEE2E6] rounded overflow-hidden">
                <div className="bg-[#F8F9FA] px-3 py-2 border-b border-[#DEE2E6] flex justify-between items-center shrink-0 font-mono">
                  <span className="font-bold text-xs text-gray-800">
                    {t.installedAppsTitle} ({filteredApps.length})
                  </span>
                  <div className="relative w-48">
                    <Search className="w-3 h-3 absolute left-2 top-1.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter software..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="w-full pl-7 pr-2 py-0.5 bg-white border border-gray-300 rounded text-[10px] focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F1F3F5] text-[10px] text-gray-500 uppercase sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-1.5 font-bold">{t.appName}</th>
                        <th className="px-3 py-1.5 font-bold">{t.appVersion}</th>
                        <th className="px-3 py-1.5 font-bold">{t.appPublisher}</th>
                        <th className="px-3 py-1.5 font-bold">{t.appInstallDate}</th>
                        <th className="px-3 py-1.5 font-bold text-right">{t.appLicense}</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] divide-y divide-gray-100">
                      {filteredApps.map((app, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-1.5 font-bold text-gray-900">{app.name}</td>
                          <td className="px-3 py-1.5 text-blue-700">{app.version}</td>
                          <td className="px-3 py-1.5 text-gray-600">{app.publisher}</td>
                          <td className="px-3 py-1.5 text-gray-500">{app.installDate}</td>
                          <td className="px-3 py-1.5 text-right">
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                app.licenseStatus === 'Licensed' || app.licenseStatus === 'Subscription'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {app.licenseStatus}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredApps.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                            {t.noAppsFound}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETWORK DIAGNOSTICS & PING */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-3 font-mono">
              <div className="flex justify-between items-center bg-gray-50 p-2.5 border border-gray-200 rounded">
                <div>
                  <span className="text-xs font-bold text-gray-800">Target Node: {device.ip}</span>
                  <span className="text-[10px] text-gray-500 block">MAC: {device.mac}</span>
                </div>
                <button
                  onClick={handlePingTest}
                  disabled={pinging}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {pinging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                  {pinging ? 'Pinging...' : 'Send ICMP Echo'}
                </button>
              </div>

              {/* Terminal Screen */}
              <div className="bg-[#1A1C23] text-green-400 p-4 rounded border border-gray-800 h-48 overflow-y-auto text-[11px] font-mono leading-relaxed space-y-1">
                {pingOutput.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8F9FA] px-4 py-2.5 border-t border-[#DEE2E6] flex justify-end items-center shrink-0 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#212529] hover:bg-black text-white font-bold rounded cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
