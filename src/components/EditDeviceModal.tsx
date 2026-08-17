import React, { useState, useEffect } from 'react';
import { X, Edit3, Trash2, Save, Cpu, HardDrive, Shield, AlertTriangle } from 'lucide-react';
import { NetworkDevice, DeviceCategory, DeviceType, Language } from '../types';
import { getTranslation } from '../data/i18n';

interface EditDeviceModalProps {
  device: NetworkDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedDevice: NetworkDevice) => void;
  onDelete: (deviceId: string) => void;
  lang: Language;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
  onDelete,
  lang
}) => {
  if (!isOpen || !device) return null;

  const t = getTranslation(lang);

  const [name, setName] = useState(device.name);
  const [category, setCategory] = useState<DeviceCategory>(device.category);
  const [type, setType] = useState<DeviceType>(device.type);
  const [ip, setIp] = useState(device.ip);
  const [mac, setMac] = useState(device.mac);
  const [vlan, setVlan] = useState(device.vlan || 20);
  const [status, setStatus] = useState(device.status || 'online');
  const [department, setDepartment] = useState(device.department || '');
  const [assignedUser, setAssignedUser] = useState(device.assignedUser || '');
  const [location, setLocation] = useState(device.location || '');
  const [notes, setNotes] = useState(device.notes || '');

  // Hardware specs
  const [cpu, setCpu] = useState(device.hardware?.cpu || '');
  const [ramGB, setRamGB] = useState(device.hardware?.ramGB || 16);
  const [storage, setStorage] = useState(device.hardware?.storage || '');
  const [serialNumber, setSerialNumber] = useState(device.hardware?.serialNumber || '');

  // Software specs
  const [osName, setOsName] = useState(device.software?.osName || '');

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (device) {
      setName(device.name);
      setCategory(device.category);
      setType(device.type);
      setIp(device.ip);
      setMac(device.mac);
      setVlan(device.vlan || 20);
      setStatus(device.status || 'online');
      setDepartment(device.department || '');
      setAssignedUser(device.assignedUser || '');
      setLocation(device.location || '');
      setNotes(device.notes || '');
      setCpu(device.hardware?.cpu || '');
      setRamGB(device.hardware?.ramGB || 16);
      setStorage(device.hardware?.storage || '');
      setSerialNumber(device.hardware?.serialNumber || '');
      setOsName(device.software?.osName || '');
      setShowConfirmDelete(false);
    }
  }, [device]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    const updated: NetworkDevice = {
      ...device,
      name,
      category,
      type,
      ip: ip.includes('/') ? ip : `${ip}/24`,
      mac,
      vlan,
      status: status as any,
      department,
      assignedUser,
      location,
      notes,
      hardware: {
        ...device.hardware,
        cpu,
        cpuCores: device.hardware?.cpuCores || 8,
        ramGB: Number(ramGB),
        ramType: device.hardware?.ramType || 'DDR4',
        storage,
        serialNumber,
        macAddress: mac
      },
      software: {
        ...device.software,
        osName
      }
    };

    onSave(updated);
    onClose();
  };

  const handleDeleteConfirm = () => {
    if (device) {
      onDelete(device.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
      <div className="bg-white rounded border border-[#DEE2E6] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn font-sans">
        {/* Modal Header */}
        <div className="bg-[#1A1C23] text-white p-4 border-b border-[#2D303E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold font-mono tracking-tight text-white">
                Modifier l'Équipement Réseau
              </h2>
              <p className="text-[11px] text-gray-400 font-mono">
                ID: {device.id} | MAC: {device.mac}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Identity Section */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-600" /> Identity & General Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nom / Device Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. PC-DEV-01"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Catégorie / Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="computer">Computer (PC / Workstation / Laptop)</option>
                  <option value="printer">Printer (Imprimante)</option>
                  <option value="network">Network (Switch / Router / FW)</option>
                  <option value="server">Server (Serveur Rack / NAS)</option>
                  <option value="iot">IoT / Security (Camera / Sensor)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Type Spécifique</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value as DeviceType)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Workstation, Desktop PC, Switch"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Adresse IP</label>
                <input
                  type="text"
                  required
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="10.10.0.101/24"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Adresse MAC</label>
                <input
                  type="text"
                  required
                  value={mac}
                  onChange={(e) => setMac(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="00:1A:2B:3C:4D:EF"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">VLAN ID</label>
                <input
                  type="number"
                  value={vlan}
                  onChange={(e) => setVlan(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Statut Réseau</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-900 font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="online">🟢 Online (En ligne)</option>
                  <option value="warning">🟡 Warning (Avertissement)</option>
                  <option value="critical">🔴 Critical (Injoignable)</option>
                  <option value="offline">⚪ Offline (Hors ligne)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organizational & Location */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
              Organisation & Emplacement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Département</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Software Engineering, Finance, HR..."
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Utilisateur Assigné / Rôle</label>
                <input
                  type="text"
                  value={assignedUser}
                  onChange={(e) => setAssignedUser(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Technicien, Analyst, Rôle..."
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Emplacement Physique</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Bureau 102, Server Room Rack A1..."
                />
              </div>
            </div>
          </div>

          {/* Hardware & OS Specs */}
          <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-3">
            <h3 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" /> Spécifications Matérielles & Système
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Processeur (CPU)</label>
                <input
                  type="text"
                  value={cpu}
                  onChange={(e) => setCpu(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="Intel Core i9-13900K..."
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Mémoire RAM (GB)</label>
                <input
                  type="number"
                  value={ramGB}
                  onChange={(e) => setRamGB(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Stockage Disk</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="1TB NVMe SSD..."
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Numéro de Série</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  placeholder="WS-2026-DEV-001"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Système d'Exploitation (OS)</label>
              <input
                type="text"
                value={osName}
                onChange={(e) => setOsName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Windows 11 Pro 64-bit..."
              />
            </div>
          </div>

          {/* Delete Danger Zone */}
          {showConfirmDelete ? (
            <div className="bg-red-50 border border-red-300 p-3 rounded flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800 font-bold">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Confirmer la suppression définitive de cet équipement ?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold cursor-pointer"
                >
                  Oui, Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {/* Modal Actions */}
          <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
            {!showConfirmDelete && (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Supprimer l'Équipement
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" /> Enregistrer les Modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
