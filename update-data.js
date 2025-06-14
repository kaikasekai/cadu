const fs = require('fs');
const fetch = require('node-fetch');

const CSV_PATH = 'data.csv';

async function fetchBTCPrice() {
  const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await res.json();
  return data.bitcoin.usd;
}

function calculateMovingAverage(data, period = 30) {
  return data.map((_, i) => {
    if (i < period - 1) return '';
    const slice = data.slice(i - period + 1, i + 1);
    const values = slice.map(row => parseFloat(row.btc_actual)).filter(Boolean);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    return avg.toFixed(2);
  });
}

(async () => {
  const price = await fetchBTCPrice();
  const now = new Date().toISOString().split('T')[0];
  const csv = fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n');
  const headers = csv[0].split(',');
  const rows = csv.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => row[h] = values[i]);
    return row;
  });

  if (rows.some(r => r.date === now)) return;

  const last = rows[rows.length - 1];
  const newRow = { ...last, date: now, btc_actual: price.toString() };
  rows.push(newRow);

  const ma = calculateMovingAverage(rows);
  rows.forEach((r, i) => r.moving_average = ma[i] || '');

  const updatedCsv = [headers.join(',')]
    .concat(rows.map(r => headers.map(h => r[h] || '').join(',')))
    .join('\n');

  fs.writeFileSync(CSV_PATH, updatedCsv);
})();