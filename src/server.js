import { openDatabase } from './db.js';
import { createApp } from './app.js';
import { seedIfEmpty } from './seed.js';
import { upsertAdmin } from './auth.js';

const port = Number(process.env.PORT) || 3000;
const db = openDatabase(process.env.DATABASE_FILE || 'data/lynq.db');

if (seedIfEmpty(db)) console.log('Seeded the catalogue with the LYNQ brand portfolio.');

// Optionally create/update an admin from the environment on start-up.
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  upsertAdmin(db, { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
}
if (!db.prepare('SELECT 1 FROM admins').get()) {
  console.log('No admin account yet. Create one with: npm run create-admin -- you@example.com "a-long-password"');
}

setInterval(() => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()), 60 * 60 * 1000).unref();

// TRUST_PROXY: number of proxy hops in front of the app (e.g. 1 behind a load balancer).
const trustProxy = process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY : 'loopback';

createApp(db, { secureCookies: process.env.NODE_ENV === 'production', trustProxy }).listen(port, () => {
  console.log(`LYNQ is running at http://localhost:${port}`);
});
