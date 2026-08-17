import { config } from '../config/index.js';

interface WmiHardwareInfo {
  cpuName: string;
  cpuCores: number;
  cpuUsage: number;
  ramTotalGB: number;
  ramUsedGB: number;
  gpuName: string;
  storageTotal: string;
  storageUsedPercent: number;
  serialNumber: string;
  macAddress: string;
}

interface WmiSoftwareInfo {
  osName: string;
  osArchitecture: string;
  kernelVersion: string;
  installedApps: Array<{
    name: string;
    version: string;
    publisher: string;
    installDate: string;
    licenseStatus: string;
  }>;
  antivirusStatus: string;
  firewallEnabled: boolean;
  lastPatchDate: string;
}

interface WmiNetworkInfo {
  adapters: Array<{
    name: string;
    macAddress: string;
    ipAddresses: string[];
    subnetMask: string;
    gateway: string;
    dhcpEnabled: boolean;
    dnsServers: string[];
  }>;
}

interface WmiPingResult {
  reachable: boolean;
  latencyMs: number;
  ttl: number;
}

export class WmiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.wmiAgent.url;
    this.timeout = config.wmiAgent.timeout;
  }

  private async request<T>(endpoint: string, targetIp?: string): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const url = targetIp
        ? `${this.baseUrl}/api/wmi/${endpoint}?target=${targetIp}`
        : `${this.baseUrl}/api/wmi/${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`WMI agent error: ${response.status} ${response.statusText}`);
        return null;
      }

      return await response.json() as T;
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.error(`WMI request timeout: ${endpoint}`);
      } else {
        console.error(`WMI request failed: ${endpoint}`, err);
      }
      return null;
    }
  }

  async getHardwareInfo(targetIp?: string): Promise<WmiHardwareInfo | null> {
    return this.request<WmiHardwareInfo>('hardware', targetIp);
  }

  async getSoftwareInfo(targetIp?: string): Promise<WmiSoftwareInfo | null> {
    return this.request<WmiSoftwareInfo>('software', targetIp);
  }

  async getNetworkInfo(targetIp?: string): Promise<WmiNetworkInfo | null> {
    return this.request<WmiNetworkInfo>('network', targetIp);
  }

  async pingHost(targetIp: string): Promise<WmiPingResult | null> {
    return this.request<WmiPingResult>('ping', targetIp);
  }

  async discoverWindowsHosts(subnet: string, startIp: number, endIp: number): Promise<string[]> {
    const results = await this.request<string[]>(`discover?subnet=${subnet}&start=${startIp}&end=${endIp}`);
    return results || [];
  }

  async isAgentAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async enrichDeviceInfo(deviceIp: string): Promise<{
    hardware: Partial<WmiHardwareInfo>;
    software: Partial<WmiSoftwareInfo>;
  } | null> {
    const [hardware, software] = await Promise.all([
      this.getHardwareInfo(deviceIp),
      this.getSoftwareInfo(deviceIp),
    ]);

    if (!hardware && !software) return null;

    return {
      hardware: hardware || {},
      software: software || {},
    };
  }
}

export const wmiClient = new WmiClient();
