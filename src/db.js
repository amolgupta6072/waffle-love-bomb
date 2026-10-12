import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function openDatabase(file) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS brands (
      id          INTEGER PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      country     TEXT NOT NULL DEFAULT '',
      city        TEXT NOT NULL DEFAULT '',
      founded     TEXT NOT NULL DEFAULT '',
      tagline     TEXT NOT NULL DEFAULT '',
      story       TEXT NOT NULL DEFAULT '',
      highlights  TEXT NOT NULL DEFAULT '',
      website     TEXT NOT NULL DEFAULT '',
      image_url   TEXT NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0,
      published   INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS watches (
      id            INTEGER PRIMARY KEY,
      slug          TEXT NOT NULL UNIQUE,
      brand_id      INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      collection    TEXT NOT NULL DEFAULT '',
      reference     TEXT NOT NULL DEFAULT '',
      curation      TEXT NOT NULL DEFAULT '',
      description   TEXT NOT NULL DEFAULT '',
      case_material TEXT NOT NULL DEFAULT '',
      case_size     TEXT NOT NULL DEFAULT '',
      movement      TEXT NOT NULL DEFAULT '',
      dial          TEXT NOT NULL DEFAULT '',
      strap         TEXT NOT NULL DEFAULT '',
      edition       TEXT NOT NULL DEFAULT '',
      price_inr     INTEGER,
      availability  TEXT NOT NULL DEFAULT 'request',
      image_url     TEXT NOT NULL DEFAULT '',
      art_shape     TEXT NOT NULL DEFAULT 'round',
      art_style     TEXT NOT NULL DEFAULT 'three-hand',
      art_dial      TEXT NOT NULL DEFAULT '#22252b',
      art_case      TEXT NOT NULL DEFAULT 'steel',
      art_strap     TEXT NOT NULL DEFAULT '#2a2a2a',
      featured      INTEGER NOT NULL DEFAULT 0,
      position      INTEGER NOT NULL DEFAULT 0,
      published     INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS watches_brand ON watches(brand_id);

    CREATE TABLE IF NOT EXISTS locations (
      id          INTEGER PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      city        TEXT NOT NULL DEFAULT '',
      address     TEXT NOT NULL DEFAULT '',
      status      TEXT NOT NULL DEFAULT 'coming',
      status_note TEXT NOT NULL DEFAULT '',
      hours       TEXT NOT NULL DEFAULT '',
      phone       TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      position    INTEGER NOT NULL DEFAULT 0,
      published   INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS events (
      id          INTEGER PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      title       TEXT NOT NULL,
      starts_at   TEXT NOT NULL,
      location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
      venue       TEXT NOT NULL DEFAULT '',
      summary     TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      capacity    INTEGER,
      published   INTEGER NOT NULL DEFAULT 1
    );

    -- Every inbound form: enquiries, orders, appointments, RSVPs, partner applications, newsletter.
    CREATE TABLE IF NOT EXISTS requests (
      id             INTEGER PRIMARY KEY,
      type           TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'new',
      name           TEXT NOT NULL DEFAULT '',
      email          TEXT NOT NULL,
      phone          TEXT NOT NULL DEFAULT '',
      city           TEXT NOT NULL DEFAULT '',
      company        TEXT NOT NULL DEFAULT '',
      message        TEXT NOT NULL DEFAULT '',
      preferred_date TEXT NOT NULL DEFAULT '',
      guests         INTEGER,
      watch_id       INTEGER REFERENCES watches(id) ON DELETE SET NULL,
      event_id       INTEGER REFERENCES events(id) ON DELETE SET NULL,
      location_id    INTEGER REFERENCES locations(id) ON DELETE SET NULL,
      note           TEXT NOT NULL DEFAULT '',
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS requests_type ON requests(type, status);

    CREATE TABLE IF NOT EXISTS admins (
      id            INTEGER PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name          TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
      csrf       TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function transaction(db, fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
