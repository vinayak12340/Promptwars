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

// ============= NEW FEATURES: AI & WELLNESS =============

// 1. AI CHATBOT COMPANION
let chatHistory = [];
const aiResponses = [
    { keyword: "wait", response: "Most concessions have 5-10 min waits right now. I recommend ordering beer - only 2 min wait! ⚡" },
    { keyword: "bathroom", response: "North Concourse bathroom has shortest wait at 1 min. South has 9 min. Stay hydrated! 💧" },
    { keyword: "seat", response: "Your seat (Sect 114, Row H, Seat 12) has great sightlines! Enjoy the game! 🎉" },
    { keyword: "crowd", response: "We're predicting heavy crowds at concessions in 3 minutes. Order now while queues are short! 🔥" },
    { keyword: "route", response: "Fastest route to bathroom: Exit and turn left. AR navigation activated! 📍" },
    { keyword: "recommend", response: "Since it's halftime, I recommend Stadium Dogs (5 min) or Premium Beer (2 min). Both popular! 🌭🍺" },
    { keyword: "help", response: "I can help with: wait times, recommendations, directions, wellness tips, and friend connections! Ask away! 🤖" }
];

function toggleChatbot() {
    const body = document.querySelector('.chatbot-body');
    body.classList.toggle('hidden');
}

function handleChatInput(event) {
    if(event.key === 'Enter') sendChat();
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg) return;
    
    const messagesDiv = document.getElementById('chatMessages');
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerText = msg;
    messagesDiv.appendChild(userMsg);
    
    // AI Response
    setTimeout(() => {
        let response = "I'm here to help! Ask about wait times, recommendations, or facilities around the venue.";
        const lowerMsg = msg.toLowerCase();
        for(let r of aiResponses) {
            if(lowerMsg.includes(r.keyword)) {
                response = r.response;
                break;
            }
        }
        
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai';
        aiMsg.innerText = response;
        messagesDiv.appendChild(aiMsg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 300);
    
    input.value = '';
    chatHistory.push({ user: msg, timestamp: Date.now() });
}

// 2. AI SMART QUEUE PREDICTION & RECOMMENDATIONS
function initAIRecommendations() {
    setInterval(() => {
        updateQueuePrediction();
        generateSmartMenuRecommendations();
    }, 30000); // Update every 30 seconds
    
    // Initial call
    updateQueuePrediction();
    generateSmartMenuRecommendations();
}

function updateQueuePrediction() {
    const items = [
        { name: 'Stadium Dog', wait: 5, price: '$8' },
        { name: 'Premium Beer', wait: 2, price: '$12' },
        { name: 'Nachos', wait: 8, price: '$10' },
        { name: 'Team Jersey', wait: 2, price: '$85' }
    ];
    
    // Find shortest wait item
    const bestItem = items.reduce((a, b) => a.wait < b.wait ? a : b);
    const nextBestTime = bestItem.wait + Math.floor(Math.random() * 3);
    
    document.getElementById('bestTimeText').innerHTML = 
        `📊 <strong>${bestItem.name}</strong> has shortest wait: <strong style="color: #00ff00;">${bestItem.wait} min</strong><br>
        <small>Next surge expected in ${nextBestTime} min - Order now!</small>`;
}

function generateSmartMenuRecommendations() {
    const menu = [
        { name: '🌭 Stadium Dog', price: '$8', wait: 5, score: 8.5 },
        { name: '🍺 Cold Beer', price: '$12', wait: 2, score: 9.2 },
        { name: '🧀 Nachos Deluxe', price: '$10', wait: 8, score: 7.8 },
        { name: '🍿 Popcorn', price: '$6', wait: 1, score: 8.7 }
    ];
    
    // Sort by AI score + wait time efficiency
    menu.sort((a, b) => (b.score / (b.wait + 1)) - (a.score / (a.wait + 1)));
    
    const container = document.getElementById('smartMenu');
    container.innerHTML = menu.slice(0, 3).map((item, idx) => `
        <div class="suggestion-card" onclick="placeOrder('${item.name.replace(/[🌭🍺🧀🍿]/g, '').trim()}', ${item.price.replace('$','')}, ${item.wait})" style="animation-delay: ${idx * 0.1}s">
            <div class="suggestion-rating">⭐ ${item.score}/10</div>
            <div class="suggestion-title">${item.name}</div>
            <div class="suggestion-meta">${item.price} • Wait: ${item.wait}m</div>
        </div>
    `).join('');
}

// 3. WELLNESS TRACKING
let hydrationLog = 0;
let breakTime = 0;
let energyLevel = 85;

function logHydration() {
    hydrationLog++;
    document.getElementById('hydrationCount').innerText = hydrationLog + ' cups';
    
    const status = hydrationLog >= 3 ? 'Perfect! 💪' : hydrationLog >= 2 ? 'Good! 😊' : 'Drink more! 💧';
    document.getElementById('hydrationStatus').innerText = status;
    
    energyLevel = Math.min(100, energyLevel + 5);
    updateEnergyLevel();
    
    showNotification('wellness', "Great! Stay hydrated! 💧");
}

function suggestBreak() {
    breakTime += 10;
    document.getElementById('breakCount').innerText = breakTime + ' min';
    
    const status = breakTime >= 30 ? 'Well rested! ✨' : 'Take more breaks! 🪑';
    document.getElementById('breakStatus').innerText = status;
    
    energyLevel = Math.min(100, energyLevel + 10);
    updateEnergyLevel();
    
    showNotification('wellness', "You've earned a break! Relax and recharge! 🪑");
}

function updateEnergyLevel() {
    let level = energyLevel;
    const status = level >= 75 ? 'Excellent!' : level >= 50 ? 'Good' : 'Low - Take a break!';
    const statusColor = level >= 75 ? 'green' : level >= 50 ? 'yellow' : 'red';
    
    document.getElementById('energyLevel').innerText = level.toFixed(0) + '%';
    document.getElementById('energyLevel').parentElement.className = 'wellness-value ' + statusColor;
}

// Auto-remind hydration and breaks
setInterval(() => {
    if(hydrationLog < 2) {
        showNotification('wellness', "💧 Remember to stay hydrated!");
    }
}, 900000); // Every 15 minutes

// 4. SOCIAL FAN CONNECT
const localFans = [
    { name: 'Alex Chen', section: 'Sect 114', distance: '2 sections away', interests: ['Beer', 'Food'], avatar: '👨' },
    { name: 'Sarah Miller', section: 'Sect 114', distance: 'Same section!', interests: ['Jersey', 'Snacks'], avatar: '👩' },
    { name: 'Mike Rodriguez', section: 'Sect 115', distance: '1 section away', interests: ['Hot Dogs', 'Nachos'], avatar: '👨' },
];

function startFanSearch() {
    const resultsDiv = document.getElementById('fanSearchResults');
    resultsDiv.classList.remove('hidden');
    resultsDiv.innerHTML = '<div class="searching">🔍 Searching nearby fans...</div>';
    
    setTimeout(() => {
        resultsDiv.innerHTML = localFans.map((fan, idx) => `
            <div class="fan-card" style="animation-delay: ${idx * 0.1}s">
                <div class="fan-avatar">${fan.avatar}</div>
                <div class="fan-info">
                    <div class="fan-name">${fan.name}</div>
                    <div class="fan-location">${fan.distance}</div>
                    <div class="fan-interests">${fan.interests.join(' • ')}</div>
                </div>
                <button class="connect-btn" onclick="connectWithFan('${fan.name}')">👋 Connect</button>
            </div>
        `).join('');
    }, 1500);
}

function connectWithFan(name) {
    showNotification('social', `🎉 Connected with ${name}! Check your chat to say hi! 👋`);
    console.log(`Connected with ${name}`);
}

function showFriendsList() {
    showNotification('social', "Your friend list is syncing... Check back soon! 👥");
}

// Initialize all new features on page load
document.addEventListener('DOMContentLoaded', () => {
    initAIRecommendations();
    
    // Auto-show a welcome message from the AI
    setTimeout(() => {
        const welcome = document.createElement('div');
        welcome.className = 'chat-message ai';
        welcome.innerText = "👋 Hi Jamie! I'm your NEXUS AI Assistant. Ask me about wait times, recommendations, or facilities! Type 'help' for options.";
        document.getElementById('chatMessages').appendChild(welcome);
    }, 500);
});
