// ============================================================
// RENDERER — 16-bit parallax backgrounds + buildings
// ============================================================

// --- Sky gradient (16-bit rich) ---
function drawSky(ctx) {
  const stops = [
    [0, '#080840'], [0.25, '#1838a0'], [0.5, '#3070d8'],
    [0.7, '#60a8f0'], [0.85, '#90d0ff'], [1, '#c0e8ff']
  ];
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, GROUND_Y);
}

// --- Stars (far background) ---
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * WORLD_WIDTH * 0.3,
  y: Math.random() * 80,
  s: Math.random() * 1.5 + 0.5,
  b: Math.random()
}));

function drawStars(ctx, camX, time) {
  stars.forEach(st => {
    const sx = ((st.x - camX * 0.02) % VW + VW) % VW;
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(time * 0.002 + st.b * 6));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.floor(sx), Math.floor(st.y), Math.ceil(st.s), Math.ceil(st.s));
  });
  ctx.globalAlpha = 1;
}

// --- Clouds (slow parallax) ---
const clouds = Array.from({ length: 12 }, () => ({
  x: Math.random() * WORLD_WIDTH * 0.6,
  y: 20 + Math.random() * 60,
  w: 30 + Math.random() * 50,
  h: 12 + Math.random() * 10
}));

function drawClouds(ctx, camX, time) {
  clouds.forEach(c => {
    const cx = c.x - camX * 0.08 + Math.sin(time * 0.0003 + c.x) * 5;
    const sx = ((cx % (VW + 100)) + VW + 100) % (VW + 100) - 50;
    // Cloud body with 16-bit shading
    const g = ctx.createRadialGradient(sx + c.w / 2, c.y + c.h / 2, 2, sx + c.w / 2, c.y + c.h / 2, c.w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.6, 'rgba(230,240,255,0.7)');
    g.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Smaller puffs
    ctx.beginPath();
    ctx.ellipse(sx + c.w * 0.3, c.y + c.h * 0.4, c.w * 0.3, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + c.w * 0.7, c.y + c.h * 0.45, c.w * 0.25, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

// --- Distant mountains (mid parallax) ---
function drawMountains(ctx, camX) {
  // Far mountains
  ctx.fillStyle = '#284080';
  drawMountainLayer(ctx, camX * 0.12, 8, 0.4, GROUND_Y);
  // Mid mountains
  ctx.fillStyle = '#306838';
  drawMountainLayer(ctx, camX * 0.2, 6, 0.55, GROUND_Y);
  // Near hills
  ctx.fillStyle = '#408040';
  drawMountainLayer(ctx, camX * 0.3, 5, 0.65, GROUND_Y);
}

function drawMountainLayer(ctx, offset, count, heightFactor, gy) {
  const segW = VW / count;
  ctx.beginPath();
  ctx.moveTo(0, gy);
  for (let i = -1; i <= count + 1; i++) {
    const bx = i * segW - (offset % segW);
    const peakH = 30 + Math.abs(Math.sin(i * 2.3 + offset * 0.001)) * 50 * heightFactor;
    ctx.lineTo(bx + segW * 0.5, gy - peakH);
    ctx.lineTo(bx + segW, gy);
  }
  ctx.lineTo(VW, gy);
  ctx.closePath();
  ctx.fill();
}

// --- Trees (near parallax) ---
function drawTrees(ctx, camX) {
  const treeSpacing = 60;
  const parallax = 0.5;
  const startX = -((camX * parallax) % treeSpacing) - treeSpacing;
  for (let tx = startX; tx < VW + treeSpacing; tx += treeSpacing) {
    const seed = Math.floor((tx + camX * parallax) / treeSpacing);
    const vary = Math.sin(seed * 7.7) * 10;
    const h = 18 + Math.abs(Math.sin(seed * 3.3)) * 14;
    const bx = tx + vary;
    const by = GROUND_Y;
    // Trunk
    ctx.fillStyle = '#604020';
    ctx.fillRect(bx + 4, by - h * 0.4, 3, h * 0.4);
    ctx.fillStyle = '#503018';
    ctx.fillRect(bx + 5, by - h * 0.4, 1, h * 0.4);
    // Canopy - layered circles for 16-bit feel
    const colors = ['#207030', '#28882c', '#30a038', '#48b848'];
    for (let li = 0; li < 3; li++) {
      ctx.fillStyle = colors[li];
      const r = (h * 0.35) - li * 2;
      ctx.beginPath();
      ctx.ellipse(bx + 5, by - h * 0.4 - h * 0.2 + li * 2, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Highlight
    ctx.fillStyle = colors[3];
    ctx.beginPath();
    ctx.ellipse(bx + 3, by - h * 0.65, h * 0.15, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Ground (16-bit grass with pattern) ---
function drawGround(ctx, camX) {
  // Base ground
  const gg = ctx.createLinearGradient(0, GROUND_Y, 0, VH);
  gg.addColorStop(0, '#48a848');
  gg.addColorStop(0.15, '#388838');
  gg.addColorStop(0.5, '#5c3820');
  gg.addColorStop(1, '#3c2810');
  ctx.fillStyle = gg;
  ctx.fillRect(0, GROUND_Y, VW, VH - GROUND_Y);

  // Grass blades
  ctx.fillStyle = '#58c858';
  const offset = camX % 8;
  for (let gx = -offset; gx < VW; gx += 8) {
    ctx.fillRect(gx, GROUND_Y, 2, 1);
    ctx.fillRect(gx + 4, GROUND_Y - 1, 1, 2);
  }
  // Dirt line
  ctx.fillStyle = '#68502c';
  ctx.fillRect(0, GROUND_Y + 8, VW, 1);

  // Path/road
  ctx.fillStyle = '#c8b888';
  ctx.fillRect(0, GROUND_Y + 2, VW, 5);
  ctx.fillStyle = '#b0a070';
  ctx.fillRect(0, GROUND_Y + 5, VW, 2);
}

// --- Buildings ---
function drawBuilding(ctx, type, wx, camX) {
  const sx = wx - camX;
  if (sx < -120 || sx > VW + 40) return;

  switch (type) {
    case 'cloud': drawCloudPlatform(ctx, sx); break;
    case 'hospital': drawHospital(ctx, sx); break;
    case 'school': drawSchool(ctx, sx, '#4070c0', '#3060a0', 'ร.ร. ประถม'); break;
    case 'highschool': drawSchool(ctx, sx, '#c04040', '#a03030', 'ร.ร. มัธยม'); break;
    case 'university': drawUniversity(ctx, sx); break;
    case 'office1': drawOffice(ctx, sx, '#5070a0', '#405880', 'บริษัท A'); break;
    case 'office2': drawOffice(ctx, sx, '#708050', '#586840', 'บริษัท B'); break;
    case 'office3': drawOffice(ctx, sx, '#906040', '#704830', 'ปัจจุบัน'); break;
  }
}

function drawCloudPlatform(ctx, sx) {
  const y = GROUND_Y - 30;
  // Large cloud
  ctx.fillStyle = '#e8f0ff';
  ctx.beginPath();
  ctx.ellipse(sx + 30, y + 10, 35, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(sx + 25, y + 5, 25, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx + 40, y + 8, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Golden gate
  ctx.fillStyle = '#ffd84d';
  ctx.fillRect(sx + 20, y - 20, 3, 25);
  ctx.fillRect(sx + 37, y - 20, 3, 25);
  ctx.fillRect(sx + 20, y - 22, 20, 4);
  ctx.fillStyle = '#e8b830';
  ctx.fillRect(sx + 22, y - 20, 16, 2);
}

function drawHospital(ctx, sx) {
  const y = GROUND_Y;
  const w = 60, h = 55;
  // Main body
  drawShadedRect(ctx, sx, y - h, w, h, '#e8e8e8', '#d0d0d0', '#b8b8b8');
  // Red cross
  ctx.fillStyle = '#e03030';
  ctx.fillRect(sx + 24, y - h + 6, 12, 4);
  ctx.fillRect(sx + 28, y - h + 2, 4, 12);
  // Windows
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      drawWindow(ctx, sx + 8 + c * 18, y - h + 18 + r * 12);
    }
  }
  // Door
  ctx.fillStyle = '#80c0e0';
  ctx.fillRect(sx + 23, y - 12, 14, 12);
  ctx.fillStyle = '#60a0c0';
  ctx.fillRect(sx + 29, y - 12, 2, 12);
  // Sign
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx + 5, y - h - 6, 50, 6);
  ctx.fillStyle = '#e03030';
  ctx.font = '4px monospace';
  ctx.fillText('HOSPITAL', sx + 10, y - h - 1);
}

function drawSchool(ctx, sx, c1, c2, label) {
  const y = GROUND_Y;
  const w = 70, h = 45;
  drawShadedRect(ctx, sx, y - h, w, h, c1, c2, '#202840');
  // Roof
  ctx.fillStyle = '#d04040';
  ctx.beginPath();
  ctx.moveTo(sx - 3, y - h);
  ctx.lineTo(sx + w / 2, y - h - 15);
  ctx.lineTo(sx + w + 3, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a03030';
  ctx.beginPath();
  ctx.moveTo(sx + w / 2, y - h - 15);
  ctx.lineTo(sx + w + 3, y - h);
  ctx.lineTo(sx + w / 2, y - h);
  ctx.closePath();
  ctx.fill();
  // Windows
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      drawWindow(ctx, sx + 6 + c * 16, y - h + 8 + r * 14);
    }
  }
  // Door
  ctx.fillStyle = '#805030';
  ctx.fillRect(sx + 28, y - 14, 14, 14);
  ctx.fillStyle = '#604020';
  ctx.fillRect(sx + 34, y - 14, 2, 14);
  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '4px monospace';
  ctx.fillText(label, sx + 10, y - h - 16);
}

function drawUniversity(ctx, sx) {
  const y = GROUND_Y;
  const w = 80, h = 60;
  // Main building
  drawShadedRect(ctx, sx + 10, y - h, w - 20, h, '#e0d8c0', '#c8c0a0', '#a89880');
  // Columns
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#f0e8d0';
    ctx.fillRect(sx + 16 + i * 15, y - h + 10, 4, h - 14);
    ctx.fillStyle = '#d0c8a8';
    ctx.fillRect(sx + 18 + i * 15, y - h + 10, 2, h - 14);
  }
  // Pediment (triangle)
  ctx.fillStyle = '#d0c8a8';
  ctx.beginPath();
  ctx.moveTo(sx + 5, y - h);
  ctx.lineTo(sx + w / 2, y - h - 18);
  ctx.lineTo(sx + w - 5, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c0b898';
  ctx.beginPath();
  ctx.moveTo(sx + w / 2, y - h - 18);
  ctx.lineTo(sx + w - 5, y - h);
  ctx.lineTo(sx + w / 2, y - h);
  ctx.closePath();
  ctx.fill();
  // Windows
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      drawWindow(ctx, sx + 20 + c * 15, y - h + 14 + r * 13);
    }
  }
  // Door
  ctx.fillStyle = '#805030';
  ctx.fillRect(sx + 33, y - 15, 16, 15);
  ctx.fillStyle = '#604020';
  ctx.fillRect(sx + 40, y - 15, 2, 15);
  // Label
  ctx.fillStyle = '#ffd84d';
  ctx.font = '4px monospace';
  ctx.fillText('UNIVERSITY', sx + 18, y - h - 20);
}

function drawOffice(ctx, sx, c1, c2, label) {
  const y = GROUND_Y;
  const w = 50, h = 65;
  drawShadedRect(ctx, sx, y - h, w, h, c1, c2, '#181828');
  // Windows (glass)
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const wy = y - h + 5 + r * 12;
      const wx = sx + 5 + c * 15;
      ctx.fillStyle = '#88c8e8';
      ctx.fillRect(wx, wy, 10, 7);
      ctx.fillStyle = '#a0e0ff';
      ctx.fillRect(wx, wy, 10, 2);
      ctx.fillStyle = '#60a0c0';
      ctx.fillRect(wx + 4, wy, 1, 7);
    }
  }
  // Door
  ctx.fillStyle = '#406080';
  ctx.fillRect(sx + 18, y - 13, 14, 13);
  ctx.fillStyle = '#80c0e0';
  ctx.fillRect(sx + 24, y - 13, 2, 13);
  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = '4px monospace';
  ctx.fillText(label, sx + 5, y - h - 4);
}

// --- Helpers ---
function drawShadedRect(ctx, x, y, w, h, cLight, cMid, cDark) {
  // Main
  ctx.fillStyle = cMid;
  ctx.fillRect(x, y, w, h);
  // Left highlight
  ctx.fillStyle = cLight;
  ctx.fillRect(x, y, 3, h);
  // Top highlight
  ctx.fillRect(x, y, w, 2);
  // Right shadow
  ctx.fillStyle = cDark;
  ctx.fillRect(x + w - 2, y, 2, h);
  // Bottom shadow
  ctx.fillRect(x, y + h - 2, w, 2);
}

function drawWindow(ctx, x, y) {
  ctx.fillStyle = '#80d0f0';
  ctx.fillRect(x, y, 8, 6);
  ctx.fillStyle = '#a0e8ff';
  ctx.fillRect(x, y, 8, 2);
  ctx.fillStyle = '#406080';
  ctx.fillRect(x + 3, y, 1, 6);
  ctx.fillRect(x, y + 2, 8, 1);
}

// --- Draw a pixel-art sprite ---
function drawSprite(ctx, spriteName, x, y, frame, flip) {
  const sp = PALETTES[spriteName];
  if (!sp) return;
  const f = sp.frames[frame % sp.frames.length];
  const pixelSize = 2;
  for (let row = 0; row < f.length; row++) {
    const line = f[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      const color = sp.palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const px = flip ? x + (line.length - 1 - col) * pixelSize : x + col * pixelSize;
      ctx.fillRect(px, y + row * pixelSize, pixelSize, pixelSize);
    }
  }
}

// --- Station label sign ---
function drawStationSign(ctx, sx, label) {
  const y = GROUND_Y - 80;
  // Post
  ctx.fillStyle = '#604020';
  ctx.fillRect(sx + 28, y + 10, 3, 70);
  // Sign board
  const tw = label.length * 5 + 12;
  const signX = sx + 30 - tw / 2;
  ctx.fillStyle = '#f8e8b0';
  ctx.fillRect(signX, y, tw, 12);
  ctx.fillStyle = '#c8a860';
  ctx.fillRect(signX, y + 10, tw, 2);
  ctx.fillRect(signX, y, tw, 1);
  ctx.fillRect(signX, y, 1, 12);
  ctx.fillRect(signX + tw - 1, y, 1, 12);
  // Text
  ctx.fillStyle = '#402010';
  ctx.font = '5px monospace';
  ctx.fillText(label, signX + 6, y + 8);
}

// --- Particles (sparkle/leaf) ---
const particles = [];
function spawnParticles(wx, wy, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: wx + Math.random() * 30 - 15,
      y: wy + Math.random() * 10,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.3,
      life: 60 + Math.random() * 40,
      maxLife: 100,
      color: color,
      size: 1 + Math.random()
    });
  }
}

function updateAndDrawParticles(ctx, camX, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.01;
    p.life -= 1;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    const sx = p.x - camX;
    if (sx > -5 && sx < VW + 5) {
      ctx.fillRect(sx, p.y, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}
