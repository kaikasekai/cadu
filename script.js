document.addEventListener('DOMContentLoaded', () => {
  const ctx = document.getElementById('btcChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr'],
      datasets: [{
        label: 'Test Data',
        data: [10, 20, 15, 30],
        borderColor: '#00ff00',
        fill: false,
        pointRadius: 3,
      }]
    }
  });
});
