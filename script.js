document.addEventListener("DOMContentLoaded", function () {
  fetch("data.csv")
    .then(response => response.text())
    .then(csvText => {
      const rows = csvText.trim().split("\n").map(row => row.split(","));
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1).map(row =>
        row.reduce((obj, val, i) => {
          obj[headers[i]] = val.trim();
          return obj;
        }, {})
      );

      // Не отображать первые 30 строк (где только btc_actual)
      const forecastStartIndex = dataRows.findIndex(row =>
        headers.some(h => h.startsWith("forecast") && row[h])
      );
      const displayData = dataRows.slice(forecastStartIndex);

      const labels = displayData.map(row => row.date);

      const datasets = [];

      // Цвета линий
      const colors = {
        btc_actual: "#f7931a",
        moving_average: "#00c69e",
        forecast_avg: "#0000ff",
        forecasts: [
          "#ff8000", "#ffff00", "#80ff00", "#00ff00", "#00ff80",
          "#00ffff", "#0080ff", "#8000ff", "#ff00ff", "#ff0080"
        ]
      };

      // Добавляем фактический BTC
      datasets.push({
        label: "BTC Actual",
        data: displayData.map(row => row.btc_actual ? +row.btc_actual : null),
        borderColor: colors.btc_actual,
        backgroundColor: colors.btc_actual,
        borderWidth: 2,
        pointRadius: displayData.map((_, i, arr) => (i === arr.length - 1 ? 4 : 0)),
        tension: 0.3
      });

      // Moving Average
      datasets.push({
        label: "Moving Average (30d)",
        data: displayData.map(row => row.moving_average ? +row.moving_average : null),
        borderColor: colors.moving_average,
        backgroundColor: colors.moving_average,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.3
      });

      // Forecast Average
      if (headers.includes("forecast_avg")) {
        datasets.push({
          label: "Forecast Avg",
          data: displayData.map(row => row.forecast_avg ? +row.forecast_avg : null),
          borderColor: colors.forecast_avg,
          backgroundColor: colors.forecast_avg,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3
        });
      }

      // Все forecastN
      let forecastColorIndex = 0;
      headers.forEach(h => {
        if (/^forecast\d+$/i.test(h)) {
          datasets.push({
            label: h,
            data: displayData.map(row => row[h] ? +row[h] : null),
            borderColor: colors.forecasts[forecastColorIndex % colors.forecasts.length],
            backgroundColor: colors.forecasts[forecastColorIndex % colors.forecasts.length],
            borderWidth: 1,
            pointRadius: 0,
            borderDash: [2, 2],
            tension: 0.2
          });
          forecastColorIndex++;
        }
      });

      const ctx = document.getElementById("btcChart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              ticks: {
                callback: function (val, index) {
                  const date = new Date(labels[index]);
                  const options = { month: "short" };
                  const day = date.getDate();
                  if (day < 8) return ${date.toLocaleDateString("en", options)} 1;
                  if (day < 15) return ${date.toLocaleDateString("en", options)} 2;
                  if (day < 22) return ${date.toLocaleDateString("en", options)} 3;
                  return ${date.toLocaleDateString("en", options)} 4;
                },
                maxRotation: 0,
                autoSkip: true
              },
              grid: { color: "#555" }
            },
            y: {
              ticks: {
                callback: val => val,
                precision: 0
              },
              grid: { color: "#555" }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: "#fff",
                font: {
                  family: "Menlo"
                }
              }
            }
          }
        }
      });
    });
});
