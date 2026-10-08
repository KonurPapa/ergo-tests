// ============================================================================
// Harvest Haven - Main Game Controller & Execution Loop
// ============================================================================

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Subsystems
    this.world = new FarmWorld();
    this.crops = new CropManager();
    this.hazards = new HazardManager();
    this.particles = new ParticleSystem();
    this.player = new Player(8, 7);
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));

    // Input States
    this.keys = {};
    this.mouse = { x: 0, y: 0, tileX: 0, tileY: 0, isHovering: false };
    this.cameraShake = { amount: 0, timer: 0 };

    this.lastTime = performance.now();
    this.saveTimer = 0;

    // Load save data if available
    this.loadGame();

    // UI Controller initialized after DOM is ready
    this.ui = new UIController(this);
    this.ui.updateHUD(this.player, this.world);

    this.setupInputs();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupInputs() {
    // Keyboard Input
    window.addEventListener('keydown', (e) => {
      // Audio unlock on first keypress
      soundManager.init();

      if (this.ui.activeModal) {
        if (e.key === 'Escape') this.ui.closeModals();
        return;
      }

      this.keys[e.key.toLowerCase()] = true;

      // Hotbar Number Selection (1..8)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 8) {
        this.player.activeHotbarSlot = num - 1;
        soundManager.playPop();
        this.ui.renderHotbar(this.player);
      }

      // Hotkeys
      if (e.key.toLowerCase() === 'e' || e.key === ' ') {
        e.preventDefault();
        this.performPlayerAction();
      } else if (e.key.toLowerCase() === 'm') {
        this.ui.openShop();
      } else if (e.key.toLowerCase() === 'q') {
        this.ui.openQuests();
      } else if (e.key.toLowerCase() === 'h') {
        this.ui.openHelp();
      } else if (e.key.toLowerCase() === 'z') {
        this.promptSleep();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse Input
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
      this.mouse.tileX = Math.floor(this.mouse.x / TILE_SIZE);
      this.mouse.tileY = Math.floor(this.mouse.y / TILE_SIZE);
      this.mouse.isHovering = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouse.isHovering = false;
    });

    this.canvas.addEventListener('click', (e) => {
      soundManager.init();
      if (this.ui.activeModal) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;
      const tileX = Math.floor(clickX / TILE_SIZE);
      const tileY = Math.floor(clickY / TILE_SIZE);

      // Check distance from player
      const dist = Math.hypot(tileX - this.player.gridX, tileY - this.player.gridY);
      if (dist <= 2.8) {
        // Player is adjacent / close enough to interact directly
        this.performActionAt(tileX, tileY);
      } else {
        // Path/move towards targeted tile
        this.particles.spawnSparkles(clickX, clickY, 3);
        const dx = (tileX * TILE_SIZE + TILE_SIZE / 2) - this.player.x;
        const dy = (tileY * TILE_SIZE + TILE_SIZE / 2) - this.player.y;
        this.player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      }
    });
  }

  // Trigger shake on canvas (e.g. thunder)
  triggerShake(amount = 10, duration = 0.35) {
    this.cameraShake.amount = amount;
    this.cameraShake.timer = duration;
  }

  // Player action from Space / E key on tile in front
  performPlayerAction() {
    const target = this.player.getFacingTile();
    this.performActionAt(target.x, target.y);
  }

  // Perform action at specified tile
  performActionAt(targetX, targetY) {
    if (!this.world.inBounds(targetX, targetY)) return;

    // Check Farmhouse door sleep trigger
    if (this.world.getTile(targetX, targetY) === TILE.HOUSE && targetY === 3 && (targetX === 3 || targetX === 4)) {
      this.promptSleep();
      return;
    }

    const result = this.player.useAction(
      targetX,
      targetY,
      this.world,
      this.crops,
      this.hazards,
      soundManager,
      this.particles,
      (metric, amount) => this.checkQuestMetric(metric, amount)
    );

    if (result === 'shipping_bin') {
      this.ui.openShop();
    }

    this.ui.updateHUD(this.player, this.world);
  }

  checkQuestMetric(metric, amount) {
    this.quests.forEach(q => {
      if (!q.completed && q.metric === metric) {
        if (metric === 'total_coins') {
          q.current = amount;
        } else {
          q.current += amount;
        }
        if (q.current >= q.target) {
          q.completed = true;
          soundManager.playFanfare();
          this.particles.addFloatingText(`✨ Quest Complete: ${q.title}!`, this.player.x, this.player.y - 35, '#facc15', 18);
        }
      }
    });
  }

  promptSleep() {
    // End day, calculate profits, roll weather, show gazette
    const dayEarned = this.world.dailyStats.goldEarned;
    const cropsHarvested = this.world.dailyStats.cropsHarvested;

    // Advance to next day
    this.world.advanceToNextDay(this.crops, this.particles);

    // Restore player stamina & refill can
    this.player.stamina = this.player.maxStamina;
    this.player.waterLevel = this.player.waterCapacity;

    // Reset daily stats
    this.world.dailyStats = { goldEarned: 0, cropsHarvested: 0, hazardsThwarted: 0 };
    this.checkQuestMetric('days_passed', 1);

    // Save game state
    this.saveGame();

    // Show daily morning summary
    this.ui.openDailySummary(this.world.day, dayEarned, cropsHarvested, this.world.weather);
    this.ui.updateHUD(this.player, this.world);
  }

  // Save / Load via LocalStorage
  saveGame() {
    const data = {
      day: this.world.day,
      timeMinutes: this.world.timeMinutes,
      weather: this.world.weather,
      weatherForecast: this.world.weatherForecast,
      tiles: this.world.tiles,
      scarecrows: this.world.scarecrows,
      sprinklers: this.world.sprinklers,
      player: {
        x: this.player.x,
        y: this.player.y,
        coins: this.player.coins,
        stamina: this.player.stamina,
        maxStamina: this.player.maxStamina,
        waterLevel: this.player.waterLevel,
        waterCapacity: this.player.waterCapacity,
        level: this.player.level,
        xp: this.player.xp,
        xpNeeded: this.player.xpNeeded,
        canLevel: this.player.canLevel,
        hoeLevel: this.player.hoeLevel,
        hasSpeedBoots: this.player.hasSpeedBoots,
        seeds: this.player.seeds,
        harvested: this.player.harvested,
        items: this.player.items
      },
      crops: Array.from(this.crops.crops.entries()),
      quests: this.quests
    };

    try {
      localStorage.setItem('harvest_haven_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Unable to save to localStorage:', e);
    }
  }

  loadGame() {
    try {
      const saved = localStorage.getItem('harvest_haven_save');
      if (!saved) return;
      const data = JSON.parse(saved);

      this.world.day = data.day || 1;
      this.world.timeMinutes = data.timeMinutes || 360;
      this.world.weather = data.weather || WEATHER.SUNNY;
      this.world.weatherForecast = data.weatherForecast || WEATHER.RAIN;
      if (data.tiles) this.world.tiles = data.tiles;
      if (data.scarecrows) this.world.scarecrows = data.scarecrows;
      if (data.sprinklers) this.world.sprinklers = data.sprinklers;

      if (data.player) {
        Object.assign(this.player, data.player);
      }

      if (data.crops) {
        this.crops.crops = new Map(data.crops);
      }

      if (data.quests) {
        this.quests = data.quests;
      }
    } catch (e) {
      console.warn('Unable to load from localStorage:', e);
    }
  }

  resetGame() {
    localStorage.removeItem('harvest_haven_save');
    this.world.reset();
    this.crops.reset();
    this.hazards.reset();
    this.particles.reset();
    this.player.reset();
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    this.ui.updateHUD(this.player, this.world);
    this.ui.closeModals();
  }

  // Main Loop
  loop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Movement Input Check
    let dx = 0;
    let dy = 0;
    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    // Update Player Movement
    this.player.move(dx, dy, dt, this.world);

    // Update World Clock
    this.world.updateTime(dt, () => {
      // Midnight forces sleep
      this.promptSleep();
    });

    // Update Crops
    this.crops.update(
      dt,
      (x, y) => this.world.isTileWatered(x, y),
      this.world.weather,
      this.particles
    );

    // Update Hazards
    const worldHazardState = {
      weather: this.world.weather,
      crops: this.crops,
      scarecrows: this.world.getScarecrows(),
      tillableTiles: this.world.getTillableTiles(),
      emptyTiles: this.world.getEmptyTiles()
    };

    this.hazards.update(
      dt,
      worldHazardState,
      soundManager,
      this.particles,
      (amt, dur) => this.triggerShake(amt, dur)
    );

    // Update Particles
    this.particles.update(dt, this.world.weather);

    // Chimney Smoke Puffs from Farmhouse
    if (Math.random() < 0.08) {
      this.particles.spawnChimneySmoke(
        (2 * TILE_SIZE) + (4 * TILE_SIZE) - 28,
        (1 * TILE_SIZE) + 4
      );
    }

    // Camera Shake Update
    if (this.cameraShake.timer > 0) {
      this.cameraShake.timer -= dt;
    }

    // Update HUD periodically
    this.ui.updateHUD(this.player, this.world);

    // Auto-save every 30 seconds
    this.saveTimer += dt;
    if (this.saveTimer >= 30) {
      this.saveTimer = 0;
      this.saveGame();
    }

    // Render Everything
    this.render(now);

    requestAnimationFrame(this.loop);
  }

  // Draw Tile Highlight Outline
  drawTileHighlight(ctx) {
    let targetX = this.player.getFacingTile().x;
    let targetY = this.player.getFacingTile().y;

    if (this.mouse.isHovering) {
      const dist = Math.hypot(this.mouse.tileX - this.player.gridX, this.mouse.tileY - this.player.gridY);
      if (dist <= 2.8) {
        targetX = this.mouse.tileX;
        targetY = this.mouse.tileY;
      }
    }

    if (!this.world.inBounds(targetX, targetY)) return;

    const px = targetX * TILE_SIZE;
    const py = targetY * TILE_SIZE;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.restore();
  }

  // Master Render Method
  render(now) {
    this.ctx.save();

    // Camera Shake offset
    if (this.cameraShake.timer > 0) {
      const shakeAmt = this.cameraShake.amount * (this.cameraShake.timer / 0.35);
      const offsetX = (Math.random() - 0.5) * shakeAmt;
      const offsetY = (Math.random() - 0.5) * shakeAmt;
      this.ctx.translate(offsetX, offsetY);
    }

    // 1. Draw World Background & Tiles
    this.world.drawTiles(this.ctx);

    // 2. Draw Active Crops
    for (const crop of this.crops.crops.values()) {
      this.crops.drawCrop(this.ctx, crop, now);
    }

    // 3. Draw Hazards (Weeds, Crows, Moles, Lightning Fires)
    this.hazards.draw(this.ctx, now);

    // 4. Draw Tile Highlight / Target Cursor
    this.drawTileHighlight(this.ctx);

    // 5. Draw Player Character
    this.player.draw(this.ctx, now);

    // 6. Draw Day/Night Ambient Lighting Overlay & Lantern
    this.world.drawLighting(this.ctx, this.player.x, this.player.y);

    // 7. Draw Weather & Action Particles
    this.particles.draw(this.ctx);

    this.ctx.restore();
  }
}

// Instantiate game when window is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.harvestGame = new Game();
});
