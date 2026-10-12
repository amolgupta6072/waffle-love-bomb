import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { loadAdmin } from './auth.js';
import { publicRouter } from './routes/public.js';
import { adminRouter } from './routes/admin.js';
import { notFoundPage } from './views/public.js';

const PUBLIC_DIR = fileURLToPath(new URL('../public', import.meta.url));

export function createApp(db, { secureCookies = false, trustProxy = 'loopback', formLimit = 12 } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);

  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': [
        "default-src 'self'",
        "img-src 'self' https: data:",
        "style-src 'self' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "script-src 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
      ].join('; '),
    });
    next();
  });

  app.use(express.static(PUBLIC_DIR, { index: false, maxAge: '1h' }));
  app.use(cookieParser());
  app.use(loadAdmin(db));

  app.use('/admin', adminRouter(db, { secureCookies }));
  app.use(publicRouter(db, { formLimit }));

  app.use((req, res) => res.status(404).type('html').send(notFoundPage().toString()));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') return res.status(413).send('Request too large.');
    console.error(err);
    res.status(500).send('Something went wrong. Please try again.');
  });

  return app;
}
