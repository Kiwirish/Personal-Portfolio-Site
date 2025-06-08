const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let config = {
    particleCount: 80,
    maxDistance: 120,
    mouseRadius: 150,
    showConnections: true,
    mouseAttraction: true,
    particleSpeed: 1,
    mouseInfluence: 0.05
};

let particles = [];
let mouse = { x: 0, y: 0 }
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * config.particleSpeed;
        this.vy = (Math.random() - 0.5) * config.particleSpeed;
        this.originalVx = this.vx;
        this.originalVy = this.vy;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.hue = Math.random() * 60 + 200;
    }

    update() {
        // Mouse attraction
        if (config.mouseAttraction) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.mouseRadius) {
                const force = (config.mouseRadius - distance) / config.mouseRadius;
                const attraction = force * config.mouseInfluence;
                this.vx += dx * attraction * 0.01;
                this.vy += dy * attraction * 0.01;
            }
        }

        // Gradual return to original velocity
        this.vx += (this.originalVx - this.vx) * 0.01;
        this.vy += (this.originalVy - this.vy) * 0.01;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundary collision
        if (this.x < 0 || this.x > canvas.width) {
            this.vx *= -1;
            this.originalVx *= -1;
        }
        if (this.y < 0 || this.y > canvas.height) {
            this.vy *= -1;
            this.originalVy *= -1;
        }

        // Keep within bounds
        this.x = Math.max(0, Math.min(canvas.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height, this.y));
    }

    draw() {
        // Simple blue particles always
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${this.hue}, 70%, 60%, ${this.opacity})`);
        gradient.addColorStop(1, `hsla(${this.hue}, 70%, 60%, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.fillStyle = `hsla(${this.hue}, 70%, 80%, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
    }
}

function drawConnections() {
    if (!config.showConnections) return;

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.maxDistance) {
                const opacity = (1 - distance / config.maxDistance) * 0.3;
                const hue = (particles[i].hue + particles[j].hue) / 2;
                
                ctx.beginPath();
                ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function drawMouseConnections() {
    if (!config.mouseAttraction) return;

    particles.forEach(particle => {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.mouseRadius) {
            const opacity = (1 - distance / config.mouseRadius) * 0.4;
            
            ctx.beginPath();
            ctx.strokeStyle = `hsla(220, 70%, 80%, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particle.x, particle.y);
            ctx.stroke();
        }
    });

    // Draw mouse cursor
    const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 20);
    gradient.addColorStop(0, 'hsla(220, 70%, 80%, 0.6)');
    gradient.addColorStop(1, 'hsla(220, 70%, 80%, 0)');
    
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
    ctx.fill();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    drawConnections();
    drawMouseConnections();

    animationId = requestAnimationFrame(animate);
}

// Event listeners
window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    initParticles();
    animate();
});