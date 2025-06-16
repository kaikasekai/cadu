const fs = require('fs');
const fetch = require('node-fetch');
const path = './data.csv';

async function getBTCPrice() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();
  return data.bitcoin.usd;
}

function calculateMovingAverage(data, index, window = 30) {
  const values = [];
  for (let i = index - window + 1; i <= index; i++) {
    const val = parseFloat(data[i]?.btc_actual);
    if (!isNaN(val)) {
      values.push(val);
    }
  }
  if (values.length === window) {
    return (values.reduce((sum, val) => sum + val, 0) / window).toFixed(2);
  }
  return '';
}

(async () => {
  if (!fs.existsSync(path)) {
    console.error('Файл data.csv не найден.');
    return;
  }

  const content = fs.readFileSync(path, 'utf8');
  const lines = content.trim().split('\n');
  const header = lines[0].split(',').map(col => col.trim().toLowerCase());

  const dateIndex = header.indexOf('date');
  const btcIndex = header.indexOf('btc_actual');
  const maIndex = header.indexOf('moving_average');

  if (dateIndex === -1  btcIndex === -1  maIndex === -1) {
    console.error("❌ Колонки 'btc_actual' или 'moving_average' не найдены в заголовке CSV.");
    return;
  }

  const rows = lines.slice(1).map(line => line.split(','));
  const today = new Date().toISOString().split('T')[0];
  const todayRow = rows.find(row => row[dateIndex] === today);

  if (!todayRow) {
    console.log('Сегодняшняя дата отсутствует в data.csv.');
    return;
  }

  // Обновить btc_actual, если он пустой
  if (!todayRow[btcIndex]) {
    const btcPrice = await getBTCPrice();
    console.log(`💰 Актуальный курс BTC: $${btcPrice}`);
    todayRow[btcIndex] = btcPrice;
  }

  // Добавить moving_average, если возможен расчет
  const fullRows = rows.map(row => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key] = row[i] || '';
    });
    return obj;
  });

  const todayIndex = fullRows.findIndex(row => row.date === today);
  const ma = calculateMovingAverage(fullRows, todayIndex);
  if (ma) {
    todayRow[maIndex] = ma;
    console.log(`📈 Moving Average (30 дней): ${ma}`);
  } else {
    console.log('Недостаточно данных для расчёта moving average.');
  }

  // Сохранить обновлённый файл
  const updated = [header.join(',')].concat(rows.map(row => row.join(','))).join('\n');
  fs.writeFileSync(path, updated, 'utf8');
  console.log('✅ Файл data.csv обновлён.');
})();
