const fs = require("fs");
const path = "./data.csv";
const fetch = require("node-fetch");

(async () => {
  // Чтение CSV
  const content = fs.readFileSync(path, "utf-8").trim();
  const rows = content.split("\n").map(line => line.split(","));

  const header = rows[0];
  const dateIndex = header.indexOf("date");
  const btcIndex = header.indexOf("btc_actual");
  const maIndex = header.indexOf("moving_average");

  if (dateIndex === -1  btcIndex === -1  maIndex === -1) {
    console.error("❌ Missing required columns in header.");
    return;
  }

  // Найдём первую строку с пустым btc_actual и прошедшей датой
  const today = new Date().toISOString().split("T")[0];
  const targetIndex = rows.findIndex((row, i) => i > 0 && !row[btcIndex] && row[dateIndex] <= today);

  if (targetIndex === -1) {
    console.log("✅ Все данные обновлены — новых строк для записи нет.");
    return;
  }

  const targetDate = rows[targetIndex][dateIndex];
  console.log(`📅 Обновляем курс BTC за ${targetDate}`);

  // Получаем цену BTC с CoinGecko (закрытие дня)
  const url = https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${formatDateForAPI(targetDate)};
  const res = await fetch(url);
  const data = await res.json();
  const price = data?.market_data?.current_price?.usd;

  if (!price) {
    console.error("❌ Не удалось получить цену BTC.");
    return;
  }

  // Записываем цену BTC
  rows[targetIndex][btcIndex] = price.toFixed(2);

  // Рассчитываем moving average на основе 30 предыдущих btc_actual
  const btcValues = [];
  for (let i = targetIndex - 1; i >= 1 && btcValues.length < 30; i--) {
    const val = parseFloat(rows[i][btcIndex]);
    if (!isNaN(val)) {
      btcValues.push(val);
    }
  }

  if (btcValues.length < 30) {
    console.warn("⚠️ Недостаточно данных для расчёта Moving Average.");
  } else {
    const ma = btcValues.reduce((sum, v) => sum + v, 0) / btcValues.length;

    // Убедимся, что строка достаточно длинная
    while (rows[targetIndex].length <= maIndex) {
      rows[targetIndex].push("");
    }

    rows[targetIndex][maIndex] = ma.toFixed(2);
    console.log(`📈 Moving Average: ${ma.toFixed(2)}`);
  }

  // Сохраняем файл
  const updatedContent = rows.map(row => row.join(",")).join("\n");
  fs.writeFileSync(path, updatedContent);
  console.log("✅ Обновление завершено и сохранено в data.csv");
})();

// Формат: dd-mm-yyyy
function formatDateForAPI(isoDate) {
  const [y, m, d] = isoDate.split("-");
  return ${d}-${m}-${y};
}
