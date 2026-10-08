// ============================================================================
// Harvest Haven - Dynamic Agricultural Hazards & Countermeasures
// ============================================================================

class HazardManager {
  constructor() {
    this.crows = [];       // Hungry birds attacking crops
    this.fires = [];       // Lightning strike fires
    this.moles = [];       // Mischievous burrowing moles
    this.weeds = [];       // Creeping thorn weeds
    this.beetles = [];     // Pest beetle swarms

    this.spawnTimerCrow = 20; // seconds between crow checks
    this.spawnTimerMole = 35;
    this.spawnTimerWeed = 45;
    this.spawnTimerBeetle = 50;
    this.lightningTimer = 18;

    this.stats = {
      crowsShooed: 0,
      firesDoused: 0,
      molesBonked: 0,
      weedsCleared: 0
    };
  }

  reset() {
    this.crows = [];
    this.fires = [];
    this.moles = [];
    this.weeds = [];
    this.beetles = [];
  }

  // Check if tile is protected by a scarecrow
  isProtectedByScarecrow(x, y, scarecrowPositions) {
    for (const sc of scarecrowPositions) {
      const dx = Math.abs(x - sc.x);
      const dy = Math.abs(y - sc.y);
      if (dx <= 2 && dy <= 2) {
        return true;
      }
    }
    return false;
  }

  // Spawn a hungry crow targeting an unprotected crop
  trySpawnCrow(crops, scarecrows, soundMgr, particleSys) {
    if (this.crows.length >= 3) return; // limit concurrent crows

    // Find candidate crops that are unprotected
    const candidates = [];
    for (const [key, crop] of crops.entries()) {
      if (!this.isProtectedByScarecrow(crop.x, crop.y, scarecrows)) {
        // Don't target if already targeted by another crow
        const alreadyTargeted = this.crows.some(c => c.targetX === crop.x && c.targetY === crop.y);
        if (!alreadyTargeted) {
          candidates.push(crop);
        }
      }
    }

    if (candidates.length === 0) return;

    const targetCrop = candidates[Math.floor(Math.random() * candidates.length)];
    // Spawn off-screen
    const startX = Math.random() > 0.5 ? -40 : CANVAS_WIDTH + 40;
    const startY = Math.random() * 200;

    this.crows.push({
      x: startX,
      y: startY,
      targetX: targetCrop.x,
      targetY: targetCrop.y,
      groundX: targetCrop.x * TILE_SIZE + TILE_SIZE / 2,
      groundY: targetCrop.y * TILE_SIZE + TILE_SIZE / 2,
      state: 'flying_in', // flying_in -> eating -> flying_away
      eatTimer: 9.0, // 9 seconds to eat crop
      maxEatTime: 9.0,
      speed: 120,
      wingTimer: 0
    });

    if (soundMgr) soundMgr.playCrow();
    if (particleSys) {
      particleSys.addFloatingText('⚠️ A hungry crow spotted your crops!', CANVAS_WIDTH / 2, 40, '#f87171', 18);
    }
  }

  // Spawn a burrowing mole
  trySpawnMole(tillableTiles, soundMgr, particleSys) {
    if (this.moles.length >= 2 || tillableTiles.length === 0) return;

    const tile = tillableTiles[Math.floor(Math.random() * tillableTiles.length)];
    const alreadyMole = this.moles.some(m => m.x === tile.x && m.y === tile.y);
    if (alreadyMole) return;

    this.moles.push({
      x: tile.x,
      y: tile.y,
      px: tile.x * TILE_SIZE + TILE_SIZE / 2,
      py: tile.y * TILE_SIZE + TILE_SIZE / 2,
      state: 'burrowing', // burrowing -> popping -> retreating
      timer: 14.0,
      headY: 10
    });

    if (soundMgr) soundMgr.playPop();
    if (particleSys) {
      particleSys.spawnDirtPuff(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2);
      particleSys.addFloatingText('🐾 A mole surfaced!', tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE, '#f59e0b', 14);
    }
  }

  // Trigger lightning strike fire during thunderstorm
  triggerLightningStrike(validTiles, soundMgr, particleSys, cameraShakeFn) {
    if (validTiles.length === 0) return;
    const tile = validTiles[Math.floor(Math.random() * validTiles.length)];

    this.fires.push({
      x: tile.x,
      y: tile.y,
      px: tile.x * TILE_SIZE + TILE_SIZE / 2,
      py: tile.y * TILE_SIZE + TILE_SIZE / 2,
      life: 12.0, // seconds until spreads or burns out
      maxLife: 12.0
    });

    if (soundMgr) soundMgr.playThunder();
    if (cameraShakeFn) cameraShakeFn(15, 0.4);
    if (particleSys) {
      particleSys.spawnSparkles(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2, 25);
      particleSys.addFloatingText('⚡ LIGHTNING STRIKE! Put out the fire!', tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE - 15, '#ef4444', 18);
    }
  }

  // Spawn invasive weed
  trySpawnWeed(emptyTiles, particleSys) {
    if (this.weeds.length >= 8 || emptyTiles.length === 0) return;
    const tile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
    const alreadyWeed = this.weeds.some(w => w.x === tile.x && w.y === tile.y);
    if (alreadyWeed) return;

    this.weeds.push({
      x: tile.x,
      y: tile.y,
      px: tile.x * TILE_SIZE + TILE_SIZE / 2,
      py: tile.y * TILE_SIZE + TILE_SIZE / 2,
      growth: 0
    });

    if (particleSys) {
      particleSys.spawnDirtPuff(tile.x * TILE_SIZE + TILE_SIZE / 2, tile.y * TILE_SIZE + TILE_SIZE / 2);
    }
  }

  // Main update loop
  update(dt, worldState, soundMgr, particleSys, cameraShakeFn) {
    const { weather, crops, scarecrows, tillableTiles, emptyTiles } = worldState;

    // --- Timers for Hazard Spawning ---
    if (crops.crops.size > 0) {
      this.spawnTimerCrow -= dt;
      if (this.spawnTimerCrow <= 0) {
        this.spawnTimerCrow = 22 + Math.random() * 15;
        this.trySpawnCrow(crops.crops, scarecrows, soundMgr, particleSys);
      }
    }

    this.spawnTimerMole -= dt;
    if (this.spawnTimerMole <= 0) {
      this.spawnTimerMole = 35 + Math.random() * 20;
      this.trySpawnMole(tillableTiles, soundMgr, particleSys);
    }

    this.spawnTimerWeed -= dt;
    if (this.spawnTimerWeed <= 0) {
      this.spawnTimerWeed = 40 + Math.random() * 20;
      this.trySpawnWeed(emptyTiles, particleSys);
    }

    // Thunderstorm lightning strikes
    if (weather === 'Thunderstorm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 16 + Math.random() * 12;
        this.triggerLightningStrike(tillableTiles, soundMgr, particleSys, cameraShakeFn);
      }
    }

    // --- Update Crows ---
    for (let i = this.crows.length - 1; i >= 0; i--) {
      const crow = this.crows[i];
      crow.wingTimer += dt * 10;

      if (crow.state === 'flying_in') {
        const dx = crow.groundX - crow.x;
        const dy = crow.groundY - crow.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 5) {
          crow.x = crow.groundX;
          crow.y = crow.groundY;
          crow.state = 'eating';
        } else {
          crow.x += (dx / dist) * crow.speed * dt;
          crow.y += (dy / dist) * crow.speed * dt;
        }
      } else if (crow.state === 'eating') {
        crow.eatTimer -= dt;

        // Check if crop still exists
        if (!crops.hasCrop(crow.targetX, crow.targetY)) {
          // Crop was harvested or removed
          crow.state = 'flying_away';
          continue;
        }

        // Ate the crop completely!
        if (crow.eatTimer <= 0) {
          crops.remove(crow.targetX, crow.targetY);
          if (particleSys) {
            particleSys.spawnDirtPuff(crow.groundX, crow.groundY);
            particleSys.addFloatingText('💔 Crop devoured by crow!', crow.groundX, crow.groundY - 15, '#ef4444', 15);
          }
          if (soundMgr) soundMgr.playCrow();
          crow.state = 'flying_away';
        }
      } else if (crow.state === 'flying_away') {
        crow.x += 160 * dt;
        crow.y -= 120 * dt;
        if (crow.x > CANVAS_WIDTH + 60 || crow.y < -60) {
          this.crows.splice(i, 1);
        }
      }
    }

    // --- Update Fires ---
    for (let i = this.fires.length - 1; i >= 0; i--) {
      const fire = this.fires[i];
      fire.life -= dt;

      if (particleSys) {
        particleSys.spawnFireParticles(fire.px, fire.py);
      }

      // Rain naturally douses fire faster
      if (weather === 'Rain') {
        fire.life -= dt * 2;
      }

      if (fire.life <= 0) {
        // Destroy crop at this position if exists
        if (crops.hasCrop(fire.x, fire.y)) {
          crops.remove(fire.x, fire.y);
          if (particleSys) {
            particleSys.addFloatingText('🔥 Crop burned!', fire.px, fire.py - 10, '#ef4444', 15);
          }
        }
        this.fires.splice(i, 1);
      }
    }

    // --- Update Moles ---
    for (let i = this.moles.length - 1; i >= 0; i--) {
      const mole = this.moles[i];
      mole.timer -= dt;
      if (mole.timer <= 0) {
        this.moles.splice(i, 1);
      }
    }
  }

  // Shoo away crow when player approaches or interacts
  shooCrowNear(playerX, playerY, particleSys, soundMgr) {
    let shooed = false;
    for (const crow of this.crows) {
      if (crow.state === 'eating' || crow.state === 'flying_in') {
        const dist = Math.hypot(playerX - crow.x, playerY - crow.y);
        if (dist < 72) { // within interaction radius
          crow.state = 'flying_away';
          this.stats.crowsShooed++;
          shooed = true;
          if (soundMgr) soundMgr.playCrow();
          if (particleSys) {
            particleSys.spawnSparkles(crow.x, crow.y, 8);
            particleSys.addFloatingText('Shoo! Crow scared off!', crow.x, crow.y - 20, '#fbbf24', 15);
          }
        }
      }
    }
    return shooed;
  }

  // Douse fire with watering can
  douseFire(tileX, tileY, particleSys, soundMgr) {
    const idx = this.fires.findIndex(f => f.x === tileX && f.y === tileY);
    if (idx !== -1) {
      const fire = this.fires[idx];
      this.fires.splice(idx, 1);
      this.stats.firesDoused++;

      if (soundMgr) soundMgr.playExtinguish();
      if (particleSys) {
        particleSys.spawnWaterSplash(fire.px, fire.py);
        particleSys.addFloatingText('💧 Fire Extinguished!', fire.px, fire.py - 20, '#38bdf8', 16);
      }
      return true;
    }
    return false;
  }

  // Bonk mole
  bonkMole(tileX, tileY, particleSys, soundMgr) {
    const idx = this.moles.findIndex(m => m.x === tileX && m.y === tileY);
    if (idx !== -1) {
      const mole = this.moles[idx];
      this.moles.splice(idx, 1);
      this.stats.molesBonked++;

      if (soundMgr) {
        soundMgr.playPop();
        soundMgr.playCoin();
      }
      if (particleSys) {
        particleSys.spawnSparkles(mole.px, mole.py, 10);
        particleSys.addFloatingText('Bonked Mole! +15g', mole.px, mole.py - 15, '#facc15', 15);
      }
      return 15; // 15 gold reward
    }
    return 0;
  }

  // Clear weed
  clearWeed(tileX, tileY, particleSys, soundMgr) {
    const idx = this.weeds.findIndex(w => w.x === tileX && w.y === tileY);
    if (idx !== -1) {
      const weed = this.weeds[idx];
      this.weeds.splice(idx, 1);
      this.stats.weedsCleared++;

      if (soundMgr) soundMgr.playTill();
      if (particleSys) {
        particleSys.spawnDirtPuff(weed.px, weed.py);
        particleSys.addFloatingText('+1 Compost Fiber', weed.px, weed.py - 15, '#84cc16', 14);
      }
      return true;
    }
    return false;
  }

  // Draw all hazards
  draw(ctx, now) {
    // Draw Weeds
    for (const w of this.weeds) {
      ctx.save();
      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.ellipse(w.px - 6, w.py + 4, 7, 3.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(w.px + 6, w.py + 4, 7, 3.5, 0.4, 0, Math.PI * 2);
      ctx.ellipse(w.px, w.py - 2, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sharp thorns
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w.px - 4, w.py);
      ctx.lineTo(w.px - 8, w.py - 5);
      ctx.moveTo(w.px + 4, w.py);
      ctx.lineTo(w.px + 8, w.py - 5);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Moles
    for (const m of this.moles) {
      ctx.save();
      // Dirt mound
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(m.px, m.py + 10, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mole body popping up
      const bob = Math.sin(now * 0.006) * 2;
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(m.px, m.py + 2 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Snout
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(m.px, m.py + 3 + bob, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(m.px - 3, m.py - 1 + bob, 1.2, 0, Math.PI * 2);
      ctx.arc(m.px + 3, m.py - 1 + bob, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw Fires
    for (const f of this.fires) {
      ctx.save();
      // Flame base
      const fHeight = 16 + Math.sin(now * 0.02 + f.x) * 4;
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(f.px - 10, f.py + 12);
      ctx.quadraticCurveTo(f.px, f.py - fHeight, f.px + 10, f.py + 12);
      ctx.closePath();
      ctx.fill();

      // Inner yellow flame
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(f.px - 6, f.py + 12);
      ctx.quadraticCurveTo(f.px, f.py - fHeight * 0.7, f.px + 6, f.py + 12);
      ctx.closePath();
      ctx.fill();

      // Warning circle
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(f.px, f.py, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Crows
    for (const c of this.crows) {
      ctx.save();
      const wingFlap = Math.sin(c.wingTimer) * 8;

      // Crow shadow on ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y + 16, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crow body
      ctx.fillStyle = '#18181b'; // dark raven
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 10, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Crow head
      ctx.beginPath();
      ctx.arc(c.x + 8, c.y - 3, 5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(c.x + 12, c.y - 4);
      ctx.lineTo(c.x + 18, c.y - 2);
      ctx.lineTo(c.x + 12, c.y);
      ctx.closePath();
      ctx.fill();

      // Beady red/white eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(c.x + 9, c.y - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(c.x + 9.5, c.y - 4, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Animated wings
      ctx.fillStyle = '#27272a';
      ctx.beginPath();
      ctx.ellipse(c.x - 2, c.y - 4 + (c.state === 'eating' ? 0 : wingFlap), 8, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Eating timer progress bar
      if (c.state === 'eating') {
        const barW = 28;
        const barH = 5;
        const progress = Math.max(0, c.eatTimer / c.maxEatTime);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(c.x - barW / 2, c.y - 22, barW, barH);
        ctx.fillStyle = progress > 0.4 ? '#eab308' : '#ef4444';
        ctx.fillRect(c.x - barW / 2, c.y - 22, barW * progress, barH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(c.x - barW / 2, c.y - 22, barW, barH);
      }

      ctx.restore();
    }
  }
}
