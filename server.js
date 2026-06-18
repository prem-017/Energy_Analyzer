const express = require('express');
const path = require('path');
const { initDb, getUsageEntries, addUsageEntry } = require('./db');
const suggestionDatasets = require('./data/suggestion_datasets.json');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Content Security Policy Middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self'; " +
    "img-src 'self' data:; " +
    "font-src 'self' data:; " +
    "connect-src 'self'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self'"
  );
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntry
 */

/**
 * @param {UsageEntry[]} entries
 */
function calculateSummary(entries) {
  const totalKwh = entries.reduce((sum, item) => sum + (item.watts / 1000) * item.hours, 0);
  const totalCost = entries.reduce((sum, item) => sum + item.cost, 0);
  const averageDaily = entries.length ? totalKwh / entries.length : 0;
  const projectedMonth = averageDaily * 30;
  const savingsGoal = Math.max(0, projectedMonth - 100);

  return {
    totalEntries: entries.length,
    totalKwh: Number(totalKwh.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    averageDailyKwh: Number(averageDaily.toFixed(2)),
    projectedMonthlyKwh: Number(projectedMonth.toFixed(2)),
    suggestedMonthlyKwh: Number((projectedMonth - savingsGoal).toFixed(2)),
    savingsOpportunityKwh: Number(savingsGoal.toFixed(2)),
    tips: [
      'Turn off unused lights and appliances.',
      'Run full loads in the dishwasher and washing machine.',
      'Use energy-efficient LED bulbs.',
      'Unplug chargers and unused electronics.'
    ]
  };
}

app.get('/api/usage', async (req, res) => {
  try {
    const entries = await getUsageEntries();
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve usage data.' });
  }
});

app.post('/api/usage', async (req, res) => {
  const { date, hours, watts, cost } = req.body;
  if (!date || hours == null || watts == null || cost == null) {
    return res.status(400).json({ error: 'Please provide date, hours, watts, and cost.' });
  }

  try {
    const entry = await addUsageEntry({ date, hours, watts, cost });
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save usage entry.' });
  }
});

app.get('/api/summary', async (req, res) => {
  try {
    const entries = await getUsageEntries();
    res.json(calculateSummary(entries));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to calculate summary.' });
  }
});

app.get('/api/suggestion-datasets', (req, res) => {
  res.json(suggestionDatasets);
});

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Energy Consumption Analyzer running at http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
