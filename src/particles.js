// ============================================================================
// Harvest Haven - Particle System & Floating Text Effects
// ============================================================================

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.floatingTexts = [];
    this.rainDrops = [];
  }

  reset() {
    this.particles = [];
    this.floatingTexts = [];
    this.rainDrops = [];
  }

  // Spawn simple visual particle
  spawn(x, y, color, count = 5, speed = 1.5, size = 3, life = 0.6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.7) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: color,
        size: (0.6 + Math.random() * 0.8) * size,
        alpha: 1.0,
        maxLife: life,
        life: life,
        gravity: 0.05
      });
    }
  }

  // Water splash particles
  spawnWaterSplash(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        color: Math.random() > 0.3 ? '#60a5fa' : '#93c5fd',
        size: 2 + Math.random() * 2.5,
        alpha: 0.9,
        maxLife: 0.5,
        life: 0.5,
        gravity: 0.12
      });
    }
  }

  // Till dirt dust
  spawnDirtPuff(x, y) {
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 1.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.4,
        color: Math.random() > 0.4 ? '#854d0e' : '#a16207',
        size: 2.5 + Math.random() * 3,
        alpha: 0.8,
        maxLife: 0.45,
        life: 0.45,
        gravity: 0.08
      });
    }
  }

  // Golden harvest sparkles
  spawnSparkles(x, y, count = 12) {
    const colors = ['#fde047', '#facc15', '#fbbf24', '#ffffff', '#38bdf8'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        maxLife: 0.75,
        life: 0.75,
        gravity: 0.04,
        isSparkle: true
      });
    }
  }

  // Fire smoke & embers
  spawnFireParticles(x, y) {
    const colors = ['#ef4444', '#f97316', '#fbbf24', '#71717a'];
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -1.2 - Math.random() * 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 3.5,
        alpha: 0.85,
        maxLife: 0.5,
        life: 0.5,
        gravity: -0.02
      });
    }
  }

  // Chimney smoke
  spawnChimneySmoke(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: 0.2 + (Math.random() - 0.5) * 0.3,
      vy: -0.6 - Math.random() * 0.4,
      color: 'rgba(226, 232, 240, 0.5)',
      size: 3 + Math.random() * 3,
      alpha: 0.6,
      maxLife: 1.8,
      life: 1.8,
      gravity: -0.01
    });
  }

  // Floating text overlay (e.g. "+25g", "-2 Stamina", "Watered!")
  addFloatingText(text, x, y, color = '#ffffff', fontSize = 16) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -1.0,
      color: color,
      fontSize: fontSize,
      alpha: 1.0,
      life: 1.2,
      maxLife: 1.2
    });
  }

  // Update loop
  update(dt, weather = 'Sunny') {
    // Update general particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy;
      ft.alpha = Math.min(1.0, ft.life / (ft.maxLife * 0.6));
    }

    // Rain simulation
    if (weather === 'Rain' || weather === 'Thunderstorm') {
      const rainCount = weather === 'Thunderstorm' ? 18 : 10;
      for (let i = 0; i < rainCount; i++) {
        this.rainDrops.push({
          x: Math.random() * CANVAS_WIDTH,
          y: -10,
          length: 12 + Math.random() * 8,
          speed: 16 + Math.random() * 8,
          slant: 2 + Math.random() * 2
        });
      }
    }

    for (let i = this.rainDrops.length - 1; i >= 0; i--) {
      const r = this.rainDrops[i];
      r.x += r.slant;
      r.y += r.speed;
      if (r.y > CANVAS_HEIGHT) {
        // Occasionally splash on ground
        if (Math.random() < 0.25) {
          this.spawn(r.x, CANVAS_HEIGHT - 4, '#60a5fa', 2, 0.8, 1.5, 0.2);
        }
        this.rainDrops.splice(i, 1);
      }
    }
  }

  // Render particles
  draw(ctx) {
    // Rain
    if (this.rainDrops.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (const r of this.rainDrops) {
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.slant * 1.5, r.y + r.length);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.isSparkle) {
        // Star diamond shape
        ctx.beginPath();
        const s = p.size;
        ctx.moveTo(p.x, p.y - s);
        ctx.lineTo(p.x + s * 0.4, p.y);
        ctx.lineTo(p.x + s, p.y);
        ctx.lineTo(p.x + s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x, p.y + s);
        ctx.lineTo(p.x - s * 0.4, p.y + s * 0.4);
        ctx.lineTo(p.x - s, p.y);
        ctx.lineTo(p.x - s * 0.4, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Floating texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${ft.fontSize}px 'Segoe UI', Inter, sans-serif`;
      ctx.textAlign = 'center';
      // Text drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}
