import React, { useState } from 'react';
import { X, Plus, Cpu, HardDrive, Zap } from 'lucide-react';
import { DeviceCategory, DeviceType, NetworkDevice, Language } from '../types';
import { getTranslation } from '../data/i18n';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: Partial<NetworkDevice>) => void;
  lang: Language;
  existingDevices?: NetworkDevice[];
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  lang,
  existingDevices = []
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);

  // Auto IP /24 calculation helper
  const calculateAutoIp = () => {
    const defaultSubnet = '10.10.0.';
    const usedHosts = existingDevices
      .map((d) => {
        const cleanIp = d.ip.split('/')[0];
        if (cleanIp.startsWith('10.10.0.')) {
          const lastOctet = parseInt(cleanIp.split('.')[3], 10);
          return isNaN(lastOctet) ? 0 : lastOctet;
        }
        return 0;
      })
      .filter((h) => h > 0 && h < 254);

    let nextHost = 106;
    if (usedHosts.length > 0) {
      nextHost = Math.max(...usedHosts) + 1;
      if (nextHost >= 254) nextHost = 110;
    }

    return `10.10.0.${nextHost}/24`;
  };

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('computer');
  const [type, setType] = useState<DeviceType>('Desktop PC');
  const [ip, setIp] = useState(() => calculateAutoIp());
  const [mac, setMac] = useState(() => `00:1A:2B:3C:4D:${(existingDevices.length + 10).toString().padStart(2, '0')}`);
  const [vlan, setVlan] = useState(20);
  const [department, setDepartment] = useState('IT & Software');
  const [assignedUser, setAssignedUser] = useState('');
  const [location, setLocation] = useState('Main Office Floor 1');
  const [cpu, setCpu] = useState('Intel Core i7-13700 16-Core @ 2.10GHz');
  const [ramGB, setRamGB] = useState(16);
  const [storage, setStorage] = useState('512GB NVMe M.2 SSD');
  const [osName, setOsName] = useState('Windows 11 Pro 64-bit');
  const [serialNumber, setSerialNumber] = useState(`PC-${(10000 + existingDevices.length + 1)}`);

  const handleAutoAssignIp = () => {
    setIp(calculateAutoIp());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalIp = ip.includes('/') ? ip : `${ip}/24`;

    onAdd({
      name: name || 'PC-ASSET-NODE',
      category,
      type,
      ip: finalIp,
      mac: mac || '00:1A:2B:3C:4D:EF',
      vlan,
      status: 'online',
      uptime: '00h 01m',
      latencyMs: 1.1,
      txRate: '0.1 MB/s',
      rxRate: '0.1 MB/s',
      department,
      assignedUser,
      location,
      lastSeen: 'Just now',
      hardware: {
        cpu,
        cpuCores: 8,
        ramGB,
        ramType: 'DDR4',
        storage,
        diskUsagePercent: 12,
        serialNumber,
        macAddress: mac || '00:1A:2B:3C:4D:EF'
      },
      software: {
        osName,
        osArchitecture: '64-bit',
        antivirusStatus: 'Active & Updated',
        firewallEnabled: true,
        installedApps: [
          { name: 'CrowdStrike Falcon Sensor', version: '7.12.0', publisher: 'CrowdStrike', installDate: '2026-08-01', licenseStatus: 'Licensed' }
        ]
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded border border-[#DEE2E6] shadow-2xl w-full max-w-2xl overflow-hidden font-sans">
        <div className="bg-[#1A1C23] text-white p-4 border-b border-[#2D303E] flex items-center justify-between">
          <h2 className="text-sm font-bold font-mono tracking-tight flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" />
            {t.addNode}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">
                Hostname / Device Name
              </label>
              <input
                type="text"
                required
                placeholder="PC-DEPT-USER"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              >
                <option value="computer">Computer / PC</option>
                <option value="printer">Printer / MFP</option>
                <option value="network">Network Hardware</option>
                <option value="server">Server / Storage</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase font-bold text-gray-500">IP Address (/24 Subnet)</label>
                <button
                  type="button"
                  onClick={handleAutoAssignIp}
                  className="text-[9px] px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded flex items-center gap-1 cursor-pointer"
                  title="Auto-detect next available IP in 10.10.0.0/24 subnet"
                >
                  <Zap className="w-2.5 h-2.5" />
                  {t.autoIpBtn}
                </button>
              </div>
              <input
                type="text"
                required
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="10.10.0.106/24"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">MAC Address</label>
              <input
                type="text"
                required
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Assigned User</label>
              <input
                type="text"
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
                placeholder="Name / Staff ID"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">CPU Processor</label>
              <input
                type="text"
                value={cpu}
                onChange={(e) => setCpu(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">RAM (GB)</label>
              <input
                type="number"
                value={ramGB}
                onChange={(e) => setRamGB(Number(e.target.value))}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none font-bold text-purple-700"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Storage / Disk</label>
              <input
                type="text"
                value={storage}
                onChange={(e) => setStorage(e.target.value)}
                placeholder="512GB NVMe SSD"
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Operating System</label>
              <input
                type="text"
                value={osName}
                onChange={(e) => setOsName(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Serial Number / Asset Tag</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded focus:outline-none font-bold text-amber-700"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
            >
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
