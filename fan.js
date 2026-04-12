// Cross-app listener
window.addEventListener('storage', (e) => {
    if(e.key === 'nexus_alert') {
        const payload = JSON.parse(e.newValue);
        if(payload.type === 'emergency') {
            triggerEmergencyMode(payload.message);
        } else {
            showNotification(payload.type, payload.message);
        }
    }
});

function pingWashroom() {
    localStorage.setItem('nexus_washroom_check', JSON.stringify({time: Date.now()}));
}

function triggerEmergencyMode(msg) {
    const overlay = document.getElementById('emergencyOverlay');
    overlay.querySelector('p').innerText = msg;
    overlay.classList.add('visible');
    
    // Add dismiss button just for demo resets
    if(!overlay.querySelector('.dismiss-btn')) {
        const btn = document.createElement('button');
        btn.className = 'dismiss-btn';
        btn.style = 'margin-top: 20px; padding: 10px 20px; background: black; color: white; border: none; border-radius: 10px; cursor: pointer;';
        btn.innerText = 'Dismiss (Demo Mode)';
        btn.onclick = () => overlay.classList.remove('visible');
        overlay.appendChild(btn);
    }
}

function showNotification(type, message) {
    const banner = document.getElementById('notificationBanner');
    banner.className = 'notification-banner';
    banner.classList.add(type);
    banner.innerText = message;
    banner.classList.add('visible');
    
    setTimeout(() => { banner.classList.remove('visible'); }, 5000);
}

// Multi-order dynamic queueing logic
let activeQueues = [];
let queueIdCounter = 0;

function placeOrder(item, price, baseWaitMins) {
    const qid = `q_${queueIdCounter++}`;
    
    // Create new queue DOM element
    const container = document.getElementById('queuesContainer');
    
    let waitTime = Math.floor(baseWaitMins + Math.random() * 3);
    let pos = Math.floor(Math.random() * 10) + (waitTime * 2);

    const div = document.createElement('div');
    div.className = 'queue-tracker';
    div.id = qid;
    
    div.innerHTML = `
        <div class="queue-header">
            <h4>${item}</h4>
            <span class="live-pulse"></span>
        </div>
        <div class="queue-status">
            <div><span class="label">Est. Wait</span><span class="val" id="${qid}_time">${waitTime} m</span></div>
            <div><span class="label">Position</span><span class="val" id="${qid}_pos">#${pos}</span></div>
        </div>
        <div class="progress-bar"><div class="progress-fill" id="${qid}_prog" style="width: 10%"></div></div>
    `;
    
    container.prepend(div);
    
    // Broadcast back to Dashboard
    localStorage.setItem('nexus_fan_action', JSON.stringify({ item, queuePos: pos, timestamp: Date.now() }));

    // Keep state
    activeQueues.push({ id: qid, wait: waitTime, pos: pos, progress: 10, interval: null });
    const me = activeQueues[activeQueues.length - 1];

    // Independent Queue tick
    me.interval = setInterval(() => {
        if(me.wait > 1 && Math.random() > 0.4) {
            me.wait--;
            me.pos = Math.max(1, me.pos -= Math.floor(Math.random()*2 + 1));
            me.progress += (100 / baseWaitMins); // roughly fill bar based on wait
            
            document.getElementById(`${qid}_time`).innerText = me.wait + ' m';
            document.getElementById(`${qid}_pos`).innerText = '#' + me.pos;
            document.getElementById(`${qid}_prog`).style.width = Math.min(100, me.progress) + '%';
        }
        
        if(me.wait <= 1) {
            document.getElementById(`${qid}_time`).innerText = 'READY!';
            document.getElementById(`${qid}_pos`).innerText = 'PICKUP';
            document.getElementById(`${qid}_prog`).style.width = '100%';
            document.getElementById(`${qid}_prog`).style.background = '#2ea043';
            clearInterval(me.interval);
        }
    }, 4000); // Ticks every 4 seconds for demo speed
}

// Geolocation Tracker
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
        document.getElementById('userLocation').innerText = `📍 GPS: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
    }, (error) => {
        document.getElementById('userLocation').innerText = `📍 GPS: Permission Denied`;
    });
} else {
    document.getElementById('userLocation').innerText = `📍 GPS: Not Supported`;
}
