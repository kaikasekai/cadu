const CSV_URL = './data.csv';  // путь к вашему CSV

// Функция парсинга CSV в объект с массивами данных
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');

  const data = {
    date: [],
    forecast1: [],
    forecast2: [],
    forecast3: [],
    forecast_avg: [],
    btc_actual: [],
    moving_average: []
  };

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    data.date.push(row[0]);
    data.forecast1.push(+row[1]);
    data.forecast2.push(+row[2]);
    data.forecast3.push(+row[3]);
    data.forecast_avg.push(+row[4]);
    data.btc_actual.push(row[5] === '' ? null : +row[5]);
    data.moving_average.push(row[6] === '' ? null : +row[6]);
  }

  return data;
}

// Функция отрисовки графика
function renderChart(data) {
  const ctx = document.getElementById('btcChart').getContext('2d');

  // Если график уже создан — уничтожаем, чтобы обновить
  if (window.btcChartInstance) {
    window.btcChartInstance.destroy();
  }

  window.btcChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.date,
      datasets: [
        {
          label: 'Forecast 1',
          data: data.forecast1,
          borderColor: '#4caf50',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Forecast 2',
          data: data.forecast2,
          borderColor: '#2196f3',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Forecast 3',
          data: data.forecast3,
          borderColor: '#ff9800',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Average Forecast',
          data: data.forecast_avg,
          borderColor: '#9c27b0',
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [5, 5],
          tension: 0.3,
        },
        {
          label: 'BTC Actual',
          data: data.btc_actual,
          borderColor: '#f44336',
          backgroundColor: 'transparent',
          borderWidth: 3,
          tension: 0.3,
          spanGaps: true,  // чтобы линия не обрывалась на null
        },
        {
          label: '30-day Moving Average',
          data: data.moving_average,
          borderColor: '#607d8b',
          backgroundColor: 'transparent',
          borderWidth: 3,
          borderDash: [10, 5],
          tension: 0.3,
          spanGaps: true,
        },
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      stacked: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#333',
            font: {
              size: 14,
            }
          }
        },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
        }
      },
      scales: {
        x: {
          ticks: { color: '#555' },
          grid: { color: '#eee' },
          title: {
            display: true,
            text: 'Date',
            color: '#555',
            font: { size: 16 }
          }
        },
        y: {
          ticks: { color: '#555' },
          grid: { color: '#eee' },
          title: {
            display: true,
            text: 'Price (USD)',
            color: '#555',
            font: { size: 16 }
          },
          beginAtZero: false,
        }
      }
    }
  });
}

async function fetchAndRenderChart() {
  console.log('Fetching CSV from:', CSV_URL);
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const text = await res.text();

    console.log('CSV raw text preview:\n', text.split('\n').slice(0, 5).join('\n'));

    const data = parseCSV(text);
    console.log('Parsed data:', data);

    renderChart(data);
  } catch (error) {
    console.
      error('Error fetching or parsing CSV:', error);
  }
}

fetchAndRenderChart();
