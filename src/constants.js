// ============================================================================
// Harvest Haven - Game Constants & Data Definitions
// ============================================================================

const TILE_SIZE = 48;
const GRID_COLS = 24;
const GRID_ROWS = 16;
const CANVAS_WIDTH = GRID_COLS * TILE_SIZE; // 1152
const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE; // 768

// Tile Types
const TILE = {
  GRASS: 0,
  TILLED_DRY: 1,
  TILLED_WET: 2,
  WATER: 3,
  ROCK: 4,
  STUMP: 5,
  WEED: 6,
  HOUSE: 7,
  WELL: 8,
  SHIPPING_BIN: 9,
  FENCE: 10,
  SCARECROW: 11,
  SPRINKLER: 12,
  PATH: 13
};

// Weather Types
const WEATHER = {
  SUNNY: 'Sunny',
  RAIN: 'Rain',
  HEATWAVE: 'Heatwave',
  THUNDERSTORM: 'Thunderstorm'
};

// Crop Definitions
const CROPS = {
  wheat: {
    id: 'wheat',
    name: 'Golden Wheat',
    color: '#eab308',
    seedPrice: 10,
    sellPrice: 25,
    growthTime: 22, // seconds
    stages: 4,
    staminaGain: 8,
    description: 'Fast-growing cereal crop. Perfect for novice farmers.',
    levelReq: 1,
    icon: '🌾'
  },
  carrot: {
    id: 'carrot',
    name: 'Crisp Carrot',
    color: '#f97316',
    seedPrice: 20,
    sellPrice: 52,
    growthTime: 36,
    stages: 4,
    staminaGain: 20,
    description: 'Sweet orange root. Restores 20 stamina when consumed!',
    levelReq: 1,
    icon: '🥕'
  },
  tomato: {
    id: 'tomato',
    name: 'Juicy Tomato',
    color: '#ef4444',
    seedPrice: 42,
    sellPrice: 98,
    growthTime: 52,
    stages: 4,
    staminaGain: 30,
    description: 'Sun-ripened red fruit. High yield and reliable market value.',
    levelReq: 2,
    icon: '🍅'
  },
  strawberry: {
    id: 'strawberry',
    name: 'Sweet Berry',
    color: '#ec4899',
    seedPrice: 65,
    sellPrice: 155,
    growthTime: 70,
    stages: 4,
    staminaGain: 40,
    description: 'Delicate gourmet berry favored by village bakers.',
    levelReq: 2,
    icon: '🍓'
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Grand Pumpkin',
    color: '#d97706',
    seedPrice: 95,
    sellPrice: 250,
    growthTime: 95,
    stages: 5,
    staminaGain: 60,
    description: 'Hefty autumn squash. Requires patience but yields massive profit.',
    levelReq: 3,
    icon: '🎃'
  },
  starfruit: {
    id: 'starfruit',
    name: 'Celestial Starfruit',
    color: '#a855f7',
    seedPrice: 175,
    sellPrice: 500,
    growthTime: 125,
    stages: 5,
    staminaGain: 100,
    description: 'Rare glowing fruit blessed by starlight. The pinnacle of agriculture.',
    levelReq: 4,
    icon: '⭐'
  }
};

// Tools
const TOOLS = {
  HOE: 'hoe',
  WATERING_CAN: 'watering_can',
  SCYTHE: 'scythe',
  PICKAXE: 'pickaxe',
  SEED: 'seed',
  DEFENSE: 'defense'
};

// Shop Items (seeds, deployables, upgrades)
const SHOP_ITEMS = [
  // Seeds
  { id: 'seed_wheat', type: 'seed', cropId: 'wheat', name: 'Wheat Seeds', price: 10, icon: '🌾', desc: 'Grows in ~22s. Sells for 25g.' },
  { id: 'seed_carrot', type: 'seed', cropId: 'carrot', name: 'Carrot Seeds', price: 20, icon: '🥕', desc: 'Grows in ~36s. Sells for 52g. Restores stamina.' },
  { id: 'seed_tomato', type: 'seed', cropId: 'tomato', name: 'Tomato Seeds', price: 42, icon: '🍅', desc: 'Grows in ~52s. Sells for 98g.' },
  { id: 'seed_strawberry', type: 'seed', cropId: 'strawberry', name: 'Strawberry Seeds', price: 65, icon: '🍓', desc: 'Grows in ~70s. Sells for 155g.' },
  { id: 'seed_pumpkin', type: 'seed', cropId: 'pumpkin', name: 'Pumpkin Seeds', price: 95, icon: '🎃', desc: 'Grows in ~95s. Sells for 250g.' },
  { id: 'seed_starfruit', type: 'seed', cropId: 'starfruit', name: 'Starfruit Seeds', price: 175, icon: '⭐', desc: 'Legendary crop. Sells for 500g.' },

  // Farm Structures
  { id: 'scarecrow', type: 'structure', name: 'Scarecrow', price: 110, icon: '🎎', desc: 'Protects a 5x5 tile radius from hungry crows.' },
  { id: 'sprinkler', type: 'structure', name: 'Auto-Sprinkler', price: 180, icon: '🚿', desc: 'Automatically waters adjacent 8 tiles every morning!' },
  { id: 'fence', type: 'structure', name: 'Wooden Fence (x3)', price: 25, icon: '🪵', desc: 'Blocks weeds and critters from encroaching into crop plots.' },

  // Consumables & Supplies
  { id: 'fertilizer', type: 'consumable', name: 'Speed Fertilizer (x3)', price: 35, icon: '🧪', desc: 'Accelerates crop growth speed by +50% on applied tile.' },
  { id: 'bug_spray', type: 'consumable', name: 'Organic Bug Spray', price: 30, icon: '🧴', desc: 'Cures and shields plants against beetle & pest swarms.' },
  { id: 'energy_tonic', type: 'consumable', name: 'Farmer\'s Cold Brew', price: 25, icon: '☕', desc: 'Instantly restores +50 Stamina.' },

  // Upgrades
  { id: 'upgrade_can_copper', type: 'upgrade', name: 'Copper Can Upgrade', price: 140, icon: '💧', desc: 'Increases water capacity to 45 and waters 1x3 tile arcs!' },
  { id: 'upgrade_can_gold', type: 'upgrade', name: 'Gold Can Upgrade', price: 320, icon: '✨', desc: 'Increases capacity to 90 and waters full 3x3 areas!' },
  { id: 'upgrade_hoe_copper', type: 'upgrade', name: 'Heavy Copper Hoe', price: 130, icon: '⛏️', desc: 'Tills 3 tiles in a line in one swing.' },
  { id: 'upgrade_boots', type: 'upgrade', name: 'Swift Farm Boots', price: 100, icon: '🥾', desc: 'Increases walking speed by +35%.' }
];

// Quests / Achievements
const INITIAL_QUESTS = [
  { id: 'q_first_crop', title: 'First Green Shoot', desc: 'Till, water, and harvest your first crop.', reward: 40, target: 1, current: 0, metric: 'harvest_count', completed: false, claimed: false },
  { id: 'q_carrot_farmer', title: 'Healthy Harvest', desc: 'Harvest 5 Crunchy Carrots.', reward: 80, target: 5, current: 0, metric: 'harvest_carrot', completed: false, claimed: false },
  { id: 'q_scarecrow', title: 'Crow Ward', desc: 'Place a Scarecrow on your farm to ward off birds.', reward: 75, target: 1, current: 0, metric: 'placed_scarecrow', completed: false, claimed: false },
  { id: 'q_shoo_crows', title: 'Sky Guardian', desc: 'Shoo away 3 hungry crows before they eat crops.', reward: 90, target: 3, current: 0, metric: 'crows_shooed', completed: false, claimed: false },
  { id: 'q_earn_gold', title: 'Market Trader', desc: 'Accumulate a total of 500 gold coins.', reward: 150, target: 500, current: 100, metric: 'total_coins', completed: false, claimed: false },
  { id: 'q_storm_hero', title: 'Thunder Extinguisher', desc: 'Douse a lightning strike fire with your watering can.', reward: 120, target: 1, current: 0, metric: 'fire_doused', completed: false, claimed: false },
  { id: 'q_starfruit', title: 'Starlight Bounty', desc: 'Successfully grow and harvest a Celestial Starfruit.', reward: 300, target: 1, current: 0, metric: 'harvest_starfruit', completed: false, claimed: false },
  { id: 'q_survive_week', title: 'Season Veteran', desc: 'Tend your farm for 7 full game days.', reward: 250, target: 7, current: 1, metric: 'days_passed', completed: false, claimed: false }
];
