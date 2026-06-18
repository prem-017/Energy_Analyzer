# Energy Consumption Analyzer

A simple Node.js + Express web app for tracking household electricity usage and viewing summary insights.

## Features

- Store energy usage entries (date, hours, watts, cost)
- View usage history and calculate kWh
- Summary cards for total consumption, cost, average daily usage, and projections
- Recommendations for energy savings
- PostgreSQL support with local JSON fallback when database credentials are unavailable

## Requirements

- Node.js 18+ (or compatible)
- npm
- PostgreSQL (optional) or local JSON fallback

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

The app attempts to connect to PostgreSQL using the following environment variables:

- `DATABASE_URL`
- `PGUSER`
- `PGPASSWORD`
- `PGHOST`
- `PGPORT`
- `PGDATABASE`

If PostgreSQL is unavailable or authentication fails, the app will automatically fall back to a local JSON file at `data/usage_entries.json`.

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
