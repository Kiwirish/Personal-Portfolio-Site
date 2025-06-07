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
let blueSections = [];

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Function to get all blue section positions
function updateBlueSections() {
    blueSections = [];
    const sections = document.querySelectorAll('.blue-section');
    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        blueSections.push({
            top: rect.top + window.scrollY,
            bottom: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
            right: rect.right + window.scrollX
        });
    });
}

// Check if a point is over a blue section
function isOverBlueSection(x, y) {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    return blueSections.some(section =>
        x + scrollX >= section.left &&
        x + scrollX <= section.right &&
        y + scrollY >= section.top &&
        y + scrollY <= section.bottom
    );
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
        // Check if particle is over blue section
        const isOverBlue = isOverBlueSection(this.x, this.y);

        // Use light colors for blue sections, blue colors for white background
        let hue, saturation, lightness;
        if (isOverBlue) {
            // Light colors for blue background
            hue = 0; // White-ish
            saturation = 0;
            lightness = 90;
        } else {
            // Blue colors for white background
            hue = this.hue;
            saturation = 70;
            lightness = 60;
        }

        // Particle glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.opacity})`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${Math.min(lightness + 20, 100)}%, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize particles
function initParticles() {
    particles = [];
    for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
    }
}

// Draw connections between particles
function drawConnections() {
    if (!config.showConnections) return;

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.maxDistance) {
                const opacity = (1 - distance / config.maxDistance) * 0.3;

                // Check if connection crosses blue sections
                const midX = (particles[i].x + particles[j].x) / 2;
                const midY = (particles[i].y + particles[j].y) / 2;
                const isOverBlue = isOverBlueSection(midX, midY);

                ctx.beginPath();
                if (isOverBlue) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                } else {
                    const hue = (particles[i].hue + particles[j].hue) / 2;
                    ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${opacity})`;
                }
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

// Draw mouse connections
function drawMouseConnections() {
    if (!config.mouseAttraction) return;

    particles.forEach(particle => {
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < config.mouseRadius) {
            const opacity = (1 - distance / config.mouseRadius) * 0.4;

            // Check if mouse is over blue section
            const isOverBlue = isOverBlueSection(mouse.x, mouse.y);

            ctx.beginPath();
            if (isOverBlue) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            } else {
                ctx.strokeStyle = `hsla(220, 70%, 80%, ${opacity})`;
            }
            ctx.lineWidth = 2;
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(particle.x, particle.y);
            ctx.stroke();
        }
    });

    // Draw mouse cursor
    const isOverBlue = isOverBlueSection(mouse.x, mouse.y);
    const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 20);

    if (isOverBlue) {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    } else {
        gradient.addColorStop(0, 'hsla(220, 70%, 80%, 0.6)');
        gradient.addColorStop(1, 'hsla(220, 70%, 80%, 0)');
    }

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw particles
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
    updateBlueSections();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('scroll', () => {
    updateBlueSections();
});

// Control functions
function toggleConnections() {
    config.showConnections = !config.showConnections;
}

function changeParticleCount() {
    config.particleCount = config.particleCount === 80 ? 150 : config.particleCount === 150 ? 50 : 80;
    initParticles();
}

function toggleMouseAttraction() {
    config.mouseAttraction = !config.mouseAttraction;
}

// Initialize
resizeCanvas();
initParticles();
updateBlueSections();
animate();
