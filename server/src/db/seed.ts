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

  console.log('Database seeded successfully');
}
