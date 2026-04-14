// Listen for alerts dispatched from the Operator Dashboard
window.addEventListener('storage', (e) => {
    if (e.key === 'nexus_alert') {
        const data = JSON.parse(e.newValue);
        showNotification(data.type, data.message);
    }
});

function showNotification(type, message) {
    const banner = document.getElementById('notificationBanner');
    const typeTitle = document.getElementById('notifType');
    const msg = document.getElementById('notifMsg');
    const icon = document.querySelector('.notif-icon');

    // Customize based on type
    if (type === 'emergency') {
        typeTitle.innerText = "CRITICAL ALERT";
        typeTitle.style.color = "#ff3366";
        icon.innerText = "🚨";
        banner.style.borderColor = "rgba(255, 51, 102, 0.5)";
        banner.style.background = "rgba(255, 51, 102, 0.1)";
        playSfx('alert');
    } else if (type === 'concession') {
        typeTitle.innerText = "SPECIAL PROMO";
        typeTitle.style.color = "#00ff9d";
        icon.innerText = "🍔";
        banner.style.borderColor = "rgba(0, 255, 157, 0.5)";
        banner.style.background = "rgba(0, 255, 157, 0.1)";
        playSfx('notification');
    } else {
        typeTitle.innerText = "VENUE UPDATE";
        typeTitle.style.color = "#38bdf8";
        icon.innerText = "ℹ️";
        banner.style.borderColor = "rgba(56, 189, 248, 0.5)";
        banner.style.background = "rgba(56, 189, 248, 0.1)";
        playSfx('notification');
    }

    msg.innerText = message;
    
    // Animate in
    banner.classList.add('show');

    // Auto hide
    setTimeout(() => {
        banner.classList.remove('show');
    }, 6000);
}

// Send Fan Actions to Operator Dashboard
function placeOrder(item) {
    playSfx('click');
    
    // Find the button safely without relying on `event.target` which can break on strict local files
    let btn = null;
    document.querySelectorAll('.order-btn').forEach(b => {
        if(b.parentNode.innerText.includes(item)) btn = b;
    });

    const status = document.getElementById('orderStatus');
    status.innerText = `Preparing ${item}...`;

    // Dispatch to localStorage so dashboard picks it up
    const payload = { item: item, timestamp: Date.now() };
    localStorage.setItem('nexus_fan_action', JSON.stringify(payload));

    if (btn) {
        const originalText = btn.innerText;
        // UI Feedback
        btn.innerText = "✓";
        btn.style.background = "#00ff9d";
        btn.style.color = "#000";
        btn.style.borderColor = "#00ff9d";

        // Reset button
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "rgba(255,255,255,0.05)";
            btn.style.color = "#fff";
            btn.style.borderColor = "var(--glass-border)";
            status.innerText = "Order successfully sent to kitchen.";
            
            setTimeout(() => { status.innerText = ""; }, 3000);
        }, 2000);
    }
}

function checkWaitTimes(itemName) {
    playSfx('click');
    // Dispatch to localStorage so dashboard picks it up
    localStorage.setItem('nexus_washroom_check', Date.now().toString());
    
    // Provide visual feedback for the user on the simulator
    alert(`Searching optimal route for ${itemName || 'nearby facility'}... Estimated Wait: 2-4 mins.`);
}

function showOrdering() {
    playSfx('click');
    document.getElementById('orderingMenu').scrollIntoView({behavior: 'smooth'});
}

// Subtle Audio Cues (Using simple beeps generated via Web Audio API to avoid missing file errors)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(type) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'notification') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'alert') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }
}

// ============= AR NAVIGATION LOGIC =============
let arStream = null;

async function launchAR() {
    playSfx('click');
    const arView = document.getElementById('arView');
    const video = document.getElementById('arCamera');
    
    arView.classList.add('active');
    
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("getUserMedia not supported (requires HTTPS or localhost)");
        }
        // Try to access the back camera specifically for AR
        arStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = arStream;
        playSfx('notification');
    } catch (err) {
        console.warn("Camera access denied or unavailable", err);
        // Fallback: Fake moving gradient to simulate camera when permissions are denied / not available
        video.style.background = 'linear-gradient(45deg, #1e1b4b, #3b0764)';
        video.style.backgroundSize = '400% 400%';
        video.style.animation = 'gradientFlow 5s ease infinite';
    }
}

function closeAR() {
    playSfx('click');
    const arView = document.getElementById('arView');
    const video = document.getElementById('arCamera');
    
    arView.classList.remove('active');
    
    // Stop webcam tracks if active
    if (arStream) {
        arStream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
        arStream = null;
    }
}
