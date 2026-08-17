import React from 'react';
import { Router, Shield, Server, Monitor, Printer, HardDrive, Wifi, Radio } from 'lucide-react';
import { NetworkDevice, Language } from '../types';
import { getTranslation } from '../data/i18n';

interface TopologyViewProps {
  devices: NetworkDevice[];
  lang: Language;
  onOpenDetails: (device: NetworkDevice) => void;
}

export const TopologyView: React.FC<TopologyViewProps> = ({ devices = [], lang, onOpenDetails }) => {
  const t = getTranslation(lang);

  const safeDevices = devices || [];

  const firewall = safeDevices.find((d) => d?.type === 'Firewall') || safeDevices[0];
  const switchCore = safeDevices.find((d) => d?.type === 'Core Switch' || d?.type === 'Switch') || safeDevices[1];
  const router = safeDevices.find((d) => d?.type === 'Router') || safeDevices[2];

  const computers = safeDevices.filter((d) => d?.category === 'computer');
  const printers = safeDevices.filter((d) => d?.category === 'printer');
  const servers = safeDevices.filter((d) => d?.category === 'server');
  const iot = safeDevices.filter((d) => d?.category === 'iot');

  return (
    <div className="bg-white rounded border border-[#DEE2E6] p-4 flex flex-col h-full overflow-hidden shadow-xs">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-800">
            {t.topology}
          </h2>
          <p className="text-[10px] text-gray-500 font-mono">
            Layer 2/3 Interconnect Routing & Node Status Map
          </p>
        </div>
        <div className="flex gap-3 text-[10px] font-mono text-gray-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> 10Gbps Fiber Uplink
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> 1Gbps Ethernet Trunk
          </span>
        </div>
      </div>

      <div className="flex-1 bg-[#1A1C23] rounded p-6 overflow-auto flex flex-col items-center justify-center min-h-[420px] relative font-mono text-white">
        {safeDevices.length === 0 ? (
          <div className="text-center text-gray-500">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No devices registered yet.</p>
            <p className="text-xs text-gray-600 mt-1">Add devices or run a subnet scan to populate the topology map.</p>
          </div>
        ) : (
          <>
            {router && (
              <div className="flex flex-col items-center z-10 cursor-pointer" onClick={() => onOpenDetails(router)}>
                <div className="px-5 py-2.5 bg-blue-900/90 border-2 border-blue-400 rounded-lg shadow-lg flex items-center gap-3 hover:scale-105 transition-transform">
                  <Router className="w-6 h-6 text-blue-300" />
                  <div>
                    <div className="text-xs font-bold">{router.name}</div>
                    <div className="text-[10px] text-blue-200">{router.ip} • Fiber WAN Endpoint</div>
                  </div>
                </div>
                <div className="h-8 w-0.5 bg-blue-400"></div>
              </div>
            )}

            {firewall && (
              <div className="flex flex-col items-center z-10 cursor-pointer" onClick={() => onOpenDetails(firewall)}>
                <div className="px-5 py-2.5 bg-red-900/90 border-2 border-red-500 rounded-lg shadow-lg flex items-center gap-3 hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6 text-red-300" />
                  <div>
                    <div className="text-xs font-bold">{firewall.name}</div>
                    <div className="text-[10px] text-red-200">{firewall.ip} • Deep Packet Inspection Gateway</div>
                  </div>
                </div>
                <div className="h-8 w-0.5 bg-green-400"></div>
              </div>
            )}

            {switchCore && (
              <div className="flex flex-col items-center z-10 cursor-pointer" onClick={() => onOpenDetails(switchCore)}>
                <div className="px-6 py-2.5 bg-gray-800 border-2 border-green-400 rounded-lg shadow-lg flex items-center gap-3 hover:scale-105 transition-transform">
                  <Server className="w-6 h-6 text-green-400" />
                  <div>
                    <div className="text-xs font-bold">{switchCore.name}</div>
                    <div className="text-[10px] text-green-200">{switchCore.ip} • 48-Port L3 Switch Core</div>
                  </div>
                </div>
                <div className="w-4/5 h-0.5 bg-gray-600 mt-5 relative">
                  <div className="absolute left-0 top-0 h-6 w-0.5 bg-gray-600"></div>
                  <div className="absolute left-1/3 top-0 h-6 w-0.5 bg-gray-600"></div>
                  <div className="absolute left-2/3 top-0 h-6 w-0.5 bg-gray-600"></div>
                  <div className="absolute right-0 top-0 h-6 w-0.5 bg-gray-600"></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-6">
              <div className="bg-gray-800/90 p-3 rounded border border-purple-500/40 text-center text-[10px] space-y-1.5">
                <div className="font-bold text-purple-300 uppercase tracking-wide">Servers (VLAN-30)</div>
                {servers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onOpenDetails(s)}
                    className="p-1.5 bg-gray-900 hover:bg-gray-700 rounded border border-gray-700 cursor-pointer flex justify-between items-center text-gray-200 font-mono"
                  >
                    <span>{s.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  </div>
                ))}
                {servers.length === 0 && <div className="text-gray-600 text-[9px]">No servers found</div>}
              </div>

              <div className="bg-gray-800/90 p-3 rounded border border-cyan-500/40 text-center text-[10px] space-y-1.5">
                <div className="font-bold text-cyan-300 uppercase tracking-wide">Computers (VLAN-20)</div>
                {computers.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onOpenDetails(c)}
                    className={`p-1.5 rounded border cursor-pointer flex justify-between items-center font-mono ${
                      c.status === 'critical'
                        ? 'bg-red-900/60 border-red-500 text-red-200'
                        : 'bg-gray-900 hover:bg-gray-700 border-gray-700 text-gray-200'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        c.status === 'online' ? 'bg-green-500' : 'bg-red-500 animate-ping'
                      }`}
                    ></span>
                  </div>
                ))}
                {computers.length === 0 && <div className="text-gray-600 text-[9px]">No computers found</div>}
              </div>

              <div className="bg-gray-800/90 p-3 rounded border border-amber-500/40 text-center text-[10px] space-y-1.5">
                <div className="font-bold text-amber-300 uppercase tracking-wide">Printers (VLAN-10)</div>
                {printers.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenDetails(p)}
                    className={`p-1.5 rounded border cursor-pointer flex justify-between items-center font-mono ${
                      p.status === 'warning'
                        ? 'bg-yellow-900/50 border-yellow-500 text-yellow-200'
                        : 'bg-gray-900 hover:bg-gray-700 border-gray-700 text-gray-200'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    ></span>
                  </div>
                ))}
                {printers.length === 0 && <div className="text-gray-600 text-[9px]">No printers found</div>}
              </div>

              <div className="bg-gray-800/90 p-3 rounded border border-emerald-500/40 text-center text-[10px] space-y-1.5">
                <div className="font-bold text-emerald-300 uppercase tracking-wide">IoT & Cameras (VLAN-40)</div>
                {iot.map((i) => (
                  <div
                    key={i.id}
                    onClick={() => onOpenDetails(i)}
                    className={`p-1.5 rounded border cursor-pointer flex justify-between items-center font-mono ${
                      i.status === 'critical'
                        ? 'bg-red-900/60 border-red-500 text-red-200'
                        : 'bg-gray-900 hover:bg-gray-700 border-gray-700 text-gray-200'
                    }`}
                  >
                    <span>{i.name}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        i.status === 'online' ? 'bg-green-500' : 'bg-red-500 animate-ping'
                      }`}
                    ></span>
                  </div>
                ))}
                {iot.length === 0 && <div className="text-gray-600 text-[9px]">No IoT devices found</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
