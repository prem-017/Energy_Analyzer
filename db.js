const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const jsonDbPath = path.join(__dirname, 'data', 'usage_entries.json');
const postgresEnvKeys = ['DATABASE_URL', 'PGUSER', 'PGPASSWORD', 'PGHOST', 'PGPORT', 'PGDATABASE'];
const hasPostgresConfig = postgresEnvKeys.some((key) => Boolean(process.env[key]));
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE || 'energy_analyzer'
    };

const pool = hasPostgresConfig ? new Pool(poolConfig) : null;
let useJsonFallback = false;

/**
 * @typedef {{ id: number, date: string, hours: number, watts: number, cost: number }} UsageEntry
 */

const sampleEntries = [
  { id: 1, date: '2026-06-01', hours: 4, watts: 1200, cost: 0.8 },
  { id: 2, date: '2026-06-02', hours: 3.5, watts: 1500, cost: 0.9 },
  { id: 3, date: '2026-06-03', hours: 2, watts: 2000, cost: 1.2 }
];

function ensureJsonStorage() {
  const dir = path.dirname(jsonDbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(jsonDbPath)) {
    fs.writeFileSync(jsonDbPath, JSON.stringify(sampleEntries, null, 2), 'utf8');
  }
}

/**
 * @returns {UsageEntry[]}
 */
function readJsonEntries() {
  try {
    const content = fs.readFileSync(jsonDbPath, 'utf8');
    return /** @type {UsageEntry[]} */ (JSON.parse(content));
  } catch {
    return [];
  }
}

/**
 * @param {UsageEntry[]} entries
 */
function writeJsonEntries(entries) {
  ensureJsonStorage();
  fs.writeFileSync(jsonDbPath, JSON.stringify(entries, null, 2), 'utf8');
}

async function initPostgres() {
  if (!pool) {
    return false;
  }

  try {
    await pool.query('SELECT 1');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_entries (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        hours NUMERIC NOT NULL,
        watts INT NOT NULL,
        cost NUMERIC NOT NULL
      )
    `);

    const { rows } = await pool.query('SELECT COUNT(*) FROM usage_entries');
    if (Number(rows[0].count) === 0) {
      for (const entry of sampleEntries) {
        await pool.query(
          'INSERT INTO usage_entries (date, hours, watts, cost) VALUES ($1, $2, $3, $4)',
          [entry.date, entry.hours, entry.watts, entry.cost]
        );
      }
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('PostgreSQL unavailable, falling back to local JSON file storage:', message);
    return false;
  }
}

async function initDb() {
  const postgresReady = await initPostgres();
  if (!postgresReady) {
    useJsonFallback = true;
    ensureJsonStorage();
  }
}

async function getUsageEntries() {
  if (useJsonFallback) {
    return readJsonEntries();
  }

  if (!pool) {
    throw new Error('Database has not been initialized.');
  }

  const result = await pool.query(
    'SELECT id, date::text, hours, watts, cost FROM usage_entries ORDER BY date'
  );
  return result.rows.map(row => ({
    id: row.id,
    date: row.date,
    hours: Number(row.hours),
    watts: row.watts,
    cost: Number(row.cost)
  }));
}

/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntryInput
 */

/**
 * @param {UsageEntryInput} entry
 */
async function addUsageEntry({ date, hours, watts, cost }) {
  if (useJsonFallback) {
    const entries = /** @type {UsageEntry[]} */ (readJsonEntries());
    const nextId = entries.length ? Math.max(...entries.map((item) => item.id)) + 1 : 1;
    const newEntry = { id: nextId, date, hours, watts, cost };
    entries.push(newEntry);
    writeJsonEntries(entries);
    return newEntry;
  }

  if (!pool) {
    throw new Error('Database has not been initialized.');
  }

  const result = await pool.query(
    'INSERT INTO usage_entries (date, hours, watts, cost) VALUES ($1, $2, $3, $4) RETURNING id, date::text, hours, watts, cost',
    [date, hours, watts, cost]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    date: row.date,
    hours: Number(row.hours),
    watts: row.watts,
    cost: Number(row.cost)
  };
}

module.exports = {
  initDb,
  getUsageEntries,
  addUsageEntry
};
