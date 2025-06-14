document.addEventListener('DOMContentLoaded', () => {
  const CSV_URL = './data.csv';

  fetch(CSV_URL)
    .then(response => response.text())
    .then(text => {
      const rows = text.trim().split('\n');
      const headers = rows[0].split(',');
      const dataRows = rows.slice(1).map(row => row.split(','));

      // Найти первую строку с forecast
      const forecastCols = headers.filter(h => h.startsWith('forecast') && h !== 'forecast_avg');
      const firstForecastIndex = dataRows.findIndex(row => {
        return forecastCols.some(col => {
          const idx = headers.indexOf(col);
          return row[idx] && row[idx].trim() !== '';
        });
      });

      // Отрезаем только строки с прогнозами
      const trimmedRows = dataRows.slice(firstForecastIndex);
      const dates = trimmedRows.map(r => new Date(r[0])); // Date-объекты для оси времени
      const datasets = [];

      const forecastColors = ['#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#8000ff', '#ff00ff', '#ff0080'];

      // Добавление forecastN
      forecastCols.forEach((col, i) => {
        const idx = headers.indexOf(col);
        datasets.push({
          label: col,
          data: trimmedRows.map(r => +r[idx] || null),
          borderColor: forecastColors[i % forecastColors.length],
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.3
        });
      });

      // Forecast average
      const forecastAvgIdx = headers.indexOf('forecast_avg');
      if (forecastAvgIdx !== -1) {
        datasets.push({
          label: 'Forecast Avg',
          data: trimmedRows.map(r => +r[forecastAvgIdx] || null),
          borderColor: '#0000ff',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3
        });
      }

      // BTC Actual
      const actualIdx = headers.indexOf('btc_actual');
      if (actualIdx !== -1) {
        const btcData = trimmedRows.map(r => +r[actualIdx] || null);
        const lastNonNullIndex = btcData.map((val, idx) => val ? idx : null).filter(v => v !== null).pop();
        datasets.push({
          label: 'BTC Actual',
          data: btcData,
          borderColor: '#f7931a',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: btcData.map((v, i) => i === lastNonNullIndex ? 4 : 0),
          pointBackgroundColor: '#f7931a',
          tension: 0.3
        });
      }

      // Moving Average
      const maIdx = headers.indexOf('moving_average');
      if (maIdx !== -1) {
        const maData = trimmedRows.map(r => +r[maIdx] || null);
        datasets.push({
          label: 'Moving Average',
          data: maData,
          borderColor: '#00c69e',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3
        });
      }

      // Рендер графика
      const ctx = document.getElementById('btcChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month',
                tooltipFormat: 'MMM dd',
                displayFormats: {
                  month: 'MMM'
                }
              },
              ticks: {
                color: '#ffffff'
              },
              grid: { color: '#555' }
            },
            y: {
              ticks: {
                callback: val => val.toString(),
                color: '#ffffff'
              },
              grid: { color: '#555' },
              title: {
                display: true,
                text: 'USD',
                color: '#ffffff',
                font: {
                  family: 'Menlo',
                  size: 14,
                  weight: 'bold'
                }
              }
            }
