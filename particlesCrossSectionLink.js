class GeometricNetwork {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.section = this.canvas.parentElement;
        this.nodes = [];
        this.mouse = { x: -1000, y: -1000 };
        this.animationId = null;
        this.isVisible = false;

        this.config = {
            nodeCount: 12,
            maxDistance: 200,
            mouseRadius: 120,
            speed: 0.3,
            mouseInfluence: 0.8
        };

        this.init();
        this.setupIntersectionObserver();
    }

    init() {
        this.resizeCanvas();
        this.createNodes();
        this.bindEvents();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.isVisible = true;
                    this.startAnimation();
                } else {
                    this.isVisible = false;
                    this.stopAnimation();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.section);
    }

    resizeCanvas() {
        const rect = this.section.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    createNodes() {
        this.nodes = [];
        const shapes = ['triangle', 'square', 'pentagon', 'hexagon', 'circle'];

        for (let i = 0; i < this.config.nodeCount; i++) {
            this.nodes.push(new GeometricNode(
                this.canvas.width,
                this.canvas.height,
                shapes[Math.floor(Math.random() * shapes.length)]
            ));
        }
    }

    bindEvents() {
        this.section.addEventListener('mousemove', (e) => {
            const rect = this.section.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.section.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });

        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createNodes();
        });
    }

    startAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    animate() {
        if (!this.isVisible) {
            this.animationId = null;
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update nodes
        this.nodes.forEach(node => {
            node.update(this.mouse, this.config, this.canvas.width, this.canvas.height);
        });

        // Draw connections first (behind nodes)
        this.drawConnections();

        // Draw nodes on top
        this.nodes.forEach(node => {
            node.draw(this.ctx);
        });

        // Draw mouse interactions
        this.drawMouseInteractions();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    drawConnections() {
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x;
                const dy = this.nodes[i].y - this.nodes[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.maxDistance) {
                    const opacity = (1 - distance / this.config.maxDistance) * 0.6;
                    const thickness = (1 - distance / this.config.maxDistance) * 2 + 0.5;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    this.ctx.lineWidth = thickness;
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();

                    // Add subtle glow effect to connections
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(173, 216, 230, ${opacity * 0.3})`;
                    this.ctx.lineWidth = thickness + 2;
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    drawMouseInteractions() {
        if (this.mouse.x < 0) return;

        // Connect mouse to nearby nodes
        this.nodes.forEach(node => {
            const dx = this.mouse.x - node.x;
            const dy = this.mouse.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.config.mouseRadius) {
                const opacity = (1 - distance / this.config.mouseRadius) * 0.8;

                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.lineWidth = 2;
                this.ctx.moveTo(this.mouse.x, this.mouse.y);
                this.ctx.lineTo(node.x, node.y);
                this.ctx.stroke();
            }
        });

        // Draw mouse indicator
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.arc(this.mouse.x, this.mouse.y, 15, 0, Math.PI * 2);
        this.ctx.stroke();
    }
}

class GeometricNode {
    constructor(canvasWidth, canvasHeight, shape) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.originalVx = this.vx;
        this.originalVy = this.vy;
        this.size = Math.random() * 8 + 6;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.shape = shape;
        this.opacity = Math.random() * 0.4 + 0.6;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(mouse, config, canvasWidth, canvasHeight) {
        // Mouse attraction
        if (mouse.x > 0) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.mouseRadius) {
                const force = (config.mouseRadius - distance) / config.mouseRadius;
                const attraction = force * config.mouseInfluence;
                this.vx += dx * attraction * 0.005;
                this.vy += dy * attraction * 0.005;
            }
        }

        // Gradual return to original velocity
        this.vx += (this.originalVx - this.vx) * 0.01;
        this.vy += (this.originalVy - this.vy) * 0.01;

        // Update position
        this.x += this.vx * config.speed;
        this.y += this.vy * config.speed;

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Boundary collision with bounce
        if (this.x < this.size || this.x > canvasWidth - this.size) {
            this.vx *= -1;
            this.originalVx *= -1;
            this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
        }
        if (this.y < this.size || this.y > canvasHeight - this.size) {
            this.vy *= -1;
            this.originalVy *= -1;
            this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
        }

        // Update pulse for subtle size animation
        this.pulsePhase += 0.03;
    }

    draw(ctx) {
        const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
        const currentSize = this.size * pulse;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, currentSize * 2);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, currentSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Main shape
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.strokeStyle = `rgba(173, 216, 230, ${this.opacity})`;
        ctx.lineWidth = 1.5;

        this.drawShape(ctx, currentSize);

        ctx.restore();
    }

    drawShape(ctx, size) {
        ctx.beginPath();

        switch (this.shape) {
            case 'circle':
                ctx.arc(0, 0, size * 0.7, 0, Math.PI * 2);
                break;
            case 'triangle':
                ctx.moveTo(0, -size);
                ctx.lineTo(-size * 0.866, size * 0.5);
                ctx.lineTo(size * 0.866, size * 0.5);
                ctx.closePath();
                break;
            case 'square':
                ctx.rect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
                break;
            case 'pentagon':
                for (let i = 0; i < 5; i++) {
                    const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI * 2) / 6;
                    const x = Math.cos(angle) * size;
                    const y = Math.sin(angle) * size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
        }

        ctx.fill();
        ctx.stroke();
    }
}

// Initialize geometric networks when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const geometricSections = document.querySelectorAll('.geometric-canvas');
    geometricSections.forEach(canvas => {
        new GeometricNetwork(canvas);
    });
});
