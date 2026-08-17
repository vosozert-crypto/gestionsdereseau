import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  db: {
    path: process.env.DB_PATH || './data/netmanager.db',
  },

  snmp: {
    community: process.env.SNMP_COMMUNITY || 'public',
    version: parseInt(process.env.SNMP_VERSION || '2', 10) as 1 | 2,
    pollInterval: parseInt(process.env.SNMP_POLL_INTERVAL || '30000', 10),
  },

  wmiAgent: {
    url: process.env.WMI_AGENT_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.WMI_AGENT_TIMEOUT || '10000', 10),
  },

  scan: {
    subnet: process.env.SCAN_SUBNET || '10.10.0.0',
    mask: parseInt(process.env.SCAN_MASK || '24', 10),
  },
} as const;
