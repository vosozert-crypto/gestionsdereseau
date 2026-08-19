import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { DeviceProvider, useDevices } from './contexts/DeviceContext.tsx';
import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SidebarNav } from './components/SidebarNav.tsx';
import { HeaderBar } from './components/HeaderBar.tsx';
import { NavSection, Language } from './types.ts';
import { AlertTriangle } from 'lucide-react';
import { api } from './services/api.ts';

const KpiDashboardView = lazy(() => import('./components/KpiDashboardView.tsx').then(m => ({ default: m.KpiDashboardView })));
const InventoryTableView = lazy(() => import('./components/InventoryTableView.tsx').then(m => ({ default: m.InventoryTableView })));
const TopologyView = lazy(() => import('./components/TopologyView.tsx').then(m => ({ default: m.TopologyView })));
const SecurityLogsView = lazy(() => import('./components/SecurityLogsView.tsx').then(m => ({ default: m.SecurityLogsView })));
const DeviceDetailModal = lazy(() => import('./components/DeviceDetailModal.tsx').then(m => ({ default: m.DeviceDetailModal })));
const AddDeviceModal = lazy(() => import('./components/AddDeviceModal.tsx').then(m => ({ default: m.AddDeviceModal })));
const EditDeviceModal = lazy(() => import('./components/EditDeviceModal.tsx').then(m => ({ default: m.EditDeviceModal })));
const IpScanModal = lazy(() => import('./components/IpScanModal.tsx').then(m => ({ default: m.IpScanModal })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <span className="text-xs text-gray-500 font-mono">Loading...</span>
      </div>
    </div>
  );
}

function MainApp() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [lang, setLang] = useState<Language>('fr');
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [ipScanModalOpen, setIpScanModalOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const { devices, logs, kpi, isLoading, fetchDevices, fetchLogs, fetchKpi, addDevice, updateDevice, deleteDevice, clearDevices } = useDevices();
  const { isConnected, liveMetrics, connect, subscribeToMetrics } = useWebSocket();
  const { logout } = useAuth();

  const [systemInfo, setSystemInfo] = useState<{ gateway: string; uptime: string }>({ gateway: '--', uptime: '--' });

  useEffect(() => {
    connect();
    subscribeToMetrics();
  }, [connect, subscribeToMetrics]);

  useEffect(() => {
    let mounted = true;
    const fetchLocalIp = async () => {
      try {
        const info = await api.getLocalIp();
        if (mounted) setSystemInfo({ gateway: info.localIp, uptime: info.subnet });
      } catch { /* keep defaults */ }
    };
    fetchLocalIp();
    const interval = setInterval(fetchLocalIp, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : prev === 'en' ? 'fr' : 'ar'));
  };

  const handleOpenDetails = (device: any) => {
    setSelectedDevice(device);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (device: any) => {
    setEditingDevice(device);
    setEditModalOpen(true);
  };

  const criticalCount = devices.filter((d: any) => d.status === 'critical').length;
  const cpuLoad = liveMetrics?.systemLoad?.cpu ?? 0;
  const memLoad = liveMetrics?.systemLoad?.memory ?? 0;
  const onlineCount = devices.filter((d: any) => d.status === 'online').length;
  const totalTx = devices.reduce((sum: number, d: any) => sum + (parseFloat(d.txRate) || 0), 0);
  const totalRx = devices.reduce((sum: number, d: any) => sum + (parseFloat(d.rxRate) || 0), 0);

  const inventoryProps = {
    devices,
    lang,
    onOpenDetails: handleOpenDetails,
    onRunDiagnostics: handleOpenDetails,
    onOpenConfig: handleOpenEdit,
    onEditDevice: handleOpenEdit,
    onDeleteDevice: deleteDevice,
    onAddDevice: () => setAddModalOpen(true),
    onClearDevices: clearDevices,
    onResetDevices: fetchDevices,
    onStartScan: () => setIpScanModalOpen(true),
    isScanning: false,
  };

  return (
    <div className="flex h-screen w-screen bg-[#0A0D14] text-[#C8CCD4] font-sans overflow-hidden">
      <SidebarNav
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        lang={lang}
        devices={devices}
        cpuLoad={cpuLoad}
        memLoad={memLoad}
        criticalCount={criticalCount}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <HeaderBar
          lang={lang}
          onToggleLang={handleToggleLang}
          criticalCount={criticalCount}
          trafficIn={totalRx}
          trafficOut={totalTx}
          isScanning={false}
          onStartScan={() => setIpScanModalOpen(true)}
          onOpenAddModal={() => setAddModalOpen(true)}
          onToggleAlerts={() => setAlertsOpen(p => !p)}
          alertsOpen={alertsOpen}
          gateway={systemInfo.gateway}
          uptime={systemInfo.uptime}
        />

        <div className="bg-[#0D1017] text-gray-500 px-4 py-1.5 border-b border-[#1A1F2E] flex flex-wrap items-center justify-between text-[10px] font-mono shrink-0">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-gray-600">STATUS:</span>
              <span className={`${isConnected ? 'text-emerald-400' : 'text-red-400'} font-bold`}>
                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-gray-600">ONLINE:</span>
              <span className="text-blue-400 font-bold">{onlineCount}/{devices.length}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5">
              <span className="text-gray-600">AVG LATENCY:</span>
              <span className="text-purple-400 font-bold">
                {devices.length > 0
                  ? (devices.reduce((s: number, d: any) => s + (d.latencyMs || 0), 0) / devices.filter((d: any) => d.status !== 'critical').length || 0).toFixed(1)
                  : '0.0'}ms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">CPU:</span>
              <span className="text-amber-400 font-bold">{cpuLoad}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">MEM:</span>
              <span className="text-cyan-400 font-bold">{memLoad}%</span>
            </div>
          </div>
        </div>

        {alertsOpen && (
          <div className="bg-red-950/50 border-b border-red-900/50 p-3 px-6 flex items-center justify-between text-xs text-red-400 shrink-0">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-mono">
                {devices.filter((d: any) => d.status === 'critical' || d.status === 'warning').map((d: any) => `${d.name} (${d.status})`).join(', ') || 'No active alerts'}
              </span>
            </div>
            <button onClick={() => setAlertsOpen(false)} className="text-red-500 hover:text-red-300 font-bold text-xs cursor-pointer">Close</button>
          </div>
        )}

        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          <Suspense fallback={<LoadingFallback />}>
            {activeSection === 'dashboard' && (
              <KpiDashboardView
                devices={devices}
                kpi={kpi}
                lang={lang}
                onSelectCategory={(cat) => {
                  if (cat === 'computer') setActiveSection('computers');
                  else if (cat === 'printer') setActiveSection('printers');
                  else if (cat === 'network') setActiveSection('network');
                  else if (cat === 'server') setActiveSection('servers');
                }}
                onOpenDetails={handleOpenDetails}
              />
            )}
            {activeSection === 'inventory' && <InventoryTableView {...inventoryProps} categoryFilter="ALL" />}
            {activeSection === 'computers' && <InventoryTableView {...inventoryProps} categoryFilter="computer" />}
            {activeSection === 'printers' && <InventoryTableView {...inventoryProps} categoryFilter="printer" />}
            {activeSection === 'network' && <InventoryTableView {...inventoryProps} categoryFilter="network" />}
            {activeSection === 'servers' && <InventoryTableView {...inventoryProps} categoryFilter="server" />}
            {activeSection === 'topology' && <TopologyView devices={devices} lang={lang} onOpenDetails={handleOpenDetails} />}
            {activeSection === 'security' && <SecurityLogsView logs={logs} lang={lang} />}
          </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        {detailModalOpen && (
          <DeviceDetailModal
            device={selectedDevice}
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            lang={lang}
          />
        )}
        {addModalOpen && (
          <AddDeviceModal
            isOpen={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onAdd={async (dev) => { await addDevice(dev as Record<string, unknown>); }}
            lang={lang}
            existingDevices={devices}
          />
        )}
        {editModalOpen && (
          <EditDeviceModal
            device={editingDevice}
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={async (dev) => { await updateDevice(dev.id, dev as unknown as Record<string, unknown>); }}
            onDelete={deleteDevice}
            lang={lang}
          />
        )}
        {ipScanModalOpen && (
          <IpScanModal
            isOpen={ipScanModalOpen}
            onClose={() => setIpScanModalOpen(false)}
            existingDevices={devices}
            onImportDiscoveredDevices={async (items) => {
              await api.importDevices(items as unknown as Record<string, unknown>[]);
              await fetchDevices();
            }}
            onAddLog={(msg) => {}}
            lang={lang}
          />
        )}
      </Suspense>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <DeviceProvider>
            <WebSocketProvider>
              <MainApp />
            </WebSocketProvider>
          </DeviceProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111520',
              color: '#C8CCD4',
              border: '1px solid #1E2536',
              fontSize: '13px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
