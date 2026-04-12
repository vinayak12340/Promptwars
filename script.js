// Navbar Scrolled State
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

// Number Counter Animation Function
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
