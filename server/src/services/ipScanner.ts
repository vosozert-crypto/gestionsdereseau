import { exec, execSync } from 'child_process';
import { Socket } from 'net';
import { getDb } from '../db/index.js';
import { config } from '../config/index.js';
import { wmiClient } from './wmiClient.js';
import { Server as SocketServer } from 'socket.io';

export interface ScanResult {
  ip: string;
  hostname: string;
  mac: string;
  status: 'online' | 'offline' | 'timeout' | 'wmi_detected';
  latencyMs: number;
  openPorts: number[];
  osGuess: string;
  isRegistered: boolean;
  matchedDeviceId?: string;
  matchedDeviceName?: string;
}

export interface ScanProgress {
  currentIp: string;
  scanned: number;
  total: number;
  discovered: number;
  percent: number;
}

let activeScan = false;

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function intToIp(int: number): string {
  return `${(int >>> 24) & 255}.${(int >>> 16) & 255}.${(int >>> 8) & 255}.${int & 255}`;
}

function pingHost(ip: string): Promise<{ reachable: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `ping -n 1 -w 1000 ${ip}`
      : `ping -c 1 -W 1 ${ip}`;

    const start = Date.now();
    exec(cmd, { timeout: 2000 }, (error: any) => {
      const latency = Date.now() - start;
      resolve({
        reachable: !error,
        latencyMs: error ? 0 : latency,
      });
    });
  });
}

function resolveHostname(ip: string): Promise<string> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `nslookup ${ip}`
      : `host ${ip}`;

    exec(cmd, { timeout: 2000 }, (error: any, stdout: string) => {
      if (error) {
        resolve('');
        return;
      }

      let hostname = '';
      if (isWindows) {
        const match = stdout.match(/Name:\s+(.+)/i);
        if (match) hostname = match[1].trim();
      } else {
        const match = stdout.match(/domain name pointer\s+(.+)/i);
        if (match) hostname = match[1].trim().replace(/\.$/, '');
      }
      resolve(hostname);
    });
  });
}

function getArpTable(): Map<string, string> {
  const arpTable = new Map<string, string>();

  try {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'arp -a' : 'arp -an';

    const output = execSync(cmd, { timeout: 5000, encoding: 'utf-8' });
    const lines = output.split('\n');

    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (isWindows) {
        if (parts.length >= 3 && parts[0].includes('.')) {
          const ip = parts[0];
          const mac = parts[1].replace(/-/g, ':');
          if (ip && mac && mac !== 'ff:ff:ff:ff:ff:ff') {
            arpTable.set(ip, mac);
          }
        }
      } else {
        const match = line.match(/\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-f:]+)/i);
        if (match) {
          arpTable.set(match[1], match[2]);
        }
      }
    }
  } catch {
    // ARP table not available
  }

  return arpTable;
}

function detectWmiPort(ip: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    let resolved = false;

    socket.setTimeout(1000);

    socket.on('connect', () => {
      if (!resolved) { resolved = true; socket.destroy(); resolve(true); }
    });

    socket.on('timeout', () => {
      if (!resolved) { resolved = true; socket.destroy(); resolve(false); }
    });

    socket.on('error', () => {
      if (!resolved) { resolved = true; resolve(false); }
    });

    socket.connect(135, ip);
  });
}

export async function scanSubnet(
  subnet: string,
  startIp: number = 1,
  endIp: number = 254,
  io?: SocketServer,
  scanId?: string
): Promise<ScanResult[]> {
  if (activeScan) {
    throw new Error('A scan is already in progress');
  }

  activeScan = true;
  const results: ScanResult[] = [];
  const total = endIp - startIp + 1;
  let scanned = 0;
  let discovered = 0;

  const arpTable = getArpTable();

  const db = getDb();
  const existingDevices = db.prepare('SELECT id, name, ip FROM devices').all() as Array<{
    id: string; name: string; ip: string;
  }>;

  const existingIps = new Map<string, { id: string; name: string }>();
  for (const d of existingDevices) {
    const cleanIp = d.ip.replace(/\/\d+$/, '');
    existingIps.set(cleanIp, { id: d.id, name: d.name });
  }

  const subnetBase = subnet.replace(/\.0$/, '');

  try {
    const batchSize = 10;
    for (let i = startIp; i <= endIp; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, endIp + 1); j++) {
        batch.push(j);
      }

      const batchResults = await Promise.all(
        batch.map(async (octet) => {
          const ip = `${subnetBase}.${octet}`;
          const { reachable, latencyMs } = await pingHost(ip);

          if (!reachable) {
            scanned++;
            return null;
          }

          const hostname = await resolveHostname(ip);
          const mac = arpTable.get(ip) || '';
          const wmiDetected = await detectWmiPort(ip);
          const existing = existingIps.get(ip);

          scanned++;
          discovered++;

          const result: ScanResult = {
            ip,
            hostname: hostname || `HOST-${octet}`,
            mac,
            status: wmiDetected ? 'wmi_detected' : 'online',
            latencyMs,
            openPorts: wmiDetected ? [135] : [],
            osGuess: wmiDetected ? 'Windows (WMI)' : 'Unknown',
            isRegistered: !!existing,
            matchedDeviceId: existing?.id,
            matchedDeviceName: existing?.name,
          };

          if (io && scanId) {
            const progress: ScanProgress = {
              currentIp: ip,
              scanned,
              total,
              discovered,
              percent: Math.round((scanned / total) * 100),
            };
            io.to(`scan:${scanId}`).emit('scan:progress', progress);
          }

          return result;
        })
      );

      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }
  } finally {
    activeScan = false;
  }

  return results;
}

export function isScanActive(): boolean {
  return activeScan;
}

export function createDiscoveryDevice(result: ScanResult) {
  return {
    name: result.hostname || `SCANNED-${result.ip.split('.').pop()}`,
    category: 'computer' as const,
    type: 'Desktop PC' as const,
    ip: `${result.ip}/24`,
    mac: result.mac || '00:00:00:00:00:00',
    vlan: 20,
    department: 'Discovered Subnet',
    assignedUser: 'Discovered Host',
    location: `Scan: ${result.ip}`,
    notes: `Discovered via subnet scan. ${result.osGuess ? 'OS: ' + result.osGuess : ''}`,
    hardware: {
      cpu: 'Unknown',
      cpuCores: 0,
      ramGB: 0,
      ramType: 'Unknown',
      storage: 'Unknown',
      serialNumber: `SCAN-${Date.now()}`,
      macAddress: result.mac || '00:00:00:00:00:00',
    },
    software: {
      osName: result.osGuess || 'Unknown OS',
      osArchitecture: '64-bit',
      installedApps: [],
    },
  };
}
