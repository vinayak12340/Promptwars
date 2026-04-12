// 1. Live Clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// 2. ML Hotspot Simulation Engine
const canvas = document.getElementById('heatmapCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // initial

// Defining ML Hotspot Attractors (e.g. gates, concessions)
let attractors = [
    { x: canvas.width * 0.2, y: canvas.height * 0.2, strength: 0.5 },
    { x: canvas.width * 0.8, y: canvas.height * 0.4, strength: 0.8 },
    { x: canvas.width * 0.5, y: canvas.height * 0.8, strength: 0.6 }
];

// Re-position attractors on resize
window.addEventListener('resize', () => {
    attractors = [
        { x: canvas.width * 0.2, y: canvas.height * 0.2, strength: 0.5 },
        { x: canvas.width * 0.8, y: canvas.height * 0.4, strength: 0.8 },
        { x: canvas.width * 0.5, y: canvas.height * 0.8, strength: 0.6 }
    ];
});

// Particles represent the crowd
const particles = Array.from({length: 150}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 15 + 10,
    vx: 0,
    vy: 0
}));

function drawHeatmap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Periodically shift attractors slightly to simulate dynamic events
    if(Math.random() < 0.05) {
        attractors.forEach(a => {
            a.x += (Math.random() - 0.5) * 10;
            a.y += (Math.random() - 0.5) * 10;
            // keep bounds
            a.x = Math.max(0, Math.min(canvas.width, a.x));
            a.y = Math.max(0, Math.min(canvas.height, a.y));
        });
    }

    particles.forEach(p => {
        // Calculate pull from all ML Predictor attractors
        let ax = 0; let ay = 0;
        attractors.forEach(a => {
            const dx = a.x - p.x;
            const dy = a.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist > 5) {
                ax += (dx / dist) * a.strength * 0.1;
                ay += (dy / dist) * a.strength * 0.1;
            }
        });

        // Add some random walk noise mimicking human unpredictability
        ax += (Math.random() - 0.5) * 2;
        ay += (Math.random() - 0.5) * 2;

        p.vx = p.vx * 0.9 + ax; // friction
        p.vy = p.vy * 0.9 + ay;

        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, 'rgba(255, 50, 50, 0.5)'); // hot core
        gradient.addColorStop(0.4, 'rgba(255, 150, 0, 0.2)'); // warm med
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    });

    requestAnimationFrame(drawHeatmap);
}
// Delay start until dimensions resolve
setTimeout(drawHeatmap, 500);

// 3. Queue Chart Simulation using Chart.js
const ctxChart = document.getElementById('queueChart').getContext('2d');
const queueChart = new Chart(ctxChart, {
    type: 'line',
    data: {
        labels: ['-30m', '-25m', '-20m', '-15m', '-10m', '-5m', 'Now'],
        datasets: [{
            label: 'Sector A Wait (Mins)',
            data: [5, 12, 18, 14, 8, 4, 3],
            borderColor: '#38bdf8',
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }
});

setInterval(() => {
    const data = queueChart.data.datasets[0].data;
    data.shift();
    const last = data[data.length-1];
    data.push(Math.max(0, last + (Math.random() * 6 - 3)));
    queueChart.update('none');
}, 5000);

// 4. Cross-tab communication: Dispatch Alerts
const dispatchBtn = document.getElementById('dispatchBtn');
dispatchBtn.addEventListener('click', () => {
    const type = document.getElementById('alertType').value;
    const msg = document.getElementById('alertMessage').value;
    
    if(!msg.trim()) return;

    // Send payload via localStorage so Fan App can pick it up
    const payload = { type, message: msg, timestamp: Date.now() };
    localStorage.setItem('nexus_alert', JSON.stringify(payload));

    const status = document.getElementById('dispatchStatus');
    status.innerText = 'Alert pushed to Fan Interface successfully!';
    setTimeout(() => { status.innerText = ''; }, 3000);
});

// 5. Cross-tab communication: Listen for Fan Actions
window.addEventListener('storage', (e) => {
    if(e.key === 'nexus_fan_action') {
        const action = JSON.parse(e.newValue);
        addActivityFeed(`Fan Activity: Ordered ${action.item} (Dynamic Queue Processed)`);
    } else if(e.key === 'nexus_washroom_check') {
        addActivityFeed(`Fan checked washroom lines.`);
    }
});

function addActivityFeed(text) {
    const feed = document.getElementById('activityFeed');
    const div = document.createElement('div');
    div.className = 'feed-item';
    div.innerText = `${new Date().toLocaleTimeString()} - ${text}`;
    feed.prepend(div);
    if(feed.children.length > 50) feed.removeChild(feed.lastChild);
}

setInterval(() => {
    const items = ['Hot Dog', 'Nachos', 'Beer', 'Soda', 'Pretzel'];
    const randomItem = items[Math.floor(Math.random() * items.length)];
    addActivityFeed(`Simulated Sensor: Group clustering at Gate ${Math.floor(Math.random()*5+1)}`);
}, 8000);
