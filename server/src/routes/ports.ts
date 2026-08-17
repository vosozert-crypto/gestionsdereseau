import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

interface PortInfo {
  number: number;
  status: 'active' | 'poe' | 'critical' | 'inactive';
  speed: string;
  vlan: number;
  poeWatts: number;
  rxBytes: number;
  txBytes: number;
  deviceName?: string;
  deviceIp?: string;
}

function generatePortData(): PortInfo[] {
  const ports: PortInfo[] = [];
  for (let i = 1; i <= 48; i++) {
    let status: PortInfo['status'] = 'active';
    let speed = '1 Gbps';
    let poeWatts = 0;
    let vlan = 1;
    let deviceName: string | undefined;
    let deviceIp: string | undefined;

    if (i <= 12) {
      status = 'poe';
      poeWatts = Math.round((10 + Math.random() * 20) * 10) / 10;
      speed = '1 Gbps PoE+';
    } else if (i === 18) {
      status = 'critical';
      speed = 'Link Down';
    } else if (i % 3 === 0) {
      status = 'inactive';
      speed = 'No Signal';
    } else if (i > 40) {
      vlan = 30;
      speed = '10 Gbps';
    } else if (i > 24) {
      vlan = 20;
    } else {
      vlan = 10;
    }

    if (status === 'active' || status === 'poe') {
      deviceName = `PORT-${i}-DEVICE`;
      deviceIp = `10.10.0.${100 + i}`;
    }

    ports.push({
      number: i,
      status,
      speed,
      vlan,
      poeWatts,
      rxBytes: status === 'inactive' ? 0 : Math.round(Math.random() * 1000000000),
      txBytes: status === 'inactive' ? 0 : Math.round(Math.random() * 500000000),
      deviceName,
      deviceIp,
    });
  }
  return ports;
}

router.get('/', (req: AuthRequest, res: Response): void => {
  const ports = generatePortData();

  const stats = {
    total: 48,
    active: ports.filter(p => p.status === 'active').length,
    poe: ports.filter(p => p.status === 'poe').length,
    critical: ports.filter(p => p.status === 'critical').length,
    inactive: ports.filter(p => p.status === 'inactive').length,
    poeBudgetUsed: ports.reduce((sum, p) => sum + p.poeWatts, 0),
    poeBudgetMax: 740,
  };

  res.json({ ports, stats });
});

router.get('/:number', (req: AuthRequest, res: Response): void => {
  const portNum = parseInt(String(req.params.number), 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 48) {
    res.status(400).json({ error: 'Invalid port number (1-48)' });
    return;
  }

  const ports = generatePortData();
  const port = ports.find(p => p.number === portNum);

  if (!port) {
    res.status(404).json({ error: 'Port not found' });
    return;
  }

  res.json(port);
});

export default router;
