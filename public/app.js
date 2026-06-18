const summaryCards = document.getElementById('summaryCards');
const usageTable = document.getElementById('usageTable');
const recommendationsList = document.getElementById('recommendations');
const usageForm = document.getElementById('usageForm');

async function fetchSummary() {
  const response = await fetch('/api/summary');
  return response.json();
}

async function fetchUsage() {
  const response = await fetch('/api/usage');
  return response.json();
}

function renderSummary(summary) {
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

function renderUsage(entries) {
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

usageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(usageForm);
  const payload = {
    date: formData.get('date'),
    hours: parseFloat(formData.get('hours')),
    watts: parseInt(formData.get('watts'), 10),
    cost: parseFloat(formData.get('cost'))
  };
  await fetch('/api/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  usageForm.reset();
  refresh();
});

refresh();
