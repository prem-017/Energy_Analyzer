const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const jsonDbPath = path.join(__dirname, 'data', 'usage_entries.json');
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
      database: process.env.PGDATABASE || 'energy_analyzer'
    };

const pool = new Pool(poolConfig);
let useJsonFallback = false;

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

function readJsonEntries() {
  try {
    const content = fs.readFileSync(jsonDbPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeJsonEntries(entries) {
  ensureJsonStorage();
  fs.writeFileSync(jsonDbPath, JSON.stringify(entries, null, 2), 'utf8');
}

async function initPostgres() {
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
    console.warn('PostgreSQL unavailable, falling back to local JSON file storage:', error.message);
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
    const entries = readJsonEntries();
    const nextId = entries.length ? Math.max(...entries.map(item => item.id)) + 1 : 1;
    const newEntry = { id: nextId, date, hours, watts, cost };
    entries.push(newEntry);
    writeJsonEntries(entries);
    return newEntry;
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
