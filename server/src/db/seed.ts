import { getDb } from './index.js';
import bcrypt from 'bcryptjs';

export function seedDatabase(): void {
  const db = getDb();
  console.log('Seeding database...');

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('admin123', 12);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'
    ).run('admin', hash, 'admin', 'Administrator');

    const operatorHash = bcrypt.hashSync('operator123', 12);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'
    ).run('operator', operatorHash, 'operator', 'Network Operator');

    const viewerHash = bcrypt.hashSync('viewer123', 12);
    db.prepare(
      'INSERT INTO users (username, password_hash, role, display_name) VALUES (?, ?, ?, ?)'
    ).run('viewer', viewerHash, 'viewer', 'Read Only User');

    console.log('Default users created: admin/admin123, operator/operator123, viewer/viewer123');
  }

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get() as { count: number };
  if (deviceCount.count === 0) {
    const insertDevice = db.prepare(`
      INSERT INTO devices (id, name, category, type, ip, mac, vlan, status, uptime, latency_ms, tx_rate, rx_rate, department, assigned_user, location, notes, hardware_json, software_json, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const devices = getInitialDevices();
    const insertMany = db.transaction((items: typeof devices) => {
      for (const d of items) {
        insertDevice.run(
          d.id, d.name, d.category, d.type, d.ip, d.mac, d.vlan,
          d.status, d.uptime, d.latency_ms, d.tx_rate, d.rx_rate,
          d.department, d.assigned_user, d.location, d.notes,
          JSON.stringify(d.hardware), JSON.stringify(d.software), d.last_seen
        );
      }
    });

    insertMany(devices);
    console.log(`Inserted ${devices.length} devices`);
  }

  const logCount = db.prepare('SELECT COUNT(*) as count FROM security_logs').get() as { count: number };
  if (logCount.count === 0) {
    const insertLog = db.prepare(
      'INSERT INTO security_logs (id, timestamp, severity, source_ip, message, message_ar, protocol) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    const logs = getInitialLogs();
    const insertLogs = db.transaction((items: typeof logs) => {
      for (const l of items) {
        insertLog.run(l.id, l.timestamp, l.severity, l.source_ip, l.message, l.message_ar, l.protocol);
      }
    });

    insertLogs(logs);
    console.log(`Inserted ${logs.length} security logs`);
  }

  console.log('Database seeded successfully');
}

function getInitialDevices() {
  return [
    {
      id: 'dev-1', name: 'CORE-FW-01', category: 'network', type: 'Firewall',
      ip: '10.10.0.1/24', mac: '00:1A:2B:3C:4D:5E', vlan: 1, status: 'online',
      uptime: '142d 08h 12m', latency_ms: 0.4, tx_rate: '18.4 MB/s', rx_rate: '3.1 MB/s',
      department: 'IT Security', assigned_user: 'Network Admin Team',
      location: 'Server Room - Rack A1', notes: 'Primary Perimeter Security Gateway',
      last_seen: 'Just now',
      hardware: {
        brandModel: 'Fortinet FortiGate 100F', cpu: 'Intel Xeon D-1541 8-Core @ 2.10GHz',
        cpuGen: 'Xeon D', cpuCores: 8, ramGB: 32, ramType: 'DDR4 ECC Registered',
        storage: '256GB NVMe Enterprise SSD', diskUsagePercent: 18,
        serialNumber: 'FW-8932-X9012', powerSupply: 'Redundant 450W Dual Hot-Swap',
        macAddress: '00:1A:2B:3C:4D:5E', portsCount: 8
      },
      software: {
        osName: 'FortiOS v7.2.5 Enterprise Edition', osArchitecture: '64-bit',
        firmwareVersion: 'v7.2.5-build1512', antivirusStatus: 'Active & Updated',
        firewallEnabled: true, lastPatchDate: '2026-07-20',
        installedApps: [
          { name: 'FortiGuard IPS Engine', version: 'v24.102', publisher: 'Fortinet', installDate: '2026-01-10', licenseStatus: 'Subscription' },
          { name: 'SSL-VPN Gateway Module', version: 'v7.2.1', publisher: 'Fortinet', installDate: '2026-01-10', licenseStatus: 'Licensed' }
        ]
      }
    },
    {
      id: 'dev-2', name: 'SW-CORE-48P', category: 'network', type: 'Core Switch',
      ip: '10.10.0.2/24', mac: 'E4:F2:A1:88:99:AA', vlan: 1, status: 'online',
      uptime: '88d 14h 45m', latency_ms: 0.2, tx_rate: '242.1 MB/s', rx_rate: '188.4 MB/s',
      department: 'IT Infrastructure', assigned_user: 'System Operations',
      location: 'Server Room - Rack A2', notes: 'Layer 3 Managed Core Switch 48-Port PoE+',
      last_seen: 'Just now',
      hardware: {
        brandModel: 'Cisco Catalyst 3850-48P', cpu: 'ARM Cortex-A9 Dual Core @ 1.2GHz',
        cpuGen: 'Cortex-A9', cpuCores: 2, ramGB: 4, ramType: 'DDR3',
        storage: '1GB Flash', diskUsagePercent: 22,
        serialNumber: 'SW48-L3-2025-00192', powerSupply: 'Internal 740W PoE Unit',
        macAddress: 'E4:F2:A1:88:99:AA', portsCount: 48
      },
      software: {
        osName: 'Cisco IOS XE Everest 16.6.4', osArchitecture: '64-bit',
        firmwareVersion: '16.6.4.21', antivirusStatus: 'N/A',
        firewallEnabled: false, lastPatchDate: '2026-05-14',
        installedApps: [
          { name: 'SNMP v3 Daemon', version: '3.8.1', publisher: 'Cisco Systems', installDate: '2025-11-01', licenseStatus: 'Licensed' },
          { name: '802.1X Port Security Module', version: '2.1.0', publisher: 'Cisco Systems', installDate: '2025-11-01', licenseStatus: 'Licensed' }
        ]
      }
    },
    {
      id: 'dev-3', name: 'PC-DEV-01', category: 'computer', type: 'Workstation',
      ip: '10.10.0.101/24', mac: '11:22:33:44:55:66', vlan: 20, status: 'online',
      uptime: '09h 15m', latency_ms: 1.1, tx_rate: '4.5 MB/s', rx_rate: '12.8 MB/s',
      department: 'Software Engineering', assigned_user: 'Lead Software Engineer',
      location: 'Office Floor 2 - Desk 14', notes: 'Senior Engineering Workstation',
      last_seen: 'Just now',
      hardware: {
        brandModel: 'Custom Workstation Pro', cpu: 'Intel Core i9-13900K 24-Cores @ 3.00GHz',
        cpuGen: '13th Gen', cpuCores: 24, ramGB: 64, ramType: 'DDR5 6000MHz',
        storage: '2TB Samsung 990 Pro NVMe + 4TB HDD', diskUsagePercent: 41,
        gpu: 'NVIDIA GeForce RTX 4080 16GB', motherboard: 'ASUS ROG Strix Z790-E',
        serialNumber: 'WS-2026-DEV-001', powerSupply: '850W 80+ Gold',
        macAddress: '11:22:33:44:55:66', portsCount: 2
      },
      software: {
        osName: 'Windows 11 Pro 64-bit (23H2)', osArchitecture: '64-bit',
        kernelVersion: '10.0.22631.3880', antivirusStatus: 'Active & Updated',
        firewallEnabled: true, lastPatchDate: '2026-08-01',
        installedApps: [
          { name: 'Visual Studio Code', version: '1.92.0', publisher: 'Microsoft', installDate: '2026-01-15', licenseStatus: 'Freeware' },
          { name: 'Docker Desktop', version: '4.32.0', publisher: 'Docker Inc.', installDate: '2026-02-10', licenseStatus: 'Licensed' },
          { name: 'Node.js LTS Runtime', version: 'v20.15.1', publisher: 'OpenJS Foundation', installDate: '2026-01-20', licenseStatus: 'Open Source' }
        ]
      }
    },
    {
      id: 'dev-4', name: 'PC-FINANCE-01', category: 'computer', type: 'Desktop PC',
      ip: '10.10.0.102/24', mac: 'F0:E1:D2:C3:B4:A5', vlan: 20, status: 'critical',
      uptime: '00h 00m', latency_ms: 999, tx_rate: '0.0 MB/s', rx_rate: '0.0 MB/s',
      department: 'Finance & Accounting', assigned_user: 'Senior Accountant',
      location: 'Office Floor 1 - Desk 08', notes: 'Unresponsive node - ICMP Packet Drop',
      last_seen: '2 hours ago',
      hardware: {
        brandModel: 'Dell OptiPlex 7000 SFF', cpu: 'Intel Core i5-12400 6-Cores @ 2.50GHz',
        cpuGen: '12th Gen', cpuCores: 6, ramGB: 16, ramType: 'DDR4 3200MHz',
        storage: '512GB Kingston NVMe SSD', diskUsagePercent: 78,
        gpu: 'Intel UHD Graphics 730', motherboard: 'Dell OptiPlex 7000 SFF',
        serialNumber: 'DELL-OPT-99120-FIN', powerSupply: '260W Internal Dell',
        macAddress: 'F0:E1:D2:C3:B4:A5', portsCount: 1
      },
      software: {
        osName: 'Windows 11 Pro (22H2)', osArchitecture: '64-bit',
        kernelVersion: '10.0.22621.2428', antivirusStatus: 'Outdated',
        firewallEnabled: true, lastPatchDate: '2026-04-12',
        installedApps: [
          { name: 'Microsoft Office 2021 LTSC', version: '16.0.14332', publisher: 'Microsoft', installDate: '2025-09-10', licenseStatus: 'Licensed' },
          { name: 'QuickBooks Enterprise 2025', version: '25.0.1', publisher: 'Intuit', installDate: '2025-10-14', licenseStatus: 'Subscription' }
        ]
      }
    },
    {
      id: 'dev-5', name: 'PRN-OFFICE-LASER', category: 'printer', type: 'Multifunction Printer',
      ip: '10.10.0.21/24', mac: 'AA:BB:CC:DD:EE:FF', vlan: 10, status: 'warning',
      uptime: '14d 02h 10m', latency_ms: 3.8, tx_rate: '0.0 MB/s', rx_rate: '0.2 MB/s',
      department: 'Administration', assigned_user: 'Shared Floor 1 Printer',
      location: 'Main Hall Printing Hub', notes: 'Low Black Toner warning (8% remaining)',
      last_seen: 'Just now',
      hardware: {
        cpu: 'ARM Cortex-R4 800MHz Embedded', cpuCores: 1, ramGB: 2,
        ramType: 'DDR3 Embedded', storage: '16GB eMMC', diskUsagePercent: 12,
        serialNumber: 'HP-MFP-E87650-09', powerSupply: 'AC 220V 600W',
        macAddress: 'AA:BB:CC:DD:EE:FF', portsCount: 1
      },
      software: {
        osName: 'HP FutureSmart Firmware v5.7.1', firmwareVersion: '5.7.1.202603',
        antivirusStatus: 'N/A', firewallEnabled: true, lastPatchDate: '2026-03-10',
        installedApps: [
          { name: 'HP Web Jetadmin Agent', version: '10.5', publisher: 'HP Inc.', installDate: '2025-06-01', licenseStatus: 'Licensed' },
          { name: 'AirPrint / Mopria Service', version: '2.4', publisher: 'Apple / Mopria', installDate: '2025-06-01', licenseStatus: 'Freeware' }
        ]
      }
    },
    {
      id: 'dev-6', name: 'SRV-DB-SQL01', category: 'server', type: 'Rack Server',
      ip: '10.10.0.50/24', mac: '33:44:55:66:77:88', vlan: 30, status: 'online',
      uptime: '195d 11h 20m', latency_ms: 0.3, tx_rate: '88.4 MB/s', rx_rate: '142.1 MB/s',
      department: 'Data Management', assigned_user: 'Database Admin',
      location: 'Server Room - Rack B1', notes: 'Primary Database Node (PostgreSQL + MSSQL)',
      last_seen: 'Just now',
      hardware: {
        cpu: '2x AMD EPYC 7543 32-Core (64-Cores Total)', cpuCores: 64,
        ramGB: 256, ramType: 'DDR4 ECC 3200MHz',
        storage: '8x 3.84TB SAS Enterprise SSD RAID 10', diskUsagePercent: 62,
        serialNumber: 'DELL-R750-SQL-9812', powerSupply: 'Dual Redundant 1100W Titanium',
        macAddress: '33:44:55:66:77:88', portsCount: 4
      },
      software: {
        osName: 'Ubuntu Server 22.04.4 LTS (Jammy)', osArchitecture: '64-bit',
        kernelVersion: '5.15.0-107-generic', antivirusStatus: 'Active & Updated',
        firewallEnabled: true, lastPatchDate: '2026-07-28',
        installedApps: [
          { name: 'PostgreSQL Database Engine', version: '16.3', publisher: 'PostgreSQL Global Dev', installDate: '2025-02-10', licenseStatus: 'Open Source' },
          { name: 'Redis Cache Server', version: '7.2.4', publisher: 'Redis Ltd.', installDate: '2025-02-12', licenseStatus: 'Open Source' }
        ]
      }
    },
    {
      id: 'dev-7', name: 'NAS-STORAGE-BACKUP', category: 'server', type: 'NAS Storage',
      ip: '10.10.0.55/24', mac: '44:55:66:77:88:99', vlan: 30, status: 'online',
      uptime: '42d 19h 05m', latency_ms: 0.5, tx_rate: '310.2 MB/s', rx_rate: '25.4 MB/s',
      department: 'IT Infrastructure', assigned_user: 'Backup Automation Service',
      location: 'Server Room - Rack B2', notes: 'Synology RackStation 12-Bay RAID 6',
      last_seen: 'Just now',
      hardware: {
        cpu: 'AMD Ryzen V1500B Quad-core 2.2GHz', cpuCores: 4,
        ramGB: 32, ramType: 'DDR4 ECC',
        storage: '12x 18TB Seagate Exos Enterprise SATA (180TB Total)', diskUsagePercent: 71,
        serialNumber: 'SYN-RS3621-NAS-01', powerSupply: 'Redundant 500W PSU',
        macAddress: '44:55:66:77:88:99', portsCount: 4
      },
      software: {
        osName: 'Synology DiskStation Manager (DSM) 7.2.1',
        firmwareVersion: '7.2.1-69057 Update 5', antivirusStatus: 'Active & Updated',
        firewallEnabled: true, lastPatchDate: '2026-06-15',
        installedApps: [
          { name: 'Hyper Backup Vault', version: '4.1.0', publisher: 'Synology Inc.', installDate: '2025-03-01', licenseStatus: 'Licensed' },
          { name: 'Active Backup for Business', version: '2.6.2', publisher: 'Synology Inc.', installDate: '2025-03-01', licenseStatus: 'Licensed' }
        ]
      }
    },
    {
      id: 'dev-8', name: 'CAM-PARKING-02', category: 'iot', type: 'IP Camera',
      ip: '10.10.0.181/24', mac: '88:99:AA:BB:CC:DD', vlan: 40, status: 'critical',
      uptime: '00h 00m', latency_ms: 999, tx_rate: '0.0 MB/s', rx_rate: '0.0 MB/s',
      department: 'Physical Security', assigned_user: 'Security Guard Post',
      location: 'Outdoor Parking Area North', notes: 'PoE Link Failure',
      last_seen: '5 hours ago',
      hardware: {
        cpu: 'HiSilicon Hi3516 800MHz Embedded', cpuCores: 1, ramGB: 1,
        ramType: 'LPDDR3', storage: '128GB MicroSD Local Buffer', diskUsagePercent: 90,
        serialNumber: 'HIK-CAM-4K-OUTDOOR-02', powerSupply: 'PoE IEEE 802.3at (15W)',
        macAddress: '88:99:AA:BB:CC:DD', portsCount: 1
      },
      software: {
        osName: 'Hikvision Embedded Linux V5.5.800',
        firmwareVersion: 'v5.5.800 build 240115', antivirusStatus: 'N/A',
        firewallEnabled: true, lastPatchDate: '2025-11-20',
        installedApps: [
          { name: 'Onvif Media Streamer', version: '18.12', publisher: 'ONVIF Forum', installDate: '2025-01-10', licenseStatus: 'Open Source' }
        ]
      }
    },
    {
      id: 'dev-9', name: 'PC-HR-01', category: 'computer', type: 'Laptop',
      ip: '10.10.0.105/24', mac: '33:22:11:00:FF:EE', vlan: 20, status: 'online',
      uptime: '04h 30m', latency_ms: 2.1, tx_rate: '1.2 MB/s', rx_rate: '3.4 MB/s',
      department: 'Human Resources', assigned_user: 'HR Operations Manager',
      location: 'HR Office - Station 02', notes: 'Executive Mobility ThinkPad Laptop',
      last_seen: 'Just now',
      hardware: {
        brandModel: 'Lenovo ThinkPad X1 Carbon Gen 10', cpu: 'Intel Core i7-1260P 12-Cores @ 2.10GHz',
        cpuGen: '12th Gen', cpuCores: 12, ramGB: 32, ramType: 'LPDDR5 5200MHz',
        storage: '1TB NVMe PCIe 4.0 SSD', diskUsagePercent: 35,
        gpu: 'Intel Iris Xe Graphics', motherboard: 'Lenovo ThinkPad X1 Carbon Gen 10',
        serialNumber: 'LEN-X1C10-HR-8812', powerSupply: '65W USB-C GaN Adapter',
        macAddress: '33:22:11:00:FF:EE', portsCount: 1
      },
      software: {
        osName: 'Windows 11 Pro 64-bit (23H2)', osArchitecture: '64-bit',
        kernelVersion: '10.0.22631.3880', antivirusStatus: 'Active & Updated',
        firewallEnabled: true, lastPatchDate: '2026-08-05',
        installedApps: [
          { name: 'Microsoft 365 Apps for Enterprise', version: '16.0.17726', publisher: 'Microsoft', installDate: '2026-01-10', licenseStatus: 'Subscription' },
          { name: 'Zoom Meetings Client', version: '6.1.0', publisher: 'Zoom Video Comms', installDate: '2026-03-01', licenseStatus: 'Freeware' }
        ]
      }
    },
    {
      id: 'dev-10', name: 'PRN-DESIGN-COLOR', category: 'printer', type: 'Laser Printer',
      ip: '10.10.0.22/24', mac: 'BB:CC:DD:EE:FF:11', vlan: 10, status: 'online',
      uptime: '28d 10h 15m', latency_ms: 2.9, tx_rate: '0.0 MB/s', rx_rate: '0.1 MB/s',
      department: 'Marketing & Design', assigned_user: 'Design Team Shared',
      location: 'Design Studio - Floor 2', notes: 'Color Laserjet A3 Format',
      last_seen: 'Just now',
      hardware: {
        cpu: 'Quad-Core 1.2GHz Embedded', cpuCores: 4, ramGB: 4,
        ramType: 'DDR4 Embedded', storage: '32GB eMMC', diskUsagePercent: 15,
        serialNumber: 'CANON-ADV-C5850i-01', powerSupply: 'AC 230V 1200W Max',
        macAddress: 'BB:CC:DD:EE:FF:11', portsCount: 1
      },
      software: {
        osName: 'Canon imageRUNNER ADVANCE Platform v3.12',
        firmwareVersion: 'v3.12.91', antivirusStatus: 'N/A',
        firewallEnabled: true, lastPatchDate: '2026-02-18',
        installedApps: [
          { name: 'Canon uniFLOW Embedded Agent', version: '2024.1', publisher: 'NT-ware / Canon', installDate: '2025-08-10', licenseStatus: 'Licensed' }
        ]
      }
    }
  ];
}

function getInitialLogs() {
  return [
    { id: 'log-1', timestamp: '03:15:12', severity: 'CRITICAL', source_ip: '10.10.0.102', message: 'Link Down / ICMP Timeout detected on PC-FINANCE-01', message_ar: 'انقطاع الاتصال / انتهت مهلة ICMP للجهاز PC-FINANCE-01', protocol: 'ICMP' },
    { id: 'log-2', timestamp: '03:10:04', severity: 'CRITICAL', source_ip: '10.10.0.181', message: 'PoE negotiation timeout on Switch Port 18 (CAM-PARKING-02)', message_ar: 'فشل تفاوض طاقة PoE على المنفذ 18', protocol: '802.3at' },
    { id: 'log-3', timestamp: '02:45:22', severity: 'WARNING', source_ip: '10.10.0.21', message: 'SNMP Trap: Black toner level low (8%) on PRN-OFFICE-LASER', message_ar: 'تحذير SNMP: مستوى الحبر الأسود منخفض (8%)', protocol: 'SNMP v3' },
    { id: 'log-4', timestamp: '02:30:15', severity: 'INFO', source_ip: '10.10.0.101', message: 'DHCP ACK: IP 10.10.0.101 assigned to PC-DEV-01', message_ar: 'تأكيد DHCP: تم إسناد العنوان 10.10.0.101', protocol: 'DHCP' },
    { id: 'log-5', timestamp: '02:15:09', severity: 'INFO', source_ip: '10.10.0.1', message: 'Perimeter Security Firewall ruleset auto-updated', message_ar: 'تحديث قواعد الجدار الناري بنجاح', protocol: 'HTTPS' }
  ];
}

// seed is auto-called when imported — but can also be called explicitly
