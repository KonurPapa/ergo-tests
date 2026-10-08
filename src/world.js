// ============================================================================
// Harvest Haven - Farm World Grid, Buildings, Weather, and Day-Night Cycle
// ============================================================================

class FarmWorld {
  constructor() {
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.tiles = []; // 2D array [y][x]
    this.scarecrows = []; // list of { x, y }
    this.sprinklers = []; // list of { x, y }

    // Time & Day Cycle
    this.day = 1;
    this.timeMinutes = 6 * 60; // Starts at 06:00 AM (360 mins)
    this.timeSpeed = 20; // 20 in-game minutes per real second (~18 seconds per 6 hours)
    this.isPaused = false;

    // Weather
    this.weather = WEATHER.SUNNY;
    this.weatherForecast = WEATHER.RAIN;

    // Shipping bin contents awaiting sale at night
    this.shippingBinItems = [];

    // Daily statistics
    this.dailyStats = {
      cropsHarvested: 0,
      goldEarned: 0,
      hazardsThwarted: 0
    };

    this.initMap();
  }

  reset() {
    this.day = 1;
    this.timeMinutes = 6 * 60;
    this.weather = WEATHER.SUNNY;
    this.weatherForecast = WEATHER.RAIN;
    this.shippingBinItems = [];
    this.dailyStats = { cropsHarvested: 0, goldEarned: 0, hazardsThwarted: 0 };
    this.initMap();
  }

  initMap() {
    this.tiles = [];
    this.scarecrows = [];
    this.sprinklers = [];

    // Base Grass field
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(TILE.GRASS);
      }
      this.tiles.push(row);
    }

    // Cobblestone / Dirt paths
    for (let x = 6; x <= 17; x++) {
      this.tiles[4][x] = TILE.PATH;
    }
    for (let y = 4; y <= 13; y++) {
      this.tiles[y][10] = TILE.PATH;
    }

    // Farmhouse layout (x: 2..5, y: 1..3)
    for (let y = 1; y <= 3; y++) {
      for (let x = 2; x <= 5; x++) {
        this.tiles[y][x] = TILE.HOUSE;
      }
    }

    // Shipping Bin (x: 6, y: 3)
    this.tiles[3][6] = TILE.SHIPPING_BIN;

    // Fresh Water Pond & Stone Well (x: 18..21, y: 1..3)
    for (let y = 1; y <= 3; y++) {
      for (let x = 18; x <= 21; x++) {
        this.tiles[y][x] = TILE.WATER;
      }
    }
    this.tiles[3][17] = TILE.WELL;

    // Pre-tilled Starter Plots (x: 6..9, y: 6..9)
    for (let y = 6; y <= 9; y++) {
      for (let x = 6; x <= 9; x++) {
        this.tiles[y][x] = TILE.TILLED_DRY;
      }
    }

    // Scatter a few natural rocks & tree stumps for clearing
    const obstacles = [
      { x: 1, y: 8 }, { x: 2, y: 12 }, { x: 12, y: 7 }, { x: 15, y: 12 },
      { x: 22, y: 8 }, { x: 21, y: 13 }, { x: 14, y: 2 }, { x: 1, y: 14 }
    ];
    for (const ob of obstacles) {
      this.tiles[ob.y][ob.x] = (ob.x + ob.y) % 2 === 0 ? TILE.ROCK : TILE.STUMP;
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return TILE.GRASS;
    return this.tiles[y][x];
  }

  setTile(x, y, tileType) {
    if (this.inBounds(x, y)) {
      this.tiles[y][x] = tileType;
    }
  }

  isSolid(x, y) {
    if (!this.inBounds(x, y)) return true;
    const t = this.tiles[y][x];
    return (
      t === TILE.HOUSE ||
      t === TILE.WATER ||
      t === TILE.ROCK ||
      t === TILE.STUMP ||
      t === TILE.FENCE ||
      t === TILE.WELL
    );
  }

  isTileTilled(x, y) {
    const t = this.getTile(x, y);
    return t === TILE.TILLED_DRY || t === TILE.TILLED_WET;
  }

  isTileWatered(x, y) {
    return this.getTile(x, y) === TILE.TILLED_WET;
  }

  tillTile(x, y) {
    if (!this.inBounds(x, y)) return false;
    const t = this.getTile(x, y);
    if (t === TILE.GRASS || t === TILE.PATH) {
      this.setTile(x, y, TILE.TILLED_DRY);
      return true;
    }
    return false;
  }

  waterTile(x, y) {
    if (!this.inBounds(x, y)) return false;
    const t = this.getTile(x, y);
    if (t === TILE.TILLED_DRY) {
      this.setTile(x, y, TILE.TILLED_WET);
      return true;
    }
    return false;
  }

  placeStructure(x, y, type) {
    if (!this.inBounds(x, y)) return false;
    const current = this.getTile(x, y);
    if (current !== TILE.GRASS && current !== TILE.TILLED_DRY && current !== TILE.TILLED_WET) {
      return false;
    }

    if (type === 'scarecrow') {
      this.setTile(x, y, TILE.SCARECROW);
      this.scarecrows.push({ x, y });
      return true;
    } else if (type === 'sprinkler') {
      this.setTile(x, y, TILE.SPRINKLER);
      this.sprinklers.push({ x, y });
      return true;
    } else if (type === 'fence') {
      this.setTile(x, y, TILE.FENCE);
      return true;
    }
    return false;
  }

  removeStructure(x, y) {
    const t = this.getTile(x, y);
    if (t === TILE.SCARECROW) {
      this.scarecrows = this.scarecrows.filter(s => !(s.x === x && s.y === y));
      this.setTile(x, y, TILE.GRASS);
      return 'scarecrow';
    } else if (t === TILE.SPRINKLER) {
      this.sprinklers = this.sprinklers.filter(s => !(s.x === x && s.y === y));
      this.setTile(x, y, TILE.GRASS);
      return 'sprinkler';
    } else if (t === TILE.FENCE) {
      this.setTile(x, y, TILE.GRASS);
      return 'fence';
    }
    return null;
  }

  clearObstacle(x, y) {
    const t = this.getTile(x, y);
    if (t === TILE.ROCK || t === TILE.STUMP) {
      this.setTile(x, y, TILE.GRASS);
      return t === TILE.ROCK ? 'rock' : 'stump';
    }
    return null;
  }

  getScarecrows() {
    return this.scarecrows;
  }

  getTillableTiles() {
    const list = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.isTileTilled(x, y)) {
          list.push({ x, y });
        }
      }
    }
    return list;
  }

  getEmptyTiles() {
    const list = [];
    for (let y = 5; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.tiles[y][x] === TILE.GRASS) {
          list.push({ x, y });
        }
      }
    }
    return list;
  }

  // Time & Day Update
  updateTime(dt, onDayEndCallback) {
    if (this.isPaused) return;

    this.timeMinutes += (dt * this.timeSpeed);

    // Midnight (24:00) forces sleep and end of day
    if (this.timeMinutes >= 24 * 60) {
      if (onDayEndCallback) {
        onDayEndCallback();
      }
    }
  }

  getTimeFormatted() {
    const totalMins = Math.floor(this.timeMinutes);
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const displayMin = mins < 10 ? '0' + mins : mins;
    return `${displayHour}:${displayMin} ${ampm}`;
  }

  // Advance to next day (called when player sleeps or midnight strikes)
  advanceToNextDay(cropsManager, particleSys) {
    this.day++;
    this.timeMinutes = 6 * 60; // 06:00 AM

    // Weather transition
    this.weather = this.weatherForecast;
    const weatherRoll = Math.random();
    if (weatherRoll < 0.55) {
      this.weatherForecast = WEATHER.SUNNY;
    } else if (weatherRoll < 0.78) {
      this.weatherForecast = WEATHER.RAIN;
    } else if (weatherRoll < 0.90) {
      this.weatherForecast = WEATHER.HEATWAVE;
    } else {
      this.weatherForecast = WEATHER.THUNDERSTORM;
    }

    // Sprinklers water surrounding 8 tiles
    for (const sp of this.sprinklers) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = sp.x + dx;
          const ny = sp.y + dy;
          if (this.inBounds(nx, ny) && this.getTile(nx, ny) === TILE.TILLED_DRY) {
            this.setTile(nx, ny, TILE.TILLED_WET);
            if (particleSys) {
              particleSys.spawnWaterSplash(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE / 2);
            }
          }
        }
      }
    }

    // If Rain or Thunderstorm, water ALL tilled tiles
    if (this.weather === WEATHER.RAIN || this.weather === WEATHER.THUNDERSTORM) {
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          if (this.tiles[y][x] === TILE.TILLED_DRY) {
            this.tiles[y][x] = TILE.TILLED_WET;
          }
        }
      }
    } else {
      // Non-rainy day: soil that was wet yesterday naturally dries up unless irrigated
      for (let y = 0; y < this.rows; y++) {
        for (let x = 0; x < this.cols; x++) {
          if (this.tiles[y][x] === TILE.TILLED_WET) {
            // Check if irrigated by sprinkler
            const hasSprinkler = this.sprinklers.some(
              s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1
            );
            if (!hasSprinkler) {
              this.tiles[y][x] = TILE.TILLED_DRY;
            }
          }
        }
      }
    }
  }

  // Calculate ambient lighting based on time of day
  getAmbientColor() {
    const hours = this.timeMinutes / 60; // 6.0 to 24.0

    // Weather darkens the sky
    let weatherDarkness = 0.0;
    if (this.weather === WEATHER.RAIN) weatherDarkness = 0.15;
    if (this.weather === WEATHER.THUNDERSTORM) weatherDarkness = 0.28;

    if (hours < 8.0) {
      // Sunrise: soft golden-pink tint
      const p = (hours - 6.0) / 2.0;
      return `rgba(251, 191, 36, ${Math.max(0, (0.18 - p * 0.18) + weatherDarkness)})`;
    } else if (hours < 17.0) {
      // Daytime: clear or stormy
      if (this.weather === WEATHER.HEATWAVE) {
        return 'rgba(249, 115, 22, 0.12)'; // warm heat haze
      }
      return `rgba(15, 23, 42, ${weatherDarkness})`;
    } else if (hours < 20.0) {
      // Sunset: orange to indigo
      const p = (hours - 17.0) / 3.0;
      return `rgba(234, 88, 12, ${0.1 + p * 0.2 + weatherDarkness})`;
    } else {
      // Night: deep starry blue
      const p = (hours - 20.0) / 4.0;
      const alpha = Math.min(0.72, 0.35 + p * 0.35 + weatherDarkness);
      return `rgba(15, 23, 42, ${alpha})`;
    }
  }

  // Draw background grid tiles
  drawTiles(ctx) {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const t = this.tiles[y][x];

        if (t === TILE.GRASS) {
          // Lush grass with subtle checker pattern & flowers
          ctx.fillStyle = (x + y) % 2 === 0 ? '#4ade80' : '#22c55e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Small flower speckle
          if ((x * 7 + y * 13) % 19 === 0) {
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(px + 14, py + 16, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if ((x * 11 + y * 5) % 23 === 0) {
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(px + 32, py + 28, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (t === TILE.PATH) {
          // Dirt / stone trail
          ctx.fillStyle = '#d97706';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px + 4, py + 6, 12, 10);
          ctx.fillRect(px + 22, py + 24, 16, 12);
        } else if (t === TILE.TILLED_DRY) {
          // Dry tilled earth
          ctx.fillStyle = '#a16207';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Soil furrows
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 2, py + 12);
          ctx.lineTo(px + TILE_SIZE - 2, py + 12);
          ctx.moveTo(px + 2, py + 24);
          ctx.lineTo(px + TILE_SIZE - 2, py + 24);
          ctx.moveTo(px + 2, py + 36);
          ctx.lineTo(px + TILE_SIZE - 2, py + 36);
          ctx.stroke();
        } else if (t === TILE.TILLED_WET) {
          // Dark moist watered earth
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Water sheen
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(px + 2, py + 12);
          ctx.lineTo(px + TILE_SIZE - 2, py + 12);
          ctx.moveTo(px + 2, py + 24);
          ctx.lineTo(px + TILE_SIZE - 2, py + 24);
          ctx.moveTo(px + 2, py + 36);
          ctx.lineTo(px + TILE_SIZE - 2, py + 36);
          ctx.stroke();

          // Wet reflection dot
          ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
          ctx.beginPath();
          ctx.ellipse(px + 24, py + 24, 8, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (t === TILE.WATER) {
          // Deep fresh blue pond
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          // Wave ripple
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px + 24, py + 24, 12, 0.2, 1.2);
          ctx.stroke();
        } else if (t === TILE.WELL) {
          // Stone well
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Stone ring
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.arc(px + 24, py + 26, 18, 0, Math.PI * 2);
          ctx.fill();

          // Deep well center
          ctx.fillStyle = '#0369a1';
          ctx.beginPath();
          ctx.arc(px + 24, py + 26, 12, 0, Math.PI * 2);
          ctx.fill();

          // Wooden bucket
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px + 18, py + 18, 12, 10);
        } else if (t === TILE.SHIPPING_BIN) {
          // Wooden crate bin
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#92400e';
          ctx.fillRect(px + 6, py + 10, 36, 30);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px + 8, py + 12, 32, 26);
          // Metal brackets
          ctx.fillStyle = '#78716c';
          ctx.fillRect(px + 6, py + 10, 6, 6);
          ctx.fillRect(px + 36, py + 10, 6, 6);
          ctx.fillRect(px + 6, py + 34, 6, 6);
          ctx.fillRect(px + 36, py + 34, 6, 6);
        } else if (t === TILE.ROCK) {
          // Natural Boulder
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.ellipse(px + 24, py + 26, 17, 13, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(px + 20, py + 22, 11, 7, -0.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (t === TILE.STUMP) {
          // Wood stump
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(px + 24, py + 28, 16, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.ellipse(px + 24, py + 24, 12, 8, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (t === TILE.FENCE) {
          // Fence post
          ctx.fillStyle = '#4ade80';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          ctx.fillStyle = '#78350f';
          ctx.fillRect(px + 18, py + 6, 12, 36);
          ctx.fillStyle = '#a16207';
          ctx.fillRect(px + 2, py + 14, 44, 6);
          ctx.fillRect(px + 2, py + 26, 44, 6);
        } else if (t === TILE.SCARECROW) {
          // Scarecrow structure
          ctx.fillStyle = (x + y) % 2 === 0 ? '#4ade80' : '#22c55e';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Aura of protection (subtle yellow ring)
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px + 24, py + 24, 22, 0, Math.PI * 2);
          ctx.stroke();

          // Wooden post
          ctx.fillStyle = '#78350f';
          ctx.fillRect(px + 22, py + 12, 4, 32);
          // Horizontal arms
          ctx.fillRect(px + 8, py + 18, 32, 4);

          // Straw shirt
          ctx.fillStyle = '#3b82f6';
          ctx.fillRect(px + 16, py + 18, 16, 14);

          // Pumpkin head / straw face
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(px + 24, py + 12, 7, 0, Math.PI * 2);
          ctx.fill();

          // Hat
          ctx.fillStyle = '#a16207';
          ctx.fillRect(px + 14, py + 5, 20, 3);
          ctx.fillRect(px + 18, py + 1, 12, 4);
        } else if (t === TILE.SPRINKLER) {
          // Auto-sprinkler
          ctx.fillStyle = '#451a03';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

          // Copper base
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(px + 24, py + 28, 12, 0, Math.PI * 2);
          ctx.fill();

          // Brass nozzle
          ctx.fillStyle = '#facc15';
          ctx.fillRect(px + 21, py + 10, 6, 14);

          // Rotating water mist ring
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px + 24, py + 20, 16, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Draw Farmhouse on top
    this.drawFarmhouse(ctx);
  }

  // Draw Cozy Farmhouse Cabin
  drawFarmhouse(ctx) {
    const hx = 2 * TILE_SIZE;
    const hy = 1 * TILE_SIZE;
    const hw = 4 * TILE_SIZE;
    const hh = 3 * TILE_SIZE;

    ctx.save();
    // House Base / Wooden Walls
    ctx.fillStyle = '#92400e';
    ctx.fillRect(hx + 8, hy + 38, hw - 16, hh - 42);

    // Wall plank lines
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    for (let py = hy + 48; py < hy + hh - 10; py += 16) {
      ctx.beginPath();
      ctx.moveTo(hx + 8, py);
      ctx.lineTo(hx + hw - 8, py);
      ctx.stroke();
    }

    // Cozy Sloped Red Tile Roof
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 40);
    ctx.lineTo(hx + hw / 2, hy + 2);
    ctx.lineTo(hx + hw, hy + 40);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Stone Chimney
    ctx.fillStyle = '#475569';
    ctx.fillRect(hx + hw - 36, hy + 6, 16, 26);
    ctx.fillStyle = '#334155';
    ctx.fillRect(hx + hw - 38, hy + 4, 20, 4);

    // Front Wooden Door
    const doorX = hx + hw / 2 - 14;
    const doorY = hy + hh - 42;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(doorX, doorY, 28, 38);

    // Brass doorknob
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(doorX + 22, doorY + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Window with cozy warm light
    const winX = hx + 24;
    const winY = hy + 50;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(winX, winY, 22, 22);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(winX, winY, 22, 22);
    ctx.beginPath();
    ctx.moveTo(winX + 11, winY);
    ctx.lineTo(winX + 11, winY + 22);
    ctx.moveTo(winX, winY + 11);
    ctx.lineTo(winX + 22, winY + 11);
    ctx.stroke();

    ctx.restore();
  }

  // Draw day-night ambient lighting overlay & player lantern glow
  drawLighting(ctx, playerPxX, playerPxY) {
    const ambientColor = this.getAmbientColor();
    const hours = this.timeMinutes / 60;

    ctx.save();
    ctx.fillStyle = ambientColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // At night (after 19:30), cast warm circular lantern light around the player
    if (hours >= 19.5 || hours < 6.5) {
      ctx.globalCompositeOperation = 'destination-out';
      const gradient = ctx.createRadialGradient(
        playerPxX, playerPxY, 15,
        playerPxX, playerPxY, 130
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(playerPxX, playerPxY, 130, 0, Math.PI * 2);
      ctx.fill();

      // House window cozy night glow
      const hx = 2 * TILE_SIZE + 24 + 11;
      const hy = 1 * TILE_SIZE + 50 + 11;
      const winGrad = ctx.createRadialGradient(hx, hy, 10, hx, hy, 60);
      winGrad.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
      winGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = winGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
