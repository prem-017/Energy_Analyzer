"use strict";

var express = require('express');

var path = require('path');

var _require = require('./db'),
    initDb = _require.initDb,
    getUsageEntries = _require.getUsageEntries,
    addUsageEntry = _require.addUsageEntry;

var suggestionDatasets = require('./data/suggestion_datasets.json');

var app = express();
var port = process.env.PORT || 3000;
app.use(express.json()); // Content Security Policy Middleware

app.use(function (req, res, next) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; " + "script-src 'self'; " + "style-src 'self'; " + "img-src 'self' data:; " + "font-src 'self' data:; " + "connect-src 'self'; " + "frame-ancestors 'none'; " + "base-uri 'self'; " + "form-action 'self'");
  next();
});
app.use(express["static"](path.join(__dirname, 'public')));
/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntry
 */

/**
 * @param {UsageEntry[]} entries
 */

function calculateSummary(entries) {
  var totalKwh = entries.reduce(function (sum, item) {
    return sum + item.watts / 1000 * item.hours;
  }, 0);
  var totalCost = entries.reduce(function (sum, item) {
    return sum + item.cost;
  }, 0);
  var averageDaily = entries.length ? totalKwh / entries.length : 0;
  var projectedMonth = averageDaily * 30;
  var savingsGoal = Math.max(0, projectedMonth - 100);
  return {
    totalEntries: entries.length,
    totalKwh: Number(totalKwh.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    averageDailyKwh: Number(averageDaily.toFixed(2)),
    projectedMonthlyKwh: Number(projectedMonth.toFixed(2)),
    suggestedMonthlyKwh: Number((projectedMonth - savingsGoal).toFixed(2)),
    savingsOpportunityKwh: Number(savingsGoal.toFixed(2)),
    tips: ['Turn off unused lights and appliances.', 'Run full loads in the dishwasher and washing machine.', 'Use energy-efficient LED bulbs.', 'Unplug chargers and unused electronics.']
  };
}

app.get('/api/usage', function _callee(req, res) {
  var entries;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(getUsageEntries());

        case 3:
          entries = _context.sent;
          res.json(entries);
          _context.next = 11;
          break;

        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](0);
          console.error(_context.t0);
          res.status(500).json({
            error: 'Failed to retrieve usage data.'
          });

        case 11:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.post('/api/usage', function _callee2(req, res) {
  var _req$body, date, hours, watts, cost, entry;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body = req.body, date = _req$body.date, hours = _req$body.hours, watts = _req$body.watts, cost = _req$body.cost;

          if (!(!date || hours == null || watts == null || cost == null)) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            error: 'Please provide date, hours, watts, and cost.'
          }));

        case 3:
          _context2.prev = 3;
          _context2.next = 6;
          return regeneratorRuntime.awrap(addUsageEntry({
            date: date,
            hours: hours,
            watts: watts,
            cost: cost
          }));

        case 6:
          entry = _context2.sent;
          res.status(201).json(entry);
          _context2.next = 14;
          break;

        case 10:
          _context2.prev = 10;
          _context2.t0 = _context2["catch"](3);
          console.error(_context2.t0);
          res.status(500).json({
            error: 'Failed to save usage entry.'
          });

        case 14:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[3, 10]]);
});
app.get('/api/summary', function _callee3(req, res) {
  var entries;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(getUsageEntries());

        case 3:
          entries = _context3.sent;
          res.json(calculateSummary(entries));
          _context3.next = 11;
          break;

        case 7:
          _context3.prev = 7;
          _context3.t0 = _context3["catch"](0);
          console.error(_context3.t0);
          res.status(500).json({
            error: 'Failed to calculate summary.'
          });

        case 11:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.get('/api/suggestion-datasets', function (req, res) {
  res.json(suggestionDatasets);
});
initDb().then(function () {
  app.listen(port, function () {
    console.log("Energy Consumption Analyzer running at http://localhost:".concat(port));
  });
})["catch"](function (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
});