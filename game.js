(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const stage = document.querySelector("#gameStage");

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const random = (min, max) => min + Math.random() * (max - min);

  const MATERIALS = {
    wood: { name: "WOOD", icon: "◆", color: "#b78655" },
    stone: { name: "STONE", icon: "⬟", color: "#9ba69e" },
    fiber: { name: "FIBER", icon: "≋", color: "#76bf68" },
    iron: { name: "IRON", icon: "■", color: "#a8b4bb" },
    crystal: { name: "CRYSTAL", icon: "♦", color: "#73d5e9" },
    ember: { name: "EMBER", icon: "✦", color: "#ff8755" },
    bone: { name: "BONE", icon: "╫", color: "#ded7b8" },
    slime: { name: "GEL", icon: "●", color: "#75dc8c" },
    hide: { name: "HIDE", icon: "◒", color: "#c09168" },
    void: { name: "VOID", icon: "✧", color: "#b889f4" }
  };

  const WEAPONS = {
    wooden: { name: "Wooden Blade", icon: "†", type: "melee", damage: 14, rate: .44, range: 60, color: "#d3a45d" },
    flint: { name: "Flint Fang", icon: "⌁", type: "melee", damage: 24, rate: .38, range: 66, color: "#c8d0c9" },
    bow: { name: "Thorn Bow", icon: "}", type: "ranged", damage: 18, rate: .52, range: 390, speed: 500, color: "#8fdd72" },
    maul: { name: "Iron Maul", icon: "⊥", type: "melee", damage: 42, rate: .72, range: 78, color: "#b9c2c7" },
    emberblade: { name: "Emberbrand", icon: "‡", type: "melee", damage: 36, rate: .34, range: 70, color: "#ff764d", burn: true },
    staff: { name: "Prism Staff", icon: "⚶", type: "ranged", damage: 31, rate: .48, range: 460, speed: 560, color: "#70e5e3", pierce: 2 },
    voidpike: { name: "Void Pike", icon: "↟", type: "ranged", damage: 50, rate: .62, range: 520, speed: 620, color: "#bb83ff", pierce: 3 },
    bossaxe: { name: "Colossus Axe", icon: "⚒", type: "melee", damage: 68, rate: .58, range: 86, color: "#d8ff7a" },
    starcaster: { name: "Starcaster", icon: "✣", type: "ranged", damage: 59, rate: .45, range: 560, speed: 680, color: "#f1a5ff", pierce: 4 }
  };

  const RECIPES = [
    { id: "flint", category: "weapon", icon: "⌁", name: "Flint Fang", copy: "Fast-edged starter blade.", cost: { wood: 4, stone: 5 }, stats: ["24 DMG", "FAST"] },
    { id: "bow", category: "weapon", icon: "}", name: "Thorn Bow", copy: "Keep claws at a distance.", cost: { wood: 6, fiber: 5, hide: 2 }, stats: ["18 DMG", "RANGED"] },
    { id: "maul", category: "weapon", icon: "⊥", name: "Iron Maul", copy: "Slow, heavy, and convincing.", cost: { wood: 4, stone: 4, iron: 7 }, stats: ["42 DMG", "STAGGER"] },
    { id: "emberblade", category: "weapon", icon: "‡", name: "Emberbrand", copy: "A blade with a hungry flame.", cost: { iron: 5, ember: 6, bone: 3 }, stats: ["36 DMG", "BURN"] },
    { id: "staff", category: "weapon", icon: "⚶", name: "Prism Staff", copy: "Piercing bolts of living crystal.", cost: { wood: 4, crystal: 7, slime: 3 }, stats: ["31 DMG", "PIERCE"] },
    { id: "voidpike", category: "weapon", icon: "↟", name: "Void Pike", copy: "Forbidden reach from beyond.", cost: { iron: 8, crystal: 5, void: 5 }, stats: ["50 DMG", "MYTHIC"] },
    { id: "bossaxe", category: "weapon", icon: "⚒", name: "Colossus Axe", copy: "A boss-breaking relic of the old grove.", cost: { wood: 9, iron: 7, hide: 5, void: 2 }, stats: ["68 DMG", "RELIC"] },
    { id: "starcaster", category: "weapon", icon: "✣", name: "Starcaster", copy: "Launches a lance through entire hordes.", cost: { crystal: 10, ember: 7, void: 8 }, stats: ["59 DMG", "PIERCE 4"] },
    { id: "salve", category: "supply", icon: "+", name: "Wild Salve", copy: "Restores 45 health to both heroes.", cost: { fiber: 4, slime: 3 }, stats: ["+45 HP", "BOTH"] },
    { id: "ward", category: "supply", icon: "◇", name: "Stone Ward", copy: "Raises maximum health this run.", cost: { stone: 7, crystal: 2 }, stats: ["+20 MAX", "BOTH"] },
    { id: "tonic", category: "supply", icon: "↑", name: "Ember Tonic", copy: "Boosts all damage for 25 seconds.", cost: { ember: 4, slime: 2 }, stats: ["+35% DMG", "25 SEC"] }
  ];

  const MONSTERS = {
    slime: { name: "Moss Slime", hp: 38, speed: 46, damage: 8, size: 18, color: "#67b85f", drop: ["slime", "fiber"], xp: 12 },
    shroom: { name: "Spore Shaman", hp: 46, speed: 39, damage: 9, size: 19, color: "#d48cca", drop: ["fiber", "slime", "crystal"], xp: 15 },
    spider: { name: "Gloom Spider", hp: 42, speed: 91, damage: 11, size: 17, color: "#786a8f", drop: ["fiber", "hide", "void"], xp: 17 },
    wolf: { name: "Bramble Wolf", hp: 52, speed: 77, damage: 10, size: 19, color: "#9b7f59", drop: ["hide", "fiber"], xp: 16 },
    skeleton: { name: "Hollow Guard", hp: 68, speed: 52, damage: 13, size: 20, color: "#c9c5a8", drop: ["bone", "iron"], xp: 20 },
    ember: { name: "Cinder Imp", hp: 64, speed: 65, damage: 15, size: 18, color: "#e66f43", drop: ["ember", "stone"], xp: 22 },
    eye: { name: "Void Watcher", hp: 82, speed: 46, damage: 17, size: 21, color: "#9b70d2", drop: ["void", "crystal"], xp: 27 },
    golem: { name: "Ironhide Golem", hp: 125, speed: 32, damage: 22, size: 27, color: "#7c8884", drop: ["iron", "stone", "crystal"], xp: 35 },
    wraith: { name: "Ash Wraith", hp: 91, speed: 55, damage: 19, size: 21, color: "#74b3b8", drop: ["void", "bone", "ember"], xp: 30 },
    charger: { name: "Crag Hornbeast", hp: 154, speed: 43, damage: 25, size: 29, color: "#b36a4a", drop: ["hide", "iron", "ember"], xp: 40 },
    mimic: { name: "Crystal Mimic", hp: 108, speed: 64, damage: 21, size: 23, color: "#55cbd4", drop: ["crystal", "iron", "void"], xp: 36 }
  };

  const BOSSES = [
    { id: "dreadroot", name: "DREADROOT COLOSSUS", short: "DREADROOT", biome: "Mosswood Basin", hp: 760, radius: 48, speed: 43, color: "#a86cd2", projectile: "#bb74dc", summons: ["spider", "shroom", "eye"], special: ["VOID BLOOM", "ROOTS AWAKEN"], reward: ["wood", "fiber", "void"] },
    { id: "cindermaw", name: "CINDERMAW FORGE TYRANT", short: "CINDERMAW", biome: "Cinderfall Crags", hp: 1080, radius: 52, speed: 51, color: "#ff7048", projectile: "#ff8156", summons: ["ember", "golem", "charger"], special: ["MAGMA CROWN", "FIRESTORM"] , reward: ["ember", "iron", "crystal"] },
    { id: "voidqueen", name: "NYXARA, QUEEN OF THE VOID", short: "NYXARA", biome: "Starless Expanse", hp: 1420, radius: 54, speed: 58, color: "#d889ff", projectile: "#e5a0ff", summons: ["wraith", "mimic", "eye"], special: ["STARFALL", "ENDLESS NIGHT"], reward: ["void", "crystal", "ember"] }
  ];
  const BOSS_TARGETS = [10, 25, 43];
  const BIOMES = [
    { name: "Mosswood Basin", core: "#1d422c", mid: "#10291c", edge: "#07150e", accent: "#7fd06f", haze: "rgba(93,178,97,.09)" },
    { name: "Cinderfall Crags", core: "#4a2b20", mid: "#291813", edge: "#120b0a", accent: "#ef7146", haze: "rgba(255,104,58,.09)" },
    { name: "Starless Expanse", core: "#292242", mid: "#17152b", edge: "#090813", accent: "#b478e6", haze: "rgba(160,90,232,.1)" }
  ];

  let W = 1200;
  let H = 700;
  let dpr = 1;
  let lastTime = performance.now();
  let running = false;
  let paused = false;
  let soundOn = true;
  let audioContext = null;
  let selectedPlayer = 0;
  let recipeFilter = "all";
  let gameMode = 1;

  const keys = Object.create(null);
  const state = {
    elapsed: 0,
    wave: 1,
    waveClock: 0,
    spawnClock: 1.2,
    kills: 0,
    totalMaterials: 0,
    crafted: 0,
    portalOpen: false,
    portalPulse: 0,
    bossActive: false,
    bossDefeated: false,
    bossStage: 0,
    bossesDefeated: 0,
    intermission: 0,
    shake: 0,
    flash: 0,
    damageBoost: 0,
    inventory: {},
    craftedWeapons: new Set(["wooden"]),
    players: [],
    enemies: [],
    resources: [],
    projectiles: [],
    particles: [],
    floaters: [],
    attacks: [],
    decor: [],
    boss: null,
    portal: { x: 0, y: 0, radius: 43 }
  };

  function resetInventory() {
    state.inventory = { wood: 6, stone: 5, fiber: 3, iron: 0, crystal: 0, ember: 0, bone: 0, slime: 0, hide: 0, void: 0 };
  }

  function createPlayer(index) {
    return {
      index,
      name: index ? "ROOK" : "NOVA",
      color: index ? "#64ccff" : "#f2bd45",
      dark: index ? "#2b74a0" : "#9b6c22",
      x: W * .5 + (gameMode === 1 ? 0 : index ? 32 : -32),
      y: H * .62,
      radius: 16,
      facing: index ? 0 : Math.PI,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      cooldown: 0,
      invuln: 0,
      dashTime: 0,
      dashCooldown: 0,
      weapon: "wooden",
      xp: 0,
      level: 1,
      down: false,
      revive: 0,
      moving: false,
      step: 0
    };
  }

  function resetGame() {
    state.elapsed = 0;
    state.wave = 1;
    state.waveClock = 0;
    state.spawnClock = .7;
    state.kills = 0;
    state.totalMaterials = 0;
    state.crafted = 0;
    state.portalOpen = false;
    state.bossActive = false;
    state.bossDefeated = false;
    state.bossStage = 0;
    state.bossesDefeated = 0;
    state.intermission = 0;
    state.shake = 0;
    state.flash = 0;
    state.damageBoost = 0;
    state.craftedWeapons = new Set(["wooden"]);
    selectedPlayer = 0;
    state.players = Array.from({ length: gameMode }, (_, index) => createPlayer(index));
    state.enemies = [];
    state.resources = [];
    state.projectiles = [];
    state.particles = [];
    state.floaters = [];
    state.attacks = [];
    state.boss = null;
    state.portal = { x: W * .5, y: H * .27, radius: 43 };
    resetInventory();
    createDecor();
    spawnInitialResources();
    syncModeUI();
    updateAllUI();
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(300, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.portal.x = W * .5;
    state.portal.y = H * .27;
    if (!state.decor.length) createDecor();
    state.players.forEach((player) => {
      player.x = clamp(player.x, 28, W - 28);
      player.y = clamp(player.y, 60, H - 55);
    });
  }

  function createDecor() {
    state.decor = Array.from({ length: 130 }, (_, i) => ({
      x: Math.random(), y: Math.random(), r: random(2, 18), kind: i % 11, a: random(.04, .16), phase: random(0, Math.PI * 2)
    }));
  }

  function spawnInitialResources() {
    const sequence = ["wood", "stone", "fiber", "wood", "stone", "fiber", "iron", "wood", "crystal", "fiber", "stone", "ember", "wood", "iron", "void", "fiber", "stone", "crystal"];
    sequence.forEach((type, i) => spawnResource(type, i));
  }

  function spawnResource(type, index = 0) {
    let x;
    let y;
    let attempts = 0;
    do {
      x = random(45, Math.max(46, W - 45));
      y = random(100, Math.max(101, H - 80));
      attempts++;
    } while (attempts < 20 && (Math.hypot(x - W * .5, y - H * .62) < 100 || Math.hypot(x - state.portal.x, y - state.portal.y) < 85));
    state.resources.push({
      id: `${type}-${Date.now()}-${index}-${Math.random()}`,
      type, x, y, health: type === "void" ? 4 : type === "iron" || type === "crystal" ? 3 : 2,
      maxHealth: type === "void" ? 4 : type === "iron" || type === "crystal" ? 3 : 2,
      radius: type === "wood" ? 25 : type === "fiber" ? 16 : 20,
      wobble: random(0, Math.PI * 2), hit: 0
    });
  }

  function makeEnemy(type) {
    const def = MONSTERS[type];
    const edge = Math.floor(Math.random() * 4);
    const margin = 34;
    const point = edge === 0 ? { x: random(0, W), y: margin } : edge === 1 ? { x: W - margin, y: random(70, H) } : edge === 2 ? { x: random(0, W), y: H - margin } : { x: margin, y: random(70, H) };
    const modeScale = gameMode === 1 ? .82 : 1.04;
    const scale = (1 + (state.wave - 1) * .13) * modeScale;
    return {
      type, ...point, radius: def.size, health: Math.round(def.hp * scale), maxHealth: Math.round(def.hp * scale),
      speed: def.speed * (1 + (state.wave - 1) * .035), damage: def.damage * (1 + (state.wave - 1) * .09) * (gameMode === 1 ? .78 : 1),
      attackCooldown: random(.2, 1), hit: 0, phase: random(0, 6.28), dead: false, burn: 0, burnTick: 0,
      elite: state.wave >= 3 && Math.random() < .12
    };
  }

  function chooseMonster() {
    const realm = state.bossStage;
    const pools = realm === 0
      ? [["slime", "slime", "shroom", "wolf"], ["slime", "spider", "wolf", "shroom", "skeleton"], ["spider", "wolf", "skeleton", "eye"]]
      : realm === 1
        ? [["ember", "skeleton", "spider", "golem"], ["ember", "wraith", "golem", "charger"], ["ember", "golem", "charger", "mimic"]]
        : [["eye", "wraith", "mimic", "skeleton"], ["wraith", "mimic", "charger", "eye"], ["wraith", "mimic", "charger", "golem", "eye"]];
    const pool = pools[Math.min(2, Math.max(0, state.wave - 1))];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function setMode(mode) {
    gameMode = mode === 2 ? 2 : 1;
    selectedPlayer = 0;
    $$("#modeSelect button").forEach((button) => button.classList.toggle("active", Number(button.dataset.mode) === gameMode));
    $("#p2Controls").style.display = gameMode === 2 ? "flex" : "none";
    $("#startButton span").textContent = gameMode === 2 ? "BEGIN CO-OP RUN" : "BEGIN SOLO RUN";
    syncModeUI();
  }

  function syncModeUI() {
    $("#playersHud").classList.toggle("solo", gameMode === 1);
    $("#modeStatus").textContent = gameMode === 2 ? "2 PLAYERS READY" : "SOLO HERO READY";
    $("#worldMode").textContent = gameMode === 2 ? "COOPERATIVE WORLD" : "SOLO WORLD";
    $("#craftShareCopy").textContent = gameMode === 2 ? "Resources are shared between both players" : "Forge resources collected in the wild";
    const p2Equip = $('#equipTarget button[data-player="1"]');
    if (p2Equip) p2Equip.style.display = gameMode === 2 ? "" : "none";
  }

  function startGame() {
    ensureAudio();
    resetGame();
    running = true;
    paused = false;
    $("#startScreen").classList.remove("active");
    $("#pauseScreen").classList.remove("active");
    $("#endScreen").classList.remove("active");
    sound("start");
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioContext = new AudioCtx();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function sound(type) {
    if (!soundOn || !audioContext) return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const values = {
      hit: [110, .04, "square", .025], collect: [620, .08, "sine", .035], craft: [330, .2, "triangle", .05],
      hurt: [85, .12, "sawtooth", .025], start: [240, .35, "sine", .04], dash: [180, .08, "triangle", .02],
      boss: [62, .6, "sawtooth", .04], win: [520, .7, "sine", .05]
    }[type] || [220, .08, "sine", .02];
    oscillator.type = values[2];
    oscillator.frequency.setValueAtTime(values[0], now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, values[0] * (type === "hurt" ? .45 : 1.7)), now + values[1]);
    gain.gain.setValueAtTime(values[3], now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + values[1]);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + values[1]);
  }

  function update(dt) {
    if (!running || paused) return;
    state.elapsed += dt;
    state.waveClock += dt;
    state.spawnClock -= dt;
    state.intermission = Math.max(0, state.intermission - dt);
    state.damageBoost = Math.max(0, state.damageBoost - dt);
    state.shake = Math.max(0, state.shake - dt * 18);
    state.flash = Math.max(0, state.flash - dt * 3);

    if (!state.bossActive && state.intermission <= 0) {
      if (state.waveClock > 28) {
        state.wave++;
        state.waveClock = 0;
        flashText(`WAVE ${String(state.wave).padStart(2, "0")}`, W / 2, H / 2, "#b9ef66", 28);
        sound("start");
      }
      const maxEnemies = Math.min((gameMode === 1 ? 4 : 6) + state.wave * 2, gameMode === 1 ? 11 : 15);
      if (state.spawnClock <= 0 && state.enemies.length < maxEnemies && !state.portalOpen) {
        state.enemies.push(makeEnemy(chooseMonster()));
        state.spawnClock = Math.max(.72, 2.15 - state.wave * .18);
      }
    }

    updatePlayers(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateResources(dt);
    updateEffects(dt);
    updatePortal(dt);
    updateRevives(dt);
    updateAllUI();

    if (state.players.length && state.players.every((p) => p.down)) endGame(false);
  }

  function updatePlayers(dt) {
    const controls = [
      { up: "KeyW", down: "KeyS", left: "KeyA", right: "KeyD", attack: "KeyF", dash: "KeyG" },
      { up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", attack: "KeyK", dash: "KeyL" }
    ];
    state.players.forEach((player, i) => {
      player.cooldown = Math.max(0, player.cooldown - dt);
      player.dashCooldown = Math.max(0, player.dashCooldown - dt);
      player.invuln = Math.max(0, player.invuln - dt);
      player.stamina = Math.min(100, player.stamina + dt * 22);
      if (player.down) return;

      const c = controls[i];
      let dx = (keys[c.right] ? 1 : 0) - (keys[c.left] ? 1 : 0);
      let dy = (keys[c.down] ? 1 : 0) - (keys[c.up] ? 1 : 0);
      const length = Math.hypot(dx, dy) || 1;
      dx /= length;
      dy /= length;
      player.moving = Boolean(dx || dy);
      if (player.moving) player.facing = Math.atan2(dy, dx);

      if (keys[c.dash] && player.dashCooldown <= 0 && player.stamina >= 34 && player.moving) {
        player.dashTime = .17;
        player.dashCooldown = .52;
        player.stamina -= 34;
        player.invuln = .25;
        burst(player.x, player.y, player.color, 8, 110);
        sound("dash");
      }
      player.dashTime = Math.max(0, player.dashTime - dt);
      const speed = player.dashTime > 0 ? 390 : 148;
      player.x = clamp(player.x + dx * speed * dt, 22, W - 22);
      player.y = clamp(player.y + dy * speed * dt, 63, H - 34);
      player.step += player.moving ? dt * (player.dashTime > 0 ? 23 : 9) : dt * 2;

      if (keys[c.attack] && player.cooldown <= 0) attack(player);
    });
  }

  function attack(player) {
    const weapon = WEAPONS[player.weapon];
    player.cooldown = weapon.rate;
    if (weapon.type === "ranged") {
      const vx = Math.cos(player.facing);
      const vy = Math.sin(player.facing);
      state.projectiles.push({
        owner: "player", player: player.index, x: player.x + vx * 20, y: player.y + vy * 20,
        vx: vx * weapon.speed, vy: vy * weapon.speed, life: weapon.range / weapon.speed,
        radius: player.weapon === "staff" ? 6 : 4, damage: weapon.damage, color: weapon.color,
        pierce: weapon.pierce || 1, hitIds: new Set(), burn: weapon.burn
      });
      burst(player.x + vx * 20, player.y + vy * 20, weapon.color, 4, 65);
    } else {
      state.attacks.push({ x: player.x, y: player.y, angle: player.facing, range: weapon.range, color: weapon.color, life: .16, maxLife: .16 });
      const targets = [...state.enemies, ...(state.boss && !state.boss.dead ? [state.boss] : [])];
      targets.forEach((enemy) => {
        const d = distance(player, enemy);
        const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        const delta = Math.atan2(Math.sin(angle - player.facing), Math.cos(angle - player.facing));
        if (d < weapon.range + enemy.radius && Math.abs(delta) < 1.25) damageEnemy(enemy, weapon.damage, player, weapon.burn);
      });
      state.resources.forEach((node) => {
        if (distance(player, node) < weapon.range + node.radius) hitResource(node, player);
      });
      sound("hit");
    }
  }

  function damageEnemy(enemy, amount, player, burn = false) {
    if (enemy.dead) return;
    const crit = Math.random() < .11;
    let total = amount * (1 + (player.level - 1) * .08) * (state.damageBoost > 0 ? 1.35 : 1) * (crit ? 1.65 : 1);
    if (enemy.elite) total *= .9;
    enemy.health -= total;
    enemy.hit = .12;
    if (burn) enemy.burn = Math.max(enemy.burn, 3);
    flashText(`${crit ? "✦ " : ""}${Math.round(total)}`, enemy.x, enemy.y - enemy.radius, crit ? "#ffe184" : "#f2f0dc", crit ? 14 : 10);
    burst(enemy.x, enemy.y, enemy.type === "boss" ? "#cf5543" : MONSTERS[enemy.type]?.color || "#a1d976", crit ? 8 : 4, 80);
    if (enemy.health <= 0) killEnemy(enemy, player);
  }

  function killEnemy(enemy, player) {
    if (enemy.dead) return;
    enemy.dead = true;
    if (enemy.type === "boss") {
      state.bossActive = false;
      state.bossesDefeated++;
      const def = BOSSES.find((item) => item.id === enemy.bossId) || BOSSES[state.bossStage];
      burst(enemy.x, enemy.y, def.color, 90, 270);
      def.reward.forEach((material, index) => collectMaterial(material, 4 + state.bossStage * 2, enemy.x + (index - 1) * 24, enemy.y));
      state.players.forEach((hero) => {
        hero.health = hero.maxHealth;
        hero.stamina = 100;
      });
      state.projectiles = [];
      state.enemies = [];
      sound("win");
      if (state.bossesDefeated >= BOSSES.length) {
        state.bossDefeated = true;
        setTimeout(() => endGame(true), 1100);
      } else {
        flashText(`${def.short} DEFEATED`, W / 2, H * .44, "#d6ff85", 24);
        state.bossStage++;
        state.boss = null;
        state.intermission = 4;
        state.wave++;
        state.waveClock = 0;
        createDecor();
        setTimeout(() => {
          if (running) flashText(`ENTERING ${BOSSES[state.bossStage].biome.toUpperCase()}`, W / 2, H * .48, BOSSES[state.bossStage].color, 19);
        }, 900);
      }
      return;
    }
    const def = MONSTERS[enemy.type];
    state.kills++;
    addXp(player, def.xp + (enemy.elite ? 15 : 0));
    const drops = enemy.elite ? 3 : Math.random() < .32 ? 2 : 1;
    for (let i = 0; i < drops; i++) {
      const type = def.drop[Math.floor(Math.random() * def.drop.length)];
      collectMaterial(type, enemy.elite ? 2 : 1, enemy.x + random(-8, 8), enemy.y + random(-8, 8));
    }
    burst(enemy.x, enemy.y, def.color, 13, 130);
    const target = BOSS_TARGETS[state.bossStage];
    if (target && state.kills >= target && !state.portalOpen && !state.bossActive) openPortal();
  }

  function addXp(player, amount) {
    player.xp += amount;
    const needed = player.level * 55;
    if (player.xp >= needed) {
      player.xp -= needed;
      player.level++;
      player.maxHealth += 10;
      player.health = player.maxHealth;
      flashText(`LEVEL ${player.level}`, player.x, player.y - 38, player.color, 15);
      burst(player.x, player.y, player.color, 18, 160);
      sound("craft");
    }
  }

  function updateEnemies(dt) {
    state.enemies.forEach((enemy) => updateEnemy(enemy, dt));
    state.enemies = state.enemies.filter((enemy) => !enemy.dead);
    if (state.boss && !state.boss.dead) updateBoss(state.boss, dt);
  }

  function updateEnemy(enemy, dt) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.attackCooldown -= dt;
    enemy.phase += dt * 4;
    if (enemy.burn > 0) {
      enemy.burn -= dt;
      enemy.burnTick -= dt;
      if (enemy.burnTick <= 0) {
        enemy.burnTick = .5;
        enemy.health -= 4;
        burst(enemy.x, enemy.y, "#ff7048", 2, 35);
        if (enemy.health <= 0) killEnemy(enemy, state.players[0]);
      }
    }
    const living = state.players.filter((p) => !p.down);
    if (!living.length) return;
    const target = living.reduce((a, b) => distance(enemy, a) < distance(enemy, b) ? a : b);
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    const d = distance(enemy, target);

    if (["eye", "wraith", "shroom"].includes(enemy.type) && d < 330 && enemy.attackCooldown <= 0) {
      enemy.attackCooldown = enemy.type === "shroom" ? 2.45 : 2.05;
      const projectileColor = enemy.type === "shroom" ? "#e59bd8" : enemy.type === "wraith" ? "#79d8df" : "#b57af0";
      state.projectiles.push({ owner: "enemy", x: enemy.x, y: enemy.y, vx: Math.cos(angle) * 205, vy: Math.sin(angle) * 205, life: 2.2, radius: 6, damage: enemy.damage, color: projectileColor });
      return;
    }
    if (d > enemy.radius + target.radius + 8) {
      enemy.x += Math.cos(angle) * enemy.speed * dt;
      enemy.y += Math.sin(angle) * enemy.speed * dt;
    } else if (enemy.attackCooldown <= 0) {
      enemy.attackCooldown = ["golem", "charger"].includes(enemy.type) ? 1.5 : .9;
      hurtPlayer(target, enemy.damage);
    }
  }

  function updateBoss(boss, dt) {
    const def = BOSSES.find((item) => item.id === boss.bossId) || BOSSES[0];
    boss.hit = Math.max(0, boss.hit - dt);
    boss.attackCooldown -= dt;
    boss.specialCooldown -= dt;
    boss.phase += dt * 2;
    const living = state.players.filter((p) => !p.down);
    if (!living.length) return;
    const target = living.reduce((a, b) => distance(boss, a) < distance(boss, b) ? a : b);
    const angle = Math.atan2(target.y - boss.y, target.x - boss.x);
    const d = distance(boss, target);
    const rage = boss.health < boss.maxHealth * .45;

    if (boss.specialCooldown <= 0) {
      boss.specialCooldown = rage ? 2.35 : 3.8;
      boss.specialType = (boss.specialType + 1) % 2;
      if (boss.specialType === 0) {
        const shots = (rage ? 14 : 10) + state.bossStage * 2;
        for (let i = 0; i < shots; i++) {
          const spiral = boss.bossId === "voidqueen" ? boss.phase * .8 : 0;
          const a = i / shots * Math.PI * 2 + spiral;
          state.projectiles.push({ owner: "enemy", x: boss.x, y: boss.y, vx: Math.cos(a) * (rage ? 245 : 195), vy: Math.sin(a) * (rage ? 245 : 195), life: 3, radius: boss.bossId === "cindermaw" ? 9 : 7, damage: (rage ? 18 : 14) + state.bossStage * 3, color: def.projectile });
        }
        flashText(def.special[0], boss.x, boss.y - boss.radius - 18, def.color, 12);
        state.shake = 6;
      } else {
        if (boss.bossId === "cindermaw") {
          for (let i = 0; i < (rage ? 8 : 6); i++) {
            const targetX = random(40, W - 40);
            state.projectiles.push({ owner: "enemy", x: targetX, y: 48, vx: random(-25, 25), vy: random(200, 270), life: Math.max(1, (H - 48) / 220), radius: 10, damage: rage ? 22 : 17, color: def.projectile });
          }
        } else {
          const count = rage ? 3 : 2;
          for (let i = 0; i < count; i++) {
            const type = def.summons[Math.floor(Math.random() * def.summons.length)];
            const add = makeEnemy(type);
            add.x = boss.x + random(-70, 70);
            add.y = boss.y + random(-70, 70);
            state.enemies.push(add);
          }
        }
        flashText(def.special[1], boss.x, boss.y - boss.radius - 18, def.color, 12);
      }
      sound("boss");
    }

    if (d > boss.radius + target.radius + 14) {
      boss.x += Math.cos(angle) * def.speed * (rage ? 1.38 : 1) * dt;
      boss.y += Math.sin(angle) * def.speed * (rage ? 1.38 : 1) * dt;
    } else if (boss.attackCooldown <= 0) {
      boss.attackCooldown = rage ? .8 : 1.15;
      hurtPlayer(target, (rage ? 24 : 19) + state.bossStage * 3);
      state.shake = 8;
    }
  }

  function hurtPlayer(player, amount) {
    if (player.invuln > 0 || player.down) return;
    player.health -= amount;
    player.invuln = .7;
    state.shake = 5;
    flashText(`-${Math.round(amount)}`, player.x, player.y - 30, "#ff7565", 12);
    burst(player.x, player.y, "#ff6659", 9, 110);
    sound("hurt");
    if (player.health <= 0) {
      player.health = 0;
      player.down = true;
      player.revive = 0;
      flashText("DOWNED", player.x, player.y - 38, "#ff7463", 15);
    }
  }

  function updateRevives(dt) {
    if (state.players.length < 2) return;
    state.players.forEach((player) => {
      if (!player.down) return;
      const ally = state.players[1 - player.index];
      if (!ally.down && distance(player, ally) < 58) {
        player.revive += dt;
        if (player.revive >= 2.5) {
          player.down = false;
          player.health = player.maxHealth * .5;
          player.invuln = 1.5;
          player.revive = 0;
          burst(player.x, player.y, player.color, 18, 130);
          flashText("BACK UP!", player.x, player.y - 36, player.color, 14);
        }
      } else player.revive = Math.max(0, player.revive - dt * .7);
    });
  }

  function updateProjectiles(dt) {
    state.projectiles.forEach((projectile) => {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.life -= dt;
      state.particles.push({ x: projectile.x, y: projectile.y, vx: 0, vy: 0, life: .18, maxLife: .18, size: projectile.radius * 1.5, color: projectile.color });
      if (projectile.owner === "player") {
        const targets = [...state.enemies, ...(state.boss && !state.boss.dead ? [state.boss] : [])];
        targets.forEach((enemy) => {
          if (projectile.life <= 0 || projectile.hitIds.has(enemy)) return;
          if (distance(projectile, enemy) < projectile.radius + enemy.radius) {
            projectile.hitIds.add(enemy);
            damageEnemy(enemy, projectile.damage, state.players[projectile.player], projectile.burn);
            projectile.pierce--;
            if (projectile.pierce <= 0) projectile.life = 0;
          }
        });
        state.resources.forEach((node) => {
          if (projectile.life > 0 && !projectile.hitIds.has(node) && distance(projectile, node) < projectile.radius + node.radius) {
            projectile.hitIds.add(node);
            hitResource(node, state.players[projectile.player]);
            projectile.pierce--;
            if (projectile.pierce <= 0) projectile.life = 0;
          }
        });
      } else {
        state.players.forEach((player) => {
          if (!player.down && projectile.life > 0 && distance(projectile, player) < projectile.radius + player.radius) {
            hurtPlayer(player, projectile.damage);
            projectile.life = 0;
          }
        });
      }
      if (projectile.x < -30 || projectile.x > W + 30 || projectile.y < 30 || projectile.y > H + 30) projectile.life = 0;
    });
    state.projectiles = state.projectiles.filter((p) => p.life > 0);
  }

  function hitResource(node) {
    if (node.hit > 0) return;
    node.health--;
    node.hit = .16;
    burst(node.x, node.y, MATERIALS[node.type].color, 5, 75);
    sound("hit");
    if (node.health <= 0) {
      const amount = node.type === "void" ? 2 : Math.random() < .3 ? 3 : 2;
      collectMaterial(node.type, amount, node.x, node.y);
      node.dead = true;
      setTimeout(() => {
        if (running && !state.bossDefeated) spawnResource(node.type);
      }, 9000 + Math.random() * 7000);
    }
  }

  function updateResources(dt) {
    state.resources.forEach((node) => {
      node.hit = Math.max(0, node.hit - dt);
      node.wobble += dt;
    });
    state.resources = state.resources.filter((node) => !node.dead);
  }

  function collectMaterial(type, amount, x, y) {
    state.inventory[type] += amount;
    state.totalMaterials += amount;
    flashText(`+${amount} ${MATERIALS[type].name}`, x, y - 16, MATERIALS[type].color, 9);
    burst(x, y, MATERIALS[type].color, 8, 100);
    sound("collect");
    renderMaterials();
  }

  function openPortal() {
    const def = BOSSES[state.bossStage];
    state.portalOpen = true;
    state.enemies.forEach((enemy) => { enemy.dead = true; });
    flashText(`${def.short}'S RIFT IS OPEN`, W / 2, H / 2 - 40, def.color, 24);
    burst(state.portal.x, state.portal.y, def.color, 42, 205);
    sound("boss");
  }

  function updatePortal(dt) {
    state.portalPulse += dt;
    if (!state.portalOpen || state.bossActive) {
      $("#interactionHint").classList.add("hidden");
      return;
    }
    const near = state.players.some((player) => !player.down && distance(player, state.portal) < 72);
    $("#interactionHint").classList.toggle("hidden", !near);
    if (near) startBoss();
  }

  function startBoss() {
    const def = BOSSES[state.bossStage];
    const hpScale = gameMode === 1 ? .72 : 1;
    state.bossActive = true;
    state.portalOpen = false;
    state.enemies = [];
    state.boss = {
      type: "boss", bossId: def.id, x: state.portal.x, y: state.portal.y, radius: def.radius,
      health: Math.round(def.hp * hpScale), maxHealth: Math.round(def.hp * hpScale), hit: 0, attackCooldown: 1.4,
      specialCooldown: 2.5, specialType: -1, phase: 0, dead: false
    };
    state.shake = 12;
    state.flash = .6;
    sound("boss");
    flashText(`${def.short} AWAKENS`, W / 2, H * .46, def.color, 25);
  }

  function updateEffects(dt) {
    state.particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += (particle.gravity || 0) * dt;
      particle.vx *= Math.pow(.04, dt);
      particle.vy *= Math.pow(.15, dt);
      particle.life -= dt;
    });
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.floaters.forEach((floater) => {
      floater.y -= dt * 28;
      floater.life -= dt;
    });
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
    state.attacks.forEach((attack) => { attack.life -= dt; });
    state.attacks = state.attacks.filter((attack) => attack.life > 0);
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const angle = random(0, Math.PI * 2);
      const velocity = random(speed * .3, speed);
      state.particles.push({
        x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity,
        life: random(.25, .7), maxLife: .7, size: random(2, 5), color, gravity: 18
      });
    }
  }

  function flashText(text, x, y, color = "#fff", size = 10) {
    state.floaters.push({ text, x, y, color, size, life: 1.2, maxLife: 1.2 });
  }

  function draw() {
    ctx.save();
    const sx = state.shake ? random(-state.shake, state.shake) : 0;
    const sy = state.shake ? random(-state.shake, state.shake) : 0;
    ctx.translate(sx, sy);
    drawWorld();
    if (state.portalOpen) drawPortal();

    const drawables = [
      ...state.resources.map((item) => ({ y: item.y, kind: "resource", item })),
      ...state.players.map((item) => ({ y: item.y, kind: "player", item })),
      ...state.enemies.map((item) => ({ y: item.y, kind: "enemy", item })),
      ...(state.boss && !state.boss.dead ? [{ y: state.boss.y, kind: "boss", item: state.boss }] : [])
    ].sort((a, b) => a.y - b.y);
    drawables.forEach(({ kind, item }) => {
      if (kind === "resource") drawResource(item);
      else if (kind === "player") drawPlayer(item);
      else if (kind === "enemy") drawEnemy(item);
      else drawBoss(item);
    });

    drawAttacks();
    drawProjectiles();
    drawParticles();
    drawFloaters();
    if (state.flash > 0) {
      ctx.fillStyle = `rgba(220, 149, 255, ${state.flash * .16})`;
      ctx.fillRect(-10, -10, W + 20, H + 20);
    }
    ctx.restore();
  }

  function drawWorld() {
    const biome = BIOMES[Math.min(state.bossStage, BIOMES.length - 1)];
    const gradient = ctx.createRadialGradient(W * .5, H * .45, 30, W * .5, H * .45, Math.max(W, H) * .8);
    gradient.addColorStop(0, biome.core);
    gradient.addColorStop(.55, biome.mid);
    gradient.addColorStop(1, biome.edge);
    ctx.fillStyle = gradient;
    ctx.fillRect(-12, -12, W + 24, H + 24);

    const path = ctx.createLinearGradient(0, H, W, 0);
    path.addColorStop(0, "rgba(212,236,197,.025)");
    path.addColorStop(.5, biome.haze);
    path.addColorStop(1, "rgba(212,236,197,.018)");
    ctx.strokeStyle = path;
    ctx.lineWidth = 90;
    ctx.beginPath();
    ctx.moveTo(-60, H * .78);
    ctx.bezierCurveTo(W * .22, H * .56, W * .65, H * .72, W + 60, H * .3);
    ctx.stroke();

    ctx.strokeStyle = "rgba(220,240,211,.026)";
    ctx.lineWidth = 1;
    const grid = 42;
    for (let x = 0; x < W; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    state.decor.forEach((decor) => {
      const x = decor.x * W;
      const y = 55 + decor.y * (H - 55);
      if (decor.kind < 2) {
        const patch = ctx.createRadialGradient(x, y, 0, x, y, decor.r * 4.5);
        patch.addColorStop(0, biome.haze);
        patch.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = patch;
        ctx.fillRect(x - decor.r * 5, y - decor.r * 5, decor.r * 10, decor.r * 10);
      } else if (decor.kind < 5) {
        ctx.fillStyle = hexAlpha(biome.accent, decor.a);
        ctx.beginPath();
        ctx.ellipse(x, y, decor.r * 1.8, decor.r * .55, decor.kind, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.kind === 5) {
        ctx.strokeStyle = hexAlpha(biome.accent, decor.a);
        ctx.beginPath(); ctx.arc(x, y, decor.r, 0, Math.PI * 1.4); ctx.stroke();
      } else if (decor.kind < 9) {
        ctx.fillStyle = "rgba(3,8,5,.25)";
        ctx.beginPath();
        ctx.moveTo(x, y - decor.r); ctx.lineTo(x + decor.r * .8, y); ctx.lineTo(x, y + decor.r * .45); ctx.lineTo(x - decor.r * .8, y); ctx.closePath(); ctx.fill();
      } else {
        const glow = .25 + Math.sin(state.elapsed * 2 + decor.phase) * .18;
        ctx.fillStyle = hexAlpha(biome.accent, glow);
        ctx.shadowColor = biome.accent; ctx.shadowBlur = 8;
        ctx.fillRect(x, y + Math.sin(state.elapsed + decor.phase) * 5, 2, 2);
        ctx.shadowBlur = 0;
      }
    });

    ctx.save();
    ctx.translate(state.portal.x, state.portal.y + 7);
    ctx.strokeStyle = hexAlpha(biome.accent, .1);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([4, 10]);
    ctx.beginPath(); ctx.ellipse(0, 0, 54, 19, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, Math.max(W, H) * .68);
    vignette.addColorStop(.55, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,5,2,.58)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function shadow(x, y, rx, ry, alpha = .3) {
    const shade = ctx.createRadialGradient(x, y + 8, 0, x, y + 8, rx);
    shade.addColorStop(0, `rgba(0,0,0,${alpha})`);
    shade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shade;
    ctx.beginPath(); ctx.ellipse(x, y + 8, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.invuln > 0 && Math.floor(player.invuln * 14) % 2) ctx.globalAlpha = .45;
    ctx.strokeStyle = hexAlpha(player.color, .18 + Math.sin(state.elapsed * 3 + player.index) * .05);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 9, 24, 10, 0, 0, Math.PI * 2); ctx.stroke();
    shadow(0, 0, 18, 7);
    if (player.down) {
      ctx.rotate(Math.PI / 2);
      ctx.translate(0, 7);
    }
    const bob = player.down ? 0 : Math.sin(player.step) * (player.moving ? 2 : .6);
    ctx.translate(0, bob);
    const bodyGradient = ctx.createLinearGradient(-12, -4, 12, 18);
    bodyGradient.addColorStop(0, player.dark);
    bodyGradient.addColorStop(1, "#17241d");
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(-12, -1, 24, 19);
    const headGradient = ctx.createLinearGradient(-14, -16, 14, 3);
    headGradient.addColorStop(0, "#fff0ad");
    headGradient.addColorStop(.25, player.color);
    headGradient.addColorStop(1, player.dark);
    ctx.fillStyle = headGradient;
    ctx.fillRect(-14, -16, 28, 19);
    ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 1; ctx.strokeRect(-14, -16, 28, 19);
    ctx.fillStyle = "rgba(255,255,255,.18)";
    ctx.fillRect(-11, -13, 22, 5);
    ctx.fillStyle = "#142017";
    const eyeShift = Math.cos(player.facing) * 2;
    ctx.fillRect(-7 + eyeShift, -5, 3, 3);
    ctx.fillRect(4 + eyeShift, -5, 3, 3);
    ctx.strokeStyle = WEAPONS[player.weapon].color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.shadowColor = WEAPONS[player.weapon].color;
    ctx.shadowBlur = player.weapon === "wooden" ? 0 : 8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(player.facing) * 12, Math.sin(player.facing) * 7);
    ctx.lineTo(Math.cos(player.facing) * 24, Math.sin(player.facing) * 17);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = player.color;
    ctx.font = "800 8px DM Mono, monospace";
    ctx.textAlign = "center";
    ctx.fillText(`P${player.index + 1}`, 0, -23);
    if (player.down) {
      ctx.rotate(-Math.PI / 2);
      const progress = player.revive / 2.5;
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -32, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = player.color; ctx.beginPath(); ctx.arc(0, -32, 12, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemy(enemy) {
    const def = MONSTERS[enemy.type];
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const scale = enemy.elite ? 1.18 : 1;
    ctx.scale(scale, scale);
    shadow(0, 0, enemy.radius, enemy.radius * .38);
    ctx.translate(0, Math.sin(enemy.phase) * 1.5);
    ctx.fillStyle = enemy.hit > 0 ? "#fff" : def.color;
    if (enemy.type === "slime") {
      ctx.beginPath(); ctx.roundRect(-18, -13, 36, 27, [15, 15, 5, 5]); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.fillRect(-10, -9, 10, 5);
    } else if (enemy.type === "shroom") {
      ctx.fillStyle = enemy.hit > 0 ? "#fff" : "#72566e"; ctx.fillRect(-7,-3,14,20);
      ctx.fillStyle = enemy.hit > 0 ? "#fff" : def.color; ctx.beginPath();ctx.moveTo(-23,-3);ctx.quadraticCurveTo(-17,-27,0,-28);ctx.quadraticCurveTo(18,-27,23,-3);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.25)";ctx.fillRect(-11,-20,7,5);ctx.fillRect(7,-15,5,4);
    } else if (enemy.type === "spider") {
      ctx.strokeStyle=enemy.hit>0?"#fff":def.color;ctx.lineWidth=3;
      for(let i=-1;i<=1;i+=2){for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(i*8,j*5-5);ctx.lineTo(i*(18+j*2),j*7-10);ctx.lineTo(i*(24+j*2),j*9-4);ctx.stroke();}}
      ctx.fillStyle=enemy.hit>0?"#fff":def.color;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
    } else if (enemy.type === "wolf") {
      ctx.beginPath(); ctx.moveTo(-18,-11);ctx.lineTo(-12,-25);ctx.lineTo(-4,-15);ctx.lineTo(12,-18);ctx.lineTo(18,11);ctx.lineTo(-16,12);ctx.closePath();ctx.fill();
    } else if (enemy.type === "skeleton") {
      ctx.fillRect(-13,-15,26,27);ctx.fillStyle="#4b4d41";ctx.fillRect(-7,-5,5,5);ctx.fillRect(3,-5,5,5);ctx.fillRect(-6,7,12,3);
    } else if (enemy.type === "ember") {
      ctx.beginPath();ctx.moveTo(0,-25);ctx.lineTo(17,-6);ctx.lineTo(13,15);ctx.lineTo(-14,15);ctx.lineTo(-17,-6);ctx.closePath();ctx.fill();
      ctx.fillStyle="#ffce69";ctx.fillRect(-7,-4,5,5);ctx.fillRect(3,-4,5,5);
    } else if (enemy.type === "eye") {
      ctx.rotate(enemy.phase * .2);ctx.fillRect(-16,-16,32,32);ctx.rotate(-enemy.phase*.2);ctx.fillStyle="#f0d6ff";ctx.beginPath();ctx.ellipse(0,0,10,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#421e68";ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
    } else if (enemy.type === "wraith") {
      ctx.shadowColor=def.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(0,-24);ctx.quadraticCurveTo(22,-16,17,3);ctx.lineTo(11,20);ctx.lineTo(2,13);ctx.lineTo(-8,22);ctx.lineTo(-17,7);ctx.quadraticCurveTo(-23,-15,0,-24);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle="#d4fbff";ctx.fillRect(-9,-7,5,4);ctx.fillRect(5,-7,5,4);
    } else if (enemy.type === "charger") {
      ctx.fillRect(-26,-17,52,35);ctx.fillStyle="#7e4535";ctx.fillRect(-18,-25,36,16);ctx.strokeStyle="#e3c799";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,-21);ctx.lineTo(-27,-33);ctx.moveTo(14,-21);ctx.lineTo(27,-33);ctx.stroke();ctx.fillStyle="#ffd36a";ctx.fillRect(-10,-12,6,5);ctx.fillRect(5,-12,6,5);
    } else if (enemy.type === "mimic") {
      ctx.shadowColor=def.color;ctx.shadowBlur=10;ctx.fillRect(-22,-16,44,33);ctx.fillStyle="#17383d";ctx.fillRect(-19,-5,38,7);ctx.fillStyle="#d8feff";ctx.fillRect(-12,-2,5,4);ctx.fillRect(7,-2,5,4);ctx.fillStyle="#72eff3";ctx.beginPath();ctx.moveTo(-10,-16);ctx.lineTo(-4,-30);ctx.lineTo(2,-16);ctx.moveTo(6,-16);ctx.lineTo(13,-27);ctx.lineTo(16,-16);ctx.fill();ctx.shadowBlur=0;
    } else {
      ctx.fillRect(-23,-18,46,35);ctx.fillStyle="#a0aba4";ctx.fillRect(-16,-22,14,7);ctx.fillRect(7,-19,11,6);ctx.fillStyle="#e7a958";ctx.fillRect(-9,-5,5,4);ctx.fillRect(5,-5,5,4);
    }
    if (["slime","shroom","spider","wolf"].includes(enemy.type)) {
      ctx.fillStyle = "#102017";
      ctx.fillRect(-8, -3, 4, 4); ctx.fillRect(5, -3, 4, 4);
    }
    if (enemy.elite) {
      ctx.strokeStyle = "#f5d15c";ctx.lineWidth=2;ctx.strokeRect(-enemy.radius,-enemy.radius,enemy.radius*2,enemy.radius*2);
    }
    ctx.restore();
    drawHealthBar(enemy, def.name);
  }

  function drawBoss(boss) {
    const def = BOSSES.find((item) => item.id === boss.bossId) || BOSSES[0];
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.strokeStyle = hexAlpha(def.color, .2 + Math.sin(boss.phase * 3) * .06);
    ctx.lineWidth = 3;
    ctx.beginPath();ctx.ellipse(0,18,boss.radius+18,22,0,0,Math.PI*2);ctx.stroke();
    shadow(0, 0, boss.radius + 8, 18, .52);
    const bob = Math.sin(boss.phase * 1.7) * 3;
    ctx.translate(0, bob);
    ctx.rotate(Math.sin(boss.phase * .35) * .04);
    ctx.shadowColor = def.color; ctx.shadowBlur = 16;
    if (boss.bossId === "cindermaw") {
      ctx.fillStyle = boss.hit > 0 ? "#fff" : "#44251d";ctx.fillRect(-44,-36,88,71);
      ctx.fillStyle = boss.hit > 0 ? "#fff" : "#8c4028";ctx.fillRect(-55,-19,18,52);ctx.fillRect(37,-19,18,52);
      ctx.fillStyle="#1f1512";ctx.fillRect(-32,26,25,30);ctx.fillRect(7,26,25,30);
      ctx.fillStyle="#ff7a43";ctx.fillRect(-28,-18,56,31);ctx.fillStyle="#ffd06a";ctx.fillRect(-17,-10,12,8);ctx.fillRect(6,-10,12,8);
      ctx.fillStyle="#2a1712";ctx.fillRect(-9,2,18,6);
      ctx.strokeStyle="#ffb154";ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*19,-35);ctx.lineTo(i*25,-54);ctx.lineTo(i*32+4,-64);ctx.stroke();}
    } else if (boss.bossId === "voidqueen") {
      ctx.rotate(Math.sin(boss.phase)*.04);
      ctx.fillStyle=boss.hit>0?"#fff":"#241b39";ctx.beginPath();ctx.moveTo(0,-55);ctx.lineTo(38,-28);ctx.lineTo(46,25);ctx.lineTo(18,48);ctx.lineTo(0,34);ctx.lineTo(-18,48);ctx.lineTo(-46,25);ctx.lineTo(-38,-28);ctx.closePath();ctx.fill();
      ctx.fillStyle=boss.hit>0?"#fff":"#6b3b82";ctx.fillRect(-28,-31,56,44);
      ctx.strokeStyle="#dda1ff";ctx.lineWidth=4;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*12,-48+Math.abs(i)*4);ctx.lineTo(i*17,-70+Math.abs(i)*5);ctx.stroke();}
      ctx.fillStyle="#f0c2ff";ctx.fillRect(-19,-17,12,8);ctx.fillRect(7,-17,12,8);ctx.fillStyle="#a54cce";ctx.fillRect(-6,1,12,18);
      for(let i=0;i<4;i++){const a=boss.phase*.5+i*Math.PI/2;ctx.fillStyle="#c986f0";ctx.fillRect(Math.cos(a)*59-4,Math.sin(a)*24-4,8,8);}
    } else {
      ctx.fillStyle = boss.hit > 0 ? "#fff" : "#2d392b";ctx.fillRect(-40,-33,80,66);
      ctx.fillStyle = boss.hit > 0 ? "#fff" : "#526547";ctx.fillRect(-50,-16,18,48);ctx.fillRect(32,-16,18,48);
      ctx.fillStyle="#1b271d";ctx.fillRect(-31,25,24,26);ctx.fillRect(7,25,24,26);
      ctx.strokeStyle="#8fbc69";ctx.lineWidth=5;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*21,-31);ctx.lineTo(i*28,-53);ctx.lineTo(i*36+4,-61);ctx.stroke();}
      ctx.fillStyle="#c7ff83";ctx.fillRect(-19,-11,11,8);ctx.fillRect(8,-11,11,8);ctx.fillStyle="#794e86";ctx.fillRect(-5,3,10,15);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle="rgba(255,255,255,.09)";ctx.lineWidth=1;ctx.strokeRect(-boss.radius*.72,-boss.radius*.65,boss.radius*1.44,boss.radius*1.25);
    ctx.restore();
  }

  function drawHealthBar(enemy, name) {
    if (enemy.health >= enemy.maxHealth || enemy.type === "boss") return;
    const width = enemy.radius * 2;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width, 3);
    ctx.fillStyle = enemy.elite ? "#f2c955" : "#d96c55";
    ctx.fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 12, width * clamp(enemy.health / enemy.maxHealth, 0, 1), 3);
    if (enemy.elite) {
      ctx.fillStyle="#efd977";ctx.font="500 6px DM Mono, monospace";ctx.textAlign="center";ctx.fillText(`ELITE ${name.toUpperCase()}`, enemy.x, enemy.y-enemy.radius-16);
    }
  }

  function drawResource(node) {
    ctx.save();
    ctx.translate(node.x, node.y);
    if (node.hit > 0) ctx.translate(random(-2,2), random(-2,2));
    shadow(0, 0, node.radius, 6, .25);
    const color = MATERIALS[node.type].color;
    if (node.type === "wood") {
      ctx.fillStyle="#725438";ctx.fillRect(-6,-5,12,27);ctx.fillStyle="#39754d";ctx.fillRect(-23,-31,46,32);ctx.fillStyle="#4c9160";ctx.fillRect(-16,-38,34,29);ctx.fillStyle="rgba(255,255,255,.09)";ctx.fillRect(-12,-34,19,5);
    } else if (node.type === "fiber") {
      ctx.strokeStyle=color;ctx.lineWidth=4;ctx.lineCap="round";
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*5,12);ctx.quadraticCurveTo(i*7-4,-3,i*6,-16-Math.abs(i)*3);ctx.stroke();}
    } else if (node.type === "crystal" || node.type === "void" || node.type === "ember") {
      ctx.shadowColor=color;ctx.shadowBlur=12;ctx.fillStyle=color;
      ctx.beginPath();ctx.moveTo(0,-28);ctx.lineTo(13,-2);ctx.lineTo(7,18);ctx.lineTo(-10,15);ctx.lineTo(-14,-4);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.28)";ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(4,-2);ctx.lineTo(-7,9);ctx.lineTo(-9,-4);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
    } else {
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-20,10);ctx.lineTo(-14,-13);ctx.lineTo(1,-20);ctx.lineTo(20,-8);ctx.lineTo(16,13);ctx.lineTo(-2,18);ctx.closePath();ctx.fill();
      ctx.fillStyle="rgba(255,255,255,.15)";ctx.beginPath();ctx.moveTo(-12,-9);ctx.lineTo(0,-15);ctx.lineTo(4,-5);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();
    }
    if (node.health < node.maxHealth) {
      ctx.strokeStyle="rgba(20,20,20,.5)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-12);ctx.lineTo(3,-3);ctx.lineTo(-2,6);ctx.stroke();
    }
    ctx.restore();
  }

  function drawPortal() {
    const portal = state.portal;
    const color = BOSSES[state.bossStage]?.color || "#b977e9";
    const pulse = Math.sin(state.portalPulse * 4) * 5;
    ctx.save();ctx.translate(portal.x,portal.y);
    ctx.strokeStyle=hexAlpha(color,.18);ctx.lineWidth=14;ctx.beginPath();ctx.ellipse(0,8,portal.radius+10+pulse,22+pulse*.3,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowColor=color;ctx.shadowBlur=25;ctx.beginPath();ctx.ellipse(0,6,portal.radius+pulse,17+pulse*.2,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=hexAlpha(color,.3);ctx.beginPath();ctx.ellipse(0,6,portal.radius-4,13,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    for(let i=0;i<9;i++){const a=state.portalPulse*(.5+i*.07)+i;const r=portal.radius+12;ctx.fillStyle=hexAlpha(color,.25+i*.035);ctx.fillRect(Math.cos(a)*r-2,Math.sin(a)*16+3,4,4);}
    ctx.restore();
  }

  function drawAttacks() {
    state.attacks.forEach((attack) => {
      const alpha = attack.life / attack.maxLife;
      ctx.strokeStyle = hexAlpha(attack.color, alpha * .75);
      ctx.lineWidth = 7 * alpha;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(attack.x, attack.y, attack.range * (1 - alpha * .2), attack.angle - .85, attack.angle + .85);
      ctx.stroke();
    });
  }

  function drawProjectiles() {
    state.projectiles.forEach((projectile) => {
      ctx.save();ctx.translate(projectile.x,projectile.y);ctx.fillStyle=projectile.color;ctx.shadowColor=projectile.color;ctx.shadowBlur=13;ctx.beginPath();ctx.arc(0,0,projectile.radius,0,Math.PI*2);ctx.fill();ctx.restore();
    });
  }

  function drawParticles() {
    state.particles.forEach((particle) => {
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawFloaters() {
    state.floaters.forEach((floater) => {
      ctx.globalAlpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.fillStyle = floater.color;
      ctx.font = `700 ${floater.size}px DM Mono, monospace`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,.8)";ctx.shadowBlur=5;
      ctx.fillText(floater.text, floater.x, floater.y);
    });
    ctx.globalAlpha=1;ctx.shadowBlur=0;
  }

  function hexAlpha(hex, alpha) {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
    return `rgba(${parseInt(full.slice(0,2),16)},${parseInt(full.slice(2,4),16)},${parseInt(full.slice(4,6),16)},${alpha})`;
  }

  function updateAllUI() {
    if (!state.players.length) return;
    state.players.forEach((player, index) => {
      $(`#p${index + 1}Health`).style.width = `${clamp(player.health / player.maxHealth, 0, 1) * 100}%`;
      $(`#p${index + 1}Stamina`).style.width = `${player.stamina}%`;
      $(`#p${index + 1}WeaponName`).textContent = WEAPONS[player.weapon].name.toUpperCase();
      $(`#p${index + 1}Level`).textContent = player.level;
    });
    $("#waveLabel").textContent = String(state.wave).padStart(2, "0");
    const day = Math.floor(state.elapsed / 80) + 1;
    const cycle = ["DAWN", "DAY", "DUSK", "NIGHT"][Math.floor(state.elapsed / 20) % 4];
    $("#dayLabel").textContent = `DAY ${day} · ${cycle}`;
    $("#biomeLabel").textContent = BIOMES[state.bossStage]?.name || BIOMES[0].name;

    if (state.bossActive && state.boss) {
      const bossDef = BOSSES.find((item) => item.id === state.boss.bossId) || BOSSES[state.bossStage];
      $("#bossHud").classList.remove("hidden");
      $("#bossHealth").style.width = `${clamp(state.boss.health / state.boss.maxHealth, 0, 1) * 100}%`;
      $("#bossName").textContent = bossDef.name;
      $("#bossChapter").textContent = `WORLD BOSS · ${state.bossStage + 1} / ${BOSSES.length}`;
      $("#questTitle").textContent = `Defeat ${bossDef.short}`;
      $("#questCopy").textContent = `Survive ${bossDef.special[0].toLowerCase()} and bring the titan down.`;
      $("#questCount").textContent = `${Math.ceil(state.boss.health)} health remains`;
      $("#questProgress").style.width = `${(1 - state.boss.health / state.boss.maxHealth) * 100}%`;
    } else {
      $("#bossHud").classList.add("hidden");
      if (state.portalOpen) {
        $("#questTitle").textContent = `Face ${BOSSES[state.bossStage].short}`;
        $("#questCopy").textContent = "The seal is broken. Approach the glowing rift.";
        $("#questCount").textContent = `BOSS ${state.bossStage + 1} OF ${BOSSES.length} READY`;
        $("#questProgress").style.width = "100%";
      } else if (state.intermission > 0) {
        $("#questTitle").textContent = "Realm purified";
        $("#questCopy").textContent = "Gather your rewards. A darker realm is forming.";
        $("#questCount").textContent = `${state.bossesDefeated} / ${BOSSES.length} BOSSES DEFEATED`;
        $("#questProgress").style.width = `${state.bossesDefeated / BOSSES.length * 100}%`;
      } else {
        const segmentStart = state.bossStage ? BOSS_TARGETS[state.bossStage - 1] : 0;
        const segmentTotal = BOSS_TARGETS[state.bossStage] - segmentStart;
        const segmentKills = clamp(state.kills - segmentStart, 0, segmentTotal);
        $("#questTitle").textContent = `Awaken ${BOSSES[state.bossStage].short}`;
        $("#questCopy").textContent = "Defeat monsters to charge the realm's ancient gate.";
        $("#questCount").textContent = `${segmentKills} / ${segmentTotal} defeated`;
        $("#questProgress").style.width = `${Math.min(100, segmentKills / segmentTotal * 100)}%`;
      }
    }
    const threat = state.bossActive ? "BOSS THREAT" : state.wave >= 4 ? "SEVERE THREAT" : state.wave >= 2 ? "RISING THREAT" : "LOW THREAT";
    $("#threatLabel").textContent = threat;
    $("#threatLabel").style.color = state.wave >= 4 || state.bossActive ? "#ff7b67" : state.wave >= 2 ? "#edc86d" : "#8ed26e";
  }

  function renderMaterials() {
    $("#materialGrid").innerHTML = Object.entries(MATERIALS).map(([id, material]) => `
      <div class="material" title="${material.name}">
        <span class="material-icon" style="background:${material.color}">${material.icon}</span>
        <span class="material-copy"><b>${state.inventory[id] || 0}</b><span>${material.name}</span></span>
      </div>`).join("");
    $("#craftMaterials").innerHTML = Object.entries(state.inventory).filter(([, count]) => count > 0).map(([id, count]) => `<span class="footer-material">${MATERIALS[id].icon}<b>${count}</b></span>`).join("");
  }

  function canCraft(recipe) {
    return Object.entries(recipe.cost).every(([material, amount]) => state.inventory[material] >= amount);
  }

  function renderRecipes() {
    const recipes = RECIPES.filter((recipe) => recipeFilter === "all" || recipe.category === recipeFilter);
    $("#recipeList").innerHTML = recipes.map((recipe) => {
      const owned = recipe.category === "weapon" && state.craftedWeapons.has(recipe.id);
      const affordable = owned || canCraft(recipe);
      return `<article class="recipe-card ${owned ? "crafted" : ""}">
        <div class="recipe-top"><span class="recipe-icon">${recipe.icon}</span><span class="recipe-type">${owned ? "FORGED" : recipe.category.toUpperCase()}</span></div>
        <h3>${recipe.name}</h3><p>${recipe.copy}</p>
        <div class="recipe-stats">${recipe.stats.map((stat) => `<span><b>${stat.split(" ")[0]}</b> ${stat.split(" ").slice(1).join(" ")}</span>`).join("")}</div>
        <div class="recipe-cost">${Object.entries(recipe.cost).map(([id, amount]) => `<span class="cost-pill ${state.inventory[id] < amount && !owned ? "missing" : ""}"><i class="cost-icon" style="background:${MATERIALS[id].color}"></i>${amount}</span>`).join("")}</div>
        <button class="craft-item-button" data-recipe="${recipe.id}" ${affordable ? "" : "disabled"}>${owned ? `EQUIP TO P${selectedPlayer + 1}` : recipe.category === "weapon" ? "FORGE & EQUIP" : "CRAFT ITEM"}</button>
      </article>`;
    }).join("");
    renderMaterials();
  }

  function craft(recipeId) {
    const recipe = RECIPES.find((item) => item.id === recipeId);
    if (!recipe) return;
    const owned = recipe.category === "weapon" && state.craftedWeapons.has(recipe.id);
    if (!owned && !canCraft(recipe)) return;
    if (!owned) {
      Object.entries(recipe.cost).forEach(([material, amount]) => { state.inventory[material] -= amount; });
      state.crafted++;
    }
    if (recipe.category === "weapon") {
      state.craftedWeapons.add(recipe.id);
      state.players[selectedPlayer].weapon = recipe.id;
      flashText(`${recipe.name.toUpperCase()} EQUIPPED`, state.players[selectedPlayer].x, state.players[selectedPlayer].y - 30, state.players[selectedPlayer].color, 10);
    } else if (recipe.id === "salve") {
      state.players.forEach((player) => { player.health = Math.min(player.maxHealth, player.health + 45); });
    } else if (recipe.id === "ward") {
      state.players.forEach((player) => { player.maxHealth += 20; player.health += 20; });
    } else if (recipe.id === "tonic") {
      state.damageBoost = 25;
    }
    sound("craft");
    renderRecipes();
    updateAllUI();
  }

  function toggleCraft(open) {
    if (!running) return;
    const shouldOpen = open ?? !$("#craftScreen").classList.contains("active");
    $("#craftScreen").classList.toggle("active", shouldOpen);
    $("#craftScreen").setAttribute("aria-hidden", String(!shouldOpen));
    paused = shouldOpen;
    if (shouldOpen) renderRecipes();
  }

  function togglePause(open) {
    if (!running || $("#craftScreen").classList.contains("active")) return;
    const shouldOpen = open ?? !$("#pauseScreen").classList.contains("active");
    $("#pauseScreen").classList.toggle("active", shouldOpen);
    $("#pauseScreen").setAttribute("aria-hidden", String(!shouldOpen));
    paused = shouldOpen;
  }

  function endGame(won) {
    if (!running) return;
    running = false;
    paused = true;
    $("#endScreen").classList.add("active");
    $("#endScreen").setAttribute("aria-hidden", "false");
    $("#endEyebrow").textContent = won ? "RIFT CONQUERED" : "THE WILDS ENDURE";
    $("#endTitle").textContent = won ? "The wilds remember." : "Your forge went cold.";
    $("#endCopy").textContent = won
      ? gameMode === 2 ? "Together, you defeated all three rulers of the rifts." : "Alone, you defeated all three rulers of the rifts."
      : gameMode === 2 ? "Gather, forge, and return stronger together." : "Gather, forge, and return stronger.";
    $("#endSigil").textContent = won ? "✦" : "×";
    $("#statMonsters").textContent = state.kills;
    $("#statMaterials").textContent = state.totalMaterials;
    $("#statCrafted").textContent = state.crafted;
  }

  function returnToMenu() {
    running = false;
    paused = true;
    ["#endScreen", "#pauseScreen", "#craftScreen"].forEach((selector) => $(selector).classList.remove("active"));
    $("#startScreen").classList.add("active");
    $("#startScreen").setAttribute("aria-hidden", "false");
  }

  function frame(time) {
    const dt = Math.min(.034, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  const blockedKeys = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]);
  window.addEventListener("keydown", (event) => {
    if (blockedKeys.has(event.code)) event.preventDefault();
    if (!event.repeat) {
      if (event.code === "KeyC") toggleCraft();
      if (event.code === "Escape") {
        if ($("#craftScreen").classList.contains("active")) toggleCraft(false);
        else togglePause();
      }
    }
    keys[event.code] = true;
  });
  window.addEventListener("keyup", (event) => { keys[event.code] = false; });
  window.addEventListener("blur", () => {
    Object.keys(keys).forEach((key) => { keys[key] = false; });
    if (running && !paused) togglePause(true);
  });
  window.addEventListener("resize", resize);

  $("#startButton").addEventListener("click", startGame);
  $("#modeSelect").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-mode]");
    if (button) setMode(Number(button.dataset.mode));
  });
  $("#restartButton").addEventListener("click", startGame);
  $("#changeModeButton").addEventListener("click", returnToMenu);
  $("#restartFromPause").addEventListener("click", startGame);
  $("#craftButton").addEventListener("click", () => toggleCraft());
  $("#closeCraft").addEventListener("click", () => toggleCraft(false));
  $("#pauseButton").addEventListener("click", () => togglePause());
  $("#resumeButton").addEventListener("click", () => togglePause(false));
  $("#soundButton").addEventListener("click", () => {
    soundOn = !soundOn;
    $("#soundButton").textContent = soundOn ? "♪" : "×";
    $("#soundButton").style.color = soundOn ? "" : "#ff7565";
  });
  $("#collapseMaterials").addEventListener("click", () => {
    const collapsed = $("#materialsPanel").classList.toggle("collapsed");
    $("#collapseMaterials").textContent = collapsed ? "+" : "−";
  });
  $("#equipTarget").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-player]");
    if (!button) return;
    selectedPlayer = Number(button.dataset.player);
    $$("#equipTarget button").forEach((item) => item.classList.toggle("active", item === button));
    renderRecipes();
  });
  $("#recipeTabs").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    recipeFilter = button.dataset.filter;
    $$("#recipeTabs button").forEach((item) => item.classList.toggle("active", item === button));
    renderRecipes();
  });
  $("#recipeList").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-recipe]");
    if (button) craft(button.dataset.recipe);
  });

  resetInventory();
  state.players = [createPlayer(0)];
  resize();
  spawnInitialResources();
  renderMaterials();
  setMode(1);
  updateAllUI();
  requestAnimationFrame(frame);
})();
