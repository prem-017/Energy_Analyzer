/**
 * @typedef {{ totalKwh: number, totalCost: number, averageDailyKwh: number, projectedMonthlyKwh: number, tips: string[] }} SummaryData
 */
/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntry
 */
/**
 * @typedef {{
 *   lighting?: { needsMoreLED?: string[], goodCoverage?: string[] },
 *   refrigeration?: { multiple?: string[], single?: string[], none?: string[] },
 *   waterMotors?: string[],
 *   fans?: string[],
 *   gridHours?: { limited?: string[], available?: string[] },
 *   powerCuts?: string[],
 *   household?: string[],
 *   income?: { low?: string[], high?: string[] },
 *   unusedRooms?: string[],
 *   online?: { highUsage?: string[], activeUse?: string[], unused?: string[] },
 *   fallback?: string[]
 * }} SuggestionDataset
 */

const summaryCards = /** @type {HTMLDivElement | null} */ (document.getElementById('summaryCards'));
const usageTable = /** @type {HTMLTableElement | null} */ (document.getElementById('usageTable'));
const recommendationsList = /** @type {HTMLOListElement | null} */ (document.getElementById('recommendations'));
const usageForm = /** @type {HTMLFormElement | null} */ (document.getElementById('usageForm'));
const surveyForm = /** @type {HTMLFormElement | null} */ (document.getElementById('surveyForm'));
const surveySuggestions = /** @type {HTMLOListElement | null} */ (document.getElementById('surveySuggestions'));

/** @type {SuggestionDataset | null} */
let suggestionDataset = null;

async function fetchSummary() {
  const response = await fetch('/api/summary');
  return /** @type {Promise<SummaryData>} */ (response.json());
}

async function fetchUsage() {
  const response = await fetch('/api/usage');
  return /** @type {Promise<UsageEntry[]>} */ (response.json());
}

/** @param {SummaryData} summary */
function renderSummary(summary) {
  if (!summaryCards || !recommendationsList) {
    return;
  }

  const cards = [
    { title: 'Total kWh', value: `${summary.totalKwh} kWh` },
    { title: 'Total cost', value: `$${summary.totalCost}` },
    { title: 'Avg daily usage', value: `${summary.averageDailyKwh} kWh` },
    { title: 'Projected monthly', value: `${summary.projectedMonthlyKwh} kWh` }
  ];

  summaryCards.innerHTML = cards
    .map(card => `
      <article class="card">
        <h3>${card.title}</h3>
        <p>${card.value}</p>
      </article>
    `)
    .join('');

  recommendationsList.innerHTML = summary.tips
    .map(tip => `<li>${tip}</li>`)
    .join('');
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
 *   onlineHours: number,
 *   monthlyIncome: number
 * }} data */
function generateSurveySuggestions(data) {
  const suggestions = [];
  const {
    familySize,
    totalRooms,
    ledBulbs,
    gridHours,
    refrigerators,
    waterMotors,
    fans,
    powerCutHours,
    onlineHours,
    monthlyIncome
  } = data;

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
    suggestions.push(
      suggestionDataset?.gridHours?.limited?.[0] ||
      'With limited grid supply, use low-power devices and backup lighting during outages.'
    );
  } else {
    suggestions.push(
      suggestionDataset?.gridHours?.available?.[0] ||
      'When grid power is available, shift heavy appliance use to daytime or off-peak hours.'
    );
  }

  if (powerCutHours > 0) {
    suggestions.push(
      suggestionDataset?.powerCuts?.[0] ||
      'During frequent power cuts, unplug idle electronics to protect them and reduce phantom loads.'
    );
  }

  if (familySize >= 5) {
    suggestions.push('Coordinate appliance use across the household to avoid running many devices simultaneously.');
  }

  if (monthlyIncome > 0 && monthlyIncome <= 30000) {
    suggestions.push(
      suggestionDataset?.income?.low?.[0] ||
      'Prioritize low-cost savings like turning off unused lights, fans, and chargers.'
    );
  } else if (monthlyIncome > 30000) {
    suggestions.push(
      suggestionDataset?.income?.high?.[0] ||
      'Consider investing in efficient appliances, LED lighting, and smart power strips.'
    );
  }

  if (totalRooms > familySize + 1) {
    suggestions.push(
      suggestionDataset?.unusedRooms?.[0] ||
      'Close doors to unused rooms and focus lighting and fans only in occupied areas.'
    );
  }

  if (onlineHours >= 4) {
    suggestions.push(
      suggestionDataset?.online?.highUsage?.[0] ||
      'Limit online streaming and reduce energy draw by using energy-efficient devices and lower screen brightness.'
    );
  } else if (onlineHours > 0) {
    suggestions.push(
      suggestionDataset?.online?.activeUse?.[0] ||
      'Power down routers and online devices when not in use to cut standby energy use.'
    );
  } else {
    suggestions.push(
      suggestionDataset?.online?.unused?.[0] ||
      'Keep online devices off when internet activity is not needed to save energy.'
    );
  }

  if (suggestions.length === 0) {
    suggestions.push('Review device use and switch off appliances when not needed to lower the current bill.');
  }

  return suggestions;
}

/** @param {string[]} suggestions */
/** @param {string[]} suggestions */
function renderSurveySuggestions(suggestions) {
  if (!surveySuggestions) {
    return;
  }
  surveySuggestions.innerHTML = suggestions.map((item) => `<li>${item}</li>`).join('');
}

/** @param {UsageEntry[]} entries */
function renderUsage(entries) {
  if (!usageTable) {
    return;
  }

  usageTable.innerHTML = entries
    .map(entry => {
      const kwh = ((entry.watts / 1000) * entry.hours).toFixed(2);
      return `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.hours}</td>
          <td>${entry.watts}</td>
          <td>${kwh}</td>
          <td>$${entry.cost.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');
}

/** @returns {Promise<SuggestionDataset>} */
async function fetchSuggestionDatasets() {
  const response = await fetch('/api/suggestion-datasets');
  return /** @type {Promise<SuggestionDataset>} */ (response.json());
}

async function refresh() {
  const [summary, usage, datasets] = await Promise.all([
    fetchSummary(),
    fetchUsage(),
    fetchSuggestionDatasets()
  ]);
  suggestionDataset = datasets;
  renderSummary(summary);
  renderUsage(usage);
}

if (usageForm) {
  usageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(usageForm);
    const dateValue = formData.get('date');
    const hoursValue = formData.get('hours');
    const wattsValue = formData.get('watts');
    const costValue = formData.get('cost');

    const payload = {
      date: typeof dateValue === 'string' ? dateValue : '',
      hours: parseFloat(typeof hoursValue === 'string' ? hoursValue : '0'),
      watts: parseInt(typeof wattsValue === 'string' ? wattsValue : '0', 10),
      cost: parseFloat(typeof costValue === 'string' ? costValue : '0')
    };

    await fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    usageForm.reset();
    refresh();
  });
}

if (surveyForm) {
  surveyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(surveyForm);
    const data = {
      familySize: parseInt(String(formData.get('familySize') || '0'), 10),
      totalRooms: parseInt(String(formData.get('totalRooms') || '0'), 10),
      ledBulbs: parseInt(String(formData.get('ledBulbs') || '0'), 10),
      gridHours: parseFloat(String(formData.get('gridHours') || '0')),
      refrigerators: parseInt(String(formData.get('refrigerators') || '0'), 10),
      waterMotors: parseInt(String(formData.get('waterMotors') || '0'), 10),
      fans: parseInt(String(formData.get('fans') || '0'), 10),
      powerCutHours: parseInt(String(formData.get('powerCutHours') || '0'), 10),
      onlineHours: parseFloat(String(formData.get('onlineHours') || '0')),
      monthlyIncome: parseFloat(String(formData.get('monthlyIncome') || '0'))
    };

    const suggestions = generateSurveySuggestions(data);
    renderSurveySuggestions(suggestions);
  });
}

refresh();
