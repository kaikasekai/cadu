fetch('data.csv')
  .then(response => response.text())
  .then(text => {
    const rows = text.trim().split('\n').slice(1);
    const headers = text.trim().split('\n')[0].split(',');
    const dateIndex = headers.indexOf('date');
    const actualIndex = headers.indexOf('btc_actual');
    const maIndex = headers.indexOf('moving_average');
    const avgIndex = headers.indexOf('forecast_avg');
    const forecastIndexes = headers
      .map((h, i) => h.startsWith('forecast') && !['forecast_avg'].includes(h) ? i : null)
      .filter(i => i !== null);

    const labels = [];
    const datasets = [];

    const forecastDatasets = forecastIndexes.map((_, i) => ({
      label: `Forecast ${i + 1}`,
      borderColor: ['#ff8000','#ffff00','#80ff00','#00ff00','#00ff80','#00ffff','#0080ff','#8000ff','#ff00ff','#ff0080'][i % 10],
      data: [],
      fill: false,
      borderWidth: 1,
      pointRadius: 0,
    }));

    const forecastAvg = {
      label: 'Forecast Avg',
      borderColor: '#0000ff',
      data: [],
      fill: false,
      borderWidth: 2,
      pointRadius: 0,
    };

    const btcActual = {
      label: 'BTC Actual',
      borderColor: '#f7931a',
      data: [],
      fill: false,
      borderWidth: 2,
      pointRadius: 0,
    };

    const movingAverage = {
      label: 'Moving Avg',
      borderColor: '#00c69e',
      data: [],
      fill: false,
      borderWidth: 2,
      pointRadius: 0,
    };

    rows.forEach(row => {
      const cols = row.split(',');
      const date = cols[dateIndex];
      const hasForecast = forecastIndexes.some(i => cols[i]);
      const hasActual = cols[actualIndex];
      const hasMA = cols[maIndex];
      if (!(hasForecast  hasActual  hasMA)) return;
      labels.push(date);

      forecastIndexes.forEach((i, idx) => {
        forecastDatasets[idx].data.push({ x: date, y: +cols[i] });
      });

      forecastAvg.data.push({ x: date, y: +cols[avgIndex] });

      if (cols[actualIndex]) {
        btcActual.data.push({ x: date, y: +cols[actualIndex] });
      }

      if (cols[maIndex]) {
        movingAverage.data.push({ x: date, y: +cols[maIndex] });
      }
    });

    const ctx = document.getElementById('btcChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          ...forecastDatasets,
          forecastAvg,
          btcActual,
          movingAverage,
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              callback: function(value, index) {
                const date = this.getLabelForValue(value);
                const d = new Date(date);
                return `${d.getMonth()+1}/${d.getDate()}`;
              },
              color: 'white',
            },
            grid: { color: '#555' }
          },
          y: {
            ticks: {
              callback: val => val,
              color: 'white',
            },
            grid: { color: '#555' }
          }
        },
        plugins: {
          legend: { labels: { color: 'white' } }
        }
      }
    });
  });
