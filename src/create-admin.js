// Usage: npm run create-admin -- email@example.com "a long password" ["Full Name"]
import { openDatabase } from './db.js';
import { upsertAdmin } from './auth.js';

const [email, password, name = ''] = process.argv.slice(2);
try {
  upsertAdmin(openDatabase(process.env.DATABASE_FILE || 'data/lynq.db'), { email, password, name });
  console.log(`Admin ${email} is ready. Sign in at /admin.`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
