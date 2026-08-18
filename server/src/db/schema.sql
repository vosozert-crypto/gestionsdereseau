CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'viewer')),
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('computer', 'printer', 'network', 'server', 'iot')),
  type TEXT NOT NULL,
  ip TEXT NOT NULL,
  mac TEXT NOT NULL,
  vlan INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK(status IN ('online', 'warning', 'critical', 'offline')) DEFAULT 'online',
  uptime TEXT DEFAULT '00h 00m',
  latency_ms REAL DEFAULT 0,
  tx_rate TEXT DEFAULT '0.0 MB/s',
  rx_rate TEXT DEFAULT '0.0 MB/s',
  department TEXT DEFAULT '',
  assigned_user TEXT,
  location TEXT DEFAULT '',
  notes TEXT,
  hardware_json TEXT NOT NULL DEFAULT '{}',
  software_json TEXT NOT NULL DEFAULT '{}',
  last_seen TEXT DEFAULT 'Just now',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_devices_category ON devices(category);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_ip ON devices(ip);
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac);
CREATE INDEX IF NOT EXISTS idx_devices_vlan ON devices(vlan);
CREATE INDEX IF NOT EXISTS idx_devices_name ON devices(name);

CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('CRITICAL', 'WARNING', 'INFO')),
  source_ip TEXT NOT NULL,
  message TEXT NOT NULL,
  message_ar TEXT,
  protocol TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_source_ip ON security_logs(source_ip);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON security_logs(created_at);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
