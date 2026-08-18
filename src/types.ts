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
  brandModel?: string; // e.g. "Dell OptiPlex 7090" / "HP EliteBook 840 G8"
  cpu: string;
  cpuGen?: string; // e.g. "11th Gen" / "12th Gen" / "M1 Pro"
  cpuCores: number;
  ramGB: number;
  ramType: string;
  storage: string; // e.g. "512GB NVMe SSD"
  diskUsagePercent?: number;
  gpu?: string;
  motherboard?: string;
  serialNumber: string;
  powerSupply?: string;
  macAddress: string;
  portsCount?: number;
}

export interface SoftwareSpecs {
  osName: string; // e.g. "Windows 11 Pro 23H2" or "Ubuntu 22.04 LTS" or "Cisco IOS-XE 17.6"
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

export type NavSection = 'dashboard' | 'inventory' | 'computers' | 'printers' | 'network' | 'servers' | 'topology' | 'security';

export type Language = 'ar' | 'en' | 'fr';
