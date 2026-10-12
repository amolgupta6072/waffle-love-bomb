# LYNQ

**A dedicated platform for independent watchmaking. An initiative by Ethos.**

LYNQ is a digital-first discovery platform for founder-led and independent watch brands, intended for thisislynq.com. Collectors can explore each maison's story and collection, then order, enquire, book a gallery appointment or reserve a place at a collector evening. The LYNQ team handles all of that from a built-in admin back office.

## What's included

**Public site**
- **Home**: manifesto, selected pieces, the eight curations (The Independents, The Complicated, The Artisans, The Icons, The Next, The Rare, The Architects, The Collectors), the maisons, the LYNQ Gallery and the LYNQ Circle newsletter.
- **Discover** (`/discover`): every watch, filterable by curation, maison, origin and availability.
- **Watch pages** (`/watches/:slug`): story, specifications, price or "Price on request", and the actions *Order this piece*, *Request an appointment* and *Enquire*.
- **Maisons** (`/maisons`, `/maisons/:slug`): brand stories, highlights and collections.
- **The Gallery** (`/gallery`): the gallery concept, locations and video consultations.
- **Events** (`/events`): collector evenings and private previews with RSVPs and capacity limits.
- **Appointments** (`/appointment`), **Enquiries and orders** (`/enquire`), **For independent brands** (`/partner`) and **About**.

**Admin** (`/admin`)
- **Inbox**: orders, enquiries, appointments, RSVPs, brand introductions and newsletter sign-ups. Each has a reference (e.g. `LQ-000042`), a status (new, in progress or closed), internal notes and CSV export.
- **Content management** for watches, maisons, events and gallery locations, including publish and unpublish, featured pieces, pricing and availability.

**Ordering.** A watch can be ordered online when it is marked *Available to order* and has a price. An order creates a request for a specialist to confirm and take payment. No card payment is taken on the site. The deck plans a Shopify backend for this, which can be connected later.

**Watch imagery.** Until product photography is uploaded, every watch is drawn as an SVG illustration from its case shape, dial layout, dial colour, metal and strap colour. All of these can be edited in the admin. Adding a *Product image URL* replaces the illustration.

## Getting started

Requires **Node.js 22.5+**. The app uses the built-in `node:sqlite`, so there is no database server to install.

```bash
npm install
npm run create-admin -- you@ethos.example "a long password" "Your Name"
npm start            # http://localhost:3000, admin at /admin
npm test
```

On first start the catalogue is seeded with the 10 LYNQ maisons and 37 models from the brand portfolio deck. The seed contains public brand information only. No commercial terms are stored anywhere, prices are left as "on request" and specifications are blank, ready for the team to fill in.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `DATABASE_FILE` | `data/lynq.db` | SQLite database file (back this up) |
| `NODE_ENV` | | Set to `production` to send admin cookies only over HTTPS |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | | Optionally create or update an admin on start-up |
| `TRUST_PROXY` | `loopback` | Number of proxy hops in front of the app (e.g. `1` behind a load balancer), so rate limiting sees real visitor IPs |

## Project layout

```
src/
  server.js          entry point (seeding, admin bootstrap)
  app.js             Express app, security headers
  routes/public.js   public pages and form handling
  routes/admin.js    admin auth, inbox, generic content CRUD
  resources.js       admin field definitions for watches, maisons, events, locations
  views/             server-rendered HTML (auto-escaped templates)
  watch-art.js       SVG watch illustrations
  seed.js            starter catalogue
  catalog.js         curations, statuses and labels
public/              CSS, small browser scripts, favicon
test/                end-to-end tests (node:test)
```

## Security

- Admin passwords are hashed with scrypt. Sessions are HttpOnly, SameSite cookies, and every admin form carries a CSRF token. Repeated failed sign-ins are throttled.
- All output is HTML-escaped. Only `http(s)` links are accepted for URLs. A strict Content-Security-Policy is sent.
- Public forms are protected by a honeypot field and a per-IP rate limit. CSV exports neutralise spreadsheet formulas.

## Before launch

- Confirm which maisons and models should be public. Unpublish any whose agreements aren't signed.
- Add INR prices, specifications and product photography in the admin.
- Set gallery address, hours and phone once the first location is confirmed.
- Optional: connect email notifications for new inbox items, and Shopify for payments.
