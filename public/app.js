// ============================
// Energy Consumption Analyzer
// ============================

/**
 * @typedef {{ date: string, hours: number, watts: number, kwh: string, cost: number }} UsageEntry
 */

/** @type {UsageEntry[]} */
let usageData = [];
try {
  const savedUsageData = localStorage.getItem("usageData");
  if (savedUsageData) {
    usageData = /** @type {UsageEntry[]} */ (JSON.parse(savedUsageData));
  }
} catch (error) {
  console.warn('Unable to parse saved usage data. Resetting local storage cache.', error);
  usageData = [];
}

/** @type {HTMLFormElement} */
const usageForm = /** @type {HTMLFormElement} */ (document.getElementById("usageForm"));
/** @type {HTMLFormElement} */
const surveyForm = /** @type {HTMLFormElement} */ (document.getElementById("surveyForm"));

/** @type {HTMLTableSectionElement} */
const usageTable = /** @type {HTMLTableSectionElement} */ (document.getElementById("usageTable"));
/** @type {HTMLUListElement} */
const recommendations = /** @type {HTMLUListElement} */ (document.getElementById("recommendations"));
/** @type {HTMLUListElement} */
const surveySuggestions = /** @type {HTMLUListElement} */ (document.getElementById("surveySuggestions"));
/** @type {HTMLElement} */
const summaryCards = /** @type {HTMLElement} */ (document.getElementById("summaryCards"));
/** @type {HTMLCanvasElement} */
const energyChart = /** @type {HTMLCanvasElement} */ (document.getElementById("energyChart"));

if (!usageForm || !surveyForm || !usageTable || !recommendations || !surveySuggestions || !summaryCards || !energyChart) {
  throw new Error('Missing required DOM elements for Energy Consumption Analyzer');
}

/** @type {any} */
const ChartConstructor = (/** @type {any} */ (window)).Chart;

/** @type {any | null} */
let chart = null;

// ====================================
// ENERGY SAVING DATASET
// ====================================

const energyDataset = [
  {
    condition: "high_fans",
    suggestion:
      "You have many fans. Consider using BLDC energy-efficient fans to reduce electricity consumption by up to 65%."
  },
  {
    condition: "high_led",
    suggestion:
      "Great job using LED bulbs. Continue replacing older bulbs with LEDs."
  },
  {
    condition: "high_ac",
    suggestion:
      "Set AC temperature between 24°C and 26°C to save energy."
  },
  {
    condition: "many_refrigerators",
    suggestion:
      "Avoid frequently opening refrigerator doors to reduce power consumption."
  },
  {
    condition: "solar_missing",
    suggestion:
      "Consider installing rooftop solar panels to reduce monthly electricity costs."
  },
  {
    condition: "high_online",
    suggestion:
      "Turn off devices when not in use to reduce standby power losses."
  },
  {
    condition: "low_income",
    suggestion:
      "Use energy-efficient appliances and LEDs to minimize electricity expenses."
  },
  {
    condition: "power_cuts",
    suggestion:
      "Consider inverter systems or solar backup solutions for frequent power cuts."
  }
];

// ====================================
// ADD USAGE ENTRY
// ====================================

usageForm.addEventListener("submit", function (e) {

  e.preventDefault();

  const formData = new FormData(usageForm);

  const date = String(formData.get("date") ?? "");
  const hours = parseFloat(String(formData.get("hours") ?? "0"));
  const watts = parseFloat(String(formData.get("watts") ?? "0"));
  const cost = parseFloat(String(formData.get("cost") ?? "0"));

  const kwh = ((hours * watts) / 1000).toFixed(2);

  usageData.push({
    date,
    hours,
    watts,
    kwh,
    cost
  });

  localStorage.setItem(
    "usageData",
    JSON.stringify(usageData)
  );

  usageForm.reset();

  renderTable();
  updateDashboard();
  updateChart();
  generateRecommendations();
});

// ====================================
// RENDER TABLE
// ====================================

function renderTable() {

  usageTable.innerHTML = "";

  usageData.forEach(entry => {

    usageTable.innerHTML += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.hours}</td>
        <td>${entry.watts}</td>
        <td>${entry.kwh}</td>
        <td>₹${entry.cost}</td>
      </tr>
    `;
  });
}

// ====================================
// DASHBOARD
// ====================================

function updateDashboard() {

  const totalEnergyValue = usageData
    .reduce((sum, item) => sum + Number(item.kwh), 0);

  const totalEnergy = totalEnergyValue.toFixed(2);

  const totalCost = usageData
    .reduce((sum, item) => sum + item.cost, 0)
    .toFixed(2);

  const avgEnergy =
    usageData.length > 0
      ? (totalEnergyValue / usageData.length).toFixed(2)
      : "0.00";

  summaryCards.innerHTML = `
  
  <div class="card">
      <h3>Total Energy</h3>
      <p>${totalEnergy} kWh</p>
  </div>

  <div class="card">
      <h3>Total Cost</h3>
      <p>₹${totalCost}</p>
  </div>

  <div class="card">
      <h3>Total Entries</h3>
      <p>${usageData.length}</p>
  </div>

  <div class="card">
      <h3>Average Usage</h3>
      <p>${avgEnergy} kWh</p>
  </div>
  
  `;
}

// ====================================
// CHART
// ====================================

function updateChart() {
  if (!ChartConstructor) {
    console.error('Chart.js is not loaded.');
    return;
  }

  const ctx = /** @type {HTMLCanvasElement} */ (energyChart);

  const labels =
    usageData.map(item => item.date);

  const values =
    usageData.map(item => item.kwh);

  if (chart) {
    chart.destroy();
  }

  chart = new ChartConstructor(ctx, {

    type: "bar",

    data: {
      labels: labels,

      datasets: [{
        label: "Energy Usage (kWh)",
        data: values,
        borderWidth: 1
      }]
    },

    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ====================================
// RECOMMENDATIONS FROM USAGE
// ====================================

function generateRecommendations() {

  recommendations.innerHTML = "";

  const totalEnergy =
    usageData.reduce(
      (sum, item) => sum + Number(item.kwh),
      0
    );

  if (totalEnergy > 50) {

    recommendations.innerHTML += `
      <li>
      High energy consumption detected.
      Consider reducing appliance usage.
      </li>
    `;
  }

  if (totalEnergy > 100) {

    recommendations.innerHTML += `
      <li>
      Your household may benefit from
      solar energy installation.
      </li>
    `;
  }

  if (usageData.length === 0) {

    recommendations.innerHTML += `
      <li>No data available.</li>
    `;
  }
}

// ====================================
// SURVEY ANALYSIS
// ====================================

surveyForm.addEventListener(
  "submit",
  function (e) {

    e.preventDefault();

    const formData =
      new FormData(surveyForm);

    const fans =
      Number(String(formData.get("fans") ?? "0"));

    const leds =
      Number(String(formData.get("ledBulbs") ?? "0"));

    const refrigerators =
      Number(String(formData.get("refrigerators") ?? "0"));

    const ac =
      Number(String(formData.get("ac") ?? "0"));

    const online =
      Number(String(formData.get("onlineHours") ?? "0"));

    const income =
      Number(String(formData.get("monthlyIncome") ?? "0"));

    const powerCuts =
      Number(String(formData.get("powerCutHours") ?? "0"));

    const solar =
      String(formData.get("solar") ?? "yes");

    surveySuggestions.innerHTML = "";

    let results = [];

      const findSuggestion = /** @type {(condition: string) => string} */ ((condition) =>
      energyDataset.find(d => d.condition === condition)?.suggestion || ""
    );

    if (fans >= 5)
      results.push(findSuggestion("high_fans"));

    if (leds >= 10)
      results.push(findSuggestion("high_led"));

    if (ac >= 1)
      results.push(findSuggestion("high_ac"));

    if (refrigerators >= 2)
      results.push(findSuggestion("many_refrigerators"));

    if (online > 8)
      results.push(findSuggestion("high_online"));

    if (income < 25000)
      results.push(findSuggestion("low_income"));

    if (powerCuts > 10)
      results.push(findSuggestion("power_cuts"));

    if (solar === "no")
      results.push(findSuggestion("solar_missing"));

    if (results.length === 0) {

      results.push(
        "Excellent! Your household already follows many energy-efficient practices."
      );
    }

    results.forEach(item => {

      surveySuggestions.innerHTML += `
      <li>${item}</li>
      `;
    });
  }
);

// ====================================
// CSV EXPORT
// ====================================

/** @type {HTMLButtonElement | null} */
const exportCsvButton = /** @type {HTMLButtonElement | null} */ (document.getElementById("exportCSV"));
if (exportCsvButton) {
  exportCsvButton.addEventListener("click", () => {

    let csv =
      "Date,Hours,Watts,kWh,Cost\n";

    usageData.forEach(item => {
      csv += `${item.date},${item.hours},${item.watts},${item.kwh},${item.cost}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "energy_usage.csv";
    a.click();

    URL.revokeObjectURL(url);
  });
}

/** @type {HTMLButtonElement | null} */
const exportPdfButton = /** @type {HTMLButtonElement | null} */ (document.getElementById("exportPDF"));
if (exportPdfButton) {
  exportPdfButton.addEventListener("click", () => {
    window.print();
  });
}

// ====================================
// INITIAL LOAD
// ====================================

renderTable();
updateDashboard();
updateChart();
generateRecommendations();
