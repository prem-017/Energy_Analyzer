// @ts-nocheck
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * @typedef {{ totalKwh: number, totalCost: number, averageDailyKwh: number, projectedMonthlyKwh: number, tips: string[] }} SummaryData
 */

/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntry
 */
var summaryCards =
/** @type {HTMLDivElement | null} */
document.getElementById('summaryCards');
var usageTable =
/** @type {HTMLTableElement | null} */
document.getElementById('usageTable');
var recommendationsList =
/** @type {HTMLOListElement | null} */
document.getElementById('recommendations');
var usageForm =
/** @type {HTMLFormElement | null} */
document.getElementById('usageForm');
var surveyForm =
/** @type {HTMLFormElement | null} */
document.getElementById('surveyForm');
var surveySuggestions =
/** @type {HTMLOListElement | null} */
document.getElementById('surveySuggestions');

function fetchSummary() {
  var response;
  return regeneratorRuntime.async(function fetchSummary$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(fetch('/api/summary'));

        case 2:
          response = _context.sent;
          return _context.abrupt("return",
          /** @type {Promise<SummaryData>} */
          response.json());

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}

function fetchUsage() {
  var response;
  return regeneratorRuntime.async(function fetchUsage$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(fetch('/api/usage'));

        case 2:
          response = _context2.sent;
          return _context2.abrupt("return",
          /** @type {Promise<UsageEntry[]>} */
          response.json());

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
}
/** @param {SummaryData} summary */


function renderSummary(summary) {
  if (!summaryCards || !recommendationsList) {
    return;
  }

  var cards = [{
    title: 'Total kWh',
    value: "".concat(summary.totalKwh, " kWh")
  }, {
    title: 'Total cost',
    value: "$".concat(summary.totalCost)
  }, {
    title: 'Avg daily usage',
    value: "".concat(summary.averageDailyKwh, " kWh")
  }, {
    title: 'Projected monthly',
    value: "".concat(summary.projectedMonthlyKwh, " kWh")
  }];
  summaryCards.innerHTML = cards.map(function (card) {
    return "\n      <article class=\"card\">\n        <h3>".concat(card.title, "</h3>\n        <p>").concat(card.value, "</p>\n      </article>\n    ");
  }).join('');
  recommendationsList.innerHTML = summary.tips.map(function (tip) {
    return "<li>".concat(tip, "</li>");
  }).join('');
}
/** @param {{
 *   familySize: number,
 *   totalRooms: number,
 *   ledBulbs: number,
 *   gridHours: number,
 *   refrigerators: number,
 *   waterMotors: number,
 *   fans: number,
 *   powerCutHours: number,
 *   monthlyIncome: number
 * }} data */


function generateSurveySuggestions(data) {
  var suggestions = [];
  var familySize = data.familySize,
      totalRooms = data.totalRooms,
      ledBulbs = data.ledBulbs,
      gridHours = data.gridHours,
      refrigerators = data.refrigerators,
      waterMotors = data.waterMotors,
      fans = data.fans,
      powerCutHours = data.powerCutHours,
      monthlyIncome = data.monthlyIncome;

  if (ledBulbs < totalRooms) {
    suggestions.push('Replace remaining bulbs with LEDs and switch off lights in empty rooms.');
  } else {
    suggestions.push('Your lighting setup is strong; keep lights only on in occupied spaces.');
  }

  if (refrigerators > 1) {
    suggestions.push('Multiple refrigerators can add cost; keep only active units plugged in and set temperatures efficiently.');
  } else if (refrigerators === 1) {
    suggestions.push('Maintain one fridge by keeping it well sealed and defrosted to save energy.');
  } else {
    suggestions.push('No refrigerators detected; ensure your cooling equipment, if any, is used efficiently.');
  }

  if (waterMotors > 0) {
    suggestions.push('Run water motors only when necessary and repair leaks to reduce pump runtime.');
  }

  if (fans > 0) {
    suggestions.push('Use fans in occupied rooms only and turn them off when not needed.');
  }

  if (gridHours < 12) {
    suggestions.push('With limited grid supply, use low-power devices and backup lighting during outages.');
  } else {
    suggestions.push('When grid power is available, shift heavy appliance use to daytime or off-peak hours.');
  }

  if (powerCutHours > 0) {
    suggestions.push('During frequent power cuts, unplug idle electronics to protect them and reduce phantom loads.');
  }

  if (familySize >= 5) {
    suggestions.push('Coordinate appliance use across the household to avoid running many devices simultaneously.');
  }

  if (monthlyIncome > 0 && monthlyIncome <= 30000) {
    suggestions.push('Prioritize low-cost savings like turning off unused lights, fans, and chargers.');
  } else if (monthlyIncome > 30000) {
    suggestions.push('Consider investing in efficient appliances, LED lighting, and smart power strips.');
  }

  if (totalRooms > familySize + 1) {
    suggestions.push('Close doors to unused rooms and focus lighting and fans only in occupied areas.');
  }

  if (suggestions.length === 0) {
    suggestions.push('Review device use and switch off appliances when not needed to lower the current bill.');
  }

  return suggestions;
}

function renderSurveySuggestions(suggestions) {
  if (!surveySuggestions) {
    return;
  }

  surveySuggestions.innerHTML = suggestions.map(function (item) {
    return "<li>".concat(item, "</li>");
  }).join('');
}
/** @param {UsageEntry[]} entries */


function renderUsage(entries) {
  if (!usageTable) {
    return;
  }

  usageTable.innerHTML = entries.map(function (entry) {
    var kwh = (entry.watts / 1000 * entry.hours).toFixed(2);
    return "\n        <tr>\n          <td>".concat(entry.date, "</td>\n          <td>").concat(entry.hours, "</td>\n          <td>").concat(entry.watts, "</td>\n          <td>").concat(kwh, "</td>\n          <td>$").concat(entry.cost.toFixed(2), "</td>\n        </tr>\n      ");
  }).join('');
}

function refresh() {
  var _ref, _ref2, summary, usage;

  return regeneratorRuntime.async(function refresh$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(Promise.all([fetchSummary(), fetchUsage()]));

        case 2:
          _ref = _context3.sent;
          _ref2 = _slicedToArray(_ref, 2);
          summary = _ref2[0];
          usage = _ref2[1];
          renderSummary(summary);
          renderUsage(usage);

        case 8:
        case "end":
          return _context3.stop();
      }
    }
  });
}

if (usageForm) {
  usageForm.addEventListener('submit', function _callee(event) {
    var formData, dateValue, hoursValue, wattsValue, costValue, payload;
    return regeneratorRuntime.async(function _callee$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            event.preventDefault();
            formData = new FormData(usageForm);
            dateValue = formData.get('date');
            hoursValue = formData.get('hours');
            wattsValue = formData.get('watts');
            costValue = formData.get('cost');
            payload = {
              date: typeof dateValue === 'string' ? dateValue : '',
              hours: parseFloat(typeof hoursValue === 'string' ? hoursValue : '0'),
              watts: parseInt(typeof wattsValue === 'string' ? wattsValue : '0', 10),
              cost: parseFloat(typeof costValue === 'string' ? costValue : '0')
            };
            _context4.next = 9;
            return regeneratorRuntime.awrap(fetch('/api/usage', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }));

          case 9:
            usageForm.reset();
            refresh();

          case 11:
          case "end":
            return _context4.stop();
        }
      }
    });
  });
}

if (surveyForm) {
  surveyForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(surveyForm);
    var data = {
      familySize: parseInt(String(formData.get('familySize') || '0'), 10),
      totalRooms: parseInt(String(formData.get('totalRooms') || '0'), 10),
      ledBulbs: parseInt(String(formData.get('ledBulbs') || '0'), 10),
      gridHours: parseFloat(String(formData.get('gridHours') || '0')),
      refrigerators: parseInt(String(formData.get('refrigerators') || '0'), 10),
      waterMotors: parseInt(String(formData.get('waterMotors') || '0'), 10),
      fans: parseInt(String(formData.get('fans') || '0'), 10),
      powerCutHours: parseInt(String(formData.get('powerCutHours') || '0'), 10),
      monthlyIncome: parseFloat(String(formData.get('monthlyIncome') || '0'))
    };
    var suggestions = generateSurveySuggestions(data);
    renderSurveySuggestions(suggestions);
  });
}

refresh();