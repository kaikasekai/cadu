document.addEventListener('DOMContentLoaded', () => {
  const CSV_URL = './data.csv';

  fetch(CSV_URL)
    .then(response => response.text())
    .then(text => {
      // Разбиваем CSV на строки и извлекаем заголовки
      const rows = text.trim().split('\n');
      const headers = rows[0].split(',');
      const dataRows = rows.slice(1).map(row => row.split(','));

      // Найдем индекс первой строки, где присутствует хотя бы один прогноз (forecastX)
      const forecastCols = headers.filter(h => h.startsWith('forecast') && h !== 'forecast_avg');
      const firstForecastIndex = dataRows.findIndex(row =>
        forecastCols.some(col => {
          const idx = headers.indexOf(col);
          return row[idx] && row[idx].trim() !== '';
        })
      );
      
      // Если прогнозов нет, ничего не рисуем
      if (firstForecastIndex === -1) {
        console.error("No forecast data found in CSV.");
        return;
      }

      // Обрезаем данные — используем строки, начиная с первой с forecast'ами
      const trimmedRows = dataRows.slice(firstForecastIndex);
      const dates = trimmedRows.map(r => r[0]);

      // Функция для создания набора данных для каждой колонки
      const datasets = [];
      const forecastColors = ['#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#8000ff', '#ff00ff', '#ff0080'];

      // Добавляем прогнозные линии (forecast1, forecast2, ...)
      forecastCols.forEach((col, i) => {
        const idx = headers.indexOf(col);
        datasets.push({
          label: col.replace('forecast', 'Forecast '),
          data: trimmedRows.map(r => {
            const n = parseFloat(r[idx]);
            return isNaN(n) ? null : n;
          }),
          borderColor: forecastColors[i % forecastColors.length],
          backgroundColor: 'transparent',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.3
        });
      });

      // Добавляем линию Forecast Avg (если есть)
      const forecastAvgIdx = headers.indexOf('forecast_avg');
      if (forecastAvgIdx !== -1) {
        datasets.push({
          label: 'Forecast Avg',
          data: trimmedRows.map(r => {
            const n = parseFloat(r[forecastAvgIdx]);
            return isNaN(n) ? null : n;
          }),
          borderColor: '#0000ff',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3
        });
      }

      // Добавляем линию BTC Actual (если есть)
      const actualIdx = headers.indexOf('btc_actual');
      if (actualIdx !== -1) {
        const btcData = trimmedRows.map(r => {
          const n = parseFloat(r[actualIdx]);
          return isNaN(n) ? null : n;
        });
        // Вычисляем индекс последнего ненулевого значения, чтобы оставить маркер
        const lastNonNullIndex = btcData.map((val, idx) => (val != null ? idx : null))
                                         .filter(v => v !== null)
                                         .pop();
        datasets.push({
          label: 'BTC Actual',
          data: btcData,
          borderColor: '#f7931a',
          backgroundColor: 'transparent',
          borderWidth: 2,
          // Отображаем маркер только для последней ненулевой точки
          pointRadius: btcData.map((v, i) => i === lastNonNullIndex ? 4 : 0),
          pointBackgroundColor: '#f7931a',
          tension: 0.3
        });
      }

      // Добавляем линию Moving Average (если есть)
      const maIdx = headers.indexOf('moving_average');
      if (maIdx !== -1) {
        datasets.push({
          label: 'Moving Average',
          data: trimmedRows.map(r => {
            const n = parseFloat(r[maIdx]);
            return isNaN(n) ? null : n;
          }),
          borderColor: '#00c69e',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [10, 5],
          tension: 0.3
        });
      }

      // Создаем график
      const ctx = document.getElementById('btcChart').getContext('2d');
      new Chart(ctx, {
