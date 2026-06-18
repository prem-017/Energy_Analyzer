/**
 * @typedef {{ totalKwh: number, totalCost: number, averageDailyKwh: number, projectedMonthlyKwh: number, tips: string[] }} SummaryData
 */
/**
 * @typedef {{ date: string, hours: number, watts: number, cost: number }} UsageEntry
 */

const summaryCards = /** @type {HTMLDivElement | null} */ (document.getElementById('summaryCards'));
const usageTable = /** @type {HTMLTableElement | null} */ (document.getElementById('usageTable'));
const recommendationsList = /** @type {HTMLOListElement | null} */ (document.getElementById('recommendations'));
const usageForm = /** @type {HTMLFormElement | null} */ (document.getElementById('usageForm'));

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

async function refresh() {
  const [summary, usage] = await Promise.all([fetchSummary(), fetchUsage()]);
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

refresh();
