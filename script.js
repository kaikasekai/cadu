async function loadCSV() {
  const res = await fetch("data.csv");
  const text = await res.text();
  const rows = text.trim().split("\n").map((line) => line.split(","));

  const header = rows[0];
  const data = rows.slice(1).map((row) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i];
    });
    return obj;
  });

  return data;
}

function createChart(data) {
  const labels = data.map((row) => row.date);
  const datasets = [];

  // Detect forecastN dynamically
  const forecastKeys = Object.keys(data[0]).filter((key) => /^forecast\d+$/i.test(key));

  forecastKeys.forEach((key, index) => {
    const colorList = ["#ff8000", "#ffff00", "#80ff00", "#00ff00", "#00ff80", "#00ffff", "#0080ff", "#8000ff", "#ff00ff", "#ff0080"];
    const color = colorList[index % colorList.length];

    datasets.push({
      label: key,
      data: data.map((row) => parseFloat(row[key] || null)),
      borderColor: color,
      borderWidth: 1,
      fill: false,
      tension: 0.4,
      pointRadius: 0,
    });
  });

  // forecast_avg
  datasets.push({
    label: "Forecast Avg",
    data: data.map((row) => parseFloat(row.forecast_avg || null)),
    borderColor: "#0000ff",
    borderWidth: 2,
    fill: false,
    tension: 0.4,
    pointRadius: 0,
  });

  // btc_actual
  datasets.push({
    label: "BTC Actual",
    data: data.map((row) => parseFloat(row.btc_actual || null)),
    borderColor: "#f7931a",
    borderWidth: 2,
    fill: false,
    tension: 0.2,
    pointRadius: (ctx) => ctx.dataIndex === data.length - 1 ? 4 : 0,
    pointBackgroundColor: "#f7931a"
  });

  // moving_average
  datasets.push({
    label: "Moving Average",
    data: data.map((row) => parseFloat(row.moving_average || null)),
    borderColor: "#00c69e",
    borderWidth: 2,
    fill: false,
    tension: 0.2,
    pointRadius: 0
  });

  const ctx = document.getElementById("btcChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 12,
            color: "#ffffff"
          },
          grid: {
            color: "#555555"
          }
        },
        y: {
          ticks: {
            callback: (value) => value.toFixed(0),
            color: "#ffffff"
          },
          grid: {
            color: "#555555"
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#ffffff",
            font: {
              family: "Menlo"
            }
          }
        },
        tooltip: {
          mode: "index",
          intersect: false
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      }
    }
  });
}

(async () => {
  const rawData = await loadCSV();

  // Отображать только строки с forecast_avg и не пустыми значениями
  const filtered = rawData.filter((row) => row.forecast_avg && !isNaN(row.forecast_avg));

  createChart(filtered);
})();
