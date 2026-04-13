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

// Live User Datasets (Simulating Real GPS Telemetry Points)
const liveUsers = Array.from({length: 60}, () => ({
    id: `USR-${Math.floor(Math.random()*9000)+1000}`,
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: 0,
    vy: 0,
    type: Math.random() > 0.8 ? 'VIP' : 'FAN'
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

    liveUsers.forEach(p => {
        // Calculate pull from attractors
        let ax = 0; let ay = 0;
        attractors.forEach(a => {
            const dx = a.x - p.x;
            const dy = a.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist > 5) {
                ax += (dx / dist) * a.strength * 0.15;
                ay += (dy / dist) * a.strength * 0.15;
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

        // Draw Real-time Data Point
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        
        if (p.type === 'VIP') {
            ctx.fillStyle = '#f59e0b'; // Gold
            ctx.shadowColor = '#f59e0b';
        } else {
            ctx.fillStyle = '#0ea5e9'; // Cyan
            ctx.shadowColor = '#0ea5e9';
        }
        
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Map Dataset ID Overlay (Only render some to prevent clutter)
        if (Math.random() > 0.05) {
            ctx.font = "10px monospace";
            ctx.fillStyle = p.type === 'VIP' ? "rgba(245, 158, 11, 0.9)" : "rgba(255, 255, 255, 0.7)";
            ctx.fillText(p.id, p.x + 8, p.y + 3);
        }
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

// ============= NEW PREDICTIVE FEATURES =============

// 6. PREDICTIVE CROWD ALERTS
function initPredictiveAlerts() {
    updateCrowdPredictions();
    updateRevenueForecasts();
    updateSystemHealth();
    generateSmartAlerts();
    
    // Refresh every 20 seconds
    setInterval(() => {
        updateCrowdPredictions();
        updateRevenueForecasts();
        updateSystemHealth();
        generateSmartAlerts();
    }, 20000);
}

function updateCrowdPredictions() {
    const predictions = [
        { time: 'In 5 min', location: 'Sector K (Restrooms)', level: 'HIGH 🔴', action: 'Deploy staff' },
        { time: 'In 10 min', location: 'Gate 3 (Main Exit)', level: 'MEDIUM 🟡', action: 'Monitor' },
        { time: 'In 15 min', location: 'Concourse B (Food)', level: 'HIGH 🔴', action: 'Increase cashiers' },
    ];
    
    const content = document.getElementById('predictionContent');
    content.innerHTML = predictions.map((pred, idx) => `
        <div class="prediction-item" style="animation-delay: ${idx * 0.1}s">
            <div class="pred-time">${pred.time}</div>
            <div class="pred-location">${pred.location}</div>
            <div class="pred-level">${pred.level}</div>
            <div class="pred-action">→ ${pred.action}</div>
        </div>
    `).join('');
}

function updateRevenueForecasts() {
    const revenue = [
        { item: 'Concessions', estimate: '$12,450', trend: '+8%' },
        { item: 'Merchandise', estimate: '$5,230', trend: '+15%' },
        { item: 'Premium Seating', estimate: '$18,900', trend: '+3%' },
    ];
    
    const forecast = document.getElementById('revenueForecast');
    forecast.innerHTML = revenue.map((item, idx) => `
        <div class="revenue-item" style="animation-delay: ${idx * 0.15}s">
            <div class="rev-name">${item.item}</div>
            <div class="rev-data">
                <span class="rev-amount">${item.estimate}</span>
                <span class="rev-trend ${item.trend.includes('+') ? 'positive' : 'negative'}">${item.trend}</span>
            </div>
        </div>
    `).join('');
}

function generateSmartAlerts() {
    const alerts = [
        { icon: '⚠️', msg: 'Sector E crowd density at 89% capacity - Reroute recommendations sent to fans', level: 'warning' },
        { icon: '✅', msg: 'All concession queues operating normally', level: 'success' },
        { icon: '🚨', msg: 'Predicted bottleneck at Gate 2 in 8 minutes - Preemptive staffing activated', level: 'critical' },
        { icon: '💡', msg: 'Dynamic pricing recommended for premium items (high demand period)', level: 'info' },
    ];
    
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = alerts.map((alert, idx) => `
        <div class="alert-item ${alert.level}" style="animation-delay: ${idx * 0.1}s">
            <span class="alert-icon">${alert.icon}</span>
            <span class="alert-text">${alert.msg}</span>
        </div>
    `).join('');
}

function updateSystemHealth() {
    const metrics = [
        { name: 'Network Status', value: '98.2%', status: 'good' },
        { name: 'Sensor Coverage', value: '100%', status: 'good' },
        { name: 'API Response', value: '42ms', status: 'good' },
        { name: 'Data Sync', value: 'Real-time', status: 'good' },
    ];
    
    const health = document.getElementById('healthMonitor');
    health.innerHTML = metrics.map(m => `
        <div class="health-metric">
            <div class="metric-name">${m.name}</div>
            <div class="metric-value">
                <span class="health-dot ${m.status}"></span>
                ${m.value}
            </div>
        </div>
    `).join('');
}

function updateWeather() {
    const weather = document.getElementById('weatherContent');
    if (!weather) return;
    weather.innerHTML = `
        <div class="weather-icon">⛅</div>
        <div class="weather-temp">82°</div>
        <div class="weather-details">
            <span>💧 Humidity: 45%</span>
            <span>💨 Wind: 12 mph NE</span>
            <span>UV Index: 6 (High)</span>
        </div>
    `;
}

function updateSentiment() {
    const sentiment = document.getElementById('sentimentContent');
    if (!sentiment) return;
    
    // Simulate live data fluctuations
    const p = Math.floor(Math.random() * 20) + 60; // 60-80% positive
    const n = Math.floor(Math.random() * 15) + 5;  // 5-20% negative
    const neu = 100 - p - n;
    
    sentiment.innerHTML = `
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem; font-weight: 600;">
            <span style="color: var(--accent-green)">Positive: ${p}%</span>
            <span style="color: var(--accent-yellow)">Neutral: ${neu}%</span>
            <span style="color: var(--accent-red)">Negative: ${n}%</span>
        </div>
        <div class="sentiment-bar-container">
            <div class="sentiment-bar positive" style="width: ${p}%"></div>
            <div class="sentiment-bar neutral" style="width: ${neu}%"></div>
            <div class="sentiment-bar negative" style="width: ${n}%"></div>
        </div>
        <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.6rem;">
            <div class="sentiment-tweet">
                <span style="color: var(--accent-glow); font-weight: bold;">@Fan123</span> <span style="color: var(--text-secondary); font-size: 0.75rem;">• 1m ago</span><br/>
                "Lines are moving super fast at Gate 4! Loving the tech 🔥🙌"
            </div>
            <div class="sentiment-tweet" style="border-left-color: var(--accent-red)">
                <span style="color: var(--accent-glow); font-weight: bold;">@SportsFanatic</span> <span style="color: var(--text-secondary); font-size: 0.75rem;">• 3m ago</span><br/>
                "Merch stand in Sector B is out of size L jerseys... please restock! 😫"
            </div>
            <div class="sentiment-tweet">
                <span style="color: var(--accent-glow); font-weight: bold;">@Priya_99</span> <span style="color: var(--text-secondary); font-size: 0.75rem;">• 5m ago</span><br/>
                "What an atmosphere here! The light show was completely insane! ✨🏟️"
            </div>
        </div>
    `;
}

// Initialize predictive features on page load
document.addEventListener('DOMContentLoaded', () => {
    initPredictiveAlerts();
    updateWeather();
    updateSentiment();
    
    // Simulate real-time sentiment updates
    setInterval(updateSentiment, 15000);
});
