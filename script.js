"use strict";

/**
 * Navbar Scrolled State - Updates navbar appearance based on scroll position.
 */
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.add('scrolled'); // keep on small scroll
        if(window.scrollY < 10) {
             navbar.classList.remove('scrolled');
        }
    }
});

// Intersection Observer for Animation Effects
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Check if it's a number stat that needs animating
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            if (statNumbers.length > 0) {
                statNumbers.forEach(stat => {
                    if (!stat.classList.contains('counted')) {
                        animateValue(stat, 0, parseInt(stat.getAttribute('data-target')), 2000);
                        stat.classList.add('counted');
                    }
                });
            }
        }
    });
}, observerOptions);

// Observe Architecture Layers
document.querySelectorAll('.layer-item').forEach(layer => {
    observer.observe(layer);
});

// Observe Stats Grid
document.querySelectorAll('.stats-grid').forEach(grid => {
    observer.observe(grid);
});

/**
 * Animates a numerical counter from a start value to an end value.
 * @param {HTMLElement} obj - The DOM element containing the number.
 * @param {number} start - The starting value.
 * @param {number} end - The ending value (target).
 * @param {number} duration - The duration of the animation in milliseconds.
 */
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function for smoother counter (easeOutExpo)
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        obj.innerHTML = Math.floor(easeOut * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
             obj.innerHTML = end;
        }
    };
    window.requestAnimationFrame(step);
}

// ============= HERO CANVAS PARTICLES =============
const canvas = document.getElementById('heroCanvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, particles;

    /**
     * Initializes the canvas dimensions and creates the particle array.
     */
    function initCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = [];
        const numParticles = Math.floor(window.innerWidth / 20); // Responsive amount of particles
        
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                radius: Math.random() * 2 + 1
            });
        }
    }

    /**
     * Animation loop to draw and connect the particles dynamically.
     */
    function drawParticles() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Connect to nearby
            for (let j = i + 1; j < particles.length; j++) {
                let p2 = particles[j];
                let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 - dist/1000})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        requestAnimationFrame(drawParticles);
    }

    window.addEventListener('resize', initCanvas);
    initCanvas();
    drawParticles();
}

// ============= BENTO CARD SPOTLIGHT =============
const bentoGrid = document.getElementById('bentoGrid');
if (bentoGrid) {
    bentoGrid.onmousemove = e => {
        for(const card of document.getElementsByClassName('bento-card')) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };
}

/**
 * Event Listeners for UI Interactions
 */
document.addEventListener('DOMContentLoaded', () => {
    const scheduleBtn = document.getElementById('scheduleDemoBtn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            window.open('demo-event-simulator.html', '_blank', 'noopener,noreferrer');
        });
    }
});
