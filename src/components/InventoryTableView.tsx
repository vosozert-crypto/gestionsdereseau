import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  Layers,
  FileSpreadsheet,
  Download,
  Edit3,
  Trash2,
  RotateCcw,
  RefreshCw,
  Eye,
  Activity,
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { NetworkDevice, Language, DeviceCategory } from '../types';
import { getTranslation } from '../data/i18n';

interface InventoryTableViewProps {
  devices: NetworkDevice[];
  lang: Language;
  categoryFilter?: DeviceCategory | 'ALL';
  onOpenDetails: (device: NetworkDevice) => void;
  onRunDiagnostics: (device: NetworkDevice) => void;
  onOpenConfig: (device: NetworkDevice) => void;
  onEditDevice?: (device: NetworkDevice) => void;
  onDeleteDevice?: (id: string) => void;
  onAddDevice?: () => void;
  onClearDevices?: () => void;
  onResetDevices?: () => void;
  onStartScan: () => void;
  isScanning: boolean;
}

export const InventoryTableView: React.FC<InventoryTableViewProps> = ({
  devices = [],
  lang,
  categoryFilter = 'ALL',
  onOpenDetails,
  onRunDiagnostics,
  onOpenConfig,
  onEditDevice,
  onDeleteDevice,
  onAddDevice,
  onClearDevices,
  onResetDevices,
  onStartScan,
  isScanning,
}) => {
  const t = getTranslation(lang);
  const safeDevices = useMemo(() => devices || [], [devices]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'ISSUES'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; ip: string } | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    safeDevices.forEach((d) => {
      if (d?.department) set.add(d.department);
    });
    return Array.from(set);
  }, [safeDevices]);

  const filteredDevices = useMemo(() => {
    return safeDevices.filter((d) => {
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;
      if (statusFilter === 'ONLINE' && d.status !== 'online') return false;
      if (statusFilter === 'ISSUES' && d.status === 'online') return false;
      if (departmentFilter !== 'ALL' && d.department !== departmentFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.ip.includes(q) ||
          d.mac.toLowerCase().includes(q) ||
          (d.hardware?.serialNumber || '').toLowerCase().includes(q) ||
          (d.hardware?.brandModel || '').toLowerCase().includes(q) ||
          (d.hardware?.cpu || '').toLowerCase().includes(q) ||
          (d.assignedUser || '').toLowerCase().includes(q) ||
          (d.department || '').toLowerCase().includes(q) ||
          (d.software?.osName || '').toLowerCase().includes(q) ||
          (d.location || '').toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [safeDevices, categoryFilter, statusFilter, departmentFilter, searchQuery]);

  const handleExportExcel = () => {
    const excelRows = filteredDevices.map((d, index) => ({
      'N°': index + 1,
      'NOM': d.name,
      'Numero de serie': d.hardware?.serialNumber || 'SN-N/A',
      'Marque / Modele': d.hardware?.brandModel || d.type || 'Desktop PC',
      'Processeur': d.hardware?.cpu || 'Intel Core i5',
      'Generation CPU': d.hardware?.cpuGen || '12th Gen',
      'RAM (Go)': d.hardware?.ramGB || 16,
      'Disque': d.hardware?.storage || '512GB NVMe SSD',
      'Architecture': d.software?.osArchitecture || '64-bit',
      'Observation': d.notes || 'Systeme operationnel',
      'Statut': d.status === 'online' ? 'En ligne' : d.status === 'warning' ? 'Avertissement' : 'Hors ligne',
      'Lieu': d.location || 'Siege Principal',
      'OS': d.software?.osName || 'Windows 11 Pro',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    const maxWidths: Record<string, number> = {
      'N°': 6,
      'NOM': 25,
      'Numero de serie': 20,
      'Marque / Modele': 28,
      'Processeur': 25,
      'Generation CPU': 15,
      'RAM (Go)': 10,
      'Disque': 22,
      'Architecture': 14,
      'Observation': 30,
      'Statut': 16,
      'Lieu': 22,
      'OS': 28,
    };

    worksheet['!cols'] = Object.values(maxWidths).map((w) => ({ wch: w }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire_PCs');
    XLSX.writeFile(workbook, `Inventaire_PCs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    const headers = [
      'N°',
      'NOM',
      'Numero de serie',
      'Marque / Modele',
      'Processeur',
      'Generation CPU',
      'RAM (Go)',
      'Disque',
      'Architecture',
      'Observation',
      'Statut',
      'Lieu',
      'OS',
    ];
    const rows = filteredDevices.map((d, index) => [
      index + 1,
      `"${d.name}"`,
      `"${d.hardware?.serialNumber || 'SN-N/A'}"`,
      `"${d.hardware?.brandModel || d.type || 'Desktop PC'}"`,
      `"${d.hardware?.cpu || 'N/A'}"`,
      `"${d.hardware?.cpuGen || 'N/A'}"`,
      d.hardware?.ramGB || 16,
      `"${d.hardware?.storage || '512GB SSD'}"`,
      `"${d.software?.osArchitecture || '64-bit'}"`,
      `"${d.notes || ''}"`,
      d.status === 'online' ? 'En ligne' : 'Hors ligne',
      `"${d.location || ''}"`,
      `"${d.software?.osName || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventaire_pcs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0D1017] rounded-lg border border-[#1E2536] flex flex-col overflow-hidden shadow-lg flex-1 h-full">
      {/* Top Filter & Toolbar */}
      <div className="bg-[#111520] px-4 py-3 border-b border-[#1E2536] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-gray-300 tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            {categoryFilter === 'ALL'
              ? t.inventory
              : categoryFilter === 'computer'
              ? t.computers
              : categoryFilter === 'printer'
              ? t.printers
              : categoryFilter === 'network'
              ? t.network
              : t.servers}
            <span className="bg-cyan-900/40 text-cyan-300 px-2 py-0.5 rounded font-mono text-[10px] border border-cyan-800/50">
              {filteredDevices.length}
            </span>
          </span>

          <div className="h-4 w-px bg-[#1E2536] hidden sm:block"></div>

          {/* Quick Status Filters */}
          <div className="flex gap-1 text-[10px] font-mono">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-[#1E2536] text-white border border-[#2D323E]'
                  : 'bg-[#0A0D14] text-gray-500 hover:bg-[#151A25] hover:text-gray-300 border border-transparent'
              }`}
            >
              {t.allStatuses}
            </button>
            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'ONLINE'
                  ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                  : 'bg-[#0A0D14] text-gray-500 hover:bg-[#151A25] hover:text-gray-300 border border-transparent'
              }`}
            >
              <Wifi className="w-3 h-3" />
              {t.onlineOnly}
            </button>
            <button
              onClick={() => setStatusFilter('ISSUES')}
              className={`px-2.5 py-1 rounded cursor-pointer font-bold transition-all flex items-center gap-1 ${
                statusFilter === 'ISSUES'
                  ? 'bg-red-900/40 text-red-300 border border-red-700/50'
                  : 'bg-[#0A0D14] text-gray-500 hover:bg-[#151A25] hover:text-gray-300 border border-transparent'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {t.issuesOnly}
            </button>
          </div>

          {/* Department Selector */}
          <div className="relative">
            <Filter className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-[10px] pl-6 pr-2 py-1 bg-[#0A0D14] border border-[#1E2536] rounded focus:outline-none text-gray-400 font-mono appearance-none cursor-pointer hover:border-[#2D323E] transition-colors"
            >
              <option value="ALL">{t.allDepts}</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <div className="relative flex-1 xl:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-500" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0A0D14] border border-[#1E2536] rounded text-[11px] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono text-gray-300 placeholder-gray-600 transition-all"
            />
          </div>

          {onAddDevice && (
            <button
              onClick={onAddDevice}
              className="text-[11px] px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer transition-all font-mono shadow-lg shadow-cyan-900/30"
              title="Ajouter un nouveau PC / Equipement"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouveau PC</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="text-[11px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer transition-all font-mono shadow-lg shadow-emerald-900/30"
            title="Exporter en Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="text-[10px] px-2.5 py-1.5 bg-[#1E2536] hover:bg-[#2D323E] text-gray-400 font-bold rounded flex items-center gap-1 cursor-pointer transition-all border border-[#2D323E]"
            title="Exporter en CSV"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={onStartScan}
            disabled={isScanning}
            className="text-[10px] px-2.5 py-1.5 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 font-bold rounded flex items-center gap-1 cursor-pointer transition-all border border-purple-700/50 disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            title="Scanner le reseau"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'Scan...' : 'Scan IP'}</span>
          </button>

          {onResetDevices && (
            <button
              onClick={onResetDevices}
              className="text-[10px] px-2.5 py-1.5 bg-[#1E2536] hover:bg-[#2D323E] text-gray-400 font-bold rounded flex items-center gap-1 cursor-pointer transition-all border border-[#2D323E] font-mono"
              title="Reinitialiser"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          )}

          {onClearDevices && (
            <button
              onClick={onClearDevices}
              className="text-[10px] px-2.5 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 font-bold rounded flex items-center gap-1 cursor-pointer transition-all border border-red-800/50 font-mono"
              title="Vider l'inventaire"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden lg:inline">Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 overflow-auto font-mono custom-scrollbar">
        <table className="w-full border-collapse text-left min-w-[1400px]">
          <thead className="bg-[#0A0D14] text-gray-400 text-[10px] sticky top-0 uppercase tracking-wider font-bold z-10">
            <tr className="border-b border-[#1E2536]">
              <th className="px-2 py-3 text-center w-10 text-gray-500">N°</th>
              <th className="px-3 py-3 text-gray-400">NOM</th>
              <th className="px-3 py-3 text-gray-400">Numero de serie</th>
              <th className="px-3 py-3 text-gray-400">Marque / Modele</th>
              <th className="px-3 py-3 text-gray-400">Processeur</th>
              <th className="px-3 py-3 text-center text-gray-400">Generation CPU</th>
              <th className="px-3 py-3 text-center text-gray-400">RAM (Go)</th>
              <th className="px-3 py-3 text-gray-400">Disque</th>
              <th className="px-3 py-3 text-center text-gray-400">Architecture</th>
              <th className="px-3 py-3 text-gray-400">Observation</th>
              <th className="px-3 py-3 text-center text-gray-400">Statut</th>
              <th className="px-3 py-3 text-gray-400">Lieu</th>
              <th className="px-3 py-3 text-gray-400">OS</th>
              <th className="px-3 py-3 text-center w-40 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-[#1E2536]/50">
            {filteredDevices.map((dev, idx) => {
              const isCritical = dev.status === 'critical';
              const isWarning = dev.status === 'warning';
              const isOnline = dev.status === 'online';

              return (
                <tr
                  key={dev.id}
                  className={`hover:bg-cyan-900/10 transition-colors group ${
                    isCritical
                      ? 'bg-red-950/20 hover:bg-red-950/30'
                      : isWarning
                      ? 'bg-amber-950/20 hover:bg-amber-950/30'
                      : 'bg-[#0D1017]'
                  }`}
                >
                  {/* N° */}
                  <td className="px-2 py-2.5 text-center font-bold text-gray-600 bg-[#0A0D14]/50">
                    {idx + 1}
                  </td>

                  {/* NOM */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-300 font-bold font-sans">{dev.name}</span>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono block mt-0.5">
                      {dev.ip}
                    </span>
                  </td>

                  {/* Numero de serie */}
                  <td className="px-3 py-2.5">
                    <span className="bg-amber-900/30 text-amber-300 px-2 py-0.5 rounded border border-amber-800/50 text-[10px] font-bold">
                      {dev.hardware?.serialNumber || 'SN-N/A'}
                    </span>
                  </td>

                  {/* Marque / Modele */}
                  <td className="px-3 py-2.5 text-gray-300 font-sans font-medium text-[11px]">
                    {dev.hardware?.brandModel || dev.type || 'Desktop PC'}
                  </td>

                  {/* Processeur */}
                  <td className="px-3 py-2.5 text-gray-400 text-[10px] truncate max-w-[150px]" title={dev.hardware?.cpu}>
                    {dev.hardware?.cpu || 'Intel Core i5'}
                  </td>

                  {/* Generation CPU */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="bg-purple-900/30 text-purple-300 px-2 py-0.5 rounded border border-purple-800/50 text-[10px] font-bold">
                      {dev.hardware?.cpuGen || '12th Gen'}
                    </span>
                  </td>

                  {/* RAM (Go) */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="bg-indigo-900/30 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/50 text-[10px] font-bold">
                      {dev.hardware?.ramGB || 16} Go
                    </span>
                  </td>

                  {/* Disque */}
                  <td className="px-3 py-2.5 text-gray-400 text-[10px] truncate max-w-[130px]" title={dev.hardware?.storage}>
                    {dev.hardware?.storage || '512GB SSD'}
                  </td>

                  {/* Architecture */}
                  <td className="px-3 py-2.5 text-center text-gray-500 text-[10px]">
                    {dev.software?.osArchitecture || '64-bit'}
                  </td>

                  {/* Observation */}
                  <td className="px-3 py-2.5 text-gray-500 text-[10px] font-sans truncate max-w-[160px]" title={dev.notes}>
                    {dev.notes || 'Aucune observation'}
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-2.5 text-center">
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-bold bg-emerald-900/30 px-2 py-0.5 rounded text-[10px] border border-emerald-700/50">
                        <Wifi className="w-3 h-3" />
                        En ligne
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-bold bg-amber-900/30 px-2 py-0.5 rounded text-[10px] border border-amber-700/50">
                        <AlertTriangle className="w-3 h-3" />
                        Avertissement
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-300 font-bold bg-red-900/30 px-2 py-0.5 rounded text-[10px] border border-red-700/50">
                        <WifiOff className="w-3 h-3" />
                        Hors ligne
                      </span>
                    )}
                  </td>

                  {/* Lieu */}
                  <td className="px-3 py-2.5 text-gray-400 text-[10px] font-sans">
                    {dev.location || 'Siege Principal'}
                  </td>

                  {/* OS */}
                  <td className="px-3 py-2.5 text-gray-400 text-[10px] truncate max-w-[130px]" title={dev.software?.osName}>
                    {dev.software?.osName || 'Windows 11 Pro'}
                  </td>

                  {/* Actions */}
                  <td className="px-2 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {/* Voir les details */}
                      <button
                        onClick={() => onOpenDetails(dev)}
                        className="p-1.5 bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-300 rounded cursor-pointer border border-cyan-800/50 transition-all hover:shadow-lg hover:shadow-cyan-900/20"
                        title="Voir les details complets"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Lancer des diagnostics / Ping reseau */}
                      <button
                        onClick={() => onRunDiagnostics(dev)}
                        className="p-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 rounded cursor-pointer border border-emerald-800/50 transition-all hover:shadow-lg hover:shadow-emerald-900/20"
                        title="Lancer diagnostics / Ping reseau"
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </button>

                      {/* Modifier la fiche */}
                      <button
                        onClick={() => (onEditDevice ? onEditDevice(dev) : onOpenConfig(dev))}
                        className="p-1.5 bg-[#1E2536] hover:bg-[#2D323E] text-gray-400 rounded cursor-pointer border border-[#2D323E] transition-all hover:text-gray-200"
                        title="Modifier la fiche PC"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Supprimer */}
                      {onDeleteDevice && (
                        <button
                          onClick={() => setPendingDelete({ id: dev.id, name: dev.name, ip: dev.ip })}
                          className="p-1.5 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded cursor-pointer border border-red-800/50 transition-all hover:shadow-lg hover:shadow-red-900/20"
                          title="Supprimer ce PC de l'inventaire"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDevices.length === 0 && (
              <tr>
                <td colSpan={14} className="text-center py-16 text-gray-600">
                  <div className="flex flex-col items-center gap-3">
                    <Search className="w-8 h-8 text-gray-700" />
                    <p className="text-sm font-sans">Aucun equipement trouve pour "{searchQuery}"</p>
                    <p className="text-[10px] text-gray-700 font-mono">
                      Essayez de modifier vos filtres ou d'ajouter un nouveau PC
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPendingDelete(null)}>
          <div
            className="bg-[#111520] rounded-xl border border-[#1E2536] shadow-2xl p-6 max-w-md w-full animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-900/30 rounded-full border border-red-800/50">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-200 font-sans">Confirmer la suppression</h3>
                <p className="text-[10px] text-gray-500 font-mono">Cette action est irreversible.</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5 font-sans">
              Supprimer <strong className="text-red-400">{pendingDelete.name}</strong> ({pendingDelete.ip}) de l'inventaire ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 bg-[#1E2536] hover:bg-[#2D323E] text-gray-400 text-xs font-bold rounded-lg cursor-pointer transition-colors border border-[#2D323E]"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteDevice?.(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-red-900/30"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <footer className="bg-[#0A0D14] px-4 py-2 border-t border-[#1E2536] flex flex-wrap justify-between items-center shrink-0 text-[10px] text-gray-600 font-mono">
        <div>
          Affichage de <span className="font-bold text-cyan-400">{filteredDevices.length}</span> sur{' '}
          <span className="font-bold text-gray-400">{safeDevices.length}</span> equipements
        </div>
        <div className="flex gap-4">
          <span>Export: Excel (.xlsx) / CSV</span>
          <span className="text-gray-700">|</span>
          <span>Sous-reseau: 10.10.0.0/24</span>
        </div>
      </footer>
    </div>
  );
};
