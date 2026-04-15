// ===== THANIT'S LIFE QUEST - 8-bit Portfolio =====
// Scroll (or arrow keys / swipe) to walk the character through life stations.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Virtual resolution (pixel art)
const VW = 480;
const VH = 270;

// Life stations (edit these to update the portfolio content)
const STATIONS = [
  {
    x: 260,
    type: 'hospital',
    stage: 'angel',     // character form when APPROACHING
    nextStage: 'baby',  // character form AFTER leaving
    name: 'HOSPITAL — DAY 1',
    text: 'นายธนิต สิทธิยากร\nเกิดในเดือนมิถุนายน',
  },
  {
    x: 720,
    type: 'school',
    stage: 'baby',
    nextStage: 'child',
    name: 'ELEMENTARY SCHOOL',
    text: 'จบประถมศึกษา\nจากโรงเรียน ... (แก้ในไฟล์ game.js)',
  },
  {
    x: 1180,
    type: 'school',
    stage: 'child',
    nextStage: 'teen',
    name: 'HIGH SCHOOL',
    text: 'จบมัธยมศึกษา\nจากโรงเรียน ... (แก้ในไฟล์ game.js)',
  },
  {
    x: 1640,
    type: 'university',
    stage: 'teen',
    nextStage: 'grad',
    name: 'UNIVERSITY',
    text: 'จบการศึกษาปริญญาตรี\nจากมหาวิทยาลัย ... (แก้ในไฟล์ game.js)',
  },
  {
    x: 2100,
    type: 'office1',
    stage: 'grad',
    nextStage: 'worker',
    name: 'FIRST JOB',
    text: 'บริษัทแรก ...\nตำแหน่ง ... (แก้ในไฟล์ game.js)',
  },
  {
    x: 2560,
    type: 'office2',
    stage: 'worker',
    nextStage: 'worker',
    name: 'SECOND JOB',
    text: 'บริษัทที่สอง ...\nตำแหน่ง ... (แก้ในไฟล์ game.js)',
  },
  {
    x: 3020,
    type: 'office3',
    stage: 'worker',
    nextStage: 'worker',
    name: 'CURRENT JOB (2026)',
    text: 'ปัจจุบันทำงานที่ ...\nตำแหน่ง ... (แก้ในไฟล์ game.js)',
  },
];

const WORLD_WIDTH = 3300;
const GROUND_Y = 210;

// Game state
const state = {
  scrollX: 0,
  targetScrollX: 0,
  charX: 80,
  charStage: 'angel',
  walkFrame: 0,
  walkTimer: 0,
  facing: 1,
  visited: new Set(),
  dialogue: null, // {station, shownChars, full}
  dialogueDone: false,
  started: false,
  cloudOffset: 0,
};

// ===== Responsive canvas =====
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  // compute scale to fit VW x VH
  const scale = Math.min(canvas.width / VW, canvas.height / VH);
  ctx.setTransform(scale, 0, 0, scale, (canvas.width - VW * scale) / 2, (canvas.height - VH * scale) / 2);
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ===== Input =====
let scrollAccum = 0;
window.addEventListener('wheel', (e) => {
  if (!state.started) return;
  state.targetScrollX += e.deltaY * 1.1;
  e.preventDefault();
}, { passive: false });

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
  if (e.key === 'Enter' || e.key === ' ') {
    if (state.dialogue && state.dialogueDone) closeDialogue();
  }
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Touch swipe
let touchStartX = null;
canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', (e) => {
  if (touchStartX === null) return;
  const dx = touchStartX - e.touches[0].clientX;
  state.targetScrollX += dx * 1.4;
  touchStartX = e.touches[0].clientX;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => { touchStartX = null; });
canvas.addEventListener('click', () => {
  if (state.dialogue && state.dialogueDone) closeDialogue();
});

// ===== Dialogue DOM =====
const dlgEl = document.getElementById('dialogue');
const dlgName = document.getElementById('dialogue-name');
const dlgText = document.getElementById('dialogue-text');
function openDialogue(station) {
  state.dialogue = { station, shown: 0, full: station.text };
  state.dialogueDone = false;
  dlgName.textContent = station.name;
  dlgText.textContent = '';
  dlgEl.classList.remove('hidden');
}
function closeDialogue() {
  if (!state.dialogue) return;
  const st = state.dialogue.station;
  st._consumed = true;
  state.charStage = st.nextStage;
  state.dialogue = null;
  dlgEl.classList.add('hidden');
}

// ===== Pixel art helpers =====
function px(x, y, color, size = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
}

// Draw a sprite from a 2D array of color chars
function sprite(x, y, data, palette, flip = false) {
  const h = data.length;
  const w = data[0].length;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const c = data[j][flip ? (w - 1 - i) : i];
      if (c === '.' || c === ' ') continue;
      const color = palette[c];
      if (color) px(x + i, y + j, color);
    }
  }
}

// ===== Sprites =====
const SPRITES = {
  angel: {
    palette: { '#': '#ffffff', 'o': '#ffd84d', 'k': '#000000', 's': '#ffcc99', 'w': '#cfeaff' },
    frames: [
      [
        '....oooo....',
        '...o####o...',
        '..#ss##ss#..',
        '..#sksksks#.',
        '..#sssssss#.',
        '...#sssss#..',
        '.w.#######.w',
        'www#######www',
        '.w.#######.w',
        '...##...##..',
        '...##...##..',
        '...ss...ss..',
      ],
      [
        '....oooo....',
        '...o####o...',
        '..#ss##ss#..',
        '..#sksksks#.',
        '..#sssssss#.',
        '...#sssss#..',
        'w..#######..w',
        'www#######www',
        'w..#######..w',
        '...##...##..',
        '...##...##..',
        '...ss...ss..',
      ],
    ],
    w: 13, h: 12,
  },
  baby: {
    palette: { '#': '#ffcc99', 'k': '#000000', 'r': '#ff6b6b', 'w': '#ffffff', 'y': '#ffd84d' },
    frames: [
      [
        '..#####..',
        '.#ykyky#.',
        '.#######.',
        '.#k###k#.',
        '.#######.',
        '..##r##..',
        '.#######.',
        '#wwwwwww#',
        '#wwwwwww#',
        '.##...##.',
        '.##...##.',
      ],
      [
        '..#####..',
        '.#ykyky#.',
        '.#######.',
        '.#k###k#.',
        '.#######.',
        '..##r##..',
        '#########',
        '#wwwwwww#',
        '#wwwwwww#',
        '.##...##.',
        '.##...##.',
      ],
    ],
    w: 9, h: 11,
  },
  child: {
    palette: { '#': '#ffcc99', 'k': '#000000', 'b': '#4a7dff', 'y': '#ffd84d', 's': '#ffffff', 'r': '#ff4d4d' },
    frames: [
      [
        '...####...',
        '..#yyyy#..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.bbbbbbbb.',
        '.bssssssb.',
        '.bbbbbbbb.',
        '..##..##..',
        '..##..##..',
        '..kk..kk..',
      ],
      [
        '...####...',
        '..#yyyy#..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.bbbbbbbb.',
        '.bssssssb.',
        '.bbbbbbbb.',
        '...##.##..',
        '..##...##.',
        '..kk...kk.',
      ],
    ],
    w: 10, h: 13,
  },
  teen: {
    palette: { '#': '#ffcc99', 'k': '#000000', 'b': '#222244', 'y': '#222222', 'j': '#2a5fcf', 's': '#ffffff', 'r': '#ff4d4d' },
    frames: [
      [
        '...####...',
        '..#yyyy#..',
        '.#yyyyyy#.',
        '.#y####y#.',
        '.#y#kk#y#.',
        '.##r##r##.',
        '.########.',
        '.jjjjjjjj.',
        '.jssssssj.',
        '.jjjjjjjj.',
        '.bbb..bbb.',
        '.bbb..bbb.',
        '..kk..kk..',
        '..kk..kk..',
      ],
      [
        '...####...',
        '..#yyyy#..',
        '.#yyyyyy#.',
        '.#y####y#.',
        '.#y#kk#y#.',
        '.##r##r##.',
        '.########.',
        '.jjjjjjjj.',
        '.jssssssj.',
        '.jjjjjjjj.',
        '.bbbbb.bb.',
        '.bb.bbbbb.',
        '..kk...kk.',
        '..kk...kk.',
      ],
    ],
    w: 10, h: 14,
  },
  grad: {
    palette: { '#': '#ffcc99', 'k': '#000000', 'G': '#1a1a2e', 'T': '#ffd84d', 's': '#ffffff', 'r': '#ff4d4d' },
    frames: [
      [
        '..GGGGGG..',
        '.GGGGGGGG.',
        '.G......G.',
        '.T#####T..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.GGGGGGGG.',
        '.GssssssG.',
        '.GGGGGGGG.',
        '.GGG..GGG.',
        '.GGG..GGG.',
        '..kk..kk..',
      ],
      [
        '..GGGGGG..',
        '.GGGGGGGG.',
        '.G......G.',
        '.T#####T..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.GGGGGGGG.',
        '.GssssssG.',
        '.GGGGGGGG.',
        '.GGGGGGGG.',
        '.GG....GG.',
        '.kk....kk.',
      ],
    ],
    w: 10, h: 15,
  },
  worker: {
    palette: { '#': '#ffcc99', 'k': '#000000', 'S': '#1a3a6b', 't': '#cc2244', 'w': '#ffffff', 'r': '#ff4d4d' },
    frames: [
      [
        '...####...',
        '..#kkkk#..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.SwwttwwS.',
        '.SwwttwwS.',
        '.SSSSSSSS.',
        '.SSS..SSS.',
        '.SSS..SSS.',
        '..kk..kk..',
        '..kk..kk..',
      ],
      [
        '...####...',
        '..#kkkk#..',
        '.#kkkkkk#.',
        '.#k####k#.',
        '.#k#kk#k#.',
        '.##r##r##.',
        '..######..',
        '.SwwttwwS.',
        '.SwwttwwS.',
        '.SSSSSSSS.',
        '.SSSS.SSS.',
        '.SSS.SSSS.',
        '..kk...kk.',
        '..kk...kk.',
      ],
    ],
    w: 10, h: 14,
  },
};

// ===== Background / scene drawing =====
function drawSky() {
  // Gradient sky
  const grd = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  grd.addColorStop(0, '#7ec9ff');
  grd.addColorStop(1, '#ffd8ac');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, VW, GROUND_Y);
  // Sun
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(VW - 60, 50, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(VW - 60, 50, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds() {
  const off = (state.scrollX * 0.2 + state.cloudOffset) % (VW + 80);
  for (let i = 0; i < 8; i++) {
    const cx = (i * 180) - off;
    drawCloud(cx, 30 + (i % 3) * 20);
    drawCloud(cx + VW, 30 + (i % 3) * 20);
  }
}
function drawCloud(x, y) {
  ctx.fillStyle = '#ffffff';
  for (const [dx, dy, w, h] of [[0,4,14,6],[6,0,14,6],[14,4,14,6],[4,8,22,4]]) {
    ctx.fillRect(Math.floor(x + dx), Math.floor(y + dy), w, h);
  }
}

function drawGround() {
  // Grass
  ctx.fillStyle = '#4dc94d';
  ctx.fillRect(0, GROUND_Y, VW, 10);
  ctx.fillStyle = '#2ea82e';
  ctx.fillRect(0, GROUND_Y + 10, VW, VH - GROUND_Y - 10);
  // Road line
  ctx.fillStyle = '#3a7a3a';
  for (let i = 0; i < VW; i += 16) {
    const sx = i - (state.scrollX % 16);
    ctx.fillRect(sx, GROUND_Y + 18, 8, 2);
  }
  // Grass tufts
  ctx.fillStyle = '#6fe06f';
  for (let i = 0; i < 40; i++) {
    const wx = i * 90 - (state.scrollX % 90);
    ctx.fillRect(wx, GROUND_Y - 2, 3, 2);
    ctx.fillRect(wx + 30, GROUND_Y - 1, 2, 1);
  }
}

function worldToScreen(x) { return x - state.scrollX; }

// ===== Station buildings =====
function drawStation(st) {
  const sx = worldToScreen(st.x);
  if (sx < -200 || sx > VW + 200) return;
  switch (st.type) {
    case 'hospital': drawHospital(sx); break;
    case 'school': drawSchool(sx, st === STATIONS[1] ? 'ประถม' : 'มัธยม'); break;
    case 'university': drawUniversity(sx); break;
    case 'office1': drawOffice(sx, '#ff8c42', 'OFFICE 1'); break;
    case 'office2': drawOffice(sx, '#5ca8e8', 'OFFICE 2'); break;
    case 'office3': drawOffice(sx, '#ffd84d', 'CURRENT'); break;
  }
  // Flag marker
  if (!st._consumed) {
    const fx = sx + 2;
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(fx, GROUND_Y - 30, 1, 20);
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(fx + 1, GROUND_Y - 30, 8, 5);
    // pulsing marker
    const pulse = Math.sin(Date.now() / 200) * 2;
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(fx - 2, GROUND_Y - 34 + pulse, 2, 2);
  }
}

function drawHospital(sx) {
  const bx = sx - 40, by = GROUND_Y - 70;
  // Building
  ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, 80, 70);
  ctx.fillStyle = '#e0e0e0'; ctx.fillRect(bx, by, 80, 5);
  // Red cross
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(bx + 35, by + 8, 10, 22);
  ctx.fillRect(bx + 29, by + 14, 22, 10);
  // Windows
  ctx.fillStyle = '#4aa0ff';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      if (r === 0 && c === 1) continue;
      ctx.fillRect(bx + 10 + c * 22, by + 36 + r * 15, 10, 8);
    }
  }
  // Door
  ctx.fillStyle = '#663322';
  ctx.fillRect(bx + 34, by + 56, 12, 14);
  // Sign
  ctx.fillStyle = '#000';
  ctx.fillRect(bx + 20, by - 10, 40, 8);
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('HOSPITAL', bx + 22, by - 3);
}

function drawSchool(sx, label) {
  const bx = sx - 50, by = GROUND_Y - 80;
  // Main block
  ctx.fillStyle = '#f4c98a'; ctx.fillRect(bx, by + 10, 100, 70);
  // Roof
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.moveTo(bx - 4, by + 10);
  ctx.lineTo(bx + 50, by - 8);
  ctx.lineTo(bx + 104, by + 10);
  ctx.closePath();
  ctx.fill();
  // Bell tower
  ctx.fillStyle = '#b07840';
  ctx.fillRect(bx + 44, by - 22, 12, 14);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(bx + 48, by - 17, 4, 4);
  // Windows
  ctx.fillStyle = '#6bc1ff';
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      if (r === 1 && c === 1) continue;
      if (r === 1 && c === 2) continue;
      ctx.fillRect(bx + 10 + c * 20, by + 20 + r * 22, 10, 10);
    }
  }
  // Door
  ctx.fillStyle = '#663322';
  ctx.fillRect(bx + 42, by + 60, 16, 20);
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(bx + 54, by + 70, 2, 2);
  // Sign
  ctx.fillStyle = '#000';
  ctx.fillRect(bx + 20, by, 60, 8);
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('SCHOOL', bx + 28, by + 7);
}

function drawUniversity(sx) {
  const bx = sx - 60, by = GROUND_Y - 100;
  // Dome
  ctx.fillStyle = '#d4b27a';
  ctx.beginPath();
  ctx.arc(bx + 60, by + 20, 20, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(bx + 58, by - 4, 4, 6);
  // Pillars building
  ctx.fillStyle = '#efe3c8';
  ctx.fillRect(bx, by + 20, 120, 80);
  ctx.fillStyle = '#c9b98a';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(bx + 10 + i * 25, by + 30, 8, 60);
  }
  // Steps
  ctx.fillStyle = '#b0a070';
  ctx.fillRect(bx - 5, by + 92, 130, 4);
  ctx.fillRect(bx - 10, by + 96, 140, 4);
  // Door
  ctx.fillStyle = '#663322';
  ctx.fillRect(bx + 54, by + 70, 14, 22);
  // Sign
  ctx.fillStyle = '#000';
  ctx.fillRect(bx + 30, by + 22, 60, 8);
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('UNIVERSITY', bx + 32, by + 29);
}

function drawOffice(sx, color, label) {
  const bx = sx - 45, by = GROUND_Y - 110;
  // Tall building
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, 90, 110);
  // Edge shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(bx + 80, by, 10, 110);
  // Windows grid
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 5; c++) {
      const lit = (r + c) % 3 === 0;
      ctx.fillStyle = lit ? '#ffeb99' : '#2a3a5a';
      ctx.fillRect(bx + 8 + c * 16, by + 8 + r * 12, 10, 8);
    }
  }
  // Door
  ctx.fillStyle = '#222';
  ctx.fillRect(bx + 38, by + 96, 14, 14);
  // Sign
  ctx.fillStyle = '#000';
  ctx.fillRect(bx + 10, by - 10, 70, 8);
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText(label, bx + 16, by - 3);
}

// ===== Trees / decorations between stations =====
function drawTrees() {
  const seed = [140, 430, 580, 900, 1000, 1380, 1530, 1850, 1980, 2280, 2400, 2720, 2860, 3180];
  for (const wx of seed) {
    const sx = worldToScreen(wx);
    if (sx < -40 || sx > VW + 40) continue;
    drawTree(sx, GROUND_Y - 30);
  }
}
function drawTree(x, y) {
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(x, y + 12, 4, 18);
  ctx.fillStyle = '#2aa54a';
  ctx.fillRect(x - 8, y, 20, 18);
  ctx.fillRect(x - 4, y - 6, 12, 10);
  ctx.fillStyle = '#38c858';
  ctx.fillRect(x - 4, y + 2, 4, 4);
  ctx.fillRect(x + 4, y + 6, 4, 4);
}

// ===== Character drawing =====
function drawCharacter() {
  const spr = SPRITES[state.charStage];
  if (!spr) return;
  const frame = spr.frames[state.walkFrame % spr.frames.length];
  // Character always screen-center-ish
  const sx = state.charX;
  const sy = GROUND_Y - spr.h + 2;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(sx, GROUND_Y + 1, spr.w, 2);
  sprite(sx, sy, frame, spr.palette, state.facing < 0);
}

// ===== Update / main loop =====
let lastTime = performance.now();
function tick(now) {
  const dt = Math.min(60, now - lastTime);
  lastTime = now;

  // Smooth scroll toward target
  if (state.started && !state.dialogue) {
    if (keys['ArrowRight'] || keys['d']) state.targetScrollX += 0.35 * dt;
    if (keys['ArrowLeft'] || keys['a']) state.targetScrollX -= 0.35 * dt;
    const maxScroll = WORLD_WIDTH - VW;
    state.targetScrollX = Math.max(0, Math.min(maxScroll, state.targetScrollX));
    const prev = state.scrollX;
    state.scrollX += (state.targetScrollX - state.scrollX) * 0.12;
    const moving = Math.abs(state.scrollX - prev) > 0.05;
    if (moving) {
      state.facing = (state.targetScrollX > prev) ? 1 : -1;
      state.walkTimer += dt;
      if (state.walkTimer > 160) { state.walkFrame++; state.walkTimer = 0; }
    }
    state.cloudOffset += dt * 0.01;
  }

  // Determine what char stage to show based on visited stations
  // (initial is 'angel' — progresses only after dialogues close via nextStage)

  // Check station proximity (trigger dialogue)
  if (!state.dialogue) {
    const charWorldX = state.scrollX + state.charX;
    for (const st of STATIONS) {
      if (st._consumed) continue;
      if (Math.abs(charWorldX - st.x) < 26) {
        openDialogue(st);
        break;
      }
    }
  }

  // Progress text reveal
  if (state.dialogue) {
    state.dialogue.shown += dt * 0.06;
    const visible = Math.min(state.dialogue.full.length, Math.floor(state.dialogue.shown));
    dlgText.textContent = state.dialogue.full.slice(0, visible);
    if (visible >= state.dialogue.full.length) state.dialogueDone = true;
  }

  // Update progress bar
  const pct = Math.min(100, Math.max(0, (state.scrollX / (WORLD_WIDTH - VW)) * 100));
  document.getElementById('progress-bar').style.width = pct + '%';

  render();
  requestAnimationFrame(tick);
}

function render() {
  // clear whole logical viewport
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0b1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  resize._noop; // keep transform

  // Re-apply transform (resize already set it)
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.min(canvas.width / VW, canvas.height / VH);
  ctx.setTransform(scale, 0, 0, scale, (canvas.width - VW * scale) / 2, (canvas.height - VH * scale) / 2);
  ctx.imageSmoothingEnabled = false;

  drawSky();
  drawClouds();
  drawGround();
  drawTrees();
  for (const st of STATIONS) drawStation(st);
  drawCharacter();

  // end flag at world end
  const endSx = worldToScreen(WORLD_WIDTH - 30);
  if (endSx < VW + 20) {
    ctx.fillStyle = '#000';
    ctx.fillRect(endSx, GROUND_Y - 40, 2, 30);
    ctx.fillStyle = '#ffd84d';
    ctx.fillRect(endSx + 2, GROUND_Y - 40, 12, 8);
    ctx.fillStyle = '#000';
    ctx.font = '5px "Press Start 2P", monospace';
    ctx.fillText('2026', endSx + 3, GROUND_Y - 34);
  }
}

// ===== Start =====
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('intro').classList.add('hidden');
  state.started = true;
});

requestAnimationFrame((t) => { lastTime = t; tick(t); });
