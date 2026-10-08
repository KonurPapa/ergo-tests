// ============================================================================
// Harvest Haven - UI Controller, Modals, Menus & HUD Updates
// ============================================================================

class UIController {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.hudDay = document.getElementById('hud-day');
    this.hudTime = document.getElementById('hud-time');
    this.hudWeather = document.getElementById('hud-weather');
    this.hudGold = document.getElementById('hud-gold');
    this.staminaFill = document.getElementById('stamina-fill');
    this.staminaText = document.getElementById('stamina-text');
    this.waterFill = document.getElementById('water-fill');
    this.waterText = document.getElementById('water-text');
    this.xpFill = document.getElementById('xp-fill');
    this.levelBadge = document.getElementById('level-badge');
    this.hotbarContainer = document.getElementById('hotbar');

    // Modals
    this.modalOverlay = document.getElementById('modal-overlay');
    this.shopModal = document.getElementById('shop-modal');
    this.questModal = document.getElementById('quest-modal');
    this.almanacModal = document.getElementById('almanac-modal');
    this.summaryModal = document.getElementById('summary-modal');
    this.helpModal = document.getElementById('help-modal');

    this.activeModal = null;
    this.initEventListeners();
  }

  initEventListeners() {
    // Top Bar Buttons
    document.getElementById('btn-shop').addEventListener('click', () => this.openShop());
    document.getElementById('btn-quests').addEventListener('click', () => this.openQuests());
    document.getElementById('btn-almanac').addEventListener('click', () => this.openAlmanac());
    document.getElementById('btn-sleep').addEventListener('click', () => this.game.promptSleep());
    document.getElementById('btn-help').addEventListener('click', () => this.openHelp());

    // Audio Toggles
    const btnMusic = document.getElementById('btn-music');
    const btnSfx = document.getElementById('btn-sfx');

    btnMusic.addEventListener('click', () => {
      const isPlaying = soundManager.toggleMusic();
      btnMusic.classList.toggle('active', isPlaying);
      btnMusic.innerText = isPlaying ? '🎵 Music: ON' : '🎵 Music: OFF';
    });

    btnSfx.addEventListener('click', () => {
      soundManager.sfxEnabled = !soundManager.sfxEnabled;
      btnSfx.classList.toggle('active', soundManager.sfxEnabled);
      btnSfx.innerText = soundManager.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
    });

    // Modal Close Buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeModals());
    });

    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.closeModals();
      }
    });

    // Sell All Harvest Button
    document.getElementById('btn-sell-all').addEventListener('click', () => {
      this.sellAllHarvest();
    });

    // Daily Summary Continue Button
    document.getElementById('btn-summary-continue').addEventListener('click', () => {
      this.closeModals();
    });
  }

  updateHUD(player, world) {
    if (!player || !world) return;

    // Time & Day
    this.hudDay.innerText = `Day ${world.day}`;
    this.hudTime.innerText = world.getTimeFormatted();

    // Weather icon & text
    let wIcon = '☀️';
    if (world.weather === WEATHER.RAIN) wIcon = '🌧️';
    else if (world.weather === WEATHER.HEATWAVE) wIcon = '🔥';
    else if (world.weather === WEATHER.THUNDERSTORM) wIcon = '⚡';
    this.hudWeather.innerHTML = `<span class="weather-icon">${wIcon}</span> ${world.weather}`;

    // Gold
    this.hudGold.innerText = `${player.coins}g`;

    // Stamina
    const staminaPct = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
    this.staminaFill.style.width = `${staminaPct}%`;
    this.staminaText.innerText = `${Math.ceil(player.stamina)} / ${player.maxStamina}`;
    if (staminaPct < 25) {
      this.staminaFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
    } else {
      this.staminaFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
    }

    // Water
    const waterPct = Math.max(0, Math.min(100, (player.waterLevel / player.waterCapacity) * 100));
    this.waterFill.style.width = `${waterPct}%`;
    this.waterText.innerText = `${player.waterLevel} / ${player.waterCapacity}`;

    // XP & Level
    const xpPct = Math.max(0, Math.min(100, (player.xp / player.xpNeeded) * 100));
    this.xpFill.style.width = `${xpPct}%`;
    this.levelBadge.innerText = `Lv. ${player.level}`;

    // Hotbar Items Rendering
    this.renderHotbar(player);
  }

  renderHotbar(player) {
    this.hotbarContainer.innerHTML = '';

    player.hotbar.forEach((slot, idx) => {
      const slotEl = document.createElement('div');
      slotEl.className = `hotbar-slot ${idx === player.activeHotbarSlot ? 'selected' : ''}`;
      slotEl.setAttribute('data-index', idx);

      let countBadge = '';
      if (slot.type === 'seed') {
        const count = player.seeds[slot.cropId] || 0;
        countBadge = `<span class="slot-count ${count === 0 ? 'empty' : ''}">${count}</span>`;
      } else if (slot.type === 'item') {
        const count = player.items[slot.itemId] || 0;
        countBadge = `<span class="slot-count ${count === 0 ? 'empty' : ''}">${count}</span>`;
      }

      slotEl.innerHTML = `
        <span class="slot-key">${idx + 1}</span>
        <span class="slot-icon">${slot.icon}</span>
        <span class="slot-name">${slot.label}</span>
        ${countBadge}
      `;

      slotEl.addEventListener('click', () => {
        player.activeHotbarSlot = idx;
        soundManager.playPop();
        this.renderHotbar(player);
      });

      this.hotbarContainer.appendChild(slotEl);
    });
  }

  // --- Modals Management ---

  openModal(modalEl) {
    this.closeModals();
    this.activeModal = modalEl;
    this.modalOverlay.classList.remove('hidden');
    modalEl.classList.remove('hidden');
    soundManager.playPop();
  }

  closeModals() {
    if (this.activeModal) {
      this.activeModal.classList.add('hidden');
      this.activeModal = null;
    }
    this.modalOverlay.classList.add('hidden');
  }

  openShop() {
    this.renderShop();
    this.openModal(this.shopModal);
  }

  renderShop() {
    const listEl = document.getElementById('shop-items-list');
    listEl.innerHTML = '';
    const player = this.game.player;

    SHOP_ITEMS.forEach(item => {
      // Check if upgrade already purchased
      let isPurchased = false;
      if (item.id === 'upgrade_can_copper' && player.canLevel >= 1) isPurchased = true;
      if (item.id === 'upgrade_can_gold' && player.canLevel >= 2) isPurchased = true;
      if (item.id === 'upgrade_hoe_copper' && player.hoeLevel >= 1) isPurchased = true;
      if (item.id === 'upgrade_boots' && player.hasSpeedBoots) isPurchased = true;

      const card = document.createElement('div');
      card.className = `shop-card ${isPurchased ? 'purchased' : ''}`;

      card.innerHTML = `
        <div class="shop-card-icon">${item.icon}</div>
        <div class="shop-card-info">
          <div class="shop-card-title">${item.name}</div>
          <div class="shop-card-desc">${item.desc}</div>
        </div>
        <div class="shop-card-action">
          <span class="shop-price">🪙 ${item.price}g</span>
          <button class="btn-buy ${isPurchased ? 'disabled' : ''}" ${isPurchased ? 'disabled' : ''}>
            ${isPurchased ? 'Owned' : 'Buy'}
          </button>
        </div>
      `;

      const buyBtn = card.querySelector('.btn-buy');
      if (!isPurchased) {
        buyBtn.addEventListener('click', () => {
          this.buyShopItem(item);
        });
      }

      listEl.appendChild(card);
    });

    // Update Harvest Sell Section
    this.renderHarvestSellSection();
  }

  renderHarvestSellSection() {
    const sellListEl = document.getElementById('harvest-sell-list');
    const player = this.game.player;
    sellListEl.innerHTML = '';

    let totalWorth = 0;
    let hasAny = false;

    Object.keys(CROPS).forEach(cid => {
      const count = player.harvested[cid] || 0;
      if (count > 0) {
        hasAny = true;
        const cropCfg = CROPS[cid];
        const worth = count * cropCfg.sellPrice;
        totalWorth += worth;

        const row = document.createElement('div');
        row.className = 'harvest-sell-row';
        row.innerHTML = `
          <span>${cropCfg.icon} ${cropCfg.name} x${count}</span>
          <span class="gold-val">+${worth}g</span>
        `;
        sellListEl.appendChild(row);
      }
    });

    if (!hasAny) {
      sellListEl.innerHTML = '<div class="empty-text">No crops harvested yet. Harvest ripe crops to sell!</div>';
    }

    document.getElementById('sell-total-worth').innerText = `${totalWorth}g`;
    const sellAllBtn = document.getElementById('btn-sell-all');
    sellAllBtn.disabled = !hasAny;
  }

  buyShopItem(item) {
    const player = this.game.player;
    if (player.coins < item.price) {
      soundManager.playCrow();
      this.game.particles.addFloatingText('Not enough gold!', player.x, player.y - 25, '#ef4444', 16);
      return;
    }

    player.coins -= item.price;
    soundManager.playCoin();

    if (item.type === 'seed') {
      player.seeds[item.cropId] = (player.seeds[item.cropId] || 0) + 1;
    } else if (item.type === 'structure') {
      player.items[item.id] = (player.items[item.id] || 0) + (item.id === 'fence' ? 3 : 1);
    } else if (item.type === 'consumable') {
      if (item.id === 'energy_tonic') {
        player.stamina = Math.min(player.maxStamina, player.stamina + 50);
        soundManager.playPop();
      } else if (item.id === 'fertilizer') {
        player.items.fertilizer = (player.items.fertilizer || 0) + 3;
      } else if (item.id === 'bug_spray') {
        player.items.bug_spray = (player.items.bug_spray || 0) + 1;
      }
    } else if (item.type === 'upgrade') {
      if (item.id === 'upgrade_can_copper') {
        player.canLevel = 1;
        player.waterCapacity = 45;
        player.waterLevel = 45;
      } else if (item.id === 'upgrade_can_gold') {
        player.canLevel = 2;
        player.waterCapacity = 90;
        player.waterLevel = 90;
      } else if (item.id === 'upgrade_hoe_copper') {
        player.hoeLevel = 1;
      } else if (item.id === 'upgrade_boots') {
        player.hasSpeedBoots = true;
      }
    }

    this.renderShop();
    this.updateHUD(player, this.game.world);
  }

  sellAllHarvest() {
    const player = this.game.player;
    let earned = 0;
    let countSold = 0;

    Object.keys(CROPS).forEach(cid => {
      const count = player.harvested[cid] || 0;
      if (count > 0) {
        earned += count * CROPS[cid].sellPrice;
        countSold += count;
        player.harvested[cid] = 0;
      }
    });

    if (earned > 0) {
      player.coins += earned;
      soundManager.playCoin();
      soundManager.playFanfare();
      this.game.particles.addFloatingText(`Sold ${countSold} crops for +${earned}g!`, player.x, player.y - 30, '#facc15', 20);
      this.game.checkQuestMetric('total_coins', player.coins);
      this.renderShop();
      this.updateHUD(player, this.game.world);
    }
  }

  openQuests() {
    this.renderQuests();
    this.openModal(this.questModal);
  }

  renderQuests() {
    const listEl = document.getElementById('quest-list');
    listEl.innerHTML = '';

    this.game.quests.forEach(quest => {
      const qCard = document.createElement('div');
      qCard.className = `quest-card ${quest.completed ? 'completed' : ''} ${quest.claimed ? 'claimed' : ''}`;

      const progressPct = Math.min(100, Math.floor((quest.current / quest.target) * 100));

      qCard.innerHTML = `
        <div class="quest-header">
          <span class="quest-title">${quest.title}</span>
          <span class="quest-reward">🪙 +${quest.reward}g</span>
        </div>
        <div class="quest-desc">${quest.desc}</div>
        <div class="quest-progress-bar">
          <div class="quest-progress-fill" style="width: ${progressPct}%"></div>
        </div>
        <div class="quest-footer">
          <span>${quest.current} / ${quest.target}</span>
          ${quest.completed && !quest.claimed ? `<button class="btn-claim">Claim Reward</button>` : ''}
          ${quest.claimed ? `<span class="claimed-tag">✓ Completed</span>` : ''}
        </div>
      `;

      const claimBtn = qCard.querySelector('.btn-claim');
      if (claimBtn) {
        claimBtn.addEventListener('click', () => {
          quest.claimed = true;
          this.game.player.coins += quest.reward;
          soundManager.playFanfare();
          this.renderQuests();
          this.updateHUD(this.game.player, this.game.world);
        });
      }

      listEl.appendChild(qCard);
    });
  }

  openAlmanac() {
    const listEl = document.getElementById('almanac-crop-list');
    listEl.innerHTML = '';

    Object.values(CROPS).forEach(crop => {
      const item = document.createElement('div');
      item.className = 'almanac-card';
      item.innerHTML = `
        <div class="almanac-icon">${crop.icon}</div>
        <div class="almanac-info">
          <h4>${crop.name}</h4>
          <p>${crop.description}</p>
          <div class="almanac-stats">
            <span>⏱️ Growth: ~${crop.growthTime}s</span>
            <span>🌱 Seed: ${crop.seedPrice}g</span>
            <span>💰 Harvest: ${crop.sellPrice}g (Profit: +${crop.sellPrice - crop.seedPrice}g)</span>
          </div>
        </div>
      `;
      listEl.appendChild(item);
    });

    this.openModal(this.almanacModal);
  }

  openDailySummary(dayNumber, earnedToday, cropsHarvested, weatherTomorrow) {
    document.getElementById('summary-day-title').innerText = `Day ${dayNumber} Recap`;
    document.getElementById('summary-gold').innerText = `+${earnedToday}g`;
    document.getElementById('summary-crops').innerText = `${cropsHarvested} crops`;
    document.getElementById('summary-forecast').innerText = `${weatherTomorrow}`;
    this.openModal(this.summaryModal);
  }

  openHelp() {
    this.openModal(this.helpModal);
  }
}
