const fs = require("fs");
const fetch = require("node-fetch");
const path = "./data.csv";

async function getBTCPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
  const data = await res.json();
  return data.bitcoin.usd;
}

function parseCSV(data) {
  return data
    .trim()
    .split("\n")
    .map((line) => line.split(","));
}

function stringifyCSV(rows) {
  return rows.map((row) => row.join(",")).join("\n") + "\n";
}

(async () => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const file = fs.readFileSync(path, "utf8");
  const rows = parseCSV(file);

  const header = rows[0];
  const dateIndex = 0;
  const btcIndex = header.indexOf("btc_actual");
  const maIndex = header.indexOf("moving_average");

  if (btcIndex === -1 || maIndex === -1) {
    console.error("🛑 Не найдены заголовки 'btc_actual' или 'moving_average'");
    return;
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const date = row[dateIndex];
    const btc_actual = row[btcIndex];

    if (!btc_actual && date <= today) {
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

      // Обновим значения в текущей строке
      row[btcIndex] = btcPrice.toFixed(2);
      row[maIndex] = movingAverage.toFixed(2);

      // Обновим массив строк
      rows[i] = row;

      // Запишем обновлённый CSV
      fs.writeFileSync(path, stringifyCSV(rows));
      console.log(`✅ Обновлено: ${date}, btc_actual = ${btcPrice.toFixed(2)}, moving_average = ${movingAverage.toFixed(2)}`);
      break;
    }
  }
})();
