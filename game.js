// ============================================================
// GAME ENGINE — 16-Bit Life Quest Portfolio
// ============================================================
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const dialogueEl = document.getElementById('dialogue');
  const dialogueNameEl = document.getElementById('dialogue-name');
  const dialogueTextEl = document.getElementById('dialogue-text');
  const progressBar = document.getElementById('progress-bar');
  const introEl = document.getElementById('intro');
  const startBtn = document.getElementById('start-btn');

  let started = false;
  let camX = 0;
  let charWorldX = 100;
  let targetWorldX = 100;
  let currentSprite = 'angel';
  let walkFrame = 0;
  let walkTimer = 0;
  let lastTime = 0;
  let dialogueShown = {};
  let currentDialogue = null;
  let typewriterText = '';
  let typewriterIdx = 0;
  let typewriterTimer = 0;
  let isTyping = false;
  let facing = 1; // 1 = right
  let touchStartX = 0;
  let touchAccum = 0;

  // --- Input state ---
  const keys = {};
  let scrollAccum = 0;

  // --- START ---
  startBtn.addEventListener('click', () => {
    started = true;
    introEl.classList.add('hidden');
  });

  // --- Keyboard ---
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!started && (e.key === 'Enter' || e.key === ' ')) {
      started = true;
      introEl.classList.add('hidden');
    }
    if (currentDialogue && (e.key === 'Enter' || e.key === ' ')) {
      if (isTyping) {
        typewriterIdx = typewriterText.length;
      } else {
        closeDialogue();
      }
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // --- Scroll ---
  window.addEventListener('wheel', e => {
    e.preventDefault();
    if (!started) { started = true; introEl.classList.add('hidden'); }
    scrollAccum += Math.abs(e.deltaY) * 0.15;
  }, { passive: false });

  // --- Touch (swipe) ---
  window.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    if (!started) { started = true; introEl.classList.add('hidden'); }
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - touchStartX;
    touchStartX = e.touches[0].clientX;
    if (Math.abs(dx) > 1) {
      touchAccum += Math.abs(dx) * 0.3;
    }
  }, { passive: true });

  canvas.addEventListener('click', () => {
    if (currentDialogue) {
      if (isTyping) {
        typewriterIdx = typewriterText.length;
      } else {
        closeDialogue();
      }
    }
  });

  // --- Resize (scale virtual canvas to fill window) ---
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  resize();

  function applyTransform() {
    const scale = Math.min(canvas.width / VW, canvas.height / VH);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - VW * scale) / 2, (canvas.height - VH * scale) / 2);
    ctx.imageSmoothingEnabled = false;
  }

  // --- Determine sprite based on position ---
  function getSpriteForPosition(wx) {
    let sp = 'angel';
    for (const st of STATIONS) {
      if (wx >= st.x - 20) sp = st.sprite;
    }
    return sp;
  }

  // --- Dialogue ---
  function showDialogue(station) {
    if (dialogueShown[station.id]) return;
    dialogueShown[station.id] = true;
    currentDialogue = station;
    typewriterText = station.dialogue.text;
    typewriterIdx = 0;
    typewriterTimer = 0;
    isTyping = true;
    dialogueNameEl.textContent = station.dialogue.name;
    dialogueTextEl.textContent = '';
    dialogueEl.classList.remove('hidden');
    // Sparkle particles
    spawnParticles(station.x + 30, GROUND_Y - 30, 15, '#ffd84d');
  }

  function closeDialogue() {
    currentDialogue = null;
    isTyping = false;
    dialogueEl.classList.add('hidden');
  }

  // --- Check station triggers ---
  function checkStations() {
    for (const st of STATIONS) {
      if (!dialogueShown[st.id] && Math.abs(charWorldX - st.x - 30) < 40) {
        showDialogue(st);
        break;
      }
    }
  }

  // --- Main loop ---
  function update(time) {
    const dt = Math.min(time - lastTime, 50);
    lastTime = time;

    if (started && !currentDialogue) {
      // Movement from input
      let moveAmount = 0;

      // Keyboard
      if (keys['ArrowRight'] || keys['d']) moveAmount += SCROLL_SPEED * dt * 0.12;
      if (keys['ArrowLeft'] || keys['a']) moveAmount -= SCROLL_SPEED * dt * 0.12;

      // Scroll wheel
      if (scrollAccum > 0) {
        const consume = Math.min(scrollAccum, SCROLL_SPEED * dt * 0.2);
        moveAmount += consume;
        scrollAccum -= consume;
        if (scrollAccum < 0.1) scrollAccum = 0;
      }

      // Touch
      if (touchAccum > 0) {
        const consume = Math.min(touchAccum, SCROLL_SPEED * dt * 0.2);
        moveAmount += consume;
        touchAccum -= consume;
        if (touchAccum < 0.1) touchAccum = 0;
      }

      targetWorldX += moveAmount;
      targetWorldX = Math.max(50, Math.min(WORLD_WIDTH - 100, targetWorldX));

      // Smooth follow
      const diff = targetWorldX - charWorldX;
      charWorldX += diff * 0.08;

      if (diff > 0.5) facing = 1;
      else if (diff < -0.5) facing = -1;

      // Walk animation
      if (Math.abs(diff) > 0.5) {
        walkTimer += dt;
        if (walkTimer > 180) {
          walkTimer = 0;
          walkFrame = (walkFrame + 1) % 2;
        }
      } else {
        walkFrame = 0;
      }

      // Update sprite
      currentSprite = getSpriteForPosition(charWorldX);

      // Check station triggers
      checkStations();
    }

    // Typewriter effect
    if (isTyping) {
      typewriterTimer += dt;
      if (typewriterTimer > 30) {
        typewriterTimer = 0;
        typewriterIdx++;
        if (typewriterIdx >= typewriterText.length) {
          isTyping = false;
        }
      }
      dialogueTextEl.textContent = typewriterText.substring(0, typewriterIdx);
    }

    // Camera follow
    const targetCam = charWorldX - VW * 0.35;
    camX += (targetCam - camX) * 0.06;
    camX = Math.max(0, Math.min(WORLD_WIDTH - VW, camX));

    // Progress bar
    const progress = charWorldX / (WORLD_WIDTH - 200);
    progressBar.style.width = Math.min(100, progress * 100) + '%';

    // ---- RENDER ----
    // Clear with black bars
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0b1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    applyTransform();

    // Sky
    drawSky(ctx);

    // Stars (visible in dark upper sky)
    drawStars(ctx, camX, time);

    // Clouds
    drawClouds(ctx, camX, time);

    // Mountains (parallax)
    drawMountains(ctx, camX);

    // Trees (near parallax)
    drawTrees(ctx, camX);

    // Ground
    drawGround(ctx, camX);

    // Buildings & station signs
    for (const st of STATIONS) {
      drawBuilding(ctx, st.building, st.x, camX);
      drawStationSign(ctx, st.x - camX, st.label);
    }

    // Particles
    updateAndDrawParticles(ctx, camX, dt);

    // Character
    const charScreenX = charWorldX - camX;
    const sp = PALETTES[currentSprite];
    let charY = GROUND_Y - (sp ? sp.frames[0].length * 2 : 30) + 1;
    // Baby sits on ground differently
    if (currentSprite === 'baby') charY += 12;

    drawSprite(ctx, currentSprite, charScreenX - 12, charY, walkFrame, facing < 0);

    // Shadow under character
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(charScreenX + 4, GROUND_Y + 2, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Ambient sparkles around angel
    if (currentSprite === 'angel' && Math.random() < 0.08) {
      spawnParticles(charWorldX + Math.random() * 20 - 10, charY + Math.random() * 20, 1, '#ffd84d');
    }

    // End flag
    const endSx = (WORLD_WIDTH - 50) - camX;
    if (endSx > -20 && endSx < VW + 20) {
      ctx.fillStyle = '#604020';
      ctx.fillRect(endSx, GROUND_Y - 40, 2, 40);
      ctx.fillStyle = '#ffd84d';
      ctx.fillRect(endSx + 2, GROUND_Y - 40, 14, 9);
      ctx.fillStyle = '#000';
      ctx.font = '5px monospace';
      ctx.fillText('END', endSx + 4, GROUND_Y - 33);
    }

    requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
})();
