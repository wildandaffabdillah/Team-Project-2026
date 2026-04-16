// load alerts
fetch("http://127.0.0.1:5000/alerts")
.then(res => res.json())
.then(data => {
    let list = document.getElementById("alerts");
    data.forEach(a => {
        let li = document.createElement("li");
        li.innerText = a.message;
        list.appendChild(li);
    });
});

// chart
const ctx = document.getElementById('chart');

new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Helmet', 'Vest', 'Violation'],
        datasets: [{
            label: 'Stats',
            data: [10, 8, 3],
        }]
    }
});