const { Pool } = require('pg');

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

async function initDb() {
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
    const sampleEntries = [
      ['2026-06-01', 4, 1200, 0.8],
      ['2026-06-02', 3.5, 1500, 0.9],
      ['2026-06-03', 2, 2000, 1.2]
    ];

    for (const entry of sampleEntries) {
      await pool.query(
        'INSERT INTO usage_entries (date, hours, watts, cost) VALUES ($1, $2, $3, $4)',
        entry
      );
    }
  }
}

async function getUsageEntries() {
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

async function addUsageEntry({ date, hours, watts, cost }) {
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
