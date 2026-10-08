# 🌾 Harvest Haven: Farm & Hazard Simulator

A rich, top-down grid-based HTML5 farming and hazard survival simulation game built with vanilla JavaScript, Canvas 2D, and procedural Web Audio API synthesis.

---

## 🎮 Overview

In **Harvest Haven**, you take charge of an idyllic yet perilous homestead. Your mission: till fertile soil, plant diverse crop varieties, manage moisture levels, harvest ripe produce, and reinvest profits into equipment, farm defenses, and expansions.

Agriculture isn't peaceful forever—dynamic environmental hazards like **hungry crows**, **creeping weed invasions**, **lightning fire strikes**, **mischievous moles**, and **scorching heatwaves** will test your farming strategy and speed!

---

## 🚜 Key Features

- **Top-Down Grid-Based Simulation**:
  - 24×16 interactive tile grid (384 tiles) with tillable earth, lush meadows, fresh water ponds, stone wells, cozy farmhouse, and shipping bins.
  - Smooth 60 FPS animation loop with collision detection and tile-based cursor targeting.

- **Deep Farming Cycle**:
  - **Tilling**: Use the Hoe to clear wild ground into rich loam.
  - **Irrigation**: Water soil with your Watering Can; crops only accumulate growth progress while soil is hydrated. Refill at the pond or stone well!
  - **Planting**: 6 unique crops with distinct growth stages, market costs, and yields:
    - 🌾 **Golden Wheat** (Quick turnaround, beginner crop)
    - 🥕 **Crisp Carrot** (Restores stamina when harvested)
    - 🍅 **Juicy Tomato** (High yield vine)
    - 🍓 **Sweet Berry** (Delicate gourmet crop)
    - 🎃 **Grand Pumpkin** (Slow growing, massive harvest payout)
    - ⭐ **Celestial Starfruit** (Rare late-game glowing mystical crop)
  - **Harvesting & Economy**: Scythe mature sparkling crops and sell them at the Market or Shipping Bin for gold.

- **Dynamic Agricultural Hazards**:
  - 🦅 **Hungry Crows (Avian Raids)**: Swoop from the skies with warning caws to feast on crops. Run up to shoo them away, or build **Scarecrows** to guard a 5×5 area!
  - 🌿 **Invasive Thorns & Weeds**: Sprout across unworked soil, sapping moisture. Scythe them down for compost fiber.
  - ⚡ **Thunderstorms & Lightning Strikes**: Lightning strikes can ignite ground fires! Rush in with your watering can to extinguish flames before they scorch surrounding crops.
  - 🐾 **Burrowing Moles**: Moles dig mounds through farm plots. Bonk them with your hoe to chase them off and snatch bonus gold!
  - 🔥 **Heatwaves & Wilting**: Soil dries out rapidly under scorching heat; unwatered crops will wilt unless quickly rehydrated.
  - 🌧️ **Gentle Rain**: Soothing rain naturally moistens every tilled plot on the farm.

- **Progression, Tools & Upgrades**:
  - Copper & Gold Watering Cans (increased capacity, 1×3 line and 3×3 square watering).
  - Heavy Copper Hoe (multi-tile line tilling).
  - Swift Farm Boots (+35% walking speed).
  - Automated Sprinklers (waters 8 surrounding tiles every morning!).
  - Farm Quests & Milestones (claim gold rewards for achievements).

- **Day/Night Cycle & Morning Farm Gazette**:
  - Dynamic day clock with smooth sunrise, midday, sunset, and starry midnight lighting with lantern glow.
  - Sleep in the farmhouse cabin or rest at midnight to trigger the daily morning recap, collect overnight shipping bin earnings, and review the daily weather forecast.

- **100% Offline Procedural Audio (Zero External Asset Dependencies)**:
  - Realistic synthesized sound effects using the Web Audio API: footsteps, tilling, water splashing, crop harvesting chimes, coin jingles, crow caws, lightning rumble, and fire sizzling.
  - Optional soothing acoustic lo-fi synthesizer background melody.

- **Persistent Auto-Save**:
  - Automatically saves farm state, tiles, crops, coins, stamina, and quests to `localStorage`.

---

## 🕹️ Controls

| Action | Primary Key | Secondary / Mouse |
| :--- | :--- | :--- |
| **Move Farmer** | `W` `A` `S` `D` | `Arrow Keys` or Click to Walk |
| **Use Tool / Action** | `Space` / `E` | Left Click on Highlighted Tile |
| **Select Hotbar Slot** | `1` - `8` | Click Hotbar Slot Icon |
| **Open Market / Shop** | `M` | Click 🛒 Market Button |
| **View Quests** | `Q` | Click 📜 Quests Button |
| **Field Almanac** | — | Click 📖 Almanac Button |
| **Sleep / End Day** | `Z` | Walk into Farmhouse Door |
| **Help Manual** | `H` | Click ❓ Help Button |

---

## 📁 Project Structure

```
ergo-tests/
├── index.html           # Main HTML entrypoint with HUD, viewport canvas, and modals
├── style.css            # Modern glassmorphism UI styling and responsive layouts
├── src/
│   ├── constants.js     # Tile configurations, crops definitions, shop catalog, quests
│   ├── audio.js         # Procedural Web Audio API sound & background music synthesizer
│   ├── particles.js     # Particle engine (water splash, dirt puffs, sparkles, rain, fire)
│   ├── crops.js         # Crop lifecycle, watering checks, stage transitions & rendering
│   ├── hazards.js       # AI & hazard logic (Crows, Moles, Lightning Fire, Weeds)
│   ├── world.js         # 24x16 grid world, buildings, day/night clock, weather engine
│   ├── player.js        # Farmer movement, stamina, tool actions, hotbar & character sprite
│   ├── ui.js            # HUD updates, modal controllers, and market transactions
│   └── game.js          # Main game loop, input handlers, save/load, and master renderer
└── README.md            # Documentation and game manual
```

---

## 🚀 How to Run

Because **Harvest Haven** is built with clean vanilla HTML5/JS without external node dependencies or build steps, it can be launched directly:

1. **Directly open in browser**:
   Double click `index.html` or open `file:///path/to/ergo-tests/index.html` in Chrome, Firefox, Safari, or Edge.

2. **Via local HTTP server**:
   ```bash
   # Python
   python3 -m http.server 8080

   # Node / npx
   npx serve .
   ```
   Open `http://localhost:8080` in your web browser.
