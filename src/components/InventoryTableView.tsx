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
  Plus
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
  isScanning
}) => {
  const t = getTranslation(lang);

  const safeDevices = useMemo(() => devices || [], [devices]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'ISSUES'>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; ip: string } | null>(null);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set<string>();
    safeDevices.forEach((d) => {
      if (d?.department) set.add(d.department);
    });
    return Array.from(set);
  }, [safeDevices]);

  // Format IP with /24 subnet mask
  const formatIpSubnet = (ip: string) => {
    if (!ip) return '10.10.0.1/24';
    return ip.includes('/') ? ip : `${ip}/24`;
  };

  // Filter logic
  const filteredDevices = useMemo(() => {
    return safeDevices.filter((d) => {
      // Category constraint
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter) return false;

      // Status constraint
      if (statusFilter === 'ONLINE' && d.status !== 'online') return false;
      if (statusFilter === 'ISSUES' && d.status === 'online') return false;

      // Department constraint
      if (departmentFilter !== 'ALL' && d.department !== departmentFilter) return false;

      // Search query across name, IP, MAC, serial, brand, cpu, storage, notes, and user
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = d.name.toLowerCase().includes(q);
        const matchesIp = d.ip.includes(q);
        const matchesMac = d.mac.toLowerCase().includes(q);
        const matchesSerial = d.hardware?.serialNumber?.toLowerCase().includes(q) || false;
        const matchesBrand = d.hardware?.brandModel?.toLowerCase().includes(q) || false;
        const matchesCpu = d.hardware?.cpu?.toLowerCase().includes(q) || false;
        const matchesUser = d.assignedUser?.toLowerCase().includes(q) || false;
        const matchesDept = d.department?.toLowerCase().includes(q) || false;
        const matchesOs = d.software?.osName?.toLowerCase().includes(q) || false;
        const matchesLocation = d.location?.toLowerCase().includes(q) || false;
        const matchesNotes = d.notes?.toLowerCase().includes(q) || false;

        return (
          matchesName ||
          matchesIp ||
          matchesMac ||
          matchesSerial ||
          matchesBrand ||
          matchesCpu ||
          matchesUser ||
          matchesDept ||
          matchesOs ||
          matchesLocation ||
          matchesNotes
        );
      }

      return true;
    });
  }, [safeDevices, categoryFilter, statusFilter, departmentFilter, searchQuery]);

  // Export to Excel (.xlsx) matching exact column structure requested by user
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
      'Observation': d.notes || 'Système opérationnel',
      'Statut': d.status === 'online' ? 'En ligne' : d.status === 'warning' ? 'Avertissement' : 'Hors ligne',
      'Lieu': d.location || 'Siège Principal',
      'OS': d.software?.osName || 'Windows 11 Pro'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    // Set auto width for Excel columns
    const max_width = excelRows.reduce((w, r) => {
      return Object.keys(r).map((key, i) => {
        const val = String((r as any)[key] || '');
        return Math.max(w[i] || key.length, val.length + 2);
      });
    }, [] as number[]);
    worksheet['!cols'] = max_width.map((w) => ({ wch: Math.min(Math.max(w, 10), 40) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaire_PCs');
    XLSX.writeFile(workbook, `Inventaire_PCs_${Date.now()}.xlsx`);
  };

  // Export Inventory as CSV
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
      'OS'
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
      `"${d.software?.osName || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventaire_pcs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded border border-[#DEE2E6] flex flex-col overflow-hidden shadow-xs flex-1 h-full">
      {/* Top Filter & Toolbar */}
      <div className="bg-[#F8F9FA] px-4 py-2.5 border-b border-[#DEE2E6] flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-gray-800 tracking-wide flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            {categoryFilter === 'ALL'
              ? t.inventory
              : categoryFilter === 'computer'
              ? t.computers
              : categoryFilter === 'printer'
              ? t.printers
              : categoryFilter === 'network'
              ? t.network
              : t.servers}{' '}
            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono text-[11px]">
              {filteredDevices.length}
            </span>
          </span>

          <div className="h-4 w-px bg-gray-300 hidden sm:block"></div>

          {/* Quick Status Filters */}
          <div className="flex gap-1 text-[10px] font-mono">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                statusFilter === 'ALL'
                  ? 'bg-[#212529] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.allStatuses}
            </button>
            <button
              onClick={() => setStatusFilter('ONLINE')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                statusFilter === 'ONLINE'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.onlineOnly}
            </button>
            <button
              onClick={() => setStatusFilter('ISSUES')}
              className={`px-2 py-0.5 rounded cursor-pointer font-bold ${
                statusFilter === 'ISSUES'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.issuesOnly}
            </button>
          </div>

          {/* Department Selector */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-[10px] px-2 py-0.5 bg-white border border-gray-300 rounded focus:outline-none text-gray-700 font-mono"
          >
            <option value="ALL">{t.allDepts}</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-gray-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-white border border-[#DEE2E6] rounded text-[11px] focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {onAddDevice && (
            <button
              onClick={onAddDevice}
              className="text-[11px] px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors font-mono shadow-xs"
              title="Ajouter un nouveau PC / Équipement"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau PC</span>
            </button>
          )}

          {/* Enregistrer Excel (.xlsx) Button requested by user */}
          <button
            onClick={handleExportExcel}
            className="text-[11px] px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded flex items-center gap-1.5 cursor-pointer transition-colors font-mono shadow-xs"
            title="Exporter la liste au format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>Enregistrer (Excel)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
            title="Exporter en fichier CSV"
          >
            <Download className="w-3 h-3 text-gray-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={onStartScan}
            className="text-[10px] px-2 py-1 bg-[#1A1C23] hover:bg-black text-white font-bold rounded flex items-center gap-1 cursor-pointer transition-colors font-mono shadow-xs"
            title="Scan 10.10.0.1 - 10.10.0.254"
          >
            <RefreshCw className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Scan IP</span>
          </button>

          {onResetDevices && (
            <button
              onClick={onResetDevices}
              className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors font-mono"
              title="Réinitialiser"
            >
              <RotateCcw className="w-3 h-3 text-blue-600" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          )}

          {onClearDevices && (
            <button
              onClick={onClearDevices}
              className="text-[10px] px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded flex items-center gap-1 cursor-pointer transition-colors font-mono"
              title="Vider"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
              <span className="hidden lg:inline">Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table with exact user columns matching image */}
      <div className="flex-1 overflow-auto font-mono">
        <table className="w-full border-collapse text-left min-w-[1200px]">
          <thead className="bg-[#1A1C23] text-white text-[10px] sticky top-0 uppercase tracking-wider font-bold">
            <tr className="divide-x divide-gray-700">
              <th className="px-2 py-2.5 text-center w-10">N°</th>
              <th className="px-3 py-2.5">NOM</th>
              <th className="px-3 py-2.5">Numero de serie</th>
              <th className="px-3 py-2.5">Marque / Modele</th>
              <th className="px-3 py-2.5">Processeur</th>
              <th className="px-3 py-2.5">Generation CPU</th>
              <th className="px-3 py-2.5 text-center">RAM (Go)</th>
              <th className="px-3 py-2.5">Disque</th>
              <th className="px-3 py-2.5 text-center">Architecture</th>
              <th className="px-3 py-2.5">Observation</th>
              <th className="px-3 py-2.5 text-center">Statut</th>
              <th className="px-3 py-2.5">Lieu</th>
              <th className="px-3 py-2.5">OS</th>
              <th className="px-3 py-2.5 text-center w-36">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[11px] divide-y divide-gray-200">
            {filteredDevices.map((dev, idx) => {
              const isCritical = dev.status === 'critical';
              const isWarning = dev.status === 'warning';

              return (
                <tr
                  key={dev.id}
                  className={`hover:bg-blue-50/70 transition-colors divide-x divide-gray-100 ${
                    isCritical ? 'bg-red-50/50' : isWarning ? 'bg-amber-50/40' : 'bg-white'
                  }`}
                >
                  {/* N° */}
                  <td className="px-2 py-2 text-center font-bold text-gray-500 bg-gray-50/50">
                    {idx + 1}
                  </td>

                  {/* NOM */}
                  <td className="px-3 py-2 font-bold text-gray-900 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-900 font-bold">{dev.name}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-gray-100 text-gray-600 rounded font-mono font-normal">
                        {dev.type}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono block font-normal">
                      {formatIpSubnet(dev.ip)}
                    </span>
                  </td>

                  {/* Numero de serie */}
                  <td className="px-3 py-2 font-mono text-[10px] text-amber-900 font-bold">
                    <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {dev.hardware?.serialNumber || 'SN-N/A'}
                    </span>
                  </td>

                  {/* Marque / Modele */}
                  <td className="px-3 py-2 text-gray-800 font-sans font-medium text-[11px]">
                    {dev.hardware?.brandModel || dev.type || 'Desktop PC'}
                  </td>

                  {/* Processeur */}
                  <td className="px-3 py-2 text-gray-700 text-[10px] truncate max-w-[150px]" title={dev.hardware?.cpu}>
                    {dev.hardware?.cpu || 'Intel Core i5'}
                  </td>

                  {/* Generation CPU */}
                  <td className="px-3 py-2 text-gray-800 text-[10px] text-center font-bold">
                    <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
                      {dev.hardware?.cpuGen || '12th Gen'}
                    </span>
                  </td>

                  {/* RAM (Go) */}
                  <td className="px-3 py-2 text-center font-bold text-indigo-900">
                    <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {dev.hardware?.ramGB || 16} Go
                    </span>
                  </td>

                  {/* Disque */}
                  <td className="px-3 py-2 text-gray-700 text-[10px] truncate max-w-[130px]" title={dev.hardware?.storage}>
                    {dev.hardware?.storage || '512GB SSD'}
                  </td>

                  {/* Architecture */}
                  <td className="px-3 py-2 text-center text-gray-600 text-[10px]">
                    {dev.software?.osArchitecture || '64-bit'}
                  </td>

                  {/* Observation */}
                  <td className="px-3 py-2 text-gray-600 text-[10px] font-sans truncate max-w-[160px]" title={dev.notes}>
                    {dev.notes || 'Aucune observation'}
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-2 text-center">
                    {dev.status === 'online' ? (
                      <span className="inline-flex items-center gap-1 text-green-800 font-bold bg-green-100 px-2 py-0.5 rounded text-[10px] border border-green-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                        En ligne
                      </span>
                    ) : dev.status === 'warning' ? (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px] border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        Avertissement
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-800 font-bold bg-red-100 px-2 py-0.5 rounded text-[10px] border border-red-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                        Hors ligne
                      </span>
                    )}
                  </td>

                  {/* Lieu */}
                  <td className="px-3 py-2 text-gray-700 text-[10px] font-sans">
                    {dev.location || 'Siège Principal'}
                  </td>

                  {/* OS */}
                  <td className="px-3 py-2 text-gray-800 text-[10px] truncate max-w-[130px]" title={dev.software?.osName}>
                    {dev.software?.osName || 'Windows 11 Pro'}
                  </td>

                  {/* Actions Buttons */}
                  <td className="px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onOpenDetails(dev)}
                        className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded cursor-pointer border border-blue-200"
                        title="Voir les détails complets"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRunDiagnostics(dev)}
                        className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer border border-emerald-200"
                        title="Ping / Prise en main à distance"
                      >
                        <Activity className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => (onEditDevice ? onEditDevice(dev) : onOpenConfig(dev))}
                        className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded cursor-pointer border border-gray-300"
                        title="Modifier la fiche PC"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteDevice && (
                        <button
                          onClick={() => setPendingDelete({ id: dev.id, name: dev.name, ip: dev.ip })}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded cursor-pointer border border-red-200"
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
                <td colSpan={14} className="text-center py-12 text-gray-400 italic">
                  Aucun PC ou équipement trouvé pour la recherche "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      {pendingDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPendingDelete(null)}>
          <div className="bg-white rounded-lg border border-gray-200 shadow-2xl p-5 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Confirmer la suppression</h3>
                <p className="text-xs text-gray-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-xs text-gray-700 mb-4">
              Supprimer <strong className="text-red-700">{pendingDelete.name}</strong> ({pendingDelete.ip}) de l'inventaire ?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPendingDelete(null)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer">
                Annuler
              </button>
              <button
                onClick={() => { onDeleteDevice?.(pendingDelete.id); setPendingDelete(null); }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats & Excel info */}
      <footer className="bg-[#F8F9FA] px-4 py-2 border-t border-[#DEE2E6] flex flex-wrap justify-between items-center shrink-0 text-[10px] text-gray-500 font-mono">
        <div>
          Affichage de <span className="font-bold text-gray-800">{filteredDevices.length}</span> sur{' '}
          <span className="font-bold text-gray-800">{safeDevices.length}</span> PCs / équipements
        </div>
        <div className="flex gap-4">
          <span>Format d'exportation: Microsoft Excel (.xlsx) / CSV</span>
          <span>Sous-réseau: 10.10.0.0/24</span>
        </div>
      </footer>
    </div>
  );
};
