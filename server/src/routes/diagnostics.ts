import { Router } from 'express';
import { exec } from 'child_process';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function pingHost(ip: string, count: number = 4): Promise<{ output: string[]; reachable: boolean; latencyMs: number }> {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const cmd = isWindows
      ? `ping -n ${count} -w 1000 ${ip}`
      : `ping -c ${count} -W 1 ${ip}`;

    const output: string[] = [];
    const start = Date.now();

    const child = exec(cmd, { timeout: 10000 }, (error, stdout) => {
      const latency = Date.now() - start;
      const lines = stdout.split('\n').filter(l => l.trim());
      output.push(...lines);

      if (error && !stdout) {
        output.push(`Ping to ${ip} failed: host unreachable`);
        resolve({ output, reachable: false, latencyMs: 0 });
      } else {
        const reachable = !error || output.some(l => /Reply from|bytes=|ttl=/i.test(l));
        const latencyMatch = stdout.match(/time[=<](\d+\.?\d*)/i);
        const avgLatency = latencyMatch ? parseFloat(latencyMatch[1]) : latency / count;
        resolve({ output, reachable, latencyMs: Math.round(avgLatency * 10) / 10 });
      }
    });

    child.on('error', () => {
      resolve({ output: [`Ping command failed for ${ip}`], reachable: false, latencyMs: 0 });
    });
  });
}

router.post('/ping', async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      res.status(400).json({ error: 'IP address is required' });
      return;
    }

    const cleanIp = ip.split('/')[0];
    const result = await pingHost(cleanIp, 4);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Ping failed', details: (err as Error).message });
  }
});

export default router;
