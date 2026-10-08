const fs = require('fs');
const vm = require('vm');

const context = {
  console,
  Math,
  Array,
  Object,
  JSON,
  Map,
  setTimeout,
  clearTimeout,
  performance: { now: () => 1000 },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  window: {},
  document: {
    getElementById: () => ({
      getContext: () => ({
        save: () => {}, restore: () => {}, fillRect: () => {}, strokeRect: () => {},
        beginPath: () => {}, arc: () => {}, fill: () => {}, stroke: () => {},
        ellipse: () => {}, moveTo: () => {}, lineTo: () => {}, closePath: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        setLineDash: () => {}, translate: () => {}
      }),
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 1152, height: 768 })
    }),
    querySelectorAll: () => []
  }
};
vm.createContext(context);

// Load game files into context
['constants.js', 'audio.js', 'particles.js', 'crops.js', 'hazards.js', 'world.js', 'player.js'].forEach(file => {
  const code = fs.readFileSync('src/' + file, 'utf8');
  vm.runInContext(code, context);
});

// Run verification tests
vm.runInContext(`
  const world = new FarmWorld();
  const player = new Player(8, 7);
  const crops = new CropManager();
  const hazards = new HazardManager();
  const particles = new ParticleSystem();

  // Test Till on grass tile (11, 11)
  const tilled = world.tillTile(11, 11);
  if (!tilled || !world.isTileTilled(11, 11)) throw new Error('Tilling failed');

  // Test Water on pre-tilled starter plot (8, 8)
  const watered = world.waterTile(8, 8);
  if (!watered || !world.isTileWatered(8, 8)) throw new Error('Watering failed');

  // Test Plant
  const planted = crops.plant(8, 8, 'wheat');
  if (!planted || !crops.hasCrop(8, 8)) throw new Error('Planting failed');

  // Test Growth
  crops.update(25, (x, y) => world.isTileWatered(x, y), 'Sunny', particles);
  const c = crops.getCrop(8, 8);
  if (!c.isRipe || c.growth < 1.0) throw new Error('Crop failed to ripen: ' + JSON.stringify(c));

  // Test Harvest
  const harvested = crops.harvest(8, 8);
  if (!harvested || harvested.cropId !== 'wheat') throw new Error('Harvest failed');

  // Test Scarecrow protection
  const placedSc = world.placeStructure(12, 10, 'scarecrow');
  if (!placedSc) throw new Error('Failed to place scarecrow');
  const protNear = hazards.isProtectedByScarecrow(13, 10, world.getScarecrows());
  const protFar = hazards.isProtectedByScarecrow(18, 10, world.getScarecrows());
  if (!protNear) throw new Error('Scarecrow near protection failed');
  if (protFar) throw new Error('Scarecrow far protection should be false');

  // Test Fire Extinguish
  hazards.fires.push({ x: 5, y: 5, px: 200, py: 200, life: 10 });
  const doused = hazards.douseFire(5, 5, particles, null);
  if (!doused || hazards.fires.length !== 0) throw new Error('Fire extinguishing failed');

  // Test Day Advance
  const oldDay = world.day;
  world.advanceToNextDay(crops, particles);
  if (world.day !== oldDay + 1) throw new Error('Day advance failed');

  console.log('✅ ALL 8 CORE GAME SIMULATION TESTS PASSED SUCCESSFULLY!');
`, context);
