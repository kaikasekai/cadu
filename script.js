const fs = require("fs");
const fetch = require("node-fetch");
const path = "./data.csv";

// Получить цену BTC на момент закрытия (около 00:00 UTC)
async function getBTCPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await res.json();
  return data.bitcoin.usd;
}

// Считать CSV в массив
function parseCSV(data) {
  return data
    .trim()
    .split("\n")
    .map((line) => line.split(","));
}

// Записать массив обратно в CSV
function stringifyCSV(rows) {
  return rows.map((row) => row.join(",")).join("\n") + "\n";
}

// Основной скрипт
(async () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const file = fs.readFileSync(path, "utf8");
  const rows = parseCSV(file);

  // Заголовки: [date, forecast1, ..., forecast_avg, btc_actual, moving_average]
  const header = rows[0];
  const dateIndex = 0;
  const btcIndex = header.indexOf("btc_actual");
  const maIndex = header.indexOf("moving_average");

  // Найдём первую строку, где btc_actual пустой и дата ≤ сегодня
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = row[dateIndex];
    const btc_actual = row[btcIndex];

    if (!btc_actual && date <= today) {
      // Получаем 30 предыдущих значений btc_actual
      const previous = [];
      for (let j = i - 30; j < i; j++) {
        if (j < 1 || !rows[j][btcIndex]) break;
        previous.push(parseFloat(rows[j][btcIndex]));
      }

      if (previous.length < 30) {
        console.log(`❌ Недостаточно данных для расчёта moving_average на ${date} — ${previous.length}/30`);
        break;
      }

      const btcPrice = await getBTCPrice();
      const movingAverage = previous.reduce((a, b) => a + b, 0) / previous.length;

      row[btcIndex] = btcPrice.toFixed(2);
      row[maIndex] = movingAverage.toFixed(2);

      fs.writeFileSync(path, stringifyCSV(rows));
      console.log(`✅ Обновлено: ${date}, btc_actual = ${btcPrice}, moving_average = ${movingAverage.toFixed(2)}`);
      break; // Только одну строку за раз
    }
  }
})();
