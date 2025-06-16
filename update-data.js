const fs = require('fs');
const fetch = require('node-fetch');
const path = './data.csv';

(async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
  const data = await response.json();
  const btcPrice = data.bitcoin.usd;

  let rows = fs.readFileSync(path, 'utf-8').split('\n').filter(row => row.trim() !== '');
  const headers = rows[0].split(',');
  const btcIndex = headers.indexOf('btc_actual');
  const maIndex = headers.indexOf('moving_average');

  let updated = false;

  for (let i = 1; i < rows.length; i++) {
    let cols = rows[i].split(',');

    if (cols[btcIndex] === '') {
      cols[btcIndex] = btcPrice.toString();

      // Calculate moving average over previous 30 non-empty BTC values
      const btc_values = [];
      for (let j = Math.max(1, i - 30); j < i; j++) {
        const val = parseFloat(rows[j].split(',')[btcIndex]);
        if (!isNaN(val)) btc_values.push(val);
      }
      const avg = btc_values.length > 0 ? btc_values.reduce((a, b) => a + b) / btc_values.length : '';
      cols[maIndex] = avg ? avg.toFixed(2) : '';
      rows[i] = cols.join(',');
      updated = true;
      break; // Только одну строку в день обновляем
    }
  }

  if (updated) {
    fs.writeFileSync(path, rows.join('\n'), 'utf-8');
    console.log('BTC actual и moving average успешно обновлены.');
  } else {
    console.log('Нет строк для обновления.');
  }
})();
