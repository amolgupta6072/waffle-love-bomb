import { openDatabase } from './db.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const dbFile = process.env.DATABASE_FILE || 'data/lynq.db';
const secureCookies = process.env.NODE_ENV === 'production';

const db = openDatabase(dbFile);
const app = createApp(db, { secureCookies });

// Clear out expired sessions hourly.
setInterval(() => db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now()), 60 * 60 * 1000).unref();

app.listen(port, () => {
  console.log(`lynq is running at http://localhost:${port}`);
});
