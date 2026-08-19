export type DeviceStatus = 'online' | 'warning' | 'critical' | 'offline';

export type DeviceCategory = 'computer' | 'printer' | 'network' | 'server' | 'iot';

export type DeviceType =
  | 'Desktop PC'
  | 'Laptop'
  | 'Workstation'
  | 'Rack Server'
  | 'NAS Storage'
  | 'Core Switch'
  | 'Access Switch'
  | 'Firewall'
  | 'Router'
  | 'Modem'
  | 'Laser Printer'
  | 'Multifunction Printer'
  | 'IP Camera'
  | 'VoIP Phone';

export interface InstalledApp {
  name: string;
  version: string;
  publisher: string;
  installDate: string;
  licenseStatus: 'Licensed' | 'Freeware' | 'Open Source' | 'Trial' | 'Subscription' | 'Outdated';
}

export interface HardwareSpecs {
  brandModel?: string;
  cpu: string;
  cpuGen?: string;
  cpuCores: number;
  ramGB: number;
  ramType: string;
  storage: string;
  diskUsagePercent?: number;
  gpu?: string;
  motherboard?: string;
  serialNumber: string;
  powerSupply?: string;
  macAddress: string;
  portsCount?: number;
}

export interface SoftwareSpecs {
  osName: string;
  osArchitecture?: '64-bit' | '32-bit' | 'ARM64';
  kernelVersion?: string;
  firmwareVersion?: string;
  installedApps: InstalledApp[];
  antivirusStatus?: 'Active & Updated' | 'Outdated' | 'Disabled' | 'N/A';
  firewallEnabled?: boolean;
  lastPatchDate?: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  category: DeviceCategory;
  type: DeviceType;
  ip: string;
  mac: string;
  vlan: number;
  status: DeviceStatus;
  uptime: string;
  latencyMs: number;
  txRate: string;
  rxRate: string;
  department: string;
  assignedUser?: string;
  location: string;
  notes?: string;
  hardware: HardwareSpecs;
  software: SoftwareSpecs;
  lastSeen: string;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  sourceIp: string;
  message: string;
  messageAr: string;
  protocol: string;
}

export interface DashboardKpi {
  totalDevices: number;
  onlineCount: number;
  warningCount: number;
  criticalCount: number;
  offlineCount: number;
  totalRamGB: number;
  avgLatencyMs: number;
  healthPercent: number;
  categories: Array<{ name: string; total: number; online: number }>;
  criticalDevices: Array<{
    id: string;
    name: string;
    status: string;
    ip: string;
    location: string;
    department: string;
  }>;
  osDistribution: Array<{ name: string; count: number }>;
  security: {
    antivirus: Array<{ status: string; count: number }>;
    firewallEnabled: number;
    firewallTotal: number;
    firewallPercent: number;
  };
}

export interface LocalIpInfo {
  localIp: string;
  subnet: string;
  netmask: string;
  interfaceName: string;
  mac: string;
  allInterfaces: Array<{
    name: string;
    address: string;
    netmask: string;
    family: string;
    mac: string;
  }>;
}

export interface ScanResult {
  ip: string;
  mac: string;
  hostname: string;
  reachable: boolean;
  latencyMs: number;
  vendor: string;
}

export interface ScanResponse {
  subnet: string;
  totalScanned: number;
  hostsFound: number;
  results: ScanResult[];
}

export interface UsbPrinter {
  name: string;
  port: string;
  driver: string;
  isUSB: boolean;
  status: string;
}

export interface PingResult {
  output: string[];
  reachable: boolean;
  latencyMs: number;
  targetIp: string;
  packetsSent: number;
  packetsReceived: number;
  packetLoss: string;
}

export type NavSection = 'dashboard' | 'inventory' | 'computers' | 'printers' | 'network' | 'servers' | 'topology' | 'security';

export type Language = 'ar' | 'en' | 'fr';
