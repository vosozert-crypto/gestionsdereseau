import React, { useState } from 'react';
import { X, Search, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { NetworkDevice, Language } from '../types';
import { getTranslation } from '../data/i18n';
import { api } from '../services/api.ts';

interface IpScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDevices: NetworkDevice[];
  onImportDiscoveredDevices: (newDevices: Partial<NetworkDevice>[]) => void;
  onAddLog: (logMessage: string) => void;
  lang: Language;
}

interface ScanResult {
  ip: string;
  hostname: string;
  mac: string;
  status: string;
  latencyMs: number;
  isRegistered: boolean;
  matchedDeviceId?: string;
  matchedDeviceName?: string;
  osGuess: string;
  openPorts: number[];
}

export const IpScanModal: React.FC<IpScanModalProps> = ({
  isOpen,
  onClose,
  existingDevices,
  onImportDiscoveredDevices,
  onAddLog,
  lang
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);

  const [subnet, setSubnet] = useState('10.10.0.0');
  const [startIp, setStartIp] = useState(1);
  const [endIp, setEndIp] = useState(254);
  const [isScanning, setIsScanning] = useState(false);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [selectedIps, setSelectedIps] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [scanTimestamp] = useState(() => new Date().toLocaleString('fr-FR'));

  const findDevice = (r: ScanResult): NetworkDevice | undefined => {
    if (r.matchedDeviceId) {
      return existingDevices.find(d => d.id === r.matchedDeviceId);
    }
    return existingDevices.find(d => d.ip.split('/')[0] === r.ip);
  };

  const handleStartScan = async () => {
    setIsScanning(true);
    setResults([]);
    setSelectedIps([]);
    setError('');

    try {
      const data = await api.startScan(subnet, startIp, endIp);

      const scanResults: ScanResult[] = (data.results || []).map((r: any) => ({
        ip: r.ip,
        hostname: r.hostname || '',
        mac: r.mac || 'N/A',
        status: r.status,
        latencyMs: r.latencyMs || 0,
        isRegistered: r.isRegistered,
        matchedDeviceId: r.matchedDeviceId,
        matchedDeviceName: r.matchedDeviceName,
        osGuess: r.osGuess || 'Unknown',
        openPorts: r.openPorts || [],
      }));

      setResults(scanResults);
      onAddLog(`Subnet scan (${subnet}.${startIp}-${endIp}) completed: ${scanResults.length} hosts found, ${data.discoveredHosts} new.`);
    } catch (err) {
      setError((err as Error).message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelect = (ip: string) => {
    setSelectedIps(prev => prev.includes(ip) ? prev.filter(x => x !== ip) : [...prev, ip]);
  };

  const toggleSelectAll = () => {
    const importable = filteredResults.filter(r => !r.isRegistered && r.status !== 'offline');
    if (selectedIps.length === importable.length) {
      setSelectedIps([]);
    } else {
      setSelectedIps(importable.map(r => r.ip));
    }
  };

  const importDevices = (ips: string[]) => {
    const toImport = results
      .filter(r => ips.includes(r.ip) && !r.isRegistered)
      .map(r => ({
        name: r.hostname || `SCANNED-${r.ip.split('.').pop()}`,
        category: 'computer' as const,
        type: 'Desktop PC' as const,
        ip: `${r.ip}/24`,
        mac: r.mac === 'N/A' ? '00:00:00:00:00:00' : r.mac,
        vlan: 20,
        department: 'Discovered Subnet',
        assignedUser: 'Discovered Host',
        location: `Scan: ${r.ip}`,
        notes: `Discovered via subnet scan. ${r.osGuess ? 'OS: ' + r.osGuess : ''}`,
      }));

    if (toImport.length > 0) {
      onImportDiscoveredDevices(toImport);
      setSelectedIps([]);
    }
  };

  const handleImportSelected = () => {
    importDevices(selectedIps);
  };

  const handleImportSingle = (ip: string) => {
    importDevices([ip]);
  };

  const filteredResults = showOnlyOnline
    ? results.filter(r => r.status !== 'offline' && r.status !== 'RESPONSE_TIMEOUT')
    : results;

  const onlineCount = results.filter(r => r.status !== 'offline' && r.status !== 'RESPONSE_TIMEOUT').length;
  const importableCount = results.filter(r => !r.isRegistered && r.status !== 'offline' && r.status !== 'RESPONSE_TIMEOUT').length;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111520] border border-[#1E2536] rounded-xl w-full max-w-7xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[#1E2536]">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-gray-200">Scan des PCs sur le réseau</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#1E2536] text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-[#1E2536] flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Subnet</label>
            <input value={subnet} onChange={e => setSubnet(e.target.value)} className="px-3 py-1.5 bg-[#0A0D14] border border-[#1E2536] rounded text-sm text-gray-300 font-mono w-40" placeholder="10.10.0.0" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">Start IP</label>
            <input type="number" min={1} max={254} value={startIp} onChange={e => setStartIp(Number(e.target.value))} className="px-3 py-1.5 bg-[#0A0D14] border border-[#1E2536] rounded text-sm text-gray-300 font-mono w-20" />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1">End IP</label>
            <input type="number" min={1} max={254} value={endIp} onChange={e => setEndIp(Number(e.target.value))} className="px-3 py-1.5 bg-[#0A0D14] border border-[#1E2536] rounded text-sm text-gray-300 font-mono w-20" />
          </div>
          <button onClick={handleStartScan} disabled={isScanning} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 text-white rounded text-xs font-bold flex items-center gap-2">
            {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
          </button>
          {selectedIps.length > 0 && (
            <button onClick={handleImportSelected} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Importer ({selectedIps.length})
            </button>
          )}
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="px-4 py-2 flex items-center gap-4 text-[10px] font-mono text-gray-500 border-b border-[#1E2536]">
            <span>Total: <strong className="text-gray-300">{results.length}</strong></span>
            <span>En ligne: <strong className="text-emerald-400">{onlineCount}</strong></span>
            <span>Enregistrés: <strong className="text-blue-400">{results.filter(r => r.isRegistered).length}</strong></span>
            <span>Nouveaux: <strong className="text-amber-400">{importableCount}</strong></span>
            <label className="flex items-center gap-1 ml-auto cursor-pointer">
              <input type="checkbox" checked={showOnlyOnline} onChange={e => setShowOnlyOnline(e.target.checked)} className="w-3 h-3 rounded" />
              <span>En ligne uniquement</span>
            </label>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {isScanning && (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-xs text-gray-500 font-mono">Scan du sous-réseau {subnet}.{startIp}-{endIp} en cours...</span>
            </div>
          )}

          {!isScanning && results.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs">Configurez le sous-réseau et cliquez sur Lancer le scan</span>
            </div>
          )}

          {!isScanning && filteredResults.length > 0 && (
            <table className="w-full text-[11px] font-mono">
              <thead className="bg-[#0A0D14] text-gray-500 uppercase text-[10px] sticky top-0">
                <tr className="border-b border-[#1E2536]">
                  <th className="px-2 py-2 text-center w-8">
                    <input type="checkbox" checked={selectedIps.length === importableCount && importableCount > 0} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded" />
                  </th>
                  <th className="px-3 py-2 text-left">État</th>
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">N° série</th>
                  <th className="px-3 py-2 text-left">Marque / Modèle</th>
                  <th className="px-3 py-2 text-left">Processeur</th>
                  <th className="px-3 py-2 text-center">RAM</th>
                  <th className="px-3 py-2 text-left">Disque</th>
                  <th className="px-3 py-2 text-left">OS</th>
                  <th className="px-3 py-2 text-left">Session</th>
                  <th className="px-3 py-2 text-left">Ajouté le</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(r => {
                  const device = findDevice(r);
                  const hw = device?.hardware;
                  const sw = device?.software;
                  const isOffline = r.status === 'offline' || r.status === 'RESPONSE_TIMEOUT';

                  return (
                    <tr key={r.ip} className={`border-b border-[#1A1F2E] hover:bg-[#151A25] ${isOffline ? 'opacity-40' : ''}`}>
                      <td className="px-2 py-1.5 text-center">
                        {!r.isRegistered && !isOffline && (
                          <input type="checkbox" checked={selectedIps.includes(r.ip)} onChange={() => toggleSelect(r.ip)} className="w-3.5 h-3.5 rounded" />
                        )}
                      </td>

                      <td className="px-3 py-1.5">
                        {isOffline ? (
                          <span className="px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-500 text-[10px]">Hors ligne</span>
                        ) : r.isRegistered ? (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/30">Enregistré</span>
                        ) : r.openPorts.includes(135) ? (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] border border-purple-500/30">WMI</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/30">Nouveau</span>
                        )}
                      </td>

                      <td className="px-3 py-1.5">
                        <div className="font-bold text-gray-200">{device?.name || r.hostname || '—'}</div>
                        <div className="text-[9px] text-gray-600">{r.ip} {r.mac !== 'N/A' ? `• ${r.mac}` : ''}</div>
                      </td>

                      <td className="px-3 py-1.5 text-amber-400 text-[10px]">
                        {hw?.serialNumber || '—'}
                      </td>

                      <td className="px-3 py-1.5 text-gray-300 text-[10px]">
                        {hw?.brandModel || device?.type || (r.openPorts.includes(135) ? 'Windows PC' : '—')}
                      </td>

                      <td className="px-3 py-1.5 text-gray-300 text-[10px] truncate max-w-[140px]" title={hw?.cpu}>
                        {hw?.cpu || '—'}
                      </td>

                      <td className="px-3 py-1.5 text-center">
                        {hw?.ramGB ? (
                          <span className="text-indigo-400 font-bold">{hw.ramGB} Go</span>
                        ) : '—'}
                      </td>

                      <td className="px-3 py-1.5 text-gray-300 text-[10px] truncate max-w-[120px]" title={hw?.storage}>
                        {hw?.storage || '—'}
                      </td>

                      <td className="px-3 py-1.5 text-gray-300 text-[10px] truncate max-w-[140px]" title={sw?.osName || r.osGuess}>
                        {sw?.osName || r.osGuess || '—'}
                      </td>

                      <td className="px-3 py-1.5 text-gray-400 text-[10px]">
                        {device?.assignedUser || '—'}
                      </td>

                      <td className="px-3 py-1.5 text-gray-500 text-[10px]">
                        {device ? (device as any).created_at || '—' : scanTimestamp}
                      </td>

                      <td className="px-3 py-1.5 text-center">
                        {!r.isRegistered && !isOffline ? (
                          <button
                            onClick={() => handleImportSingle(r.ip)}
                            className="p-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded border border-emerald-500/30 cursor-pointer"
                            title="Importer cet appareil"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        ) : r.isRegistered ? (
                          <span className="text-[9px] text-gray-600">Dans l'inv.</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-[#1E2536] text-[10px] text-gray-600 font-mono flex justify-between">
            <span>Sous-réseau: {subnet}/24 • Scan: {scanTimestamp}</span>
            <span>{filteredResults.length} résultats affichés</span>
          </div>
        )}
      </div>
    </div>
  );
};
