import express from 'express';
import path from 'path';
import { createServer } from 'http';
import os from 'os';
import { execSync, exec } from 'child_process';
import fs from 'fs';

declare const __dirname: string;
const appRoot = typeof __dirname !== 'undefined' ? __dirname : path.dirname(new URL(import.meta.url).pathname);
const app = express();
const httpServer = createServer(app);
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(express.json({ limit: '10mb' }));

// ─── API: Local IP Detection ───────────────────────────────────────
app.get('/api/network/local-ip', (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const results: Array<{ name: string; address: string; netmask: string; family: string; mac: string }> = [];

    for (const [name, nets] of Object.entries(interfaces)) {
      if (!nets) continue;
      for (const net of nets) {
        if (!net.internal && net.family === 'IPv4') {
          results.push({ name, address: net.address, netmask: net.netmask, family: net.family, mac: net.mac });
        }
      }
    }

    const primary = results[0] || { address: '127.0.0.1', netmask: '255.255.255.0', name: 'lo', mac: '00:00:00:00:00:00' };
    const subnet = primary.address.split('.').slice(0, 3).join('.');

    res.json({
      localIp: primary.address,
      subnet: `${subnet}.0`,
      netmask: primary.netmask,
      interfaceName: primary.name,
      mac: primary.mac,
      allInterfaces: results,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to detect local IP', details: (err as Error).message });
  }
});

// ─── API: ARP/ICMP Network Scan ────────────────────────────────────
let scanRunning = false;

app.get('/api/network/scan/status', (_req, res) => {
  res.json({ active: scanRunning });
});

app.post('/api/network/scan', async (req, res) => {
  if (scanRunning) {
    res.status(409).json({ error: 'A scan is already in progress' });
    return;
  }

  const { subnet = '10.10.0.0', startIp = 1, endIp = 254 } = req.body || {};
  scanRunning = true;

  const results: Array<{
    ip: string;
    mac: string;
    hostname: string;
    reachable: boolean;
    latencyMs: number;
    vendor: string;
  }> = [];

  try {
    const isWindows = process.platform === 'win32';
    const arpTable: Record<string, string> = {};

    try {
      const arpOutput = execSync('arp -a', { timeout: 10000, encoding: 'utf-8' });
      for (const line of arpOutput.split('\n')) {
        const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([\w-]{17}|[\w:]{17})/);
        if (match) {
          arpTable[match[1]] = match[2].replace(/-/g, ':').toUpperCase();
        }
      }
    } catch { /* ARP not available */ }

    const batchSize = 20;
    for (let i = startIp; i <= endIp; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, endIp + 1); j++) batch.push(j);

      const batchPromises = batch.map((octet) => {
        return new Promise<void>((resolve) => {
          const ip = `${subnet}.${octet}`;
          const cmd = isWindows ? `ping -n 1 -w 1000 ${ip}` : `ping -c 1 -W 1 ${ip}`;
          const start = Date.now();

          exec(cmd, { timeout: 3000 }, (execError, stdout) => {
            const latency = Date.now() - start;
            const reachable = !execError || /Reply from|bytes=|ttl=/i.test(stdout);
            const mac = arpTable[ip] || 'N/A';

            if (reachable || mac !== 'N/A') {
              let hostname = '';
              try {
                hostname = execSync(`nslookup ${ip}`, { timeout: 2000, encoding: 'utf-8' })
                  .split('\n').find(l => l.includes('Name:'))?.split(':')[1]?.trim() || '';
              } catch { /* ignore */ }

              results.push({ ip, mac, hostname, reachable, latencyMs: reachable ? latency : 0, vendor: getVendorFromMac(mac) });
            }
            resolve();
          });
        });
      });
      await Promise.all(batchPromises);
    }

    scanRunning = false;
    res.json({
      subnet,
      totalScanned: endIp - startIp + 1,
      hostsFound: results.length,
      results: results.sort((a, b) => parseInt(a.ip.split('.').pop() || '0') - parseInt(b.ip.split('.').pop() || '0')),
    });
  } catch (err) {
    scanRunning = false;
    res.status(500).json({ error: 'Scan failed', details: (err as Error).message });
  }
});

// ─── API: USB Printer Detection ────────────────────────────────────
app.get('/api/usb/printers', (_req, res) => {
  try {
    const isWindows = process.platform === 'win32';
    const printers: Array<{ name: string; port: string; driver: string; isUSB: boolean; status: string }> = [];

    if (isWindows) {
      try {
        const psOutput = execSync(
          `powershell -Command "Get-Printer | Select-Object Name, PortName, DriverName, PrinterStatus | ConvertTo-Json"`,
          { timeout: 10000, encoding: 'utf-8', windowsHide: true }
        );
        const parsed = JSON.parse(psOutput);
        const printerList = Array.isArray(parsed) ? parsed : [parsed];
        for (const p of printerList) {
          if (p.Name) {
            printers.push({
              name: p.Name,
              port: p.PortName || '',
              driver: p.DriverName || '',
              isUSB: (p.PortName || '').toLowerCase().includes('usb'),
              status: mapPrinterStatus(String(p.PrinterStatus || 0)),
            });
          }
        }
      } catch {
        try {
          const wmicOutput = execSync(
            'wmic printer get Name,PortName,DriverName,PrinterStatus /format:csv',
            { timeout: 10000, encoding: 'utf-8', windowsHide: true }
          );
          for (const line of wmicOutput.split('\n').filter(l => l.trim() && !l.startsWith('Node'))) {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 5) {
              const name = parts[4] || parts[1] || '';
              if (name && !name.startsWith('Name')) {
                printers.push({
                  name,
                  port: parts[3] || '',
                  driver: parts[2] || '',
                  isUSB: (parts[3] || '').toLowerCase().includes('usb'),
                  status: mapPrinterStatus(parts[1] || ''),
                });
              }
            }
          }
        } catch { /* both methods failed */ }
      }
    } else {
      try {
        const lpOutput = execSync('lpstat -p -d 2>/dev/null || true', { timeout: 5000, encoding: 'utf-8' });
        for (const line of lpOutput.split('\n')) {
          const match = line.match(/^printer\s+(\S+)\s+is\s+(.+)$/);
          if (match) {
            printers.push({ name: match[1], port: 'unknown', driver: match[2], isUSB: false, status: 'idle' });
          }
        }
      } catch { /* lpstat not available */ }
    }

    res.json({ count: printers.length, usbPrinters: printers.filter(p => p.isUSB), allPrinters: printers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to detect printers', details: (err as Error).message });
  }
});

// ─── API: System Info ──────────────────────────────────────────────
app.get('/api/system', (_req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    let gateway = '127.0.0.1';
    try {
      if (process.platform === 'win32') {
        const output = execSync('ipconfig', { encoding: 'utf-8', timeout: 5000 });
        for (const line of output.split('\n')) {
          if (line.includes('Passerelle par défaut') || line.includes('Default Gateway')) {
            const match = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
            if (match && match[1] !== '0.0.0.0') { gateway = match[1]; break; }
          }
        }
      } else {
        const output = execSync('ip route show default', { encoding: 'utf-8', timeout: 5000 });
        const match = output.match(/default via (\d+\.\d+\.\d+\.\d+)/);
        if (match && match[1]) gateway = match[1];
      }
    } catch { /* use default */ }

    const totalSeconds = os.uptime();
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const uptime = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    res.json({
      gateway,
      uptime,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Unknown',
      loadAverage: {
        '1m': Math.round(loadAvg[0] * 100) / 100,
        '5m': Math.round(loadAvg[1] * 100) / 100,
        '15m': Math.round(loadAvg[2] * 100) / 100,
      },
      memory: {
        totalGB: Math.round((totalMem / 1073741824) * 100) / 100,
        freeGB: Math.round((freeMem / 1073741824) * 100) / 100,
        usedPercent: totalMem > 0 ? Math.round(((totalMem - freeMem) / totalMem) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get system info' });
  }
});

// ─── API: Diagnostics / Ping ───────────────────────────────────────
app.post('/api/diagnostics/ping', (req, res) => {
  const { ip, count = 4 } = req.body;
  if (!ip) {
    res.status(400).json({ error: 'IP address is required' });
    return;
  }

  const cleanIp = ip.split('/')[0];
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? `ping -n ${count} -w 1000 ${cleanIp}` : `ping -c ${count} -W 1 ${cleanIp}`;

  exec(cmd, { timeout: 15000 }, (error, stdout) => {
    const lines = stdout.split('\n').filter(l => l.trim());
    const reachable = !error || /Reply from|bytes=|ttl=/i.test(stdout);
    const latencyMatch = stdout.match(/Average\s*=\s*(\d+\.?\d*)/i) || stdout.match(/avg\s*[=\/]\s*(\d+\.?\d*)/i);
    const avgLatency = latencyMatch ? parseFloat(latencyMatch[1]) : 0;

    res.json({
      output: lines,
      reachable,
      latencyMs: avgLatency,
      targetIp: cleanIp,
      packetsSent: count,
      packetsReceived: reachable ? count : 0,
      packetLoss: reachable ? '0%' : '100%',
    });
  });
});

// ─── Helper Functions ──────────────────────────────────────────────
function getVendorFromMac(mac: string): string {
  const prefix = mac.replace(/[:\-]/g, '').substring(0, 6).toUpperCase();
  const vendors: Record<string, string> = {
    '001E58': 'Dell', '0026BB': 'Apple', '005056': 'VMware', '000C29': 'VMware',
    '001C42': 'Parallels', '080027': 'Oracle VirtualBox',
    '3C22FB': 'Apple', '406C8F': 'Apple', '542696': 'Apple', '7831C1': 'Apple',
    'A483E7': 'Apple', 'DC5427': 'Apple', 'F01898': 'Apple', 'B8E856': 'Apple',
    '00155D': 'Microsoft', '001DD8': 'Microsoft', '7C1E52': 'Microsoft', '000D3A': 'Microsoft',
    'F8BC12': 'Dell', '1866DA': 'Dell', 'D4AE52': 'Dell', 'B083FE': 'Dell',
    'F8DB88': 'Dell', '0024E8': 'Dell',
    '30D042': 'HP', '10604B': 'HP', '18A905': 'HP', '2C4138': 'HP',
    '3863BB': 'HP', '645106': 'HP', '9457A5': 'HP', 'A0D3C1': 'HP',
    'B439D6': 'HP', 'C8CBB8': 'HP', 'D8D385': 'HP', 'E4115D': 'HP', 'F43909': 'HP',
    '0025B3': 'Intel', '001B21': 'Intel', '6805CA': 'Intel', 'A4BF01': 'Intel',
    '303A64': 'Cisco', '001B53': 'Cisco', '00260B': 'Cisco', '58971E': 'Cisco',
    '64F69D': 'Cisco', 'C80084': 'Cisco', '0024D7': 'Cisco', '4403A7': 'Cisco',
    '885A92': 'Cisco', '00E0F7': 'Cisco', 'FC5B39': 'Cisco', '3CCE73': 'Cisco',
    '000E38': 'Cisco', '001794': 'Cisco', 'ACF2C5': 'Cisco', 'B0AA77': 'Cisco',
    'D4D748': 'Cisco', '9C32CE': 'Cisco', '002155': 'Cisco', '54781A': 'Cisco',
    '00146A': 'Cisco', '1CC1DE': 'Cisco', '44DAD3': 'Cisco', '64F81C': 'Cisco',
    '001873': 'Cisco', '0050F2': 'Cisco', 'D021F9': 'Cisco', 'D072DC': 'Cisco',
    'E02F6D': 'Cisco', 'E4AA5D': 'Cisco', 'F02929': 'Cisco', 'F44E05': 'Cisco',
    '001B2F': 'Netgear', '0024B2': 'Netgear', '20E52A': 'Netgear', '28C68E': 'Netgear',
    '30469A': 'Netgear', '4494FC': 'Netgear', '4C60DE': 'Netgear', '504A6E': 'Netgear',
    '5C3A45': 'Netgear', '6C5AB0': 'Netgear', '744401': 'Netgear', '841B5E': 'Netgear',
    '8C3BAD': 'Netgear', '9C3DCF': 'Netgear', 'A021B7': 'Netgear', 'A42B8C': 'Netgear',
    'B07F9B': 'Netgear', 'C03F0E': 'Netgear', 'C0FFD4': 'Netgear', 'CC40D0': 'Netgear',
    'E0469A': 'Netgear', 'E091F5': 'Netgear', 'E4F4C6': 'Netgear', 'E8FC60': 'Netgear',
    'F0217D': 'Netgear', 'F4EC38': 'Netgear', 'FCA13E': 'Netgear',
    '000E8F': 'Zyxel', '001F9E': 'Zyxel', '0026F2': 'Zyxel', '107BEF': 'Zyxel',
    '1CF841': 'Zyxel', '2CF418': 'Zyxel', '303926': 'Zyxel', '38F83D': 'Zyxel',
    '40F4EC': 'Zyxel', '44A92C': 'Zyxel', '506028': 'Zyxel', '587E61': 'Zyxel',
    '6038E0': 'Zyxel', '6C8336': 'Zyxel', '788DF7': 'Zyxel', '80C5F6': 'Zyxel',
    '84A8E4': 'Zyxel', '88DC96': 'Zyxel', '8CB84C': 'Zyxel', '90EF68': 'Zyxel',
    '94F720': 'Zyxel', '981333': 'Zyxel', 'A0861D': 'Zyxel', 'A4933F': 'Zyxel',
    'A83E0E': 'Zyxel', 'ACB8F9': 'Zyxel', 'B40427': 'Zyxel', 'B88D12': 'Zyxel',
    'BCA920': 'Zyxel', 'C025E9': 'Zyxel', 'C47154': 'Zyxel', 'C81FEA': 'Zyxel',
    'CC5D4D': 'Zyxel', 'D0817A': 'Zyxel', 'D42CB2': 'Zyxel', 'D87382': 'Zyxel',
    'E4388C': 'Zyxel', 'E894F6': 'Zyxel', 'F09FC6': 'Zyxel', 'F40270': 'Zyxel',
    'F81547': 'Zyxel', 'FC51A4': 'Zyxel',
  };
  return vendors[prefix] || 'Unknown Vendor';
}

function mapPrinterStatus(status: string): string {
  const map: Record<string, string> = {
    '0': 'idle', '1': 'printing', '2': 'error', '3': 'pending deletion',
    '4': 'paper jam', '5': 'paper out', '6': 'manual feed', '7': 'paper problem', '8': 'offline',
  };
  return map[status] || status.toLowerCase();
}

// ─── Serve Frontend ────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';
const distPath = path.resolve(appRoot, 'dist');

if (isProduction && fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '30d', etag: true, lastModified: true }));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Start Server ──────────────────────────────────────────────────
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Gestion_AWEM_Parc - Gestion du Parc Informatique`);
  console.log(`  Server running on http://0.0.0.0:${PORT}`);
  if (!isProduction) {
    console.log(`  Frontend dev server with HMR enabled`);
  } else {
    console.log(`  Serving static frontend from dist/`);
  }
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  httpServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  httpServer.close();
  process.exit(0);
});
