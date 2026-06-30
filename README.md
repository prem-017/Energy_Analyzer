# Energy Consumption Analyzer

A simple Node.js + Express web app for tracking household electricity usage and viewing summary insights.

## Features

- Store energy usage entries (date, hours, watts, cost)
- View usage history and calculate kWh
- Summary cards for total consumption, cost, average daily usage, and projections
- Recommendations for energy savings
- Local JSON storage by default, with optional PostgreSQL support

## Requirements

- Node.js 18+ (or compatible)
- npm
- PostgreSQL (optional)

## Installation

1. Open a terminal in the project folder.
2. Install dependencies:

```sh
npm install
```

## Usage

Start the server:

```sh
npm start
```

Then open:

```sh
http://localhost:3000
```

## Database

By default, the app stores usage entries in `data/usage_entries.json`.

To use PostgreSQL instead, provide one or more of the following environment variables before starting the server:

- `DATABASE_URL`
- `PGUSER`
- `PGPASSWORD`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`

If PostgreSQL is configured but unavailable or authentication fails, the app will automatically fall back to the local JSON file.

## Project Structure

- `server.js` — Express server and API endpoints
- `db.js` — database access logic and fallback storage
- `public/` — frontend assets
  - `index.html`
  - `app.js`
  - `style.css`

## Notes

- Sample usage entries are seeded automatically when the app first starts.
- For production use, configure PostgreSQL and provide valid credentials.
