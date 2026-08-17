import { getDb } from '../db/index.js';
import { config } from '../config/index.js';

interface SnmpDevice {
  id: string;
  ip: string;
  name: string;
}

interface SnmpMetrics {
  sysUpTime: number;
  cpuLoad: number;
  memUsed: number;
  memTotal: number;
  ifInOctets: number;
  ifOutOctets: number;
  ifOperStatus: number;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

function getPollableDevices(): SnmpDevice[] {
  const db = getDb();
  const devices = db.prepare(
    "SELECT id, ip, name FROM devices WHERE status != 'critical' AND category IN ('network', 'server')"
  ).all() as SnmpDevice[];
  return devices;
}

async function querySnmpDevice(device: SnmpDevice): Promise<SnmpMetrics | null> {
  const ip = device.ip.replace(/\/\d+$/, '');

  try {
    if (config.snmp.version === 2) {
      return await querySnmpV2c(ip, config.snmp.community);
    }
    return await querySnmpV1(ip, config.snmp.community);
  } catch {
    return null;
  }
}

async function querySnmpV1(ip: string, community: string): Promise<SnmpMetrics> {
  const snmp = await importNetSnmp();
  return performWalk(snmp, ip, community, '2c');
}

async function querySnmpV2c(ip: string, community: string): Promise<SnmpMetrics> {
  const snmp = await importNetSnmp();
  return performWalk(snmp, ip, community, '2c');
}

async function importNetSnmp() {
  try {
    const snmp = await import('net-snmp' as string);
    return snmp;
  } catch {
    throw new Error('net-snmp module not available - install with: npm install net-snmp @types/net-snmp');
  }
}

function performWalk(snmp: any, ip: string, community: string, version: string): Promise<SnmpMetrics> {
  return new Promise((resolve, reject) => {
    const session = snmp.createSession(ip, community, { version: snmp.Version2c });
    const oidMap: Record<string, string> = {};
    const oids = [
      '1.3.6.1.2.1.1.3.0',
      '1.3.6.1.2.1.25.1.1.0',
      '1.3.6.1.2.1.25.2.2.0',
      '1.3.6.1.2.1.25.2.3.0',
    ];

    let completed = 0;
    const timeout = setTimeout(() => {
      session.close();
      reject(new Error('SNMP timeout'));
    }, 5000);

    oids.forEach(oid => {
      session.get([oid], (error: Error | null, varbinds: any[]) => {
        completed++;
        if (!error && varbinds?.[0]) {
          oidMap[oid] = varbinds[0].value?.toString() || '0';
        }
        if (completed >= oids.length) {
          clearTimeout(timeout);
          session.close();
          resolve({
            sysUpTime: parseInt(oidMap['1.3.6.1.2.1.1.3.0'] || '0', 10),
            cpuLoad: 0,
            memUsed: 0,
            memTotal: parseInt(oidMap['1.3.6.1.2.1.25.2.2.0'] || '0', 10),
            ifInOctets: 0,
            ifOutOctets: 0,
            ifOperStatus: 1,
          });
        }
      });
    });
  });
}

function updateDeviceMetrics(deviceId: string, metrics: SnmpMetrics): void {
  const db = getDb();

  const uptimeStr = formatUptime(metrics.sysUpTime);
  db.prepare(
    "UPDATE devices SET uptime = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(uptimeStr, deviceId);

  db.prepare(
    'INSERT INTO device_metrics (device_id, cpu_usage, mem_usage, latency_ms) VALUES (?, ?, ?, ?)'
  ).run(deviceId, metrics.cpuLoad, metrics.memUsed, 0);
}

function formatUptime(ticks: number): string {
  const seconds = Math.floor(ticks / 100);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

export async function pollAllDevices(): Promise<{ polled: number; failed: number }> {
  const devices = getPollableDevices();
  let polled = 0;
  let failed = 0;

  for (const device of devices) {
    const metrics = await querySnmpDevice(device);
    if (metrics) {
      updateDeviceMetrics(device.id, metrics);
      polled++;
    } else {
      failed++;
    }
  }

  return { polled, failed };
}

export function startPolling(): void {
  if (pollInterval) return;

  console.log(`SNMP polling started (interval: ${config.snmp.pollInterval}ms)`);
  pollInterval = setInterval(async () => {
    try {
      const result = await pollAllDevices();
      console.log(`SNMP poll: ${result.polled} OK, ${result.failed} failed`);
    } catch (err) {
      console.error('SNMP poll cycle error:', err);
    }
  }, config.snmp.pollInterval);
}

export function stopPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log('SNMP polling stopped');
  }
}
