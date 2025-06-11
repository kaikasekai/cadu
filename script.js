const CSV_URL = './data.csv';

async function fetchCSV(url) {
  const res = await fetch(url);
  const text = await res.text();
  return parseCSV(text);
}

function parseCSV(data) {
  const lines = data.trim().split('\n');
  const rows = lines.slice(1).map(line => line.split(','));

  const dates = [];
  const forecasts = [[], [], []];
  const forecastAvg = [];
  const actual = [];
  const movingAvg = [];

  rows.forEach(row => {
    dates.push(row[0]);
    forecasts[0].push(+row[1]);
    forecasts[1].push(+row[2]);
    forecasts[2].push(+row[3]);
    forecastAvg.push(+row[4]);
    actual.push(row[5] !== '---' ? +row[5] : null);
    movingAvg.push(row[6] !== '---' ? +row[6] : null);
  });

  return { dates, forecasts, forecastAvg, actual, movingAvg };
}

function calculateAccuracy(forecastAvg, actual) {
  let totalError = 0;
  let count = 0;
  for (let i = 0; i < forecastAvg.length; i++) {
    if (actual[i] != null) {
      totalError += Math.abs(forecastAvg[i] - actual[i]);
      count++;
    }
  }
  return count ? (totalError / count).toFixed(2) : 'N/A';
}

function renderChart(data) {
  const ctx = document.getElementById('btcChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.dates,
      datasets: [
        { label: 'Forecast 1', data: data.forecasts[0], borderColor: '#FF6B6B', fill: false },
        { label: 'Forecast 2', data: data.forecasts[1], borderColor: '#FFD93D', fill: false },
        { label: 'Forecast 3', data: data.forecasts[2], borderColor: '#6BCB77', fill: false },
        { label: 'Forecast Avg', data: data.forecastAvg, borderColor: '#4D96FF', borderWidth: 2, fill: false },
        { label: 'BTC Actual', data: data.actual, borderColor: '#1B9CFC', borderDash: [5, 5], fill: false },
        { label: '30-Day Moving Avg', data: data.movingAvg, borderColor: '#8E44AD', borderDash: [2, 2], fill: false }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: { y: { beginAtZero: false } }
    }
  });
}

async function main() {
  const data = await fetchCSV(CSV_URL);
  const accuracy = calculateAccuracy(data.forecastAvg, data.actual);
  document.getElementById('accuracy').textContent = ${accuracy} USD;
  renderChart(data);
}

main();
