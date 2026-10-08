// ============================================================================
// Harvest Haven - Farmer Character, Inventory, Tools & Controls
// ============================================================================

class Player {
  constructor(startX = 7, startY = 5) {
    this.gridX = startX;
    this.gridY = startY;
    this.x = startX * TILE_SIZE + TILE_SIZE / 2;
    this.y = startY * TILE_SIZE + TILE_SIZE / 2;
    this.targetPxX = this.x;
    this.targetPxY = this.y;

    this.baseSpeed = 160; // pixels per second
    this.speed = this.baseSpeed;
    this.facing = 'down'; // 'up', 'down', 'left', 'right'
    this.isMoving = false;
    this.walkAnimTimer = 0;
    this.swingAnimTimer = 0;
    this.swingingTool = null;

    // Economy & Stamina
    this.coins = 100;
    this.stamina = 100;
    this.maxStamina = 100;

    // Tools & Upgrades
    this.activeHotbarSlot = 0; // 0..7
    this.canLevel = 0; // 0: Wood (20 charges), 1: Copper (45 charges), 2: Gold (90 charges)
    this.hoeLevel = 0; // 0: Basic, 1: Copper (1x3)
    this.hasSpeedBoots = false;
    this.waterCapacity = 20;
    this.waterLevel = 20;

    // Inventory
    this.seeds = {
      wheat: 5,
      carrot: 3,
      tomato: 0,
      strawberry: 0,
      pumpkin: 0,
      starfruit: 0
    };
    this.harvested = {
      wheat: 0,
      carrot: 0,
      tomato: 0,
      strawberry: 0,
      pumpkin: 0,
      starfruit: 0
    };
    this.items = {
      scarecrow: 1,
      sprinkler: 0,
      fence: 0,
      fertilizer: 2,
      bug_spray: 1
    };

    // Experience & Progression
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 100;

    // Hotbar Setup
    this.hotbar = [
      { id: 'hoe', label: 'Hoe', type: 'tool', icon: '⛏️' },
      { id: 'watering_can', label: 'Water Can', type: 'tool', icon: '💧' },
      { id: 'scythe', label: 'Scythe', type: 'tool', icon: '🌾' },
      { id: 'pickaxe', label: 'Pickaxe', type: 'tool', icon: '🪓' },
      { id: 'seed_wheat', label: 'Wheat Seeds', type: 'seed', cropId: 'wheat', icon: '🌱' },
      { id: 'seed_carrot', label: 'Carrot Seeds', type: 'seed', cropId: 'carrot', icon: '🥕' },
      { id: 'fertilizer', label: 'Fertilizer', type: 'item', itemId: 'fertilizer', icon: '🧪' },
      { id: 'scarecrow', label: 'Scarecrow', type: 'item', itemId: 'scarecrow', icon: '🎎' }
    ];
  }

  reset(startX = 7, startY = 5) {
    this.gridX = startX;
    this.gridY = startY;
    this.x = startX * TILE_SIZE + TILE_SIZE / 2;
    this.y = startY * TILE_SIZE + TILE_SIZE / 2;
    this.facing = 'down';
    this.coins = 100;
    this.stamina = 100;
    this.maxStamina = 100;
    this.waterLevel = 20;
    this.waterCapacity = 20;
    this.canLevel = 0;
    this.hoeLevel = 0;
    this.hasSpeedBoots = false;
    this.speed = this.baseSpeed;
    this.level = 1;
    this.xp = 0;
    this.xpNeeded = 100;

    this.seeds = { wheat: 5, carrot: 3, tomato: 0, strawberry: 0, pumpkin: 0, starfruit: 0 };
    this.harvested = { wheat: 0, carrot: 0, tomato: 0, strawberry: 0, pumpkin: 0, starfruit: 0 };
    this.items = { scarecrow: 1, sprinkler: 0, fence: 0, fertilizer: 2, bug_spray: 1 };
  }

  gainXp(amount, particleSys, soundMgr) {
    this.xp += amount;
    if (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level++;
      this.xpNeeded = Math.floor(this.xpNeeded * 1.5);
      this.maxStamina += 15;
      this.stamina = this.maxStamina;

      if (soundMgr) soundMgr.playFanfare();
      if (particleSys) {
        particleSys.spawnSparkles(this.x, this.y, 25);
        particleSys.addFloatingText(`⭐ LEVEL UP! Rank ${this.level}`, this.x, this.y - 30, '#facc15', 20);
      }
    }
  }

  // Get tile directly in front of the farmer based on facing direction
  getFacingTile() {
    let tx = this.gridX;
    let ty = this.gridY;
    if (this.facing === 'up') ty--;
    else if (this.facing === 'down') ty++;
    else if (this.facing === 'left') tx--;
    else if (this.facing === 'right') tx++;
    return { x: tx, y: ty };
  }

  // Move with keyboard input vector
  move(dx, dy, dt, world) {
    if (this.swingAnimTimer > 0) return; // locked while swinging

    this.speed = this.hasSpeedBoots ? this.baseSpeed * 1.35 : this.baseSpeed;

    if (dx !== 0 || dy !== 0) {
      this.isMoving = true;
      this.walkAnimTimer += dt * 10;

      // Update facing
      if (Math.abs(dx) > Math.abs(dy)) {
        this.facing = dx > 0 ? 'right' : 'left';
      } else {
        this.facing = dy > 0 ? 'down' : 'up';
      }

      // Normalization for diagonal movement
      const len = Math.hypot(dx, dy);
      const moveX = (dx / len) * this.speed * dt;
      const moveY = (dy / len) * this.speed * dt;

      // Axis-independent collision detection
      const newX = this.x + moveX;
      const newY = this.y + moveY;

      const halfW = 12;
      const halfH = 10;

      // Check X movement
      const tileX1 = Math.floor((newX - halfW) / TILE_SIZE);
      const tileX2 = Math.floor((newX + halfW) / TILE_SIZE);
      const curTileY1 = Math.floor((this.y - halfH) / TILE_SIZE);
      const curTileY2 = Math.floor((this.y + halfH) / TILE_SIZE);

      let collideX = false;
      for (let tx = tileX1; tx <= tileX2; tx++) {
        for (let ty = curTileY1; ty <= curTileY2; ty++) {
          if (world.isSolid(tx, ty)) {
            collideX = true;
            break;
          }
        }
      }
      if (!collideX && newX >= 16 && newX <= CANVAS_WIDTH - 16) {
        this.x = newX;
      }

      // Check Y movement
      const curTileX1 = Math.floor((this.x - halfW) / TILE_SIZE);
      const curTileX2 = Math.floor((this.x + halfW) / TILE_SIZE);
      const tileY1 = Math.floor((newY - halfH) / TILE_SIZE);
      const tileY2 = Math.floor((newY + halfH) / TILE_SIZE);

      let collideY = false;
      for (let tx = curTileX1; tx <= curTileX2; tx++) {
        for (let ty = tileY1; ty <= tileY2; ty++) {
          if (world.isSolid(tx, ty)) {
            collideY = true;
            break;
          }
        }
      }
      if (!collideY && newY >= 16 && newY <= CANVAS_HEIGHT - 16) {
        this.y = newY;
      }

      // Update current grid coordinates
      this.gridX = Math.floor(this.x / TILE_SIZE);
      this.gridY = Math.floor(this.y / TILE_SIZE);
    } else {
      this.isMoving = false;
    }
  }

  // Use active tool on targeted tile
  useAction(targetX, targetY, world, crops, hazards, sounds, particles, questCallback) {
    if (this.stamina <= 0) {
      if (particles) {
        particles.addFloatingText('Exhausted! Sleep or drink tonic.', this.x, this.y - 25, '#ef4444', 16);
      }
      return false;
    }

    const currentSlot = this.hotbar[this.activeHotbarSlot];
    if (!currentSlot) return false;

    // Trigger tool swing animation
    this.swingAnimTimer = 0.22;
    this.swingingTool = currentSlot.id;

    // 1. Refill watering can if clicking near pond or well
    const tileType = world.getTile(targetX, targetY);
    if (tileType === TILE.WATER || tileType === TILE.WELL) {
      this.waterLevel = this.waterCapacity;
      if (sounds) sounds.playWater();
      if (particles) {
        particles.spawnWaterSplash(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2);
        particles.addFloatingText(`Water Refilled! (${this.waterLevel}/${this.waterCapacity})`, this.x, this.y - 20, '#38bdf8', 16);
      }
      return true;
    }

    // 2. Open Shipping Bin or Market if clicking bin
    if (tileType === TILE.SHIPPING_BIN) {
      // Handled by UI modal
      return 'shipping_bin';
    }

    // 3. Shoo crows nearby
    const shooedCrow = hazards.shooCrowNear(this.x, this.y, particles, sounds);
    if (shooedCrow && questCallback) {
      questCallback('crows_shooed', 1);
    }

    // 4. Handle specific tools
    if (currentSlot.id === 'hoe') {
      // Bonk mole if present
      const moleReward = hazards.bonkMole(targetX, targetY, particles, sounds);
      if (moleReward > 0) {
        this.coins += moleReward;
        this.stamina = Math.max(0, this.stamina - 2);
        if (questCallback) questCallback('total_coins', this.coins);
        return true;
      }

      // Clear weed if present
      if (hazards.clearWeed(targetX, targetY, particles, sounds)) {
        this.stamina = Math.max(0, this.stamina - 2);
        this.gainXp(5, particles, sounds);
        return true;
      }

      // Till soil (support copper hoe 1x3 till)
      const tilesToTill = [{ x: targetX, y: targetY }];
      if (this.hoeLevel >= 1) {
        if (this.facing === 'up' || this.facing === 'down') {
          tilesToTill.push({ x: targetX - 1, y: targetY });
          tilesToTill.push({ x: targetX + 1, y: targetY });
        } else {
          tilesToTill.push({ x: targetX, y: targetY - 1 });
          tilesToTill.push({ x: targetX, y: targetY + 1 });
        }
      }

      let anyTilled = false;
      for (const t of tilesToTill) {
        if (world.tillTile(t.x, t.y)) {
          anyTilled = true;
          if (particles) particles.spawnDirtPuff(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
        }
      }

      if (anyTilled) {
        this.stamina = Math.max(0, this.stamina - 2);
        if (sounds) sounds.playTill();
        this.gainXp(3, particles, sounds);
        return true;
      }
    } else if (currentSlot.id === 'watering_can') {
      if (this.waterLevel <= 0) {
        if (particles) {
          particles.addFloatingText('Can is empty! Refill at the pond.', this.x, this.y - 20, '#60a5fa', 15);
        }
        return false;
      }

      // Check for fire extinguish first
      if (hazards.douseFire(targetX, targetY, particles, sounds)) {
        this.waterLevel--;
        this.stamina = Math.max(0, this.stamina - 2);
        this.gainXp(20, particles, sounds);
        if (questCallback) questCallback('fire_doused', 1);
        return true;
      }

      // Water target tiles (arc depending on canLevel)
      const tilesToWater = [{ x: targetX, y: targetY }];
      if (this.canLevel === 1) { // 1x3 line
        if (this.facing === 'up' || this.facing === 'down') {
          tilesToWater.push({ x: targetX - 1, y: targetY });
          tilesToWater.push({ x: targetX + 1, y: targetY });
        } else {
          tilesToWater.push({ x: targetX, y: targetY - 1 });
          tilesToWater.push({ x: targetX, y: targetY + 1 });
        }
      } else if (this.canLevel >= 2) { // 3x3 square
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx !== 0 || dy !== 0) {
              tilesToWater.push({ x: targetX + dx, y: targetY + dy });
            }
          }
        }
      }

      let anyWatered = false;
      for (const t of tilesToWater) {
        if (this.waterLevel > 0 && world.waterTile(t.x, t.y)) {
          anyWatered = true;
          this.waterLevel--;
          if (particles) particles.spawnWaterSplash(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
        }
      }

      if (anyWatered) {
        this.stamina = Math.max(0, this.stamina - 1);
        if (sounds) sounds.playWater();
        return true;
      }
    } else if (currentSlot.id === 'scythe') {
      // Clear weeds
      if (hazards.clearWeed(targetX, targetY, particles, sounds)) {
        this.stamina = Math.max(0, this.stamina - 2);
        this.gainXp(5, particles, sounds);
        return true;
      }

      // Harvest ripe crop
      if (crops.hasCrop(targetX, targetY)) {
        const crop = crops.harvest(targetX, targetY);
        if (crop) {
          const cid = crop.cropId;
          this.harvested[cid] = (this.harvested[cid] || 0) + 1;
          this.stamina = Math.max(0, this.stamina - 1);

          if (sounds) sounds.playHarvest();
          if (particles) {
            particles.spawnSparkles(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2, 16);
            particles.addFloatingText(`+1 ${crop.config.name}!`, targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE - 15, '#facc15', 18);
          }

          this.gainXp(12, particles, sounds);
          if (questCallback) {
            questCallback('harvest_count', 1);
            questCallback(`harvest_${cid}`, 1);
          }
          return true;
        } else {
          if (particles) {
            particles.addFloatingText('Still growing...', targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE, '#cbd5e1', 14);
          }
        }
      }
    } else if (currentSlot.id === 'pickaxe') {
      // Clear rock or stump
      const obstacle = world.clearObstacle(targetX, targetY);
      if (obstacle) {
        this.stamina = Math.max(0, this.stamina - 5);
        if (sounds) sounds.playTill();
        if (particles) {
          particles.spawnDirtPuff(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2);
          particles.addFloatingText(obstacle === 'rock' ? '+Stone (+10g)' : '+Wood (+8g)', targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE - 15, '#e2e8f0', 15);
        }
        this.coins += obstacle === 'rock' ? 10 : 8;
        this.gainXp(8, particles, sounds);
        if (questCallback) questCallback('total_coins', this.coins);
        return true;
      }

      // Dismantle structure (scarecrow, sprinkler, fence)
      const struct = world.removeStructure(targetX, targetY);
      if (struct) {
        this.items[struct] = (this.items[struct] || 0) + 1;
        if (sounds) sounds.playPop();
        if (particles) {
          particles.addFloatingText(`Retrieved ${struct}`, targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE, '#cbd5e1', 14);
        }
        return true;
      }
    } else if (currentSlot.type === 'seed') {
      // Planting seed
      const cid = currentSlot.cropId;
      if (!this.seeds[cid] || this.seeds[cid] <= 0) {
        if (particles) {
          particles.addFloatingText('No seeds left! Buy in shop.', this.x, this.y - 20, '#f87171', 14);
        }
        return false;
      }

      if (!world.isTileTilled(targetX, targetY)) {
        if (particles) {
          particles.addFloatingText('Must till soil first!', targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE, '#cbd5e1', 14);
        }
        return false;
      }

      if (crops.hasCrop(targetX, targetY)) {
        return false;
      }

      if (crops.plant(targetX, targetY, cid)) {
        this.seeds[cid]--;
        this.stamina = Math.max(0, this.stamina - 1);
        if (sounds) sounds.playPlant();
        if (particles) {
          particles.spawnDirtPuff(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2);
          particles.addFloatingText(`Planted ${CROPS[cid].name}`, targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE - 10, '#84cc16', 14);
        }
        return true;
      }
    } else if (currentSlot.type === 'item') {
      const itId = currentSlot.itemId;
      if (!this.items[itId] || this.items[itId] <= 0) {
        if (particles) {
          particles.addFloatingText(`No ${itId} available!`, this.x, this.y - 20, '#f87171', 14);
        }
        return false;
      }

      if (itId === 'scarecrow' || itId === 'sprinkler' || itId === 'fence') {
        if (world.placeStructure(targetX, targetY, itId)) {
          this.items[itId]--;
          if (sounds) sounds.playPop();
          if (particles) {
            particles.spawnSparkles(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2, 8);
            particles.addFloatingText(`Placed ${itId}!`, targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE - 15, '#facc15', 15);
          }
          if (itId === 'scarecrow' && questCallback) {
            questCallback('placed_scarecrow', 1);
          }
          return true;
        }
      } else if (itId === 'fertilizer') {
        const crop = crops.getCrop(targetX, targetY);
        if (crop && !crop.isFertilized) {
          crop.isFertilized = true;
          this.items.fertilizer--;
          if (sounds) sounds.playPlant();
          if (particles) {
            particles.spawnSparkles(targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE + TILE_SIZE / 2, 10);
            particles.addFloatingText('Fertilized! +50% Growth Speed', targetX * TILE_SIZE + TILE_SIZE / 2, targetY * TILE_SIZE - 15, '#4ade80', 15);
          }
          return true;
        }
      }
    }

    return false;
  }

  // Draw Farmer Character Sprite
  draw(ctx, now) {
    ctx.save();

    const cx = this.x;
    const cy = this.y;

    // Walking leg bobbing
    const walkBob = this.isMoving ? Math.sin(this.walkAnimTimer) * 2.5 : 0;
    const legOffset = this.isMoving ? Math.sin(this.walkAnimTimer) * 4 : 0;

    // Character Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs / Boots
    ctx.fillStyle = this.hasSpeedBoots ? '#b45309' : '#1e293b';
    ctx.fillRect(cx - 7, cy + 8 + legOffset, 5, 8);
    ctx.fillRect(cx + 2, cy + 8 - legOffset, 5, 8);

    // Blue Denim Overalls Body
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(cx - 9, cy - 6 + walkBob, 18, 16, 4);
    ctx.fill();

    // Plaid Shirt sleeves
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx - 11, cy - 4 + walkBob, 3, 8);
    ctx.fillRect(cx + 8, cy - 4 + walkBob, 3, 8);

    // Overalls straps
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(cx - 6, cy - 6 + walkBob, 3, 10);
    ctx.fillRect(cx + 3, cy - 6 + walkBob, 3, 10);

    // Farmer Face / Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, cy - 10 + walkBob, 8, 0, Math.PI * 2);
    ctx.fill();

    // Eyes based on facing
    ctx.fillStyle = '#18181b';
    if (this.facing === 'down') {
      ctx.fillRect(cx - 4, cy - 10 + walkBob, 2, 2.5);
      ctx.fillRect(cx + 2, cy - 10 + walkBob, 2, 2.5);
    } else if (this.facing === 'up') {
      // Back of head, no eyes visible
    } else if (this.facing === 'left') {
      ctx.fillRect(cx - 5, cy - 10 + walkBob, 2, 2.5);
    } else if (this.facing === 'right') {
      ctx.fillRect(cx + 3, cy - 10 + walkBob, 2, 2.5);
    }

    // Classic Straw Hat
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 15 + walkBob, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.arc(cx, cy - 17 + walkBob, 8, Math.PI, 0);
    ctx.fill();
    // Red hat ribbon
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - 8, cy - 17 + walkBob, 16, 2.5);

    // Tool swinging animation
    if (this.swingAnimTimer > 0) {
      this.swingAnimTimer -= 0.016;
      ctx.fillStyle = '#94a3b8';
      let toolX = cx + (this.facing === 'right' ? 14 : -14);
      let toolY = cy + walkBob;
      ctx.beginPath();
      ctx.arc(toolX, toolY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
