const CSV_URL = './data.csv';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const data = {};
  headers.forEach(h => data[h] = []);
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    headers.forEach((h, j) => {
      const v = row[j];
      data[h].push(v === '' || v === '---' ? null : (h === 'date' ? v : +v));
    });
  }
  return { headers, data };
}

function calculateMovingAverage(arr, window = 30) {
  return arr.map((val, i) => {
    const slice = arr.slice(Math.max(0, i - window + 1), i + 1).filter(v => v != null);
    return slice.length === window ? + (slice.reduce((a, b) => a + b, 0) / window).toFixed(2) : null;
  });
}

function getColorForForecast(label) {
  const palette = ['#ff8000', '#ffff00', '#80ff00', '#00ff00',
                   '#00ff80', '#00ffff', '#0080ff', '#8000ff',
                   '#ff00ff', '#ff0080'];
  const n = +label.replace('forecast', '') - 1;
  return palette[n % palette.length];
}

function deriveDatasets(headers, data) {
  const ds = [];
  headers.forEach(h => {
    if (h.startsWith('forecast') && h !== 'forecast_avg') {
      ds.push({
        label: h.replace('forecast', 'Forecast '),
        data: data[h],
        borderColor: getColorForForecast(h),
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        hidden: false,
      });
    }
  });
  if (headers.includes('forecast_avg')) {
    ds.push({
      label: 'Forecast Avg',
      data: data['forecast_avg'],
      borderColor: '#0000ff',
      borderWidth: 3,
      tension: 0.3,
      pointRadius: ctx => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
    });
  }
  if (headers.includes('btc_actual')) {
    ds.push({
      label: 'BTC Actual',
      data: data['btc_actual'],
      borderColor: '#f7931a',
      borderWidth: 3,
      tension: 0.3,
      pointRadius: ctx => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
    });
  }
  if (headers.includes('moving_average')) {
    ds.push({
      label: '30‑day MA',
      data: data['moving_average'],
      borderColor: '#00c69e',
      borderWidth: 3,
      tension: 0.3,
      pointRadius: 0,
      borderDash: [10, 5],
    });
  }
  return ds;
}

function calculateAccuracy(forecast, actual) {
  let sum = 0, cnt = 0;
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i] != null && actual[i] != null) {
      sum += Math.abs(forecast[i] - actual[i]);
      cnt++;
    }
  }
  return cnt ? (sum / cnt).toFixed(2) : 'N/A';
}

async function fetchAndRender() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    const { headers, data } = parseCSV(text);
    if (!data['moving_average']) {
      data['moving_average'] = calculateMovingAverage(data['btc_actual']);
    }

    const ds = deriveDatasets(headers, data);

    const ctx = document.getElementById('btcChart').getContext('2d');
    if (window.btcChart) window.btcChart.destroy();
    window.btcChart = new Chart(ctx, {
      type: 'line',
      data: { labels: data['date'], datasets: ds },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#fff' } } },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'YYYY-MM-DD' },
            ticks: { color: '#fff', autoSkip: true, maxTicksLimit: 12 },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: '#fff', callback: v => v.toString() },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });

    const accuracy = calculateAccuracy(data['forecast_avg'], data['btc_actual']);
    document.getElementById('accuracy').textContent = accuracy;
  } catch (e) {
    console.error('Error loading or rendering:', e);
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRender);
