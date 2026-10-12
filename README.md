# lynq

**One link for everything you share.** lynq is a link-in-bio platform: people sign up, build a page of links, pick a theme, and share a single URL like `yoursite.com/ava`.

## Features

- **Landing page** with a "claim your username" box
- **Accounts**: sign up / log in / log out, live username availability check, delete account
- **Dashboard**
  - Add, edit, delete, show/hide links
  - Reorder by drag-and-drop or ↑/↓ buttons
  - Profile: display name, bio, avatar image URL
  - 6 themes (Midnight, Sunrise, Forest, Ocean, Paper, Candy)
  - Live phone preview of your public page
  - Analytics: page views, clicks per link, click rate
  - One-click copy of your public link
- **Public profile pages** at `/:username`, server-rendered, fast, mobile-first
- **Click tracking** through `/go/:id` redirects

## Running it

Requires **Node.js 22.5+** (it uses the built-in `node:sqlite`, so there is no native database driver to compile).

```bash
npm install
npm start          # http://localhost:3000
npm run dev        # restarts on file changes
npm test
```

| Variable        | Default        | Purpose                                      |
| --------------- | -------------- | -------------------------------------------- |
| `PORT`          | `3000`         | HTTP port                                    |
| `DATABASE_FILE` | `data/lynq.db` | SQLite database file                         |
| `NODE_ENV`      | –              | Set to `production` to mark cookies `Secure` (requires HTTPS) |

## Project layout

```
src/
  server.js        entry point
  app.js           Express app: pages, public profiles, click redirects
  api.js           JSON API (/api/...)
  auth.js          scrypt password hashing, DB-backed sessions
  db.js            SQLite schema
  validate.js      input validation (only http/https links allowed)
  profile-page.js  server-rendered public profile HTML
public/            landing, auth, dashboard pages, CSS, and browser JS
test/              end-to-end API tests (node:test)
```

## API

All mutating requests must send `X-Lynq-Request: 1` (CSRF protection) and JSON bodies.

| Method & path                 | Description                               |
| ----------------------------- | ----------------------------------------- |
| `POST /api/signup`            | `{ email, username, password }`           |
| `POST /api/login`             | `{ login, password }` (username or email) |
| `POST /api/logout`            |                                           |
| `GET /api/check-username`     | `?username=` availability check           |
| `GET /api/me`                 | current user + links                      |
| `PATCH /api/me`               | `{ display_name, bio, avatar_url, theme }`|
| `DELETE /api/me`              | delete account                            |
| `POST /api/links`             | `{ title, url }`                          |
| `PATCH /api/links/:id`        | `{ title?, url?, enabled? }`              |
| `DELETE /api/links/:id`       |                                           |
| `PUT /api/links/order`        | `{ ids: [...] }` new order                |

## Security notes

- Passwords hashed with scrypt + per-user salt; sessions are random 256-bit tokens in an `HttpOnly`, `SameSite=Lax` cookie.
- Links and avatars must be `http(s)` URLs, so `javascript:` and similar can't be injected; all user text is HTML-escaped.
- Users can only modify their own links. Usernames that collide with app routes (`login`, `dashboard`, `api`, …) are reserved.
