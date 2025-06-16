const fs = require("fs");
const fetch = require("node-fetch");
const path = require("path");

const FILE_PATH = path.join(__dirname, "data.csv");

async function fetchBTCPrice() {
  const url = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";
  const response = await fetch(url);
  const data = await response.json();
  return data.bitcoin.usd;
}

function calculateMovingAverage(data, index, window = 30) {
  const slice = data.slice(index - window, index);
  const values = slice.map(row => parseFloat(row.btc_actual)).filter(v => !isNaN(v));
  if (values.length < window) return "";
  const sum = values.reduce((acc, val) => acc + val, 0);
  return (sum / window).toFixed(2);
}

async function updateData() {
  let csv = fs.readFileSync(FILE_PATH, "utf8").trim().split("\n");
  const headers = csv[0].split(",").map(h => h.trim().toLowerCase());
  let rows = csv.slice(1).map(line => {
    const parts = line.split(",");
    while (parts.length < headers.length) parts.push(""); // pad missing
    return headers.reduce((obj, key, i) => {
      obj[key] = parts[i].trim();
      return obj;
    }, {});
  });

  const today = new Date().toISOString().slice(0, 10);
  let updated = false;

  for (let i = 30; i < rows.length; i++) {
    const row = rows[i];
    if (!row.btc_actual) {
      const btcPrice = await fetchBTCPrice();
      row.btc_actual = btcPrice.toFixed(2);
      updated = true;
      console.log(`✔ BTC actual added for ${row.date}: $${btcPrice}`);
    }

    if (!row.moving_average) {
      const ma = calculateMovingAverage(rows, i);
      if (ma) {
        row.moving_average = ma;
        console.log(`✔ Moving average added for ${row.date}: $${ma}`);
        updated = true;
      }
    }
  }

  if (updated) {
    const newCsv = [headers.join(",")].concat(
      rows.map(row => headers.map(h => row[h] || "").join(","))
    );
    fs.writeFileSync(FILE_PATH, newCsv.join("\n"), "utf8");
    console.log("✅ data.csv updated");
  } else {
    console.log("ℹ No updates needed — all data present");
  }
}

updateData().catch(err => {
  console.error("❌ Error updating BTC data:", err);
});
