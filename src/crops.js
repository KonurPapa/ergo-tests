// ============================================================================
// Harvest Haven - Crop Lifecycle & Visual Renderer
// ============================================================================

class CropManager {
  constructor() {
    this.crops = new Map(); // key: `${x},${y}` -> crop object
  }

  reset() {
    this.crops.clear();
  }

  getKey(x, y) {
    return `${x},${y}`;
  }

  hasCrop(x, y) {
    return this.crops.has(this.getKey(x, y));
  }

  getCrop(x, y) {
    return this.crops.get(this.getKey(x, y));
  }

  plant(x, y, cropId, isFertilized = false) {
    const config = CROPS[cropId];
    if (!config) return false;

    this.crops.set(this.getKey(x, y), {
      x,
      y,
      cropId,
      config,
      growth: 0.0, // 0.0 to 1.0
      stage: 0,
      isFertilized: isFertilized,
      isWilted: false,
      wiltTimer: 0,
      isInfested: false,
      isRipe: false,
      sparkleTimer: 0
    });
    return true;
  }

  harvest(x, y) {
    const crop = this.getCrop(x, y);
    if (!crop || !crop.isRipe) return null;

    this.crops.delete(this.getKey(x, y));
    return crop;
  }

  remove(x, y) {
    this.crops.delete(this.getKey(x, y));
  }

  // Update growth for all crops
  update(dt, isTileWateredFn, weather = 'Sunny', particleSys = null) {
    for (const [key, crop] of this.crops.entries()) {
      const isWatered = isTileWateredFn(crop.x, crop.y);

      // Check wilting during heatwaves if unwatered
      if (!isWatered && weather === 'Heatwave' && !crop.isRipe) {
        crop.wiltTimer += dt;
        if (crop.wiltTimer > 18) {
          crop.isWilted = true;
        }
      } else if (isWatered) {
        crop.wiltTimer = 0;
        crop.isWilted = false;
      }

      if (crop.isRipe) {
        // Ripe sparkle particle emitter
        crop.sparkleTimer = (crop.sparkleTimer || 0) + dt;
        if (crop.sparkleTimer > 1.2 && particleSys) {
          crop.sparkleTimer = 0;
          particleSys.spawnSparkles(
            crop.x * TILE_SIZE + TILE_SIZE / 2,
            crop.y * TILE_SIZE + TILE_SIZE / 2,
            4
          );
        }
        continue;
      }

      // If infested with bugs, growth slows to a halt
      if (crop.isInfested) {
        continue;
      }

      // Only grow if soil is watered and not wilted
      if (isWatered && !crop.isWilted) {
        const speedMult = (crop.isFertilized ? 1.5 : 1.0) * (weather === 'Rain' ? 1.15 : 1.0);
        const growthDelta = (dt / crop.config.growthTime) * speedMult;
        crop.growth = Math.min(1.0, crop.growth + growthDelta);

        // Update stage
        const totalStages = crop.config.stages;
        crop.stage = Math.min(totalStages - 1, Math.floor(crop.growth * totalStages));

        if (crop.growth >= 1.0) {
          crop.isRipe = true;
          crop.stage = totalStages - 1;
          if (particleSys) {
            particleSys.spawnSparkles(
              crop.x * TILE_SIZE + TILE_SIZE / 2,
              crop.y * TILE_SIZE + TILE_SIZE / 2,
              8
            );
          }
        }
      }
    }
  }

  // Draw crop at (x, y)
  drawCrop(ctx, crop, now = 0) {
    const px = crop.x * TILE_SIZE;
    const py = crop.y * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    ctx.save();

    // Fertilizer indicator on ground
    if (crop.isFertilized) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy + 10, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wilted rendering
    if (crop.isWilted) {
      ctx.fillStyle = '#785434';
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 8, 0, Math.PI * 2);
      ctx.fill();
      // Drooping dry leaf
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 6);
      ctx.quadraticCurveTo(cx - 10, cy + 12, cx - 14, cy + 16);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Gentle wind sway when fully grown
    let sway = 0;
    if (crop.stage > 1) {
      sway = Math.sin(now * 0.003 + crop.x * 2 + crop.y * 3) * (crop.isRipe ? 2 : 1);
    }

    // Distinct rendering per stage & crop type
    const stage = crop.stage;
    const id = crop.cropId;

    if (stage === 0) {
      // Seed mound with tiny sprout dot
      ctx.fillStyle = '#6b451e';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.arc(cx, cy + 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 1) {
      // Early sprout
      ctx.strokeStyle = '#65a30d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx + sway, cy + 3);
      ctx.stroke();

      // Two tiny leaves
      ctx.fillStyle = '#84cc16';
      ctx.beginPath();
      ctx.ellipse(cx - 5 + sway, cy + 2, 4, 2.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 5 + sway, cy + 2, 4, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 2) {
      // Mid-stage foliage
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx + sway, cy - 2);
      ctx.stroke();

      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.arc(cx - 6 + sway, cy + 2, 5, 0, Math.PI * 2);
      ctx.arc(cx + 6 + sway, cy + 2, 5, 0, Math.PI * 2);
      ctx.arc(cx + sway, cy - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Stage 3 & Mature/Ripe Stage
      this.drawMatureCrop(ctx, id, cx + sway, cy, crop.isRipe, now);
    }

    // Beetle infestation indicator
    if (crop.isInfested) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx + 10, cy - 10, 4, 0, Math.PI * 2);
      ctx.fill();
      // Bug antennae
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 10, cy - 12);
      ctx.lineTo(cx + 7, cy - 16);
      ctx.moveTo(cx + 10, cy - 12);
      ctx.lineTo(cx + 13, cy - 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawMatureCrop(ctx, cropId, cx, cy, isRipe, now) {
    if (cropId === 'wheat') {
      // Golden Wheat stalk with ears of grain
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 14);
      ctx.lineTo(cx, cy - 6);
      ctx.stroke();

      ctx.fillStyle = isRipe ? '#facc15' : '#eab308';
      // Ear sheafs
      for (let i = 0; i < 4; i++) {
        const yOffset = cy - 4 - i * 5;
        ctx.beginPath();
        ctx.ellipse(cx - 4, yOffset, 5, 2.8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(cx + 4, yOffset, 5, 2.8, 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (cropId === 'carrot') {
      // Feathery green carrot tops + orange shoulder showing in earth
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(cx - 7, cy - 2, 8, 3.5, -0.6, 0, Math.PI * 2);
      ctx.ellipse(cx + 7, cy - 2, 8, 3.5, 0.6, 0, Math.PI * 2);
      ctx.ellipse(cx, cy - 6, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Orange root shoulder
      ctx.fillStyle = isRipe ? '#ea580c' : '#f97316';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 6, isRipe ? 8 : 6, isRipe ? 6 : 4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (cropId === 'tomato') {
      // Tomato vine bush with plump red spheres
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
      ctx.fill();

      // Red tomatoes
      ctx.fillStyle = isRipe ? '#ef4444' : '#84cc16';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 4, 5.5, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy + 2, 5.5, 0, Math.PI * 2);
      ctx.arc(cx, cy - 4, 6, 0, Math.PI * 2);
      ctx.fill();

      // Tomato green star crowns
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy - 1, 2, 0, Math.PI * 2);
      ctx.arc(cx, cy - 7, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (cropId === 'strawberry') {
      // Low strawberry crown with deep pink berries
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(cx - 8, cy + 6, 7, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy + 6, 7, 0, Math.PI * 2);
      ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
      ctx.fill();

      // Berries
      ctx.fillStyle = isRipe ? '#ec4899' : '#a3e635';
      for (const [bx, by] of [[cx - 5, cy + 5], [cx + 5, cy + 4], [cx, cy + 8]]) {
        ctx.beginPath();
        ctx.moveTo(bx - 3.5, by - 3);
        ctx.lineTo(bx + 3.5, by - 3);
        ctx.lineTo(bx, by + 4.5);
        ctx.closePath();
        ctx.fill();
      }
    } else if (cropId === 'pumpkin') {
      // Broad trailing leaves + heavy orange ribbed pumpkin
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(cx - 10, cy - 4, 10, 5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(cx + 10, cy - 4, 10, 5, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Pumpkin body
      ctx.fillStyle = isRipe ? '#c2410c' : '#15803d';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 4, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isRipe ? '#f97316' : '#22c55e';
      ctx.beginPath();
      ctx.ellipse(cx - 5, cy + 4, 7, 10, -0.1, 0, Math.PI * 2);
      ctx.ellipse(cx + 5, cy + 4, 7, 10, 0.1, 0, Math.PI * 2);
      ctx.ellipse(cx, cy + 4, 8, 10.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Green stem
      ctx.fillStyle = '#166534';
      ctx.fillRect(cx - 2, cy - 9, 4, 5);
    } else if (cropId === 'starfruit') {
      // Celestial starfruit with mystical glow
      const glow = Math.sin(now * 0.005) * 4;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 18 + glow, 0, Math.PI * 2);
      ctx.fill();

      // Golden 5-point star
      ctx.fillStyle = isRipe ? '#fbbf24' : '#818cf8';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerAngle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const innerAngle = outerAngle + Math.PI / 5;
        const ox = cx + Math.cos(outerAngle) * 13;
        const oy = cy + Math.sin(outerAngle) * 13;
        const ix = cx + Math.cos(innerAngle) * 6;
        const iy = cy + Math.sin(innerAngle) * 6;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Golden harvest badge pulse if ripe
    if (isRipe) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(cx, cy - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
