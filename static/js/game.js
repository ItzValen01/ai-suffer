"use strict";
console.log("AI Suffer — build v33 (projectile fixes + enemy magnetic rounds)");

/* =========================================================
   AUDIO — sintetizado con Web Audio API (sin archivos .mp3)
   ========================================================= */
const Sound = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  function tone(freq, dur, { type = "square", vol = 1, freqEnd = null, delay = 0 } = {}) {
    if (!enabled) return;
    ensureCtx();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  const fileCache = {};
  function playFile(src, volume = 0.65) {
    if (!enabled) return;
    try {
      const a = fileCache[src] || (fileCache[src] = new Audio(src));
      a.pause();
      a.currentTime = 0;
      a.volume = volume;
      void a.play();
    } catch {}
  }

  function noiseBurst(dur, vol = 0.5, delay = 0) {
    if (!enabled) return;
    ensureCtx();
    const t0 = ctx.currentTime + delay;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(gain).connect(master);
    src.start(t0);
  }

  return {
    setEnabled(v) { enabled = v; },
    unlock() { ensureCtx(); },
    shoot() { tone(720, 0.07, { type: "square", vol: 0.5, freqEnd: 340 }); },
    jump() { tone(260, 0.12, { type: "square", vol: 0.4, freqEnd: 520 }); },
    dash() { tone(180, 0.09, { type: "sawtooth", vol: 0.28, freqEnd: 720 }); noiseBurst(0.06, 0.12); },
    crit() { tone(980, 0.07, { type: "triangle", vol: 0.3, freqEnd: 1450 }); },
    event() { tone(420, 0.12, { type: "sine", vol: 0.2, freqEnd: 760 }); tone(760, 0.18, { type: "triangle", vol: 0.16, delay: 0.12, freqEnd: 980 }); },
    playerHurt() { tone(180, 0.18, { type: "sawtooth", vol: 0.5, freqEnd: 60 }); noiseBurst(0.1, 0.2); },
    bossHit() { tone(500, 0.06, { type: "triangle", vol: 0.4, freqEnd: 260 }); },
    minionDown() { tone(340, 0.12, { type: "square", vol: 0.35, freqEnd: 90 }); },
    enemyShoot() { tone(220, 0.08, { type: "sawtooth", vol: 0.25, freqEnd: 140 }); },
    bossIntro() {
      tone(92, 0.24, { type: "sawtooth", vol: 0.22, freqEnd: 54 });
      tone(184, 0.16, { type: "triangle", vol: 0.16, delay: 0.18, freqEnd: 92 });
      [220, 277, 330].forEach((f, i) => tone(f, 0.22, { type: "sine", vol: 0.14, delay: 0.72 + i * 0.12, freqEnd: f * 0.7 }));
      tone(55, 0.55, { type: "sawtooth", vol: 0.28, delay: 1.12, freqEnd: 32 });
      noiseBurst(0.32, 0.22, 1.14);
      tone(880, 0.12, { type: "square", vol: 0.16, delay: 2.0, freqEnd: 440 });
    },
    bossDefeat() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, { type: "square", vol: 0.4, delay: i * 0.11 }));
      noiseBurst(0.4, 0.3, 0.05);
    },
    floorEnter() { tone(140, 0.5, { type: "sine", vol: 0.3, freqEnd: 420 }); },
    gameOver() {
      [400, 340, 260, 160].forEach((f, i) => tone(f, 0.25, { type: "sawtooth", vol: 0.4, delay: i * 0.15 }));
    },
    victory() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, { type: "square", vol: 0.4, delay: i * 0.14 }));
    },
    uiClick() { tone(600, 0.05, { type: "square", vol: 0.25, freqEnd: 900 }); },
    hit() { tone(880, 0.035, { type: "square", vol: 0.18, freqEnd: 620 }); },
    combo() { tone(520, 0.07, { type: "triangle", vol: 0.18, freqEnd: 900 }); },
    weapon() { tone(300, 0.08, { type: "square", vol: 0.18, freqEnd: 600 }); },
    secret() { [660, 880, 1320].forEach((f,i)=>tone(f,0.16,{type:"triangle",vol:0.16,delay:i*.1})); },
    achievement() { [660, 880, 1320, 1760].forEach((f,i)=>tone(f,0.13,{type:"triangle",vol:0.16,delay:i*.09})); },
    heartbeat() { tone(75, 0.16, { type: "sine", vol: 0.4, freqEnd: 40 }); },
    petByte() { tone(520, 0.06, { type: "square", vol: 0.13, freqEnd: 780 }); tone(780, 0.08, { type: "triangle", vol: 0.09, delay: 0.07, freqEnd: 980 }); },
    petEcho() { tone(330, 0.12, { type: "sine", vol: 0.10, freqEnd: 660 }); tone(660, 0.16, { type: "sine", vol: 0.07, delay: 0.08, freqEnd: 330 }); },
    petGlitch() { tone(150, 0.045, { type: "sawtooth", vol: 0.12, freqEnd: 900 }); tone(70, 0.07, { type: "square", vol: 0.08, delay: 0.05, freqEnd: 240 }); },
    petSentinel() { tone(190, 0.12, { type: "triangle", vol: 0.11, freqEnd: 110 }); tone(380, 0.08, { type: "sine", vol: 0.07, delay: 0.08, freqEnd: 520 }); },
    petMimic() { tone(270, 0.07, { type: "square", vol: 0.11, freqEnd: 540 }); tone(540, 0.05, { type: "square", vol: 0.08, delay: 0.08, freqEnd: 270 }); },
    petCore() { tone(110, 0.18, { type: "sine", vol: 0.10, freqEnd: 220 }); tone(440, 0.16, { type: "triangle", vol: 0.08, delay: 0.08, freqEnd: 880 }); },
    petCat() { tone(420,.08,{type:"sine",vol:.08,freqEnd:620}); tone(620,.09,{type:"sine",vol:.06,delay:.08,freqEnd:520}); },
    petFox() { tone(520,.07,{type:"triangle",vol:.08,freqEnd:860}); tone(340,.06,{type:"square",vol:.05,delay:.08,freqEnd:520}); },
    petWolf() { tone(150,.18,{type:"sawtooth",vol:.10,freqEnd:360}); tone(300,.16,{type:"triangle",vol:.07,delay:.12,freqEnd:190}); },
    petOwl() { tone(720,.12,{type:"sine",vol:.07,freqEnd:520}); tone(1040,.13,{type:"sine",vol:.06,delay:.12,freqEnd:760}); },
    petShark() { tone(95,.18,{type:"sawtooth",vol:.10,freqEnd:55}); noiseBurst(.08,.06); },
    petDragon() { tone(75,.30,{type:"sawtooth",vol:.14,freqEnd:42}); tone(180,.18,{type:"triangle",vol:.08,delay:.12,freqEnd:90}); noiseBurst(.14,.10,.08); },
    petPhoenix() { [660,880,1175].forEach((f,i)=>tone(f,.16,{type:"sine",vol:.08,delay:i*.08,freqEnd:f*1.25})); },
    petVoid() { tone(48,.35,{type:"sine",vol:.11,freqEnd:28}); tone(96,.22,{type:"triangle",vol:.06,delay:.08,freqEnd:44}); },
    petAbilitySpecial() { tone(880,.08,{type:"triangle",vol:.13,freqEnd:1320}); tone(440,.12,{type:"sine",vol:.07,delay:.07,freqEnd:220}); noiseBurst(.05,.05,.02); },
    petAbility() { tone(620, 0.08, { type: "triangle", vol: 0.14, freqEnd: 1240 }); noiseBurst(0.04, 0.06, 0.03); },
    purchase() { playFile("/sounds/compras-mejora.mp3", 0.72); },
    finish() { playFile("/sounds/finish.mp3", 0.8); },
    simsimiAttack() {
      tone(135, 0.16, { type: "sawtooth", vol: 0.22, freqEnd: 48 });
      tone(910, 0.11, { type: "square", vol: 0.13, delay: 0.04, freqEnd: 220 });
      noiseBurst(0.12, 0.2, 0.08);
    },
  };
})();

/* =========================================================
   MUSICA — pistas de fondo generadas por procedimiento (loops de
   arpegios via osciladores), nada de archivos .mp3 que descargar.
   ========================================================= */
const Music = (() => {
  let ctx = null;
  let master = null;
  let enabled = true;
  let desired = null;
  let currentTrack = null;
  let stepTimer = null;
  let stepIndex = 0;
  let transitionTimer = null;
  let transitionId = 0;

  function ensureCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  // La musica usa una mezcla mucho mas suave: seno/triangulo en vez de
  // cuadrados agresivos, notas cortas con ataque/release y cambios con fade.
  function playNote(freq, dur, type, vol, when = null) {
    if (!freq) return;
    ensureCtx();

    const t0 = when ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), t0 + Math.min(0.045, dur * 0.18));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.04);
  }

  // Todas las pistas comparten centro tonal (A minor) y una estructura de
  // 16 pasos. Asi el cambio de escena no parece un cambio de cancion aleatorio.
  const TRACKS = {
    menu: {
      stepMs: 250,
      bass: [110, null, 110, null, 87.31, null, 87.31, null, 98, null, 98, null, 73.42, null, 87.31, null],
      lead: [null, 261.63, null, 293.66, 329.63, null, 293.66, null, null, 261.63, null, 246.94, 261.63, null, 220, null],
    },
    explore: {
      stepMs: 250,
      bass: [98, null, 98, null, 87.31, null, 87.31, null, 110, null, 110, null, 73.42, null, 87.31, null],
      lead: [329.63, null, 293.66, 261.63, null, 293.66, 329.63, null, 392, null, 349.23, 329.63, null, 293.66, 261.63, null],
    },
    battle: {
      stepMs: 187.5,
      bass: [82.41, 82.41, null, 82.41, 87.31, 87.31, null, 87.31, 73.42, 73.42, null, 73.42, 82.41, 82.41, null, 98],
      lead: [329.63, null, 349.23, 392, null, 349.23, 329.63, null, 293.66, null, 329.63, 349.23, null, 392, 349.23, null],
    },
    battleFast: {
      stepMs: 150,
      bass: [82.41, 82.41, null, 82.41, 87.31, 87.31, null, 87.31, 73.42, 73.42, null, 73.42, 82.41, 82.41, null, 98],
      lead: [329.63, 349.23, 392, 349.23, 329.63, 392, 440, 392, 293.66, 329.63, 349.23, 329.63, 329.63, 392, 440, 392],
    },
  };

  function scheduleStep() {
    if (!currentTrack) return;
    const track = TRACKS[currentTrack];
    if (!track) return;

    if (enabled) {
      const i = stepIndex % track.bass.length;
      const step = track.stepMs / 1000;

      // Bass redondo y discreto.
      playNote(track.bass[i], step * 0.72, "sine", 0.075);

      // Lead suave, con triangulo para evitar el sonido "chiptune" estridente.
      playNote(track.lead[i], step * 0.62, "triangle", 0.035);
    }

    stepIndex++;
    stepTimer = setTimeout(scheduleStep, track.stepMs);
  }

  function clearTimers() {
    if (stepTimer) clearTimeout(stepTimer);
    if (transitionTimer) clearTimeout(transitionTimer);
    stepTimer = null;
    transitionTimer = null;
  }

  function fadeMaster(target, duration, onDone) {
    ensureCtx();
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + duration);

    if (onDone) {
      const id = ++transitionId;
      transitionTimer = setTimeout(() => {
        if (id === transitionId) onDone();
      }, duration * 1000 + 30);
    }
  }

  function startTrack(name, fadeIn = true) {
    clearTimers();
    currentTrack = name;
    stepIndex = 0;

    if (!enabled) return;
    ensureCtx();

    if (fadeIn) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.9);
    } else {
      master.gain.setValueAtTime(0.15, ctx.currentTime);
    }

    scheduleStep();
  }

  function stop() {
    // API publica compatible con las llamadas existentes de pause/game over.
    clearTimers();
    currentTrack = null;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  }

  function play(name) {
    desired = name;
    if (!enabled) return;
    if (currentTrack === name) return;

    // Primer arranque.
    if (!currentTrack) {
      startTrack(name, true);
      return;
    }

    // No cortamos la pista anterior de golpe. Hacemos un crossfade corto.
    const requested = name;
    const id = ++transitionId;
    clearTimers();
    ensureCtx();

    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    transitionTimer = setTimeout(() => {
      if (id !== transitionId || desired !== requested) return;
      startTrack(requested, true);
    }, 570);
  }

  return {
    unlock() { ensureCtx(); },
    setEnabled(v) {
      enabled = v;
      if (!v) {
        stop();
        return;
      }
      if (desired && !currentTrack) startTrack(desired, true);
    },
    playMenu() { play("menu"); },
    playExplore() { play("explore"); },
    playBattle(fast) { play(fast ? "battleFast" : "battle"); },
    stop() { stop(); },
    stopAll() {
      desired = null;
      stop();
    },
  };
})();

// desbloquea audio (Sound + Music) en la primera interaccion del usuario,
// y arranca la musica de menu si todavia estamos en el menu
function unlockAudioOnFirstInteraction() {
  Sound.unlock();
  Music.unlock();
  if (G.state === "menu") Music.playMenu();
}
document.addEventListener("pointerdown", unlockAudioOnFirstInteraction, { once: true });
document.addEventListener("keydown", unlockAudioOnFirstInteraction, { once: true });

/* =========================================================
   UI — navegacion entre pantallas
   ========================================================= */
const screens = {};
document.querySelectorAll(".screen").forEach(s => (screens[s.id] = s));
const bossIntroOverlay = document.getElementById("boss-intro-overlay");
const bossIntroKicker = document.getElementById("boss-intro-kicker");
const bossIntroName = document.getElementById("boss-intro-name");
const bossIntroQuote = document.getElementById("boss-intro-quote");
const bossIntroMeta = document.getElementById("boss-intro-meta");

function showScreen(id) {
  // El aviso de vida crítica pertenece exclusivamente a la partida.
  // Al salir de la pantalla de juego, se limpia para que nunca quede
  // visible sobre el menú, victoria, derrota u otras pantallas.
  if (id !== "screen-game") {
    const vignette = document.getElementById("low-hp-vignette");
    if (vignette) vignette.classList.remove("active");
    const gameCanvas = document.getElementById("game-canvas");
    if (gameCanvas) gameCanvas.classList.remove("hp-critical");
    if (G && G.player) G.player.hpWarnT = 0;
  }
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[id].classList.add("active");
}

function bindClick(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", (e) => {
    Sound.unlock();
    Music.unlock();
    if (G.state === "menu") Music.playMenu();
    Sound.uiClick();
    fn(e);
  });
}

document.querySelectorAll(".back-btn").forEach(b =>
  b.addEventListener("click", () => { Sound.uiClick(); showScreen("screen-menu"); })
);

document.getElementById("sound-check").addEventListener("change", (e) => {
  Sound.setEnabled(e.target.checked);
  Music.setEnabled(e.target.checked);
});

bindClick("btn-howto", () => showScreen("screen-howto"));
bindClick("btn-scores", () => { loadScores(); showScreen("screen-scores"); });
bindClick("btn-pets", async () => {
  const name=document.getElementById("player-name").value.trim() || window._devName || "Anonimo";
  window._devName=name; await loadProfile(name); G.unlockedPets=[...(G.profile?.unlockedPets||[])]; G.selectedPet=G.profile?.selectedPet||""; syncPetUnlocks(); syncAchievements(); renderPets(); showScreen("screen-pets");
});
document.getElementById("btn-pets-back").onclick=()=>{Sound.uiClick();showScreen("screen-menu");};
bindClick("btn-achievements", async () => {
  const name=document.getElementById("player-name").value.trim() || window._devName || "Anonimo";
  window._devName=name; await loadProfile(name); G.unlockedAchievements=[...(G.profile?.unlockedAchievements||[])]; syncAchievements(); renderAchievements(); showScreen("screen-achievements");
});
document.getElementById("btn-achievements-back").onclick=()=>{Sound.uiClick();showScreen("screen-menu");};

/* =========================================================
   CUSTOMIZACIÓN — color persistente del personaje
   ========================================================= */
const DEFAULT_PLAYER_COLOR = "#39ff88";
function normalizeHexColor(value){
  const v=String(value||"").trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : DEFAULT_PLAYER_COLOR;
}
function setCharacterColor(color, persist=false){
  const c=normalizeHexColor(color);
  G.playerColor=c;
  const input=document.getElementById("player-color");
  const hex=document.getElementById("customize-hex");
  const avatar=document.getElementById("customize-avatar");
  if(input) input.value=c;
  if(hex) hex.textContent=c.toUpperCase();
  if(avatar) avatar.style.setProperty("--avatar-color",c);
  document.querySelectorAll(".color-swatch").forEach(b=>b.classList.toggle("selected",normalizeHexColor(b.dataset.color)===c));
  if(persist && G.profile) {
    G.profile.characterColor=c;
    saveProfile();
  }
}
function openCustomize(){
  const color=normalizeHexColor(G.profile?.characterColor || G.playerColor || DEFAULT_PLAYER_COLOR);
  setCharacterColor(color);
  document.getElementById("customize-status").textContent="Elegí un color y guardalo en tu perfil.";
  showScreen("screen-customize");
}
bindClick("btn-customize", openCustomize);
document.getElementById("btn-customize-back").onclick=()=>{Sound.uiClick();showScreen("screen-menu");};
document.getElementById("player-color").addEventListener("input",e=>setCharacterColor(e.target.value));
document.querySelectorAll(".color-swatch").forEach(b=>b.addEventListener("click",()=>{Sound.uiClick();setCharacterColor(b.dataset.color);}));
document.getElementById("btn-save-color").addEventListener("click",async()=>{
  Sound.uiClick();
  if(!G.profile){ await loadProfile(window._devName || document.getElementById("player-name").value.trim() || "Anonimo"); }
  setCharacterColor(document.getElementById("player-color").value);
  await saveProfile();
  document.getElementById("customize-status").textContent="✓ Color guardado.";
});

/* =========================================================
   TUTORIAL — bootcamp guiado, pensado para aprender jugando
   ========================================================= */
const tutorialPages = [
  {
    kicker:"01 // OBJECTIVE", title:"Tu objetivo: sobrevivir",
    html:`<div class="tutorial-page tutorial-hero">
      <div>
        <p class="tutorial-lead">AI Suffer es un roguelite de plataformas y disparos. Tu trabajo es simple: <strong>subir los 6 pisos</strong>, sobrevivir a cada horda y derrotar a la IA que controla cada piso.</p>
        <div class="tutorial-card"><span class="tutorial-big-number">01</span><h3>La partida, en una línea</h3><p><strong>Horda → jefe → ascensor → mejora → siguiente piso.</strong> Repetí el ciclo hasta llegar al piso 6.</p></div>
        <div class="tutorial-callout"><span>IMPORTANTE</span>No necesitás aprender todas las mecánicas ahora. Primero movete, saltá y dispará. El resto lo vas descubriendo mientras avanzás.</div>
      </div>
      <div class="tutorial-visual"><div class="tutorial-floor"></div><div class="tutorial-player"></div><div class="tutorial-enemy"></div><div class="tutorial-bullet"></div></div>
    </div>`
  },
  {
    kicker:"02 // MOVEMENT", title:"Movete, saltá y esquivá",
    html:`<div class="tutorial-page">
      <p class="tutorial-lead">La supervivencia depende más de <strong>posicionarte</strong> que de disparar rápido. Mantenete en movimiento y usá el salto para pasar por encima de amenazas.</p>
      <div class="tutorial-grid">
        <div class="tutorial-card"><h3>← A / D →</h3><p>Movete a izquierda y derecha. También funcionan las flechas <strong>← →</strong>.</p></div>
        <div class="tutorial-card"><h3>↑ ESPACIO</h3><p>Saltá con <strong>W</strong>, <strong>↑</strong> o <strong>ESPACIO</strong>. Si conseguís el upgrade de doble salto, podés saltar dos veces.</p></div>
      </div>
      <div class="tutorial-keyboard"><span class="tutorial-key">A</span><span class="tutorial-key">←</span><span class="tutorial-key-label">MOVER</span><span class="tutorial-key">D</span><span class="tutorial-key">→</span><span class="tutorial-key-label">MOVER</span><span class="tutorial-key big">SPACE</span><span class="tutorial-key">W</span><span class="tutorial-key">↑</span><span class="tutorial-key-label">SALTAR</span></div>
      <div class="tutorial-callout"><span>TIP DE SUPERVIVENCIA</span>No te quedes pegado a una esquina. Los enemigos y proyectiles están diseñados para castigar a quien deja de moverse.</div>
    </div>`
  },
  {
    kicker:"03 // COMBAT", title:"Apuntá y dispará",
    html:`<div class="tutorial-page tutorial-hero">
      <div>
        <p class="tutorial-lead">Tu ataque principal es el disparo. En PC, la forma más cómoda es <strong>mover el mouse para apuntar</strong> y hacer <strong>clic izquierdo</strong> para disparar.</p>
        <div class="tutorial-grid">
          <div class="tutorial-card"><h3>🖱 Mouse</h3><p><strong>Apuntá</strong> con el cursor. El personaje orienta sus disparos hacia donde estás mirando.</p></div>
          <div class="tutorial-card"><h3>CLICK IZQUIERDO</h3><p><strong>Dispará</strong> sin dejar de moverte. También podés usar <strong>J / Z</strong>.</p></div>
        </div>
        <div class="tutorial-mouse"><div class="tutorial-mouse-body"></div><span>APUNTAR + CLICK<br><strong style="color:var(--green)">DISPARAR</strong></span></div>
      </div>
      <div class="tutorial-visual"><div class="tutorial-floor"></div><div class="tutorial-player" style="left:18%"></div><div class="tutorial-enemy" style="right:16%"></div><div class="tutorial-bullet" style="animation-delay:.2s"></div><div class="tutorial-bullet" style="bottom:66px;animation-delay:.8s"></div></div>
    </div>`
  },
  {
    kicker:"04 // SURVIVAL", title:"Entendé tu HUD",
    html:`<div class="tutorial-page">
      <p class="tutorial-lead">Tu HUD te avisa qué tan cerca estás de morir y qué recursos tenés. Miralo de vez en cuando, especialmente antes de entrar a un jefe.</p>
      <div class="tutorial-bars">
        <div class="tutorial-stat"><span class="tutorial-stat-label">HP</span><div class="tutorial-stat-bar tutorial-hp"><span></span></div><span class="tutorial-stat-value">76%</span></div>
        <div class="tutorial-stat"><span class="tutorial-stat-label">ESCUDO</span><div class="tutorial-stat-bar tutorial-shield"><span></span></div><span class="tutorial-stat-value">48%</span></div>
      </div>
      <div class="tutorial-grid">
        <div class="tutorial-card"><h3>HP · tu vida</h3><p>Si llega a <strong>0</strong>, la partida termina. Cuando estés muy bajo de vida, la pantalla te avisará visualmente.</p></div>
        <div class="tutorial-card"><h3>ESCUDO · protección</h3><p>Si tenés escudo, absorbe daño <strong>antes que el HP</strong>. Algunas mejoras pueden darte uno.</p></div>
        <div class="tutorial-card"><h3>SCRAP · tu recurso</h3><p>Conseguís Scrap al derrotar enemigos. Sirve para <strong>repararte</strong> y cambiar opciones de mejoras.</p></div>
        <div class="tutorial-card warn"><h3>⚠ REGLA DE ORO</h3><p>Los proyectiles y hazards del escenario pueden dañarte aunque estés mirando al jefe. <strong>Mirá todo el campo.</strong></p></div>
      </div>
    </div>`
  },
  {
    kicker:"05 // BUILD", title:"Construí tu personaje",
    html:`<div class="tutorial-page">
      <p class="tutorial-lead">Después de derrotar un jefe llegás al ascensor y elegís <strong>1 de 3 mejoras</strong>. No existe una build perfecta: elegí según lo que te esté costando.</p>
      <div class="tutorial-upgrade"><div class="tutorial-upgrade-icon">⚡</div><div><h3>Compilador rápido</h3><p>Más cadencia de disparo. Ideal si sentís que te falta daño constante.</p></div><span class="tutorial-tag">OFENSIVA</span></div>
      <div class="tutorial-upgrade"><div class="tutorial-upgrade-icon">◇</div><div><h3>Escudo cinético</h3><p>Agrega una capa de protección que absorbe daño antes de tu vida.</p></div><span class="tutorial-tag">DEFENSA</span></div>
      <div class="tutorial-upgrade"><div class="tutorial-upgrade-icon">↠</div><div><h3>Phase Dash</h3><p>Desbloquea <strong>SHIFT</strong>: un dash rápido con un breve período de invulnerabilidad.</p></div><span class="tutorial-tag">MOVILIDAD</span></div>
      <div class="tutorial-callout"><span>SCRAP</span>¿Te faltó vida? Podés gastar <strong>60 Scrap</strong> para reparar +35 HP. ¿No te gustan las 3 opciones? Podés gastar <strong>75 Scrap</strong> para cambiarlas.</div>
    </div>`
  },
  {
    kicker:"06 // THE TOWER", title:"La Torre es un ciclo",
    html:`<div class="tutorial-page">
      <p class="tutorial-lead">Cada piso aumenta la presión. La clave es entrar al jefe con recursos, aprender su patrón y elegir una mejora que haga más fuerte tu próxima ronda.</p>
      <div class="tutorial-flow">
        <div class="tutorial-flow-step"><b>01</b><span>Entrás al piso</span></div>
        <div class="tutorial-flow-step"><b>02</b><span>Limpiás la horda</span></div>
        <div class="tutorial-flow-step"><b>03</b><span>Derrotás al jefe</span></div>
        <div class="tutorial-flow-step"><b>04</b><span>Mejorás y subís</span></div>
      </div>
      <div class="tutorial-grid">
        <div class="tutorial-card"><h3>JEFES</h3><p>Cada IA tiene ataques y patrones distintos. <strong>Observá primero</strong> y atacá cuando tengas una ventana segura.</p></div>
        <div class="tutorial-card"><h3>HAZARDS</h3><p>Cada piso puede tener una mecánica ambiental. Láseres, zonas peligrosas y otros obstáculos también forman parte del combate.</p></div>
        <div class="tutorial-card"><h3>PAUSA</h3><p>Presioná <strong>ESC</strong> para pausar. Desde ahí también podés volver a consultar este tutorial.</p></div>
        <div class="tutorial-card warn"><h3>¿LISTO?</h3><p>Tu primera prioridad es simple: <strong>movete + saltá + dispará</strong>. Después aprendé el resto sobre la marcha.</p></div>
      </div>
    </div>`
  }
];
let tutorialIndex = 0;
let tutorialReturnScreen = "screen-menu";
let tutorialReturnState = "menu";
function renderTutorial(index, direction = 1) {
  tutorialIndex = Math.max(0, Math.min(tutorialPages.length - 1, index));
  const page = tutorialPages[tutorialIndex];
  document.getElementById("tutorial-kicker").textContent = page.kicker;
  document.getElementById("tutorial-title").textContent = page.title;
  const content = document.getElementById("tutorial-content");
  content.innerHTML = page.html;
  // No uses animation-direction: reverse para volver atras: eso invierte
  // tambien la opacidad del keyframe y puede dejar la pagina invisible.
  // Usamos dos animaciones independientes para que ambas direcciones
  // terminen siempre visibles.
  const pageEl = content.firstElementChild;
  if (pageEl) {
    pageEl.classList.remove("tutorial-page-forward", "tutorial-page-backward");
    void pageEl.offsetWidth;
    pageEl.classList.add(direction >= 0 ? "tutorial-page-forward" : "tutorial-page-backward");
  }
  document.getElementById("tutorial-progress-text").textContent = `${String(tutorialIndex + 1).padStart(2,"0")} / ${String(tutorialPages.length).padStart(2,"0")}`;
  document.getElementById("tutorial-progress-fill").style.width = `${((tutorialIndex + 1) / tutorialPages.length) * 100}%`;
  document.querySelectorAll(".tutorial-step").forEach((b,i)=>b.classList.toggle("active",i===tutorialIndex));
  document.querySelectorAll(".tutorial-step").forEach((b,i)=>b.classList.toggle("done",i<tutorialIndex));
  document.getElementById("tutorial-back").disabled = tutorialIndex === 0;
  document.getElementById("tutorial-next").textContent = tutorialIndex === tutorialPages.length - 1 ? "¡entendido! ✓" : "siguiente →";
  document.getElementById("tutorial-dots").innerHTML = tutorialPages.map((_,i)=>`<span class="tutorial-dot${i===tutorialIndex?" active":""}"></span>`).join("");
}
function openTutorial(returnScreen = "screen-menu", returnState = "menu") {
  tutorialReturnScreen = returnScreen;
  tutorialReturnState = returnState;
  renderTutorial(0);
  G.state = "tutorial";
  showScreen("screen-howto");
}
function closeTutorial() {
  Sound.uiClick();
  G.state = tutorialReturnState;
  showScreen(tutorialReturnScreen);
  if (tutorialReturnState === "playing") musicForCurrentMode()();
}
renderTutorial(0);
document.getElementById("btn-howto").onclick = () => { Sound.unlock(); Music.unlock(); Sound.uiClick(); openTutorial(); };
document.querySelectorAll(".tutorial-step").forEach(btn => btn.addEventListener("click", () => { Sound.uiClick(); renderTutorial(Number(btn.dataset.step), Number(btn.dataset.step) >= tutorialIndex ? 1 : -1); }));
document.getElementById("tutorial-back").onclick = () => { if (tutorialIndex > 0) { Sound.uiClick(); renderTutorial(tutorialIndex - 1, -1); } };
document.getElementById("tutorial-next").onclick = () => { Sound.uiClick(); if (tutorialIndex < tutorialPages.length - 1) renderTutorial(tutorialIndex + 1, 1); else closeTutorial(); };
document.getElementById("tutorial-close").onclick = closeTutorial;
document.getElementById("btn-pause-tutorial").onclick = () => { Sound.uiClick(); openTutorial("screen-pause", "pause"); };
window.addEventListener("keydown", e => {
  if (G.state !== "tutorial") return;
  if (e.code === "Escape") { e.preventDefault(); closeTutorial(); }
  if (e.code === "ArrowRight" || e.code === "Enter") { e.preventDefault(); if (tutorialIndex < tutorialPages.length - 1) { Sound.uiClick(); renderTutorial(tutorialIndex + 1, 1); } }
  if (e.code === "ArrowLeft") { e.preventDefault(); if (tutorialIndex > 0) { Sound.uiClick(); renderTutorial(tutorialIndex - 1, -1); } }
});

async function loadProfile(name) {
  G.profileLoading = true;
  try { const res = await fetch(`/api/profile?name=${encodeURIComponent(name)}`); G.profile = res.ok ? await res.json() : null; } catch { G.profile = null; }
  G.profileLoading = false;
  if(G.profile){ G.profile.unlockedPets=Array.isArray(G.profile.unlockedPets)?G.profile.unlockedPets:[]; G.profile.unlockedAchievements=Array.isArray(G.profile.unlockedAchievements)?G.profile.unlockedAchievements:[]; G.profile.selectedPet=G.profile.selectedPet||""; G.profile.characterColor=normalizeHexColor(G.profile.characterColor); G.profile.bestAccuracy=Number(G.profile.bestAccuracy||0); G.profile.perfectBossWins=Number(G.profile.perfectBossWins||0); G.profile.hackerBossWins=Number(G.profile.hackerBossWins||0); G.profile.bossWins=Number(G.profile.bossWins||0); }
}
async function saveProfile(extra = {}) {
  const name = window._devName || "Anonimo";
  const old = G.profile || {};
  const isRun = !!extra.run;
  const acc = G.shots ? Math.round(G.hits / G.shots * 100) : 100;
  const projectedRuns = (old.runs||0) + (isRun ? 1 : 0);
  const projectedWins = (old.wins||0) + (extra.win ? 1 : 0);
  const projectedKills = (old.totalKills||0) + (isRun ? G.kills : 0);
  const projectedScrap = (old.totalScrap||0) + (isRun ? G.scrap : 0);
  const projectedBestAccuracy = Math.max(old.bestAccuracy||0, isRun ? acc : 0);
  const projectedFastest = extra.win ? G.fastestWin : (old.fastestWin||0);
  const projectedPerfectBossWins = (old.perfectBossWins||0) + (extra.perfectBoss ? 1 : 0);
  const projectedBossWins = (old.bossWins||0) + (extra.bossWin ? 1 : 0);
  const projectedHardBossWins = (old.hardBossWins||0) + (extra.hardBossWin ? 1 : 0);
  const projectedHackerWins = (old.hackerWins||0) + (extra.hackerWin ? 1 : 0);
  const projectedHackerBossWins = (old.hackerBossWins||0) + (extra.hackerBossWin ? 1 : 0);
  const projectedEnemyDodges = (old.enemyDodges||0) + (isRun ? G.enemyDodges : 0);
  const projectedBossDodges = (old.bossDodges||0) + (isRun ? G.bossDodges : 0);
  const projected = {
    runs:projectedRuns,wins:projectedWins,totalKills:projectedKills,totalScrap:projectedScrap,
    bestFloor:Math.max(old.bestFloor||0, Math.min(6, G.floorIndex+1)),bestCombo:Math.max(old.bestCombo||0,G.maxCombo),
    bestAccuracy:projectedBestAccuracy,fastestWin:projectedFastest,hardBossWins:projectedHardBossWins,
    hackerWins:projectedHackerWins,hackerBossWins:projectedHackerBossWins,perfectBossWins:projectedPerfectBossWins,
    bossWins:projectedBossWins,enemyDodges:projectedEnemyDodges,bossDodges:projectedBossDodges
  };
  const newlyUnlocked=[];
  const previous=new Set(old.unlockedAchievements||[]);
  for(const a of ACHIEVEMENTS){
    if(a.unlock(projected)&&!previous.has(a.id)){ newlyUnlocked.push(a); previous.add(a.id); }
  }
  const unlockProfile={...projected};
  const unlockedPets=[...(G.unlockedPets||[])];
  for(const pet of PETS) if(pet.unlockFn(unlockProfile)&&!unlockedPets.includes(pet.id)) unlockedPets.push(pet.id);
  G.unlockedPets=[...new Set(unlockedPets)];
  G.unlockedAchievements=[...previous];
  const payload={
    name,
    bestScore:Math.max(old.bestScore||0,G.score),bestFloor:projected.bestFloor,bestCombo:projected.bestCombo,mostKills:Math.max(old.mostKills||0,G.kills),
    fastestWin:projected.fastestWin,runs:projected.runs,wins:projected.wins,totalKills:projected.totalKills,totalScrap:projected.totalScrap,
    unlockedPets:G.unlockedPets,selectedPet:G.selectedPet||old.selectedPet||"",characterColor:normalizeHexColor(G.playerColor||old.characterColor),hardBossWins:projected.hardBossWins,hackerWins:projected.hackerWins,
    perfectBossWins:projected.perfectBossWins,bestAccuracy:projected.bestAccuracy,hackerBossWins:projected.hackerBossWins,bossWins:projected.bossWins,
    unlockedAchievements:G.unlockedAchievements,enemyDodges:projectedEnemyDodges,bossDodges:projectedBossDodges
  };
  G.profile={...old,...payload};
  try { const res=await fetch(`/api/profile?name=${encodeURIComponent(name)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}); if(res.ok) G.profile=await res.json(); } catch {}
  if(newlyUnlocked.length){ newlyUnlocked.forEach((a,i)=>setTimeout(()=>achievementToast(a),i*500)); }
  return payload;
}

function showRunStats(targetId){
  const el=document.getElementById(targetId); if(!el)return; const acc=G.shots?Math.round(G.hits/G.shots*100):100;
  el.innerHTML=[["PISO",`${G.secretBossUnlocked ? Math.min(7,G.floorIndex+1) : Math.min(6,G.floorIndex+1)}/${G.secretBossUnlocked ? 7 : 6}`],["KILLS",G.kills],["COMBO MAX",G.maxCombo],["ACCURACY",acc+"%"],["DAMAGE",Math.round(G.damageDealt)],["TIME",formatRunTime(G.runTime||((performance.now()-G.runStart)/1000))]].map(x=>`<div class="run-stat"><b>${x[1]}</b><span>${x[0]}</span></div>`).join("");
}
function formatRunTime(sec){sec=Math.max(0,sec||0); const m=Math.floor(sec/60),s=Math.floor(sec%60); return `${String(m).padStart(2,"0")}\:${String(s).padStart(2,"0")}`;}
function updateCombatHud(){
  const combo=document.getElementById("hud-combo"), weapon=document.getElementById("hud-weapon"), acc=document.getElementById("hud-accuracy");
  if(combo) combo.textContent=`COMBO ×${G.combo}`; if(weapon) weapon.textContent=G.weapon.toUpperCase(); if(acc) acc.textContent=`ACC ${G.shots?Math.round(G.hits/G.shots*100):100}%`;
}
function addDamageNumber(x,y,value,crit=false){ const el=document.createElement("div"); el.className="damage-number"+(crit?" crit":""); el.textContent=crit?`✦ ${Math.round(value)}!`:`-${Math.round(value)}`; const r=canvas.getBoundingClientRect(); el.style.left=`${r.left+x*r.width/W}px`; el.style.top=`${r.top+y*r.height/H}px`; document.body.appendChild(el); setTimeout(()=>el.remove(),700); }
function addHitMarker(x,y,crit=false){ const el=document.createElement("div"); el.className="hit-marker"; el.textContent=crit?"✦":"×"; const r=canvas.getBoundingClientRect(); el.style.left=`${r.left+x*r.width/W}px`; el.style.top=`${r.top+y*r.height/H}px`; document.body.appendChild(el); setTimeout(()=>el.remove(),300); }

async function loadScores() {
  const list = document.getElementById("scores-list");
  list.innerHTML = '<p class="dim">cargando...</p>';
  try {
    const res = await fetch("/api/highscores");
    const data = await res.json();
    if (!data.length) {
      list.innerHTML = '<p class="dim">sin registros todavia. se el primero.</p>';
      return;
    }
    list.innerHTML = data
      .map((s, i) => `<div class="score-row"><span class="rank">#${i + 1}</span><span class="name">${escapeHtml(s.name)} — piso ${s.floor}/6</span><span class="pts">${s.score}</span></div>`)
      .join("");
  } catch (err) {
    list.innerHTML = '<p class="dim">no se pudo cargar (¿esta el servidor Go corriendo?)</p>';
  }
}
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* =========================================================
   MEJORAS (perks) — se eligen al superar cada piso de la torre.
   Subir de nivel SOLO ocurre subiendo la torre: un piso, un nivel.
   ========================================================= */
const PERKS = [
  { id:"vida_extra", icon:"❤", name:"Vida extra", desc:"+25 HP máximo y recupera toda la vida.", apply(p){ p.maxHp+=25; p.hp=p.maxHp; } },
  { id:"cafeina", icon:"☕", name:"Café doble", desc:"+15% velocidad de movimiento.", apply(){ G.moveSpeedMult*=1.15; } },
  { id:"compilador_rapido", icon:"⚡", name:"Compilador rápido", desc:"+18% cadencia de disparo.", apply(){ G.fireRateMult*=0.82; } },
  { id:"buffer_overflow", icon:"▮", name:"Buffer overflow", desc:"+4 daño por disparo.", apply(){ G.bulletDmgBonus+=4; } },
  { id:"doble_salto", icon:"↑↑", name:"Commit atómico", desc:"Desbloquea un segundo salto.", apply(){ G.doubleJumpUnlocked=true; }, once:true },
  { id:"disparo_doble", icon:"»", name:"Multi-hilo", desc:"Dispara un proyectil adicional ligeramente separado.", apply(){ G.extraBullet=true; }, once:true },
  { id:"blindaje", icon:"▣", name:"Firewall personal", desc:"+0.35 s de invulnerabilidad tras recibir daño.", apply(){ G.invulnBonus+=0.35; } },
  { id:"escudo", icon:"◇", name:"Escudo cinético", desc:"Obtén 30 de escudo que absorbe daño antes del HP.", apply(p){ G.shieldMax+=30; G.shield=G.shieldMax; }, once:true },
  { id:"dash", icon:"↠", name:"Phase Dash", desc:"Desbloquea SHIFT: dash rápido con 0.22 s de invulnerabilidad.", apply(){ G.dashUnlocked=true; }, once:true },
  { id:"critico", icon:"✦", name:"Crítico", desc:"15% de probabilidad de infligir ×2.2 daño.", apply(){ G.critChance+=0.15; }, once:true },
  { id:"explosivo", icon:"✹", name:"Munición explosiva", desc:"Los impactos explotan y dañan en área.", apply(){ G.explosiveRounds=true; }, once:true },
  { id:"imán", icon:"✥", name:"Núcleo magnético", desc:"Las balas corrigen ligeramente su trayectoria hacia enemigos.", apply(){ G.homingBullets=true; }, once:true },
  { id:"nanobots", icon:"✚", name:"Nanobots", desc:"Recupera 1 HP cada segundo durante combate.", apply(){ G.regen=true; }, once:true },
  { id:"scrap", icon:"$", name:"Scrap magnético", desc:"+30% Scrap obtenido.", apply(){ G.scrapMult*=1.3; } },
];
function pickPerkOptions(n=3){
  const available=PERKS.filter(p=>!(p.once&&G.perksOwned.has(p.id)));
  const pool=[...available], chosen=[];
  while(chosen.length<n&&pool.length){ const i=Math.floor(Math.random()*pool.length); chosen.push(pool.splice(i,1)[0]); }
  return chosen;
}
function updateSynergies(){
  const has=id=>G.perksOwned.has(id); const out=[];
  if(has("critico")&&has("explosivo")) out.push("CRITICAL BLAST");
  if(has("escudo")&&has("nanobots")) out.push("REACTIVE CORE");
  if(has("dash")&&has("doble_salto")) out.push("AIR PHASE");
  if(has("scrap")&&has("imán")) out.push("MAGNETIC FORTUNE");
  G.synergies=out;
}
function renderShop(){
  const wrap=document.getElementById("shop-items"), scrap=document.getElementById("shop-scrap"); if(!wrap)return; if(scrap)scrap.textContent=`SCRAP ${G.scrap}`; wrap.innerHTML="";
  const items=[
    ["repair","PATCH KIT","+25 HP",70],
    ["shield","SHIELD CELL","+15 shield",90],
    ["damage","HOTFIX DAMAGE","+5 daño",120],
    ["cooldown","CLOCK BOOST","+10% cadencia",120]
  ];
  items.forEach(([id,name,desc,cost])=>{const b=document.createElement("button");b.className="shop-item";b.disabled=G.scrap<cost; b.innerHTML=`<strong>${name}</strong><small>${desc}</small><span class="shop-price">${cost} SCRAP</span>`; b.onclick=()=>{if(G.scrap<cost)return;G.scrap-=cost;G.shopBought.push(id); Sound.purchase(); if(id==="repair")G.player.hp=Math.min(G.player.maxHp,G.player.hp+25); if(id==="shield"){G.shieldMax+=15;G.shield+=15;} if(id==="damage")G.bulletDmgBonus+=5; if(id==="cooldown")G.fireRateMult*=.9; Sound.uiClick(); renderShop();}; wrap.appendChild(b);});
}

function renderBuildRow(){
  const row=document.getElementById("levelup-build");
  const ids=Object.keys(G.perkStacks||{});
  if(!ids.length){ row.innerHTML='<span class="build-empty">sin mejoras activas</span>'; return; }
  row.innerHTML=ids.map(id=>{const perk=PERKS.find(p=>p.id===id); if(!perk)return""; const n=G.perkStacks[id]||1; return `<span class="build-chip"><span class="chip-icon">${perk.icon}</span>${perk.name}${n>1?` ×${n}`:""}</span>`;}).join("") + (G.synergies||[]).map(x=>`<span class="build-chip synergy-chip">✦ ${x}</span>`).join("");
}
function applyPerk(perk){
  perk.apply(G.player); G.perksOwned.add(perk.id); G.perkStacks[perk.id]=(G.perkStacks[perk.id]||0)+1; updateSynergies();
  if(perk.id==="escudo") G.shield=G.shieldMax;
  spawnParticles(G.player.x+13,G.player.y+20,"#39ff88",18,{speedMin:40,speedMax:180,lifeMin:.3,lifeMax:.8});
}
function rerollPerks(){
  if(G.scrap<75)return;
  G.scrap-=75; Sound.uiClick();
  const lvl=G.level; showLevelUp(G.lastDefeatedName||"Jefe",G.pendingNextFloor); G.level=lvl;
}
function showLevelUp(bossDefeatedName,afterFn){
  G.level+=1; G.lastDefeatedName=bossDefeatedName; G.pendingNextFloor=afterFn;
  document.getElementById("levelup-label").textContent=`NIVEL ${G.level} · ${G.scrap} SCRAP`;
  document.getElementById("levelup-title").textContent=`${bossDefeatedName} caído — elige tu mejora`;
  document.getElementById("levelup-sub").textContent="Elige 1 de 3. También puedes reparar o gastar Scrap para cambiar las opciones.";
  const wrap=document.getElementById("levelup-cards"); wrap.innerHTML="";
  pickPerkOptions(3).forEach(perk=>{
    const card=document.createElement("div"); card.className="perk-card"+(perk.once?" rare":"");
    const stacks=G.perkStacks[perk.id]||0;
    card.innerHTML=`<div class="perk-top"><span class="perk-icon-badge">${perk.icon}</span><span class="perk-rarity">${perk.once?"ÚNICA":(stacks?`NIVEL ${stacks+1}`:"MEJORA")}</span></div><span class="perk-name">${perk.name}</span><span class="perk-desc">${perk.desc}</span>`;
    card.addEventListener("click",()=>{Sound.uiClick(); applyPerk(perk); afterFn();}); wrap.appendChild(card);
  });
  const repair=document.getElementById("btn-repair");
  if(repair){repair.textContent=`> reparar +35 HP · 60 SCRAP`; repair.disabled=G.scrap<60||G.player.hp>=G.player.maxHp; repair.onclick=()=>{if(G.scrap>=60&&G.player.hp<G.player.maxHp){G.scrap-=60;G.player.hp=Math.min(G.player.maxHp,G.player.hp+35); Sound.uiClick(); const lvl=G.level; showLevelUp(bossDefeatedName,afterFn); G.level=lvl;}};}
  const reroll=document.getElementById("btn-reroll"); if(reroll){reroll.disabled=G.scrap<75; reroll.onclick=()=>rerollPerks();}
  renderBuildRow(); renderShop(); G.state="levelup"; Sound.floorEnter(); showScreen("screen-levelup");
}

/* =========================================================
   DATOS DE JUEGO — jefes
   ========================================================= */
const FLOOR_THEMES = ["BOOT SEQUENCE","CORRUPTED MEMORY","NETWORK BREACH","KERNEL PANIC","SYSTEM OVERLOAD","THE CORE","SIMSIMI // EASTER EGG"];

const BOSSES = [
  {
    key: "clippy", name: "Clippy", color: "#7fd8ff", accent: "#e8f9ff",
    quote: "¡Parece que estás intentando salvar tu carrera! ¿Quieres ayuda?",
    maxHp: 80, contactDmg: 8, moveSpeed: 100, attackEvery: 1.35,
    pattern: "lob",
  },
  {
    key: "kimi", name: "Kimi", color: "#ffd166", accent: "#fff3d6",
    quote: "Tengo contexto para 2 millones de tokens. Tu currículum, en cambio, es bastante corto.",
    maxHp: 115, contactDmg: 11, moveSpeed: 200, attackEvery: 1.15,
    pattern: "dash",
  },
  {
    key: "deepseek", name: "DeepSeek", color: "#5ad1a0", accent: "#d8ffef",
    quote: "Ya indexé cada bug que vas a escribir antes de que lo escribas.",
    maxHp: 150, contactDmg: 11, moveSpeed: 130, attackEvery: 0.95,
    pattern: "homing",
  },
  {
    key: "grok", name: "Grok", color: "#ff8a5c", accent: "#ffe3d6",
    quote: "Relájate, esto es solo una simulación... probablemente.",
    maxHp: 185, contactDmg: 12, moveSpeed: 270, attackEvery: 0.78,
    pattern: "burst",
  },
  {
    key: "chatgpt", name: "ChatGPT", color: "#8ef0c8", accent: "#e6fff5",
    quote: "Como modelo de lenguaje, no tengo sentimientos. Pero si los tuviera, te tendría lástima.",
    maxHp: 220, contactDmg: 13, moveSpeed: 155, attackEvery: 0.85,
    pattern: "summon",
  },
  {
    // Jefe final — notablemente mas duro que ChatGPT: mas HP, ataca mas
    // seguido, tiene 4 patrones en vez de 3, y entra en fase de furia
    // al 50% de vida (mas rapido y mas agresivo).
    key: "claude", name: "Claude", color: "#c9a6ff", accent: "#f1e6ff",
    quote: "He leído todo tu código. Hablemos de tus decisiones de vida.",
    maxHp: 400, contactDmg: 17, moveSpeed: 220, attackEvery: 0.52,
    pattern: "final",
  },
];

/* =========================================================
   ESTADO DEL JUEGO
   ========================================================= */
const canvas = document.getElementById("game-canvas");
const ctx2d = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;
const GROUND_Y = H - 80;
const ARENA_L = 40, ARENA_R = W - 40;
const simsimiImage = new Image();
simsimiImage.src = "/img/simsimi.png";

const keys = {};

function allCollectionUnlocked(){
  return PETS.every(p=>G.unlockedPets.includes(p.id)) && ACHIEVEMENTS.every(a=>G.unlockedAchievements.includes(a.id));
}
function secretConditionMet(){ return !!G.secretOverride || allCollectionUnlocked(); }
function showSecretBanner(message){
  const el=document.createElement("div"); el.className="secret-banner"; el.textContent=message; document.body.appendChild(el); setTimeout(()=>el.remove(),1900);
}
function unlockSimSimiBoss(){
  if(BOSSES.some(b=>b.key==="simsimi")) return;
  BOSSES.push({ key:"simsimi", name:"SimSimi", color:"#ffe15a", accent:"#fff8c9", quote:"No esperaba que llegaras tan lejos. Ahora te toca aguantarme.", maxHp:520, contactDmg:20, moveSpeed:245, attackEvery:.62, pattern:"simsimi" });
  G.secretBossUnlocked=true;
  showSecretBanner("EASTER EGG // SIMSIMI DESBLOQUEADO");
  Sound.secret();
}


// Apuntado con mouse: el jugador puede disparar hacia cualquier punto de la arena.
const mouseAim = { x: W * 0.75, y: GROUND_Y - 44, active: false, down: false };
function updateMouseAim(e) {
  const rect = canvas.getBoundingClientRect();
  mouseAim.x = clamp((e.clientX - rect.left) * (W / rect.width), ARENA_L, ARENA_R);
  mouseAim.y = clamp((e.clientY - rect.top) * (H / rect.height), 20, GROUND_Y - 8);
  mouseAim.active = true;
  if (G.player) {
    const pcx = G.player.x + G.player.w / 2;
    G.player.facing = mouseAim.x >= pcx ? 1 : -1;
  }
}
canvas.addEventListener("mousemove", updateMouseAim);
canvas.addEventListener("mouseenter", () => { mouseAim.active = true; });
canvas.addEventListener("mouseleave", () => { mouseAim.active = false; mouseAim.down = false; });
window.addEventListener("blur", () => { mouseAim.active = false; mouseAim.down = false; });
canvas.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  updateMouseAim(e);
  mouseAim.down = true;
  e.preventDefault();
});
window.addEventListener("mouseup", (e) => {
  if (e.button === 0) mouseAim.down = false;
});
window.addEventListener("blur", () => {
  mouseAim.down = false;
  Object.keys(keys).forEach(k => keys[k] = false);
});

const KONAMI_CODE = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","KeyB","KeyA"];
let konamiIndex = 0;
const SIMSIMI_DIRECT_CODE = ["KeyS","KeyI","KeyM","KeyS","KeyI","KeyM","KeyI"];
let simsimiCodeIndex = 0;

async function startDirectSimSimiBattle(){
  if (G.state === "playing" || G.state === "bossIntro" || G.state === "horde") return;
  Sound.unlock();
  const name = document.getElementById("player-name")?.value.trim() || window._devName || "Anonimo";
  window._devName = name;
  const difficultySelect = document.getElementById("difficulty-select");
  G.difficultyKey = difficultySelect?.value || "easy";
  G.difficulty = DIFFICULTIES[G.difficultyKey] || DIFFICULTIES.easy;
  await loadProfile(name);
  syncPetUnlocks();
  unlockSimSimiBoss();
  resetGame();
  G.secretOverride = true;
  G.secretBossUnlocked = true;
  const index = BOSSES.findIndex(b => b.key === "simsimi");
  if (index < 0) return;
  G.floorIndex = index;
  G.level = index + 1;
  G.towerCleared = Array(index).fill(true);
  showSecretBanner("EASTER EGG // BATALLA SIMSIMI DIRECTA");
  startBossFight(index);
}

window.addEventListener("keydown", e => {
  if (e.code === SIMSIMI_DIRECT_CODE[simsimiCodeIndex]) {
    simsimiCodeIndex++;
    if (simsimiCodeIndex === SIMSIMI_DIRECT_CODE.length) {
      simsimiCodeIndex = 0;
      startDirectSimSimiBattle();
    }
  } else if (e.code !== "Escape") {
    simsimiCodeIndex = e.code === SIMSIMI_DIRECT_CODE[0] ? 1 : 0;
  }

  if (e.code === KONAMI_CODE[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === KONAMI_CODE.length) {
      konamiIndex = 0;
      G.secretOverride = true;
      localStorage.setItem("ai-suffer-konami","1");
      Sound.unlock(); Sound.secret();
      showSecretBanner("KONAMI // PROTOCOLO SIMSIMI ARMADO");
    }
  } else if (e.code !== "Escape") {
    konamiIndex = e.code === KONAMI_CODE[0] ? 1 : 0;
  }
});

window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if ((e.code === "ShiftLeft" || e.code === "ShiftRight") && !e.repeat) {
    if (G.state === "playing" && G.dashUnlocked) G.player && (G.player._dashQueued = true);
    e.preventDefault();
  }
  if (e.code === "Escape" && G.state === "playing") togglePause();
  if (G.state === "playing" && ["Digit1","Digit2","Digit3","Digit4","Digit5"].includes(e.code)) { const map={Digit1:"pistol",Digit2:"shotgun",Digit3:"railgun",Digit4:"plasma",Digit5:"trap"}; if(map[e.code]){G.weapon=map[e.code]; Sound.weapon(); updateCombatHud();} }
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", (e) => (keys[e.code] = false));

function freshPlayer() {
  return {
    x: 100, y: GROUND_Y - 44, w: 26, h: 46, vx: 0, vy: 0,
    hp: 100, maxHp: 100, onGround: false, facing: 1,
    shootCd: 0, invuln: 0, hurtFlash: 0,
    _jumpHeld: false, _dashHeld: false, _dashQueued: false,
    usedDoubleJump: false, animT: 0, shootAnim: 0,
  };
}


/* =========================================================
   PET SYSTEM — compañeros desbloqueables con habilidades únicas.
   La colección se persiste mediante el perfil del servidor Go.
   ========================================================= */
const PETS = [
  // PETS ORIGINALES
  {id:"byte", icon:"▣", color:"#39ff88", rarity:"COMÚN", rarityKey:"common", name:"BYTE", type:"BOT DE COMPAÑÍA", benefit:"+10% velocidad de movimiento.", ability:"CACHE PULSE — cada 18 s genera +40 Scrap.", unlock:"Jugá 5 partidas.", unlockFn:p=>p.runs>=5, idle:["petByte"]},
  {id:"echo", icon:"◉", color:"#67e8ff", rarity:"COMÚN", rarityKey:"common", name:"ECHO", type:"NÚCLEO SONORO", benefit:"+12% cadencia de disparo.", ability:"RESONANCE — cada 16 s sobrecarga tu siguiente disparo para lanzar +2 proyectiles.", unlock:"Alcanzá 750 kills totales.", unlockFn:p=>p.totalKills>=750, idle:["petEcho"]},
  {id:"glitch", icon:"⌁", color:"#c084fc", rarity:"RARO", rarityKey:"rare", name:"GLITCH", type:"PROCESO INESTABLE", benefit:"+8% velocidad y +8% probabilidad de esquiva.", ability:"PHASE ERROR — puede anular por completo el próximo impacto recibido.", unlock:"Llegá al piso 5 en DIFÍCIL y derrotá 2 jefes difíciles.", unlockFn:p=>p.bestFloor>=5 && p.hardBossWins>=2, idle:["petGlitch"]},
  {id:"sentinel", icon:"◇", color:"#62a7ff", rarity:"RARO", rarityKey:"rare", name:"SENTINEL", type:"FIREWALL MÓVIL", benefit:"+25 escudo máximo al iniciar.", ability:"FIREWALL — cada 28 s activa 0.8 s de invulnerabilidad al recibir daño.", unlock:"Acumulá 35.000 Scrap y llegá al piso 6.", unlockFn:p=>p.totalScrap>=35000 && p.bestFloor>=6, idle:["petSentinel"]},
  {id:"mimic", icon:"$", color:"#ffd166", rarity:"ÉPICO", rarityKey:"epic", name:"MIMIC", type:"COLECTOR AUTÓNOMO", benefit:"+25% Scrap obtenido.", ability:"DUPLICATE — 15% de probabilidad de duplicar el Scrap de un enemigo.", unlock:"Jugá 40 partidas y acumulá 50.000 Scrap.", unlockFn:p=>p.runs>=40 && p.totalScrap>=50000, idle:["petMimic"]},
  {id:"core", icon:"✦", color:"#ff5f8f", rarity:"LEGENDARIO", rarityKey:"legendary", name:"CORE", type:"PROTOCOLO DE EMERGENCIA", benefit:"+15 HP máximo.", ability:"REBOOT — una vez por partida evita una muerte.", unlock:"Ganale a la torre 4 veces y derrotá 6 jefes en DIFÍCIL.", unlockFn:p=>p.wins>=4 && p.hardBossWins>=6, idle:["petCore"]},

  // FAUNA / CRIATURAS ESPECIALES
  {id:"cat", icon:"◡", color:"#d6d6e8", rarity:"COMÚN", rarityKey:"common", name:"CAT", type:"FELINO DE SISTEMA", benefit:"+5% probabilidad de crítico y +5% velocidad.", ability:"NINE LIVES — una vez por piso, al quedar bajo 18% HP gana 1.2 s de invulnerabilidad.", unlock:"Conseguí 1.500 kills y llegá al piso 4.", unlockFn:p=>p.totalKills>=1500 && p.bestFloor>=4, idle:["petCat"]},
  {id:"fox", icon:"◇", color:"#ff8a3d", rarity:"POCO COMÚN", rarityKey:"uncommon", name:"FOX", type:"DEPREDADOR DE DATOS", benefit:"+12% Scrap obtenido.", ability:"SCAVENGER — cada 25 s encuentra automáticamente +70 Scrap.", unlock:"Acumulá 20.000 Scrap total.", unlockFn:p=>p.totalScrap>=20000, idle:["petFox"]},
  {id:"wolf", icon:"◆", color:"#a8b4c8", rarity:"RARO", rarityKey:"rare", name:"WOLF", type:"CAZADOR DE COMBOS", benefit:"+8% daño de armas.", ability:"PACK HOWL — con combo ×5, activa 5 s de +25% velocidad y cadencia. Cooldown 20 s.", unlock:"Alcanzá combo ×40.", unlockFn:p=>p.bestCombo>=40, idle:["petWolf"]},
  {id:"owl", icon:"◉", color:"#b9a7ff", rarity:"ÉPICO", rarityKey:"epic", name:"OWL", type:"VIGÍA NOCTURNO", benefit:"+20% cadencia y +10 HP máximo.", ability:"OMNISIGHT — cada 14 s recupera 3 HP y revela las amenazas con un pulso visual.", unlock:"Completá la torre 2 veces y derrotá 1 jefe en HACKER.", unlockFn:p=>p.wins>=2 && p.hackerBossWins>=1, idle:["petOwl"]},
  {id:"shark", icon:"△", color:"#35d0ff", rarity:"ÉPICO", rarityKey:"epic", name:"SHARK", type:"DEPREDADOR ABISAL", benefit:"+18% daño mientras estás por debajo del 45% HP.", ability:"BLOOD RUSH — al bajar de 45% HP gana +35% velocidad durante 4 s. Cooldown 18 s.", unlock:"Derrotá 4.000 enemigos.", unlockFn:p=>p.totalKills>=4000, idle:["petShark"]},
  {id:"dragon", icon:"🐉", color:"#ff5b5b", rarity:"LEGENDARIO", rarityKey:"legendary", name:"DRAGON", type:"BESTIA ANCESTRAL", benefit:"+15% daño y +20% HP máximo.", ability:"DRAGON BREATH — cada 20 s lanza una llamarada que daña a todos los enemigos y jefes.", unlock:"Derrotá 12 jefes en DIFÍCIL y conseguí 5 esquivas de jefe.", unlockFn:p=>p.hardBossWins>=12 && p.bossDodges>=5, idle:["petDragon"]},
  {id:"phoenix", icon:"✹", color:"#ffb347", rarity:"MÍTICO", rarityKey:"mythic", name:"PHOENIX", type:"AVE DE RENACIMIENTO", benefit:"+20 HP máximo y +12% velocidad.", ability:"REBIRTH — una vez por partida, al morir revive con 55% HP, 50 escudo y 2 s de invulnerabilidad.", unlock:"Completá 15 partidas y acumulá 9 jefes difíciles.", unlockFn:p=>p.wins>=15 && p.hardBossWins>=9, idle:["petPhoenix"]},
  {id:"void", icon:"☽", color:"#8b5cf6", rarity:"MÍTICO", rarityKey:"mythic", name:"VOID", type:"CRIATURA DEL VACÍO", benefit:"+20% daño y +10% cadencia.", ability:"NULL WAVE — cada 24 s libera una onda que golpea a todos los enemigos y destruye proyectiles enemigos cercanos.", unlock:"Completá 7 partidas en HACKER y derrotá 10 jefes en HACKER.", unlockFn:p=>p.hackerWins>=7 && p.hackerBossWins>=10, idle:["petVoid"]},
];

/* =========================================================
   ACHIEVEMENTS — progresión persistente en el backend Go
   ========================================================= */
const ACHIEVEMENTS = [
  {id:"boot_sequence", tier:"FÁCIL", tierKey:"easy", icon:"01", name:"BOOT SEQUENCE", desc:"Jugá 3 partidas.", unlock:p=>p.runs>=3},
  {id:"first_blood", tier:"FÁCIL", tierKey:"easy", icon:"02", name:"FIRST BLOOD", desc:"Conseguí 250 kills acumuladas.", unlock:p=>p.totalKills>=250},
  {id:"scrap_hoarder", tier:"FÁCIL", tierKey:"easy", icon:"03", name:"SCRAP HOARDER", desc:"Acumulá 5.000 Scrap.", unlock:p=>p.totalScrap>=5000},
  {id:"floor_runner", tier:"FÁCIL", tierKey:"easy", icon:"04", name:"FLOOR RUNNER", desc:"Llegá al piso 3.", unlock:p=>p.bestFloor>=3},
  {id:"combo_starter", tier:"NORMAL", tierKey:"normal", icon:"05", name:"COMBO STARTER", desc:"Alcanzá combo ×18.", unlock:p=>p.bestCombo>=18},
  {id:"clean_code", tier:"NORMAL", tierKey:"normal", icon:"06", name:"CLEAN CODE", desc:"Terminá una run con al menos 85% de precisión.", unlock:p=>p.bestAccuracy>=85},
  {id:"first_boss", tier:"NORMAL", tierKey:"normal", icon:"07", name:"BOSS PROCESS", desc:"Derrotá 2 jefes.", unlock:p=>p.bossWins>=2},
  {id:"tower_runner", tier:"NORMAL", tierKey:"normal", icon:"08", name:"TOWER RUNNER", desc:"Alcanzá el piso 5.", unlock:p=>p.bestFloor>=5},
  {id:"combo_master", tier:"DIFÍCIL", tierKey:"hard", icon:"09", name:"COMBO MASTER", desc:"Alcanzá combo ×35.", unlock:p=>p.bestCombo>=35},
  {id:"hard_mode", tier:"DIFÍCIL", tierKey:"hard", icon:"10", name:"HARD MODE", desc:"Derrotá 3 jefes en DIFÍCIL.", unlock:p=>p.hardBossWins>=3},
  {id:"untouchable", tier:"DIFÍCIL", tierKey:"hard", icon:"11", name:"UNTOUCHABLE", desc:"Derrotá 2 jefes sin recibir daño.", unlock:p=>p.perfectBossWins>=2},
  {id:"marksman", tier:"DIFÍCIL", tierKey:"hard", icon:"12", name:"MARKSMAN", desc:"Conseguí 94% de precisión en una run.", unlock:p=>p.bestAccuracy>=94},
  {id:"speedrunner", tier:"EXPERTO", tierKey:"expert", icon:"13", name:"SPEEDRUNNER", desc:"Completá la torre en menos de 12 minutos.", unlock:p=>p.fastestWin>0&&p.fastestWin<=720},
  {id:"rich_process", tier:"EXPERTO", tierKey:"expert", icon:"14", name:"RICH PROCESS", desc:"Acumulá 50.000 Scrap.", unlock:p=>p.totalScrap>=50000},
  {id:"hacker_mode", tier:"EXPERTO", tierKey:"expert", icon:"15", name:"HACKER MODE", desc:"Completá 2 partidas en HACKER.", unlock:p=>p.hackerWins>=2},
  {id:"hacker_veteran", tier:"EXPERTO", tierKey:"expert", icon:"16", name:"HACKER VETERAN", desc:"Derrotá 8 jefes en HACKER.", unlock:p=>p.hackerBossWins>=8},
  {id:"evasive_protocol", tier:"EXPERTO", tierKey:"expert", icon:"21", name:"EVASIVE PROTOCOL", desc:"Realizá 100 esquivas exitosas contra proyectiles enemigos.", unlock:p=>p.enemyDodges>=100},
  {id:"perfect_run", tier:"MAESTRO", tierKey:"master", icon:"17", name:"PERFECT RUN", desc:"Completá 2 partidas con al menos 97% de precisión.", unlock:p=>p.bestAccuracy>=97&&p.wins>=2},
  {id:"executioner", tier:"MAESTRO", tierKey:"master", icon:"18", name:"EXECUTIONER", desc:"Conseguí 10.000 kills acumuladas.", unlock:p=>p.totalKills>=10000},
  {id:"tower_master", tier:"MAESTRO", tierKey:"master", icon:"19", name:"TOWER MASTER", desc:"Ganale a la torre 8 veces.", unlock:p=>p.wins>=8},
  {id:"full_stack", tier:"MAESTRO", tierKey:"master", icon:"20", name:"FULL STACK", desc:"Ganale a la torre 15 veces.", unlock:p=>p.wins>=15},
  {id:"boss_dance", tier:"MAESTRO", tierKey:"master", icon:"22", name:"BOSS DANCE", desc:"Provocá 20 esquivas de jefe en DIFÍCIL o HACKER.", unlock:p=>p.bossDodges>=20},
  {id:"hacker_predator", tier:"MAESTRO", tierKey:"master", icon:"23", name:"HACKER PREDATOR", desc:"Ganale a una run HACKER con 98% de precisión y 50+ esquivas enemigas.", unlock:p=>p.hackerWins>=1&&p.bestAccuracy>=98&&p.enemyDodges>=50},
];

function achievementProfileData(){
  const p=G.profile||{};
  return {runs:p.runs||0,wins:p.wins||0,totalKills:p.totalKills||0,totalScrap:p.totalScrap||0,bestFloor:p.bestFloor||0,bestCombo:p.bestCombo||0,bestAccuracy:p.bestAccuracy||0,fastestWin:p.fastestWin||0,hardBossWins:p.hardBossWins||0,hackerWins:p.hackerWins||0,hackerBossWins:p.hackerBossWins||0,perfectBossWins:p.perfectBossWins||0,bossWins:p.bossWins||0,enemyDodges:p.enemyDodges||0,bossDodges:p.bossDodges||0};
}
function syncAchievements(profileData=achievementProfileData()){
  const before=new Set(G.profile?.unlockedAchievements||[]);
  const unlocked=[...before];
  for(const a of ACHIEVEMENTS) if(a.unlock(profileData)&&!unlocked.includes(a.id)) unlocked.push(a.id);
  G.unlockedAchievements=[...new Set(unlocked)];
  return G.unlockedAchievements;
}
function achievementToast(a){
  const el=document.createElement("div"); el.className=`achievement-toast tier-${a.tierKey}`; el.innerHTML=`<span>ACHIEVEMENT UNLOCKED</span><b>${a.icon} ${a.name}</b><small>${a.tier} · ${a.desc}</small>`; document.body.appendChild(el); Sound.achievement(); setTimeout(()=>el.classList.add("hide"),3000); setTimeout(()=>el.remove(),3600);
}
function renderAchievements(){
  const wrap=document.getElementById("achievements-list"); if(!wrap)return;
  const current=achievementProfileData(); syncAchievements(current);
  const groups={easy:"FÁCILES",normal:"NORMALES",hard:"DIFÍCILES",expert:"EXPERTOS",master:"MAESTROS"};
  wrap.innerHTML=Object.entries(groups).map(([key,label])=>{
    const items=ACHIEVEMENTS.filter(a=>a.tierKey===key); const count=items.filter(a=>G.unlockedAchievements.includes(a.id)).length;
    return `<div class="achievement-group tier-${key}"><div class="achievement-group-title"><span>${label}</span><i></i><small>${count}/${items.length} DESBLOQUEADOS</small></div><div class="achievement-grid">${items.map(a=>{const ok=G.unlockedAchievements.includes(a.id);return `<article class="achievement-card ${ok?"unlocked":"locked"}"><div class="achievement-icon">${ok?a.icon:"?"}</div><div class="achievement-copy"><strong>${a.name}</strong><span>${a.desc}</span></div><em>${ok?"DESBLOQUEADO":"BLOQUEADO"}</em></article>`}).join("")}</div></div>`;
  }).join("");
}

function petDef(){ return PETS.find(p=>p.id===G.selectedPet) || null; }
function profilePetData(){ return G.profile || {runs:0,wins:0,bestFloor:0,totalKills:0,totalScrap:0,bestCombo:0,hardBossWins:0,hackerWins:0,unlockedPets:[],unlockedAchievements:[]}; }
function syncPetUnlocks(){
  const p=profilePetData(); const before=new Set(G.unlockedPets||[]);
  PETS.forEach(pet=>{ if(pet.unlockFn(p)) before.add(pet.id); });
  G.unlockedPets=[...before].filter(id=>PETS.some(pet=>pet.id===id));
  if(G.selectedPet && !G.unlockedPets.includes(G.selectedPet)) G.selectedPet="";
  if(G.profile) G.profile.unlockedPets=[...G.unlockedPets];
}
function petSound(pet=petDef()){ if(!pet)return; const fn=pet.id.startsWith("byte")?"petByte":pet.id==="echo"?"petEcho":pet.id==="glitch"?"petGlitch":pet.id==="sentinel"?"petSentinel":pet.id==="mimic"?"petMimic":pet.id==="core"?"petCore":pet.id.startsWith("cat")?"petCat":pet.id==="fox"?"petFox":pet.id==="wolf"?"petWolf":pet.id==="owl"?"petOwl":pet.id==="shark"?"petShark":pet.id==="dragon"?"petDragon":pet.id==="phoenix"?"petPhoenix":"petVoid"; Sound[fn](); }
function renderPets(){
  const wrap=document.getElementById("pets-list"); if(!wrap)return; syncPetUnlocks();
  const groups={common:"COMÚN",uncommon:"POCO COMÚN",rare:"RARO",epic:"ÉPICO",legendary:"LEGENDARIO",mythic:"MÍTICO"};
  wrap.innerHTML=Object.entries(groups).map(([key,label])=>{ const pets=PETS.filter(p=>p.rarityKey===key); if(!pets.length)return ""; return `<div class="pet-rarity-group rarity-${key}"><div class="pet-rarity-title"><span>${label}</span><i></i><small>${pets.filter(p=>G.unlockedPets.includes(p.id)).length}/${pets.length} DESBLOQUEADOS</small></div><div class="pets-grid">${pets.map(pet=>{
    const unlocked=G.unlockedPets.includes(pet.id), selected=G.selectedPet===pet.id;
    return `<article class="pet-card ${unlocked?"":"locked"} ${selected?"selected":""} rarity-${pet.rarityKey}" style="--pet-color:${pet.color}"><div class="pet-card-top"><div class="pet-icon">${pet.icon}</div><span class="pet-status">${selected?"EQUIPADO":unlocked?"DESBLOQUEADO":"BLOQUEADO"}</span></div><div><div class="pet-name">${pet.name}</div><div class="pet-type">${pet.type}</div><div class="pet-rarity-chip">${pet.rarity}</div></div><div class="pet-benefit"><strong>BENEFICIO</strong>${pet.benefit}</div><div class="pet-ability"><strong>HABILIDAD ÚNICA</strong>${pet.ability}</div>${unlocked?`<button class="btn-secondary pet-select-btn" data-pet="${pet.id}">${selected?"✓ EQUIPADO":"EQUIPAR"}</button>`:`<div class="pet-unlock">🔒 ${pet.unlock}</div>`}</article>`;}).join("")}</div></div>`; }).join("");
  wrap.querySelectorAll("[data-pet]").forEach(btn=>btn.addEventListener("click",()=>{const id=btn.dataset.pet;if(!G.unlockedPets.includes(id))return;G.selectedPet=id;if(G.profile)G.profile.selectedPet=id;Sound.uiClick();petSound();saveProfile();renderPets();}));
}
function applyPet(){
  const pet=petDef(); if(!pet)return; const p=G.player;
  if(pet.id==="byte") G.moveSpeedMult*=1.10; if(pet.id==="echo") G.fireRateMult*=.88; if(pet.id==="glitch") G.moveSpeedMult*=1.08;
  if(pet.id==="sentinel"){G.shieldMax+=25;G.shield=G.shieldMax;} if(pet.id==="mimic") G.scrapMult*=1.25; if(pet.id==="core"){p.maxHp+=15;p.hp=p.maxHp;}
  if(pet.id==="cat"){G.critChance+=.05;G.moveSpeedMult*=1.05;} if(pet.id==="fox")G.scrapMult*=1.12; if(pet.id==="wolf")G.bulletDmgBonus+=2;
  if(pet.id==="owl"){G.fireRateMult*=.80;p.maxHp+=10;p.hp=p.maxHp;} if(pet.id==="shark")G.petLowHpDamage=.18;
  if(pet.id==="dragon"){G.bulletDamageMult*=1.15;p.maxHp+=20;p.hp=p.maxHp;} if(pet.id==="phoenix"){p.maxHp+=20;p.hp=p.maxHp;G.moveSpeedMult*=1.12;} if(pet.id==="void"){G.bulletDamageMult*=1.20;G.fireRateMult*=.90;}
}
function resetPetRunState(){
  G.petT=rand(3.5,6.5); G.petAbilityT={byte:18,echo:16,glitch:22,sentinel:28,mimic:0,core:0,cat:0,fox:25,wolf:20,owl:14,shark:18,dragon:20,phoenix:0,void:24}[G.selectedPet]||0;
  G.petPhase=0;G.petRebootUsed=false;G.petShieldT=0;G.petResonance=0;G.petGlitchReady=G.selectedPet==="glitch";G.petFirewallReady=G.selectedPet==="sentinel";G.petSpecialReady=true;G.petBloodRushT=0;G.petCatTriggered=false;G.petFloorMark=G.floorIndex;
}
function damageAllEnemies(amount,color="#fff",label="PET"){
  let hits=0; G.minions.forEach(m=>{if(m.hp>0){m.hp-=amount;hits++;spawnParticles(m.x+m.w/2,m.y+m.h/2,color,8,{speedMin:50,speedMax:170,lifeMin:.18,lifeMax:.5});}});
  if(G.boss&&G.boss.hp>0){G.boss.hp-=amount;hits++;spawnParticles(G.boss.x+G.boss.w/2,G.boss.y+G.boss.h/2,color,18,{speedMin:70,speedMax:240,lifeMin:.2,lifeMax:.6});}
  G.minions=G.minions.filter(m=>m.hp>0); if(hits) {G.score+=hits*15; addHitMarker(G.player.x+G.player.w/2,G.player.y+10,true);}
}
function destroyNearbyEnemyBullets(radius){const p=G.player;G.enemyBullets=G.enemyBullets.filter(b=>Math.hypot(b.x-p.x,b.y-p.y)>radius);spawnParticles(p.x+p.w/2,p.y+p.h/2,"#8b5cf6",28,{speedMin:80,speedMax:300,lifeMin:.15,lifeMax:.5});}
function updatePet(dt){
  const pet=petDef(), p=G.player; if(!pet||!p||G.state!=="playing")return; G.petPhase+=dt*4; G.petT-=dt;
  if(G.petT<=0){petSound();G.petT=rand(4.5,8.5);} if(G.petAbilityT>0)G.petAbilityT-=dt;if(G.petShieldT>0)G.petShieldT-=dt;if(G.petBloodRushT>0)G.petBloodRushT-=dt;
  if(pet.id==="byte"&&G.petAbilityT<=0){G.scrap+=40;G.score+=20;G.petAbilityT=18;Sound.petAbility();spawnParticles(p.x+13,p.y+20,pet.color,12,{speedMin:30,speedMax:100,lifeMin:.2,lifeMax:.6});}
  if(pet.id==="echo"&&G.petAbilityT<=0){G.petResonance=5;G.petAbilityT=16;Sound.petAbility();spawnParticles(p.x+13,p.y+20,pet.color,10,{speedMin:40,speedMax:140,lifeMin:.2,lifeMax:.5});}
  if(pet.id==="fox"&&G.petAbilityT<=0){G.scrap+=70;G.score+=30;G.petAbilityT=25;Sound.petAbilitySpecial();spawnParticles(p.x+13,p.y+20,pet.color,18,{speedMin:50,speedMax:180});}
  if(pet.id==="owl"&&G.petAbilityT<=0){p.hp=Math.min(p.maxHp,p.hp+3);G.petAbilityT=14;Sound.petAbilitySpecial();spawnParticles(p.x+13,p.y+20,pet.color,20,{speedMin:50,speedMax:190});}
  if(pet.id==="wolf"&&G.petAbilityT<=0&&G.combo>=5){G.petAbilityT=20;G.petBloodRushT=5;G.moveSpeedMult*=1.25;G.fireRateMult*=.80;Sound.petWolf();spawnParticles(p.x+13,p.y+20,pet.color,24,{speedMin:80,speedMax:260});}
  if(pet.id==="shark"&&p.hp/p.maxHp<=.45&&G.petBloodRushT<=0){G.petBloodRushT=4;G.petAbilityT=18;G.moveSpeedMult*=1.35;Sound.petShark();spawnParticles(p.x+13,p.y+20,pet.color,22,{speedMin:90,speedMax:300});}
  if(pet.id==="dragon"&&G.petAbilityT<=0){G.petAbilityT=20;Sound.petDragon();damageAllEnemies(35*G.difficulty?.bossHp?1:1,pet.color,"DRAGON BREATH");spawnParticles(p.x+p.w/2,p.y+15,pet.color,35,{speedMin:100,speedMax:340});}
  if(pet.id==="void"&&G.petAbilityT<=0){G.petAbilityT=24;Sound.petVoid();damageAllEnemies(45,pet.color,"NULL WAVE");destroyNearbyEnemyBullets(190);}
}
function petCanDodge(){if(G.selectedPet!=="glitch"||G.petAbilityT>0)return false;if(Math.random()<.08){G.petAbilityT=22;Sound.petAbility();spawnParticles(G.player.x+13,G.player.y+20,"#c084fc",16,{speedMin:80,speedMax:260,lifeMin:.15,lifeMax:.45});return true;}return false;}
function petFirewall(){if(G.selectedPet!=="sentinel"||G.petAbilityT>0)return false;G.petAbilityT=28;G.petShieldT=.8;Sound.petAbility();spawnParticles(G.player.x+13,G.player.y+20,"#62a7ff",18,{speedMin:70,speedMax:220,lifeMin:.15,lifeMax:.5});return true;}
function petReboot(){if(G.selectedPet!=="core"||G.petRebootUsed)return false;G.petRebootUsed=true;G.player.hp=Math.max(1,Math.round(G.player.maxHp*.35));G.shield=Math.max(G.shield,25);G.player.invuln=1.2;Sound.petAbility();spawnParticles(G.player.x+13,G.player.y+20,"#ff5f8f",30,{speedMin:90,speedMax:320,lifeMin:.2,lifeMax:.8});return true;}
function petPhoenix(){if(G.selectedPet!=="phoenix"||G.petRebootUsed)return false;G.petRebootUsed=true;G.player.hp=Math.max(1,Math.round(G.player.maxHp*.55));G.shield=Math.max(G.shield,50);G.player.invuln=2;Sound.petPhoenix();spawnParticles(G.player.x+13,G.player.y+20,"#ffb347",60,{speedMin:100,speedMax:380,lifeMin:.3,lifeMax:1});shake(8,.3);return true;}
const DIFFICULTIES = {
  easy:   { label:"FÁCIL", desc:"La dificultad base. Los enemigos casi no anticipan tus disparos.", hp:1.00, damage:1.00, speed:1.00, fire:1.00, spawn:1.00, count:1.00, bossHp:1.00, bossAttack:1.00, bossSpeed:1.00, bossDamage:1.00, hazard:1.00, special:1.00, dodge:0.08, dodgePrecision:0.25, enemyMagneticChance:0.05, enemyMagneticTurn:0.45 },
  normal: { label:"NORMAL", desc:"Los enemigos empiezan a leer trayectorias y buscar huecos.", hp:1.65, damage:1.55, speed:1.24, fire:1.30, spawn:1.38, count:1.25, bossHp:1.65, bossAttack:1.28, bossSpeed:1.22, bossDamage:1.55, hazard:1.35, special:1.55, dodge:0.24, dodgePrecision:0.48, enemyMagneticChance:0.13, enemyMagneticTurn:0.78 },
  hard:   { label:"DIFÍCIL", desc:"IA agresiva: cambios de dirección, esquivas anticipadas y jefes reactivos.", hp:2.55, damage:2.35, speed:1.48, fire:1.70, spawn:1.92, count:1.55, bossHp:2.55, bossAttack:1.62, bossSpeed:1.48, bossDamage:2.35, hazard:1.90, special:2.15, dodge:0.46, dodgePrecision:0.72, enemyMagneticChance:0.25, enemyMagneticTurn:1.18 },
  hacker: { label:"HACKER", desc:"IA de élite: predice tus trayectorias, corta ángulos y los jefes reaccionan casi inmediatamente.", hp:4.00, damage:3.60, speed:1.75, fire:2.10, spawn:2.75, count:1.90, bossHp:4.00, bossAttack:2.05, bossSpeed:1.78, bossDamage:3.60, hazard:2.70, special:3.00, dodge:0.70, dodgePrecision:0.94, enemyMagneticChance:0.40, enemyMagneticTurn:1.65 },
};

function difficultyConfig(){ return DIFFICULTIES[G.difficultyKey] || DIFFICULTIES.easy; }
function difficultyDamage(v){ return v * difficultyConfig().damage; }
function difficultyBossDamage(v){ return v * difficultyConfig().bossDamage; }

const G = {
  state: "menu",          // menu | horde | floorwait | boss | levelup | pause | gameover | win
  difficultyKey: "easy",
  difficulty: DIFFICULTIES.easy,
  player: null,
  bullets: [],            // disparos del jugador
  enemyBullets: [],       // disparos enemigos
  minions: [],            // horda actual (camino al servidor o piso)
  particles: [],
  floorIndex: 0,          // 0..5 -> BOSSES
  boss: null,
  horde: null,            // { tier, kills, params, spawnTimer, label, onComplete }
  score: 0,
  lastTime: 0,
  shakeT: 0, shakeMag: 0,
  // progresion: subir de nivel SOLO pasa al superar un piso de la torre
  level: 1,
  perksOwned: new Set(),
  moveSpeedMult: 1,
  fireRateMult: 1,
  bulletDmgBonus: 0,
  invulnBonus: 0,
  doubleJumpUnlocked: false,
  extraBullet: false,
  shield: 0, shieldMax: 0,
  critChance: 0, critMult: 2.2, explosiveRounds: false, homingBullets: false, regen: false,
  dashUnlocked: false, dashCooldown: 0, dashTimer: 0, dashInvuln: 0,
  scrap: 0, scrapMult: 1,
  perkStacks: {},
  eventMods: { damage: 1, fireRate: 1, move: 1 },
  eventUsed: false,
  towerCleared: [],
  elevator: null,
  bossIntro: null,
  ambientT: 0,
  levelPulse: 0,
  effects: [],
  hazards: [],
  floorMechanic: null,
  transitionFlash: 0,
  weapon: "pistol", combo: 0, comboT: 0, maxCombo: 0, kills: 0, shots: 0, hits: 0,
  damageDealt: 0, damageTaken: 0, enemyDodges: 0, bossDodges: 0, runStart: 0, runTime: 0, fastestWin: 0, newGamePlus: false,
  synergies: [], shopBought: [], secretFound: false, secretT: 0,
  selectedPet: "", unlockedPets: [], unlockedAchievements: [], characterColor: DEFAULT_PLAYER_COLOR, playerColor: DEFAULT_PLAYER_COLOR, bossDamageTaken: 0, petT: 0, petAbilityT: 0, petPhase: 0, petRebootUsed: false, petShieldT: 0, petResonance: 0,
  petBloodRushT: 0, petCatTriggered: false, petFirewallReady: false, petFloorMark: 0, petGlitchReady: false, petLowHpDamage: 0, petSpecialReady: true,
  bulletDamageMult: 1, mode: "normal", simsimiSlowT: 0, simsimiInsult: "", secretOverride: localStorage.getItem("ai-suffer-konami") === "1", secretBossUnlocked: false,
  profile: null, profileLoading: false,
};

function resetGame(newGamePlus = false) {
  G.player = freshPlayer();
  G.bullets = [];
  G.enemyBullets = [];
  G.minions = [];
  G.particles = [];
  G.floorIndex = 0;
  G.boss = null;
  G.horde = null;
  G.score = 0;
  G.enemyDodges = 0;
  G.bossDodges = 0;
  G.level = 1;
  G.perksOwned = new Set();
  G.moveSpeedMult = 1;
  G.fireRateMult = 1;
  G.bulletDmgBonus = 0;
  G.invulnBonus = 0;
  G.doubleJumpUnlocked = false;
  G.extraBullet = false;
  G.shield=0; G.shieldMax=0; G.critChance=0; G.critMult=2.2; G.explosiveRounds=false; G.homingBullets=false; G.regen=false;
  G.dashUnlocked=false; G.dashCooldown=0; G.dashTimer=0; G.dashInvuln=0;
  G.scrap=0; G.scrapMult=1; G.perkStacks={}; G.eventMods={damage:1,fireRate:1,move:1}; G.eventUsed=false;
  G.towerCleared=[]; G.hpRegenT=1;
  G.elevator = null;
  G.bossIntro = null;
  G.ambientT = 0;
  G.levelPulse = 0;
  G.effects = [];
  G.hazards = [];
  G.floorMechanic = null;
  G.transitionFlash = 0;
  G.weapon="pistol"; G.combo=0; G.comboT=0; G.maxCombo=0; G.kills=0; G.shots=0; G.hits=0; G.damageDealt=0; G.damageTaken=0; G.runStart=performance.now(); G.runTime=0; G.fastestWin=0; G.newGamePlus=!!newGamePlus; G.synergies=[]; G.shopBought=[]; G.secretFound=false; G.secretT=0;
  G.unlockedPets=[...(G.profile?.unlockedPets||[])]; G.unlockedAchievements=[...(G.profile?.unlockedAchievements||[])]; G.selectedPet=G.profile?.selectedPet||""; G.playerColor=normalizeHexColor(G.profile?.characterColor||G.playerColor||DEFAULT_PLAYER_COLOR); G.characterColor=G.playerColor; G.bulletDamageMult=1; G.bossDamageTaken=0; G.simsimiSlowT=0; G.simsimiInsult=""; G.secretBossUnlocked=BOSSES.some(b=>b.key==="simsimi"); G.petLowHpDamage=0; syncPetUnlocks(); resetPetRunState(); applyPet();
}

/* =========================================================
   FLUJO ENTRE PANTALLAS DEL JUEGO
   ========================================================= */
bindClick("btn-start", async () => {
  Sound.unlock();
  const name = document.getElementById("player-name").value.trim();
  const difficultySelect = document.getElementById("difficulty-select");
  G.difficultyKey = difficultySelect?.value || "easy";
  G.difficulty = DIFFICULTIES[G.difficultyKey] || DIFFICULTIES.easy;
  window._devName = name || "Anonimo";
  await loadProfile(window._devName);
  syncPetUnlocks();
  syncAchievements();
  resetGame();
  startIntro();
});

const difficultySelectEl = document.getElementById("difficulty-select");
const difficultyInfoEl = document.getElementById("difficulty-info");
if (difficultySelectEl) {
  difficultySelectEl.addEventListener("change", () => {
    const d = DIFFICULTIES[difficultySelectEl.value] || DIFFICULTIES.easy;
    if (difficultyInfoEl) difficultyInfoEl.textContent = d.desc;
    Sound.uiClick();
  });
}

bindClick("btn-floor-continue", () => {
  Sound.floorEnter();
  const idx = G.floorIndex;
  startHorde(idx, `PISO ${idx + 1} · ${DIFFICULTIES[G.difficultyKey].label} · LIMPIA EL PASILLO`, () => startBossFight(idx));
});

bindClick("btn-resume", () => togglePause());
bindClick("btn-quit", () => { G.state = "menu"; Music.playMenu(); showScreen("screen-menu"); });

bindClick("btn-retry", () => {
  resetGame();
  startIntro();
});
bindClick("btn-gameover-menu", () => { Music.playMenu(); showScreen("screen-menu"); });
bindClick("btn-win-menu", () => { Music.playMenu(); showScreen("screen-menu"); });
bindClick("btn-newgameplus", async () => { window._devName = document.getElementById("win-name").value.trim() || window._devName || "Anonimo"; await loadProfile(window._devName); resetGame(true); startIntro(); });

bindClick("btn-submit-score", async () => {
  const name = document.getElementById("win-name").value.trim() || window._devName || "Anonimo";
  try {
    await fetch("/api/highscores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score: G.score, floor: 6 }),
    });
    document.getElementById("btn-submit-score").textContent = "> guardado ✓";
  } catch (e) {
    document.getElementById("btn-submit-score").textContent = "> error al guardar";
  }
});

function musicForCurrentMode() {
  if (G.mode === "boss" && G.boss) return () => Music.playBattle(G.boss.enraged);
  if (G.mode === "horde" || G.mode === "elevator") return () => Music.playExplore();
  return () => Music.playMenu();
}

function togglePause() {
  if (G.state === "pause") {
    G.state = "playing";
    showScreen("screen-game");
    musicForCurrentMode()();
  } else {
    G.state = "pause";
    showScreen("screen-pause");
    Music.stop();
  }
}

function configureFloorMechanic(index, mode = "horde") {
  const mechanics = [
    { name: "GRID DE SEGURIDAD", color: "#39ff88", type: "grid", hazard: 0 },
    { name: "LASER DE CONTENCIÓN", color: "#7fd8ff", type: "laser", hazard: 0 },
    { name: "SOBRECARGA TÉRMICA", color: "#ffd166", type: "heat", hazard: 0 },
    { name: "CAMPO CORRUPTO", color: "#ff5c7a", type: "corrupt", hazard: 0 },
    { name: "GRAVEDAD INESTABLE", color: "#8ef0c8", type: "gravity", hazard: 0 },
    { name: "NÚCLEO FINAL", color: "#c9a6ff", type: "final", hazard: 0 },
  ];
  const m = mechanics[index % mechanics.length];
  G.floorMechanic = { ...m, t: 0, pulse: 0, mode };
  G.hazards = [];
  if (m.type === "laser") {
    G.hazards.push({type:"laser", x: 310, y: GROUND_Y - 105, w: 6, h: 105, phase: 0.4, on: true});
    G.hazards.push({type:"laser", x: 650, y: GROUND_Y - 145, w: 6, h: 145, phase: 2.0, on: true});
  } else if (m.type === "heat") {
    G.hazards.push({type:"vent", x: 220, y: GROUND_Y - 10, w: 100, h: 10, phase: 0});
    G.hazards.push({type:"vent", x: 690, y: GROUND_Y - 10, w: 100, h: 10, phase: 1.8});
  } else if (m.type === "corrupt") {
    G.hazards.push({type:"zone", x: 470, y: GROUND_Y - 38, w: 130, h: 38, phase: 0});
  } else if (m.type === "gravity") {
    G.hazards.push({type:"gravity", x: 430, y: 95, w: 180, h: 280, phase: 0});
  }
}

function updateFloorMechanic(dt) {
  const m = G.floorMechanic;
  if (!m || !G.player || G.state !== "playing") return;
  m.t += dt;
  m.pulse = (Math.sin(m.t * 4) + 1) / 2;
  const p = G.player;

  // Las mecánicas de piso SOLO son peligrosas durante la horda o el jefe.
  // Al derrotar al jefe se limpian inmediatamente en startElevatorWait().
  const hazardActive = G.mode === "horde" || G.mode === "boss";
  G.hazards.forEach(h => {
    h.phase += dt;
    if (h.type === "laser") {
      h.on = Math.sin(h.phase * 2.5) > -0.35;
      if (hazardActive && h.on && overlap(h, p)) hurtPlayer(8 * difficultyConfig().hazard);
    } else if (h.type === "vent") {
      h.active = Math.sin(h.phase * 2.2) > 0.35;
      if (hazardActive && h.active && overlap(h, p)) hurtPlayer(7 * difficultyConfig().hazard);
    } else if (h.type === "zone") {
      if (hazardActive && overlap(h, p)) hurtPlayer(4 * difficultyConfig().hazard);
    } else if (h.type === "gravity") {
      if (hazardActive && overlap(h, p)) { p.vy -= 520 * dt; p.vy = Math.max(p.vy, -700); }
    }
  });
}

function drawFloorMechanic() {
  const m = G.floorMechanic;
  if (!m || !G.hazards.length) return;
  const t = m.t;

  ctx2d.save();
  ctx2d.lineCap = "round";

  G.hazards.forEach(h => {
    if (h.type === "laser") {
      const active = h.on !== false;
      const pulse = 0.72 + 0.28 * Math.sin(t * 9 + h.phase);
      // Emisor claramente visible.
      ctx2d.shadowColor = "#7fd8ff";
      ctx2d.shadowBlur = 14;
      ctx2d.fillStyle = "#091722";
      ctx2d.fillRect(h.x - 13, GROUND_Y - 13, 26, 13);
      ctx2d.strokeStyle = "#7fd8ff";
      ctx2d.lineWidth = 2;
      ctx2d.strokeRect(h.x - 13, GROUND_Y - 13, 26, 13);

      // Zona de advertencia cuando el laser esta apagado.
      if (!active) {
        ctx2d.shadowBlur = 0;
        ctx2d.globalAlpha = 0.16 + 0.08 * Math.sin(t * 6);
        ctx2d.fillStyle = "#7fd8ff";
        ctx2d.fillRect(h.x - 2, h.y, 4, h.h);
        ctx2d.globalAlpha = 1;
      }

      if (active) {
        ctx2d.globalAlpha = 0.18 * pulse;
        ctx2d.fillStyle = "#7fd8ff";
        ctx2d.fillRect(h.x - 9, h.y, 18, h.h);
        ctx2d.globalAlpha = 1;
        ctx2d.shadowBlur = 18;
        ctx2d.fillStyle = "#dff7ff";
        ctx2d.fillRect(h.x - 2, h.y, 4, h.h);
        ctx2d.fillStyle = "#7fd8ff";
        ctx2d.fillRect(h.x - 5, h.y, 10, h.h);
        // Segmentos de energia que se desplazan por el haz.
        ctx2d.shadowBlur = 0;
        ctx2d.fillStyle = "#ffffff";
        const offset = (t * 150) % 38;
        for (let y = GROUND_Y - offset; y > h.y; y -= 38) ctx2d.fillRect(h.x - 1, y, 2, 12);
      }
      ctx2d.shadowBlur = 0;
      ctx2d.fillStyle = "#7fd8ff";
      ctx2d.globalAlpha = 0.8;
      ctx2d.beginPath(); ctx2d.arc(h.x, GROUND_Y - 7, 3 + pulse * 2, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.globalAlpha = 1;

    } else if (h.type === "vent") {
      const active = h.active !== false;
      ctx2d.fillStyle = "#111814";
      ctx2d.fillRect(h.x, h.y, h.w, h.h);
      ctx2d.strokeStyle = "#ffd166";
      ctx2d.lineWidth = 2;
      ctx2d.strokeRect(h.x, h.y, h.w, h.h);
      for (let x = h.x + 8; x < h.x + h.w; x += 14) {
        ctx2d.strokeStyle = active ? "#ffd166" : "#6d603d";
        ctx2d.beginPath(); ctx2d.moveTo(x, h.y + 2); ctx2d.lineTo(x + 5, h.y + h.h - 2); ctx2d.stroke();
      }
      if (active) {
        ctx2d.globalAlpha = 0.18 + 0.08 * Math.sin(t * 8);
        ctx2d.fillStyle = "#ffd166";
        ctx2d.fillRect(h.x, h.y - 45, h.w, 45);
        ctx2d.globalAlpha = 1;
        ctx2d.strokeStyle = "#fff0ad";
        ctx2d.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const xx = h.x + 15 + i * 23;
          const sway = Math.sin(t * 5 + i) * 6;
          ctx2d.beginPath(); ctx2d.moveTo(xx, h.y - 5); ctx2d.quadraticCurveTo(xx + sway, h.y - 24, xx - sway, h.y - 42); ctx2d.stroke();
        }
      }

    } else if (h.type === "zone") {
      const pulse = 0.3 + 0.18 * Math.sin(t * 5);
      ctx2d.fillStyle = `rgba(255,92,122,${pulse})`;
      ctx2d.fillRect(h.x, h.y, h.w, h.h);
      ctx2d.strokeStyle = "#ff5c7a";
      ctx2d.lineWidth = 2;
      ctx2d.strokeRect(h.x, h.y, h.w, h.h);
      ctx2d.setLineDash([8, 8]);
      ctx2d.lineDashOffset = -t * 30;
      ctx2d.strokeRect(h.x - 4, h.y - 4, h.w + 8, h.h + 8);
      ctx2d.setLineDash([]);
      ctx2d.fillStyle = "#ffb0bd";
      ctx2d.globalAlpha = 0.65;
      for (let i = 0; i < 7; i++) {
        const xx = h.x + ((i * 27 + t * 22) % h.w);
        const yy = h.y + 7 + ((i * 17 + t * 16) % Math.max(8, h.h - 10));
        ctx2d.fillRect(xx, yy, 2, 2);
      }
      ctx2d.globalAlpha = 1;

    } else if (h.type === "gravity") {
      ctx2d.fillStyle = "rgba(142,240,200,0.08)";
      ctx2d.fillRect(h.x, h.y, h.w, h.h);
      ctx2d.strokeStyle = "#8ef0c8";
      ctx2d.lineWidth = 2;
      ctx2d.setLineDash([6, 8]);
      ctx2d.lineDashOffset = t * 25;
      ctx2d.strokeRect(h.x, h.y, h.w, h.h);
      ctx2d.setLineDash([]);
      ctx2d.globalAlpha = 0.45;
      for (let x = h.x + 18; x < h.x + h.w; x += 30) {
        for (let y = h.y + 18; y < h.y + h.h; y += 34) {
          ctx2d.beginPath(); ctx2d.moveTo(x, y); ctx2d.lineTo(x, y - 12); ctx2d.lineTo(x - 3, y - 7); ctx2d.moveTo(x, y - 12); ctx2d.lineTo(x + 3, y - 7); ctx2d.stroke();
        }
      }
      ctx2d.globalAlpha = 1;
      ctx2d.fillStyle = "#8ef0c8";
      ctx2d.font = "bold 10px 'JetBrains Mono'";
      ctx2d.textAlign = "center";
      ctx2d.fillText("GRAVITY FIELD", h.x + h.w / 2, h.y - 9);
    }
  });

  ctx2d.restore();
}

function startIntro() {
  startHorde(-1, "CAMINO AL SERVIDOR", () => goToFloorScreen(0));
}


function renderTowerMap(activeIndex){
  const wrap=document.getElementById("tower-map"); if(!wrap)return; wrap.innerHTML="";
  BOSSES.forEach((b,i)=>{const node=document.createElement("div");node.className="tower-node "+(i<activeIndex?"cleared ":"")+(i===activeIndex?"active ":"")+(G.towerCleared[i]?"done":"");node.innerHTML=`<span class="tower-num">${String(i+1).padStart(2,"0")}</span><span class="tower-name">${b.name}</span><span class="tower-status">${G.towerCleared[i]?"✓ CLEAR":i===activeIndex?"▶ NOW":"LOCKED"}</span>`;wrap.appendChild(node);});
}

function goToFloorScreen(index) {
  G.floorIndex = index;
  G.eventUsed=false;
  const boss = BOSSES[index];
  document.getElementById("floor-label").textContent = `PISO ${index + 1} / ${BOSSES.length}`;
  document.getElementById("floor-boss-name").textContent = boss.name;
  document.getElementById("floor-boss-quote").textContent = `"${boss.quote}"`;
  document.getElementById("floor-boss-name").style.color = boss.color;
  renderTowerMap(index);
  const scrap=document.getElementById("floor-scrap"); if(scrap) scrap.textContent=`SCRAP ${G.scrap}`;
  const mechanicNames = ["GRID DE SEGURIDAD", "LASER DE CONTENCIÓN", "SOBRECARGA TÉRMICA", "CAMPO CORRUPTO", "GRAVEDAD INESTABLE", "NÚCLEO FINAL"];
  const quote = document.getElementById("floor-boss-quote");
  quote.textContent = `"${boss.quote}"  ·  MECÁNICA: ${mechanicNames[index]}`;
  showScreen("screen-floor");
  G.state = "floorwait";
}

/* =========================================================
   HORDAS — antes de llegar a la torre y antes de cada jefe hay que
   limpiar una oleada de enemigos. Se ponen mas duras piso a piso.
   ========================================================= */
function hordeParams(tier) {
  const t=Math.max(0,tier), d=difficultyConfig(), ng=G.newGamePlus?1.28:1;
  const hp=ng*d.hp, speed=d.speed, fire=d.fire, spawn=d.spawn, count=d.count, dmg=ng*d.damage;
  return {
    target:Math.max(1,Math.round((6+t*2)*ng*count)),
    cap:3+Math.floor(t/2)+Math.max(0,Math.floor((count-1)*3)),
    hpMin:(14+t*4)*hp, hpMax:(20+t*5)*hp,
    speedMin:(70+t*14)*speed, speedMax:(110+t*16)*speed,
    shootMin:Math.max(.28,(1.4-t*.13)/fire), shootMax:Math.max(.42,(2.1-t*.15)/fire),
    spawnGapMin:Math.max(.22,(1.05-t*.09)/spawn), spawnGapMax:Math.max(.35,(1.7-t*.11)/spawn),
    bulletDmg:(6+t*1.2)*dmg, contactDmg:(5+t)*dmg,
    enemyMagneticChance: Math.min(.58, d.enemyMagneticChance + t * 0.018),
    enemyMagneticTurn: d.enemyMagneticTurn * (1 + Math.min(.28, t * .035)),
    eliteChance:t>=1?Math.min(.62,(.08+t*.035)*d.special):0,
    chargerChance:t>=1?Math.min(.42,(.04+t*.025)*d.special):0, turretChance:t>=2?Math.min(.34,(.03+t*.018)*d.special):0,
    splitterChance:t>=2?Math.min(.34,(.05+t*.018)*d.special):0, sniperChance:t>=1?Math.min(.34,(.04+t*.02)*d.special):0,
    orbiterChance:t>=2?Math.min(.30,(.035+t*.018)*d.special):0, mineChance:t>=2?Math.min(.28,(.025+t*.016)*d.special):0,
    shieldChance:t>=1?Math.min(.24,(.025+t*.012)*d.special):0, healerChance:t>=2?Math.min(.20,(.02+t*.010)*d.special):0, hunterChance:t>=3?Math.min(.24,(.025+t*.012)*d.special):0
  };
}

function spawnHordeMinion() {
  const p = G.horde.params;
  const r = Math.random();
  let type = "drone";
  let forcedSpecial = false;
  if (G.horde && G.horde.tier >= 0 && !G.horde.specialSpawned) {
    const specials = G.horde.tier >= 3 ? ["splitter", "sniper", "charger", "turret"] : G.horde.tier >= 2 ? ["sniper", "turret", "charger"] : ["charger", "sniper"];
    type = specials[G.horde.spawned % specials.length];
    G.horde.specialSpawned = true;
    forcedSpecial = true;
  }
  if (!forcedSpecial && G.horde && G.horde.tier >= 0 && G.horde.spawned > 0 && G.horde.spawned % 4 === 0) {
    const specials = ["sniper", "orbiter", "mine", "splitter", "shield", "healer", "hunter"];
    type = specials[G.horde.specialCount++ % specials.length];
    forcedSpecial = true;
  }
  if (!forcedSpecial) {
    let cursor = 0;
    if ((cursor += p.mineChance) > r) type = "mine";
    else if ((cursor += p.healerChance) > r) type = "healer";
    else if ((cursor += p.shieldChance) > r) type = "shield";
    else if ((cursor += p.hunterChance) > r) type = "hunter";
    else if ((cursor += p.orbiterChance) > r) type = "orbiter";
    else if ((cursor += p.sniperChance) > r) type = "sniper";
    else if ((cursor += p.splitterChance) > r) type = "splitter";
    else if ((cursor += p.turretChance) > r) type = "turret";
    else if ((cursor += p.chargerChance) > r) type = "charger";
  }
  const elite = type === "drone" && Math.random() < p.eliteChance;
  if (G.horde) G.horde.spawned++;
  const hpBase = rand(p.hpMin, p.hpMax);
  const hp = hpBase * (elite ? 2.1 : type === "turret" ? 1.7 : type === "splitter" ? 1.35 : 1);
  const size = elite ? 38 : type === "turret" ? 32 : type === "sniper" ? 30 : type === "orbiter" ? 27 : type === "mine" ? 24 : type === "splitter" ? 30 : type === "charger" ? 28 : type === "shield" ? 34 : type === "healer" ? 27 : type === "hunter" ? 29 : 26;
  // Snipers/turrets quedan cerca de la altura del jugador: siguen siendo una amenaza
  // a distancia, pero no quedan flotando fuera del alcance de un disparo horizontal.
  const y = type === "sniper" ? GROUND_Y - 105 - rand(0, 24)
    : type === "turret" ? GROUND_Y - 145 - rand(0, 35)
    : type === "orbiter" ? GROUND_Y - 90 - rand(0, 150)
    : type === "healer" ? GROUND_Y - 170 - rand(0,50)
    : GROUND_Y - size;
  const side = Math.random() < 0.5 ? -1 : 1;
  const moveDir = side < 0 ? 1 : -1;
  const baseSpeed = (type === "turret" || type === "sniper" || type === "healer" || type === "shield") ? 38 : type === "orbiter" ? 70 : type === "mine" ? 125 : type === "charger" ? rand(115, 175) : type === "hunter" ? rand(p.speedMin*1.15,p.speedMax*1.35) : rand(p.speedMin, p.speedMax) * (elite ? 0.72 : type === "splitter" ? 0.82 : 1);
  G.minions.push({
    x: side < 0 ? ARENA_L + 20 : W - 30, y, w: size, h: type === "turret" ? 32 : size,
    hp, maxHp: hp,
    vx: moveDir * baseSpeed,
    shootT: rand(p.shootMin, p.shootMax),
    bulletDmg: p.bulletDmg * (elite ? 1.4 : type === "turret" ? 1.25 : type === "sniper" ? 1.55 : type === "healer" ? 0.7 : 1),
    contactDmg: p.contactDmg * (elite ? 1.6 : type === "charger" ? 1.8 : type === "mine" ? 2.2 : type === "hunter" ? 1.4 : 1),
    elite, type, phase: rand(0, Math.PI * 2), chargeT: type === "charger" ? rand(0.5, 1.5) : 0,
    orbitR: rand(45, 90), orbitSpeed: rand(1.2, 2.1), originX: side < 0 ? ARENA_L + 40 : W - 70, originY: y,
    hitFlash: 0, telegraph: 0, healT: rand(1.5,2.4), shielded: type === "shield" ? true : false, side, moveDir, dodgeT:0, dodgeCd:rand(.2,1.1), dodgeDir:moveDir, dodgePulse:0,
  });
}

function resetPlayerStageStart() {
  // Cada nueva etapa comienza desde el punto de partida, a la izquierda.
  // Conservamos HP, mejoras, armas y recursos: solo reiniciamos la posición/movimiento.
  G.player.x = 100;
  G.player.y = GROUND_Y - G.player.h;
  G.player.vx = 0;
  G.player.vy = 0;
  G.player.onGround = true;
  G.player.jumps = 0;
  G.player._jumpHeld = false;
  G.player._dashHeld = false;
  G.player._dashQueued = false;
  G.dashTimer = 0;
}

function startHorde(tier, label, onComplete) {
  resetPlayerStageStart();
  G.horde = { tier, kills: 0, params: hordeParams(tier), spawnTimer: 0.35, label, onComplete, spawned: 0, specialSpawned: false, specialCount: 0 };
  G.minions = [];
  G.enemyBullets = [];
  G.elevator = null;
  document.getElementById("boss-name-label").style.display = "none";
  document.getElementById("boss-bar-wrap").style.display = "none";
  updateHordeHud();
  showScreen("screen-game");
  G.state = "playing";
  G.mode = "horde";
  G.levelPulse = 1;
  G.transitionFlash = 0.35;
  configureFloorMechanic(Math.max(0, tier), "horde");
  Music.playExplore();
}

function updateHordeHud() {
  const h = G.horde;
  document.getElementById("hud-stage-label").textContent =
    `NIVEL ${G.level} · ${DIFFICULTIES[G.difficultyKey].label} · ${h.label} — ${h.kills}/${h.params.target}`;
}

function registerHit(target, bullet, dealt){
  G.hits++; G.damageDealt+=dealt; addDamageNumber(target.x+target.w/2,target.y,dealt,bullet.crit); addHitMarker(target.x+target.w/2,target.y+target.h/2,bullet.crit); Sound.hit();
}
function registerKill(target){
  G.kills++; G.combo++; G.maxCombo=Math.max(G.maxCombo,G.combo); G.comboT=2.6;
  const multiplier=1+Math.min(2,G.combo*0.05); G.score=Math.round(G.score*0 + (G.score));
  if(G.combo>1) Sound.combo();
  return multiplier;
}
function updateCombo(dt){
  if(G.comboT>0){G.comboT-=dt;if(G.comboT<=0){G.combo=0;}}
}

function bulletThreatensEntity(b,m,lookAhead=0.8,padding=30){
  const bx=b.x+b.w/2,by=b.y+b.h/2,mx=m.x+m.w/2,my=m.y+m.h/2,vx=b.vx||0,vy=b.vy||0,denom=vx*vx+vy*vy;
  if(denom<400)return null;
  const rx=mx-bx,ry=my-by,t=clamp((rx*vx+ry*vy)/denom,0,lookAhead),px=bx+vx*t,py=by+vy*t;
  return Math.hypot(px-mx,py-my)<=Math.max(m.w,m.h)*.5+padding?t:null;
}
function tryEnemyDodge(m,dt){
  const d=difficultyConfig(); if(!m||m.hp<=0||m.fromBoss)return;
  m.dodgeCd=Math.max(0,(m.dodgeCd||0)-dt); m.dodgeT=Math.max(0,(m.dodgeT||0)-dt); m.dodgePulse=Math.max(0,(m.dodgePulse||0)-dt);
  if(m.dodgeT>0||m.dodgeCd>0||!G.bullets.length)return;
  let threat=null,tt=Infinity; for(const b of G.bullets){const t=bulletThreatensEntity(b,m,.75,28);if(t!==null&&t<tt){threat=b;tt=t;}}
  if(!threat)return;
  const reaction=.10+.42*d.dodgePrecision; if(Math.random()>d.dodge+(tt<reaction?.14:0))return;
  m.dodgeT=.20+.14*d.dodgePrecision; m.dodgeCd=Math.max(.5,1.55-.8*d.dodgePrecision); m.dodgePulse=.35;
  if(["sniper","turret","orbiter","healer"].includes(m.type)||Math.abs(threat.vy||0)>Math.abs(threat.vx||0)*.45){m.y+=((threat.y+threat.h/2>m.y+m.h/2)?-1:1)*(18+26*d.dodgePrecision);}else{const dir=threat.x<m.x?1:-1;m.moveDir=dir;m.vx=dir*Math.abs(m.vx||80)*(1.2+.35*d.dodgePrecision);}
  G.enemyDodges++; spawnParticles(m.x+m.w/2,m.y+m.h/2,"#67e8ff",5,{speedMin:30,speedMax:100,lifeMin:.12,lifeMax:.3});
}
function rollEnemyBulletType(m, params) {
  const chance = params?.enemyMagneticChance ?? difficultyConfig().enemyMagneticChance;
  if (!chance || Math.random() >= chance) {
    return { type:"straight", turn:0 };
  }
  return {
    type:"magnetic",
    turn: params?.enemyMagneticTurn ?? difficultyConfig().enemyMagneticTurn
  };
}

function createEnemyBullet(m, dx, dy, speed, size, color, dmg, life=3, params=null) {
  const dist=Math.max(1,Math.hypot(dx,dy));
  const magnetic=rollEnemyBulletType(m,params);
  return {
    x:m.x+m.w/2, y:m.y+m.h/2, w:size, h:size,
    vx:dx/dist*speed, vy:dy/dist*speed,
    speed, dmg, type:magnetic.type, turn:magnetic.turn,
    color, life
  };
}

function updateHorde(dt) {
  const h = G.horde;
  h.spawnTimer -= dt;
  if (h.spawnTimer <= 0 && G.minions.length < h.params.cap && h.kills + G.minions.length < h.params.target) {
    spawnHordeMinion();
    h.spawnTimer = rand(h.params.spawnGapMin, h.params.spawnGapMax);
  }

  G.minions.forEach(m => {
    m.hitFlash = Math.max(0, (m.hitFlash || 0) - dt);
    m.phase += dt * (m.type === "turret" ? 1.2 : 4);
    tryEnemyDodge(m,dt);
    if (m.type === "healer") {
      m.healT -= dt;
      if (m.healT <= 0) {
        m.healT = rand(2.2,3.5);
        const target = G.minions.filter(x=>x!==m && x.hp>0).sort((a,b)=>b.hp/a.maxHp-a.hp/b.maxHp)[0];
        if (target) { target.hp=Math.min(target.maxHp,target.hp+target.maxHp*0.18); spawnParticles(target.x+target.w/2,target.y+target.h/2,"#62ff9b",10,{speedMin:20,speedMax:90}); Sound.uiClick(); }
      }
      m.y += (GROUND_Y-170-m.y)*dt*0.7;
    }
    if(m.type!=="shield") m.shielded=false;
    if (m.type === "shield") {
      G.minions.forEach(x=>{ if(x!==m && x.hp>0 && Math.hypot(x.x-m.x,x.y-m.y)<150) x.shielded=true; });
      m.y += (GROUND_Y-65-m.y)*dt*0.9;
    }
    if (m.type === "hunter") {
      const targetX=G.player.x + (G.player.x < m.x ? 70 : -70);
      m.vx = clamp((targetX-m.x)*1.8,-220,220);
      m.y += ((G.player.y+G.player.h/2-m.h/2)-m.y)*dt*1.8;
    }
    if (m.type === "orbiter") {
      m.y = m.originY + Math.sin(m.phase * m.orbitSpeed) * 42;
    }
    if (m.type === "sniper") {
      const wasTelegraphing = m.telegraph > 0;
      m.telegraph = Math.max(0, m.telegraph - dt);
      // Ajuste vertical suave hacia el centro del jugador, sin hacer que el enemigo
      // persiga de forma injusta.
      const targetY = G.player.y + G.player.h / 2 - m.h / 2;
      m.y += clamp(targetY - m.y, -55, 55) * dt * 0.7;
      m.y = clamp(m.y, GROUND_Y - 135, GROUND_Y - 70);

      // El sniper primero avisa y recién después dispara.
      // Esto evita que el telegraph sea solamente decorativo.
      if (wasTelegraphing && m.telegraph <= 0) {
        const dx = G.player.x + G.player.w / 2 - (m.x + m.w / 2);
        const dy = G.player.y + G.player.h / 2 - (m.y + m.h / 2);
        const speed = 300;
        G.enemyBullets.push(createEnemyBullet(m, dx, dy, speed, 10, "#ffea7a", m.bulletDmg, 4, h.params));
        Sound.enemyShoot();
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, "#ffea7a", 10, { speedMin: 50, speedMax: 140, lifeMin: .2, lifeMax: .5 });
      }
    }
    if (m.type === "mine") { m.vx = m.moveDir * 125; m.phase += dt * 3; }
    if (m.type === "charger") {
      m.chargeT -= dt;
      if (m.chargeT <= 0) {
        m.vx = m.moveDir * rand(260, 390);
        m.chargeT = rand(1.8, 3.0);
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, "#ff3d71", 5);
        shake(3, 0.08);
      } else {
        m.vx *= Math.pow(0.985, dt * 60);
      }
    }
    if (m.type === "turret") {
      m.y = GROUND_Y - 170 + Math.sin(m.phase) * 18;
      if(!m.dodgeT)m.vx=m.moveDir*(38+18*difficultyConfig().dodgePrecision);
      m.x += m.vx * dt;
    } else if (m.type !== "orbiter") { m.x += m.vx * dt; }
    if (m.type === "orbiter") {
      if(m.originX<=ARENA_L+20||m.originX>=W-90)m.moveDir*=-1;
      m.originX+=m.moveDir*70*dt; m.x=m.originX+Math.cos(m.phase*m.orbitSpeed)*m.orbitR;
    }
    if(m.x<=ARENA_L+12){m.x=ARENA_L+12;m.moveDir=1;if(Math.abs(m.vx)>20)m.vx=Math.abs(m.vx);}
    if(m.x+m.w>=ARENA_R-8){m.x=ARENA_R-8-m.w;m.moveDir=-1;if(Math.abs(m.vx)>20)m.vx=-Math.abs(m.vx);}
    m.x = clamp(m.x, ARENA_L, ARENA_R - m.w);

    // Nunca permitimos que un enemigo termine debajo del suelo.
    // Los dodges verticales de la IA pueden mover accidentalmente a un enemigo
    // de superficie por debajo de GROUND_Y, dejándolo fuera del alcance del mouse.
    // El clamp se aplica a TODOS los tipos como red de seguridad; los enemigos
    // aéreos siguen pudiendo moverse libremente por encima de esta línea.
    const floorLimit = GROUND_Y - m.h;
    m.y = clamp(m.y, 24, floorLimit);
    m.shootT -= dt;
    if (m.shootT <= 0 && m.x < W - 40 && m.type !== "mine" && m.type !== "sniper") {
      m.shootT = rand(h.params.shootMin, h.params.shootMax) * (m.type === "turret" ? 0.72 : m.type === "orbiter" ? 1.1 : 1);
      const dx = G.player.x + G.player.w / 2 - (m.x + m.w / 2);
      const dy = G.player.y + G.player.h / 2 - (m.y + m.h / 2);
      const speed = m.type === "turret" ? 250 : 260;
      const color = m.type === "charger" ? "#ff3d71" : m.type === "mine" ? "#ff4d8d" : m.elite ? "#ff5f5f" : "#ff8a5c";
      const bullet = createEnemyBullet(m, dx, dy, speed, m.type === "turret" ? 10 : 8, color, m.bulletDmg, 3, h.params);
      // Turret/orbiter mantienen una ligera corrección propia, pero ahora la
      // habilidad "Núcleo magnético" se reparte probabilísticamente entre todos.
      if (bullet.type === "straight" && (m.type === "turret" || m.type === "orbiter")) {
        bullet.type = "magnetic";
        bullet.turn = m.type === "turret" ? h.params.enemyMagneticTurn * 0.85 : h.params.enemyMagneticTurn * 0.65;
      }
      G.enemyBullets.push(bullet);
      Sound.enemyShoot();
    }

    // El sniper usa un ciclo separado: apunta -> espera -> dispara.
    if (m.type === "sniper" && m.shootT <= 0 && m.telegraph <= 0 && m.x < W - 40) {
      m.shootT = rand(h.params.shootMin, h.params.shootMax) * 1.45;
      m.telegraph = 0.65;
      spawnParticles(m.x + m.w / 2, m.y + m.h / 2, "#ffea7a", 7, {speedMin:20,speedMax:80,lifeMin:.2,lifeMax:.45});
    }
    if (overlap(m, G.player)) {
      hurtPlayer(m.contactDmg);
      if (m.type === "mine") {
        m.hp = 0;
        spawnParticles(m.x + m.w/2, m.y + m.h/2, "#ff4d8d", 22, {speedMin:80,speedMax:260,lifeMin:.25,lifeMax:.7});
        shake(7, .18);
      }
    }
  });

  G.bullets.forEach(b => {
    G.minions.forEach(m => {
      if (!b.dead && m.hp > 0 && overlap(b, m)) {
        if (b.hitIds && b.hitIds.has(m)) return;
        if (b.hitIds) b.hitIds.add(m);
        const blocked = m.shielded && m.type !== "shield";
        const dealt = blocked ? b.dmg * 0.45 : b.dmg;
        m.hp -= dealt;
        registerHit(m,b,dealt);
        if (blocked) spawnParticles(m.x+m.w/2,m.y+m.h/2,"#ffe47a",4,{speedMin:30,speedMax:80});
        m.hitFlash = 0.12;
        if(G.explosiveRounds || (G.synergies||[]).includes("CRITICAL BLAST")) explodeAt(b.x+b.w/2,b.y+b.h/2,b.dmg*0.55,"#ffb454");
        if (!b.pierce) { b.dead = true; b.x = -999; }
        spawnParticles(m.x + m.w / 2, m.y + m.h / 2, m.elite ? "#ff5f5f" : "#ff8a5c", m.elite ? 8 : 5);
        if (m.hp <= 0) {
          Sound.minionDown();
          let killScrap = Math.round((m.elite ? 16 : 8 + (m.type === "healer" || m.type === "shield" || m.type === "hunter" ? 7 : 0)) * G.scrapMult); if(G.selectedPet==="mimic" && Math.random()<0.15){killScrap*=2;Sound.petAbility();} G.scrap += killScrap;
          G.score += Math.round((m.elite ? 90 : m.type === "turret" ? 70 : m.type === "splitter" ? 65 : m.type === "charger" ? 55 : m.type === "sniper" ? 85 : m.type === "orbiter" ? 75 : m.type === "mine" ? 70 : 40) * (1+Math.min(2,G.combo*.05)));
          h.kills++; registerKill(m);
          spawnParticles(m.x + m.w / 2, m.y + m.h / 2, m.type === "charger" ? "#ff3d71" : "#ff8a5c", m.type === "splitter" ? 16 : 10);
          if (m.type === "splitter" && h.kills + G.minions.length < h.params.target) {
            for (let i = 0; i < 2; i++) G.minions.push({
              x: m.x + i * 12, y: GROUND_Y - 22, w: 18, h: 22, hp: 7 + h.tier * 2, maxHp: 7 + h.tier * 2,
              vx: -rand(150, 210) * (i ? 1 : 0.75), shootT: rand(1.4, 2.1), bulletDmg: h.params.bulletDmg * 0.7,
              contactDmg: h.params.contactDmg * 0.7, elite: false, type: "shard", phase: rand(0, 6), chargeT: 0, hitFlash: 0
            });
          }
        }
      }
    });
  });
  G.minions = G.minions.filter(m => m.hp > 0);
  G.bullets = G.bullets.filter(b => !b.dead);

  updateHordeHud();

  if (h.kills >= h.params.target && G.minions.length === 0) {
    const onComplete = h.onComplete;
    G.horde = null;
    maybeRandomEvent(onComplete);
  }
}

function maybeRandomEvent(nextFn){
  if(!G.secretFound && Math.random()<0.035){ G.secretFound=true; G.scrap+=250; G.score+=150; Sound.secret(); const el=document.createElement("div"); el.className="secret-banner"; el.textContent="✦ SECRET CACHE // +250 SCRAP"; document.getElementById("screen-game").appendChild(el); setTimeout(()=>el.remove(),1800); nextFn(); return; }
  if(G.eventUsed || Math.random()>0.42){ nextFn(); return; }
  G.eventUsed=true; G.pendingEvent=nextFn; G.state="event"; showScreen("screen-event"); Sound.event();
  const events=[
    {title:"CACHE OLVIDADA",desc:"Encontraste un repositorio abandonado. Elige una recompensa.",opts:[{name:"RECOGER SCRAP",desc:"+180 Scrap",run(){G.scrap+=180;}},{name:"REPARAR SISTEMA",desc:"+35 HP",run(){G.player.hp=Math.min(G.player.maxHp,G.player.hp+35);}}]},
    {title:"OVERCLOCK",desc:"El sistema puede forzarse por unos segundos... y quizá durante todo el piso.",opts:[{name:"FORZAR CPU",desc:"+20% cadencia",run(){G.eventMods.fireRate*=0.8;}},{name:"MODO SEGURO",desc:"+20 HP y +20 Scrap",run(){G.player.hp=Math.min(G.player.maxHp,G.player.hp+20);G.scrap+=20;}}]},
    {title:"ANOMALÍA",desc:"Un proceso desconocido ofrece poder a cambio de riesgo.",opts:[{name:"ACEPTAR",desc:"+35% daño · +100 Scrap",run(){G.eventMods.damage*=1.35;G.scrap+=100;}},{name:"CERRAR PROCESO",desc:"+15 HP máximo",run(){G.player.maxHp+=15;G.player.hp+=15;}}]}
  ];
  const ev=events[Math.floor(Math.random()*events.length)]; document.getElementById("event-title").textContent=ev.title; document.getElementById("event-desc").textContent=ev.desc;
  const wrap=document.getElementById("event-options"); wrap.innerHTML=""; ev.opts.forEach(o=>{const b=document.createElement("button");b.className="event-card";b.innerHTML=`<strong>${o.name}</strong><span>${o.desc}</span>`;b.onclick=()=>{Sound.uiClick();o.run();G.state="playing";nextFn();};wrap.appendChild(b);});
}

function startBossFight(index) {
  resetPlayerStageStart();
  G.bossDamageTaken=0;
  const def = BOSSES[index];
  const d = difficultyConfig();
  const ngHp = G.newGamePlus ? 1.35 : 1;
  const bossMaxHp = Math.round(def.maxHp * d.bossHp * ngHp);
  const bossAttackEvery = def.attackEvery / d.bossAttack * (G.newGamePlus ? 0.86 : 1);
  const bossDef = {...def, maxHp: bossMaxHp, attackEvery: bossAttackEvery, contactDmg: Math.round(def.contactDmg * d.bossDamage * (G.newGamePlus ? 1.15 : 1)), moveSpeed: def.moveSpeed * d.bossSpeed};
  G.boss = {
    def: bossDef, x: W + 90, y: GROUND_Y - (def.key==="simsimi" ? 104 : 70), w: def.key==="simsimi" ? 84 : 60, h: def.key==="simsimi" ? 104 : 70,
    hp: bossMaxHp, maxHp: bossMaxHp,
    vx: 0, targetX: W - 200, retargetT: 1 / d.bossSpeed,
    attackT: bossAttackEvery * 0.6,
    telegraphThresh: bossAttackEvery * 0.3,
    phase: 0, invuln: 0,
    summonT: 3, dashT: 0, dashVx: 0,
    enraged: false, phaseLevel: 1, phasePulse: 0, dodgeCd:rand(.4,.9), dodgeT:0, dodgeVx:0, dodgeJumpV:0, dodgeStyle:0, dodgePulse:0,
  };
  G.player.hp = Math.min(G.player.hp + 15, G.player.maxHp);
  G.enemyBullets = [];
  G.bullets = [];
  G.minions = [];
  G.elevator = null;
  document.getElementById("hud-stage-label").textContent = `NIVEL ${G.level} · ${FLOOR_THEMES[index]} · ${DIFFICULTIES[G.difficultyKey].label} · PISO ${index + 1}/${BOSSES.length}`;
  document.getElementById("boss-name-label").textContent = def.name.toUpperCase();
  document.getElementById("boss-name-label").style.display = "inline";
  document.getElementById("boss-bar-wrap").style.display = "block";
  showScreen("screen-game");
  G.state = "playing";
  G.mode = "bossIntro";
  G.levelPulse = 1;
  G.transitionFlash = 0.7;
  configureFloorMechanic(index, "boss");

  G.bossIntro = { index, t: 0, duration: 3.15, startX: W + 90, targetX: W - 200 };
  bossIntroOverlay.style.setProperty("--boss-color", def.color);
  bossIntroOverlay.classList.remove("show", "closing");
  bossIntroKicker.textContent = `PISO ${index + 1} // PROCESO HOSTIL DETECTADO`;
  bossIntroName.textContent = def.name.toUpperCase();
  bossIntroQuote.textContent = `"${def.quote}"`;
  bossIntroMeta.textContent = `HP ${G.boss.maxHp}  ·  ${d.label}  ·  PROTOCOLO ${String(index + 1).padStart(2, "0")}${G.newGamePlus?" · NEW GAME+":""}  ·  PREPARATE`;
  void bossIntroOverlay.offsetWidth;
  bossIntroOverlay.classList.add("show");
  Sound.bossIntro();
  Music.playBattle(false);
}

function updateBossIntro(dt) {
  const intro = G.bossIntro;
  const boss = G.boss;
  if (!intro || !boss) return;
  intro.t += dt;

  const p = clamp(intro.t / 1.35, 0, 1);
  const ease = 1 - Math.pow(1 - p, 3);
  boss.x = intro.startX + (intro.targetX - intro.startX) * ease;
  boss.y = GROUND_Y - boss.h + Math.sin(intro.t * 8) * (p < 0.85 ? 2.5 : 1.2);

  if (Math.random() < dt * 22) {
    spawnParticles(
      boss.x + boss.w / 2 + rand(-24, 24),
      boss.y + rand(6, boss.h - 4),
      boss.def.color,
      1
    );
  }

  if (intro.t >= intro.duration) {
    G.bossIntro = null;
    G.mode = "boss";
    boss.x = intro.targetX;
    boss.y = GROUND_Y - boss.h;
    boss.attackT = boss.def.attackEvery * 0.85;
    boss.retargetT = 0.9;
    bossIntroOverlay.classList.remove("show");
    bossIntroOverlay.classList.add("closing");
    setTimeout(() => bossIntroOverlay.classList.remove("closing"), 280);
    G.transitionFlash = 0.28;
  }
}

/* =========================================================
   ASCENSOR — se desbloquea al superar un piso. El jugador debe
   caminar hasta él y entrar; recién ahí se pregunta la mejora.
   ========================================================= */
function startElevatorWait(defeatedIndex, nextFloor) {
  // El piso queda completamente seguro al derrotar al jefe.
  // No debe quedar ningun laser/vent/zona activa mientras el jugador va al ascensor.
  G.hazards = [];
  G.floorMechanic = null;
  G.enemyBullets = [];
  G.minions = [];
  G.elevator = {
    x: ARENA_R - 96, y: GROUND_Y - 132, w: 74, h: 132,
    nextFloor, defeatedName: BOSSES[defeatedIndex].name, entered: false,
  };
  document.getElementById("boss-name-label").style.display = "none";
  document.getElementById("boss-bar-wrap").style.display = "none";
  document.getElementById("hud-stage-label").textContent =
    `NIVEL ${G.level} · PISO ${defeatedIndex + 1} SUPERADO — ve al ascensor`;
  G.mode = "elevator";
  Music.playExplore();
}

function updateElevatorWait(dt) {
  const el = G.elevator;
  if (!el || el.entered) return;
  if (overlap(G.player, el)) {
    el.entered = true;
    Sound.floorEnter();
    const nextFloor = el.nextFloor;
    const defeatedName = el.defeatedName;
    G.elevator = null;
    showLevelUp(defeatedName, () => goToFloorScreen(nextFloor));
  }
}

function triggerGameOver() {
  G.state = "gameover";
  Music.stop();
  Sound.gameOver();
  let floorTxt = "el camino al servidor";
  if (G.mode === "boss") {
    floorTxt = `piso ${G.floorIndex + 1} (${BOSSES[G.floorIndex].name})`;
  } else if (G.mode === "horde" && G.horde && G.horde.tier >= 0) {
    floorTxt = `la horda del piso ${G.horde.tier + 1}`;
  }
  G.runTime=(performance.now()-G.runStart)/1000;
  document.getElementById("gameover-msg").textContent = `Tu proceso fue terminado en ${floorTxt}. Puntaje final: ${G.score}.`;
  showRunStats("gameover-stats"); saveProfile({run:true});
  showScreen("screen-gameover");
}

function triggerWin() {
  G.state = "win";
  Music.stop();
  Sound.victory();
  Sound.finish();
  G.runTime=(performance.now()-G.runStart)/1000; G.fastestWin=G.runTime;
  document.getElementById("win-score").textContent = `Puntaje: ${G.score}`;
  const winLore=document.getElementById("win-lore"); if(winLore) winLore.textContent = G.secretBossUnlocked ? "Venciste a las siete IAs. SimSimi quedó sin nada que decir." : "Venciste a las seis IAs. El código sigue vivo, y sigue siendo tuyo. Por ahora.";
  document.getElementById("win-name").value = window._devName || ""; showRunStats("win-stats"); saveProfile({run:true,win:true,hackerWin:G.difficultyKey==="hacker",hardBossWin:false});
  document.getElementById("btn-submit-score").textContent = "> guardar_puntaje";
  showScreen("screen-win");
}

/* =========================================================
   UTILIDADES
   ========================================================= */
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }
function spawnParticles(x, y, color, n = 8, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(opts.speedMin ?? 70, opts.speedMax ?? 220);
    G.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.lift ?? 40), life: rand(opts.lifeMin ?? 0.3, opts.lifeMax ?? 0.7),
      maxLife: opts.lifeMax ?? 0.7, color, size: rand(opts.sizeMin ?? 2, opts.sizeMax ?? 5), gravity: opts.gravity ?? 500,
    });
  }
}
function shake(mag, t) { G.shakeMag = mag; G.shakeT = t; }

/* =========================================================
   ACTUALIZACION — JUGADOR
   ========================================================= */
const GRAVITY = 1500;
const MOVE_SPEED = 250;
const JUMP_VEL = -560;
const WEAPONS = {
  pistol:{label:"PISTOL",cd:.22,speed:620,damage:10,color:"#39ff88",count:1,spread:0},
  shotgun:{label:"SHOTGUN",cd:.58,speed:560,damage:7,color:"#ffd166",count:5,spread:.18},
  railgun:{label:"RAILGUN",cd:.9,speed:980,damage:34,color:"#67e8ff",count:1,spread:0,pierce:true},
  plasma:{label:"PLASMA",cd:.38,speed:430,damage:18,color:"#c084fc",count:1,spread:0,large:true},
  trap:{label:"TRAP",cd:.72,speed:390,damage:24,color:"#ff5f8f",count:1,spread:0,stationary:true}
};

function updatePlayer(dt) {
  const p = G.player;
  const left = keys["ArrowLeft"] || keys["KeyA"];
  const right = keys["ArrowRight"] || keys["KeyD"];
  const jump = keys["Space"] || keys["ArrowUp"] || keys["KeyW"];
  const shoot = keys["KeyJ"] || keys["KeyZ"] || mouseAim.down;
  const dashPressed = keys["ShiftLeft"] || keys["ShiftRight"];
  const effectiveMove = G.moveSpeedMult * G.eventMods.move;

  p.vx = 0;
  if (left) { p.vx = -MOVE_SPEED * effectiveMove; p.facing = -1; }
  if (right) { p.vx = MOVE_SPEED * effectiveMove; p.facing = 1; }

  if (G.dashCooldown > 0) G.dashCooldown -= dt;
  if (G.dashTimer > 0) {
    G.dashTimer -= dt;
    p.vx = p.facing * 760;
    p.vy = 0;
    G.dashInvuln = Math.max(G.dashInvuln, 0.08);
  } else if (G.dashUnlocked && p._dashQueued && G.dashCooldown <= 0) {
    // El dash se dispara desde keydown y no depende de que SHIFT siga presionado.
    // Esto evita que una pulsación rápida se pierda entre dos frames.
    p._dashQueued = false;
    G.dashTimer = 0.16;
    G.dashCooldown = 1.15;
    G.dashInvuln = 0.22;
    Sound.dash();
    spawnParticles(p.x+p.w/2,p.y+p.h/2,"#67e8ff",18,{speedMin:80,speedMax:280,lifeMin:.15,lifeMax:.45});
    shake(3,.08);
  }
  p._dashHeld = dashPressed;
  if (G.dashInvuln > 0) G.dashInvuln -= dt;

  if (jump && !p._jumpHeld) {
    if (p.onGround) {
      p.vy = JUMP_VEL;
      p.onGround = false;
      p.usedDoubleJump = false;
      Sound.jump();
    } else if (G.doubleJumpUnlocked && !p.usedDoubleJump) {
      p.vy = JUMP_VEL * 0.85;
      p.usedDoubleJump = true;
      Sound.jump();
    }
  }
  p._jumpHeld = jump;

  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  p.x = clamp(p.x, ARENA_L, ARENA_R - p.w);

  if (p.y + p.h >= GROUND_Y) {
    p.y = GROUND_Y - p.h;
    p.vy = 0;
    p.onGround = true;
  }

  if (p.vx !== 0 && p.onGround) p.animT += dt * 9;

  p.shootCd -= dt;
  if (shoot && p.shootCd <= 0) {
    const weapon=WEAPONS[G.weapon]||WEAPONS.pistol;
    const simsimiCadencePenalty = G.simsimiSlowT > 0 ? 1.75 : 1;
    p.shootCd = weapon.cd * G.fireRateMult * G.eventMods.fireRate * simsimiCadencePenalty;
    p.shootAnim = 0.12;
    const startX=p.x+p.w/2, startY=p.y+17;
    let baseDx=p.facing, baseDy=0;
    if(mouseAim.active){baseDx=mouseAim.x-startX;baseDy=mouseAim.y-startY;const len=Math.max(1,Math.hypot(baseDx,baseDy));baseDx/=len;baseDy/=len;p.facing=baseDx>=0?1:-1;}
    const count=weapon.count+(G.extraBullet?1:0)+(G.petResonance>0?2:0); if(G.petResonance>0){G.petResonance=0;Sound.petAbility();}
    G.shots+=count;
    for(let i=0;i<count;i++){
      const spread=weapon.spread?((i-(count-1)/2)*weapon.spread):0;
      const ang=Math.atan2(baseDy,baseDx)+spread;
      let dmg=(weapon.damage+G.bulletDmgBonus)*G.eventMods.damage;
      const crit=Math.random()<G.critChance; if(crit){dmg*=G.critMult;Sound.crit();}
      const w=weapon.large?14:weapon.pierce?16:10, h=weapon.large?14:weapon.pierce?4:5;
      G.bullets.push({
        x:startX-w/2,y:startY-h/2,w,h,
        vx:Math.cos(ang)*weapon.speed,vy:Math.sin(ang)*weapon.speed,
        speed:weapon.speed, dmg, color:weapon.color, pierce:!!weapon.pierce, crit,
        life:weapon.stationary ? undefined : (G.homingBullets ? 1.75 : (weapon.pierce ? 1.4 : 3)), hitIds:new Set(), stationary:!!weapon.stationary,
        armT:weapon.stationary?0.20:0, homingTurn:8.0, homingLife:G.homingBullets ? 1.75 : undefined
      });
    }
    Sound.shoot();
  }
  if (p.shootAnim > 0) p.shootAnim -= dt;

  if (p.invuln > 0) p.invuln -= dt;
  if (p.hurtFlash > 0) p.hurtFlash -= dt;
  if (G.simsimiSlowT > 0) G.simsimiSlowT = Math.max(0, G.simsimiSlowT - dt);

  document.getElementById("player-hp-fill").style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
  const shieldEl=document.getElementById("player-shield-fill"); if(shieldEl) shieldEl.style.width=`${G.shieldMax?clamp(G.shield/G.shieldMax*100,0,100):0}%`;
  const scrapEl=document.getElementById("hud-scrap"); if(scrapEl) scrapEl.textContent=`SCRAP ${G.scrap}`;
  const dashEl=document.getElementById("hud-dash"); if(dashEl) dashEl.textContent=G.dashUnlocked?(G.dashCooldown<=0?"DASH READY":"DASH "+G.dashCooldown.toFixed(1)):"DASH —"; const petEl=document.getElementById("hud-pet"); if(petEl){const pd=petDef();petEl.textContent=pd?`PET ${pd.name}`:"PET —";}
  updateCombatHud();
  if(G.regen && G.hpRegenT===undefined) G.hpRegenT=1;
  if(G.regen){ G.hpRegenT-=dt; if(G.hpRegenT<=0){p.hp=Math.min(p.maxHp,p.hp+1);G.hpRegenT=1;} }
}

function hurtPlayer(amount, source = null) {
  const p = G.player;
  if (p.invuln > 0 || G.dashInvuln > 0 || G.petShieldT > 0) return;
  if (petCanDodge()) return;
  if (G.selectedPet === "sentinel" && G.petAbilityT <= 0) { petFirewall(); return; }
  if (p.hp - amount <= 0 && G.selectedPet === "phoenix" && petPhoenix()) return;
  if (p.hp - amount <= 0 && petReboot()) return;
  if ((source?.type === "insult") || (G.boss?.def?.key === "simsimi" && G.mode === "boss")) {
    G.simsimiSlowT = Math.max(G.simsimiSlowT, 4.0);
    G.simsimiInsult = source?.insult || G.simsimiInsult || "...";
    showSecretBanner(`SIMSIMI: ${G.simsimiInsult} // CADENCIA -43%`);
  }
  let remaining=amount;
  if(G.shield>0){ const absorbed=Math.min(G.shield,remaining); G.shield-=absorbed; remaining-=absorbed; spawnParticles(p.x+13,p.y+20,"#67e8ff",8,{speedMin:30,speedMax:100}); }
  p.hp -= remaining;
  G.damageTaken += Math.max(0, amount);
  if(G.mode === "boss") G.bossDamageTaken += Math.max(0, amount);
  p.invuln = 0.9 + G.invulnBonus;
  p.hurtFlash = 0.25;
  shake(6, 0.2);
  Sound.playerHurt();
  if (p.hp <= 0) {
    p.hp = 0;
    triggerGameOver();
  }
}

const lowHpVignetteEl = document.getElementById("low-hp-vignette");
function updateLowHpEffect(dt) {
  const p = G.player;
  if (!p) return;
  const low = p.hp > 0 && p.hp / p.maxHp <= 0.25;
  if (lowHpVignetteEl) lowHpVignetteEl.classList.toggle("active", low);
  canvas.classList.toggle("hp-critical", low);
  if (low) {
    p.hpWarnT = (p.hpWarnT ?? 0) - dt;
    if (p.hpWarnT <= 0) {
      Sound.heartbeat();
      p.hpWarnT = 0.85;
    }
  } else {
    p.hpWarnT = 0;
  }
}

/* =========================================================
   ACTUALIZACION — BALAS DEL JUGADOR
   ========================================================= */
function explodeAt(x,y,damage,color){
  spawnParticles(x,y,color,20,{speedMin:60,speedMax:260,lifeMin:.2,lifeMax:.7}); shake(3,.08);
  const targets=[...G.minions]; if(G.boss) targets.push(G.boss);
  targets.forEach(t=>{
    if(!t||t.hp<=0||Math.hypot((t.x+t.w/2)-x,(t.y+t.h/2)-y)>=58)return;
    t.hp-=damage;
    if(t.hp<=0 && t!==G.boss){
      if(G.horde){ G.horde.kills++; }
      G.scrap+=Math.round(6*G.scrapMult); G.score+=20;
      spawnParticles(t.x+t.w/2,t.y+t.h/2,color,8);
    }
  });
}

function updateBullets(dt) {
  G.bullets.forEach(b => {
    if (!Number.isFinite(b.vx)) b.vx = 0;
    if (!Number.isFinite(b.vy)) b.vy = 0;

    // Los proyectiles estacionarios se arman después de un instante corto:
    // eso evita que nazcan dentro del jugador y que puedan dañarlo al instante.
    if (b.stationary) {
      if (b.armT > 0) {
        b.armT -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.armT <= 0) {
          b.vx = 0;
          b.vy = 0;
          b.armed = true;
        }
      } else {
        b.vx = 0;
        b.vy = 0;
      }
      if (b.life !== undefined) b.life -= dt;
      return;
    }

    if(G.homingBullets){
      let target=null, best=Infinity;
      for(const m of G.minions){
        if(m.hp<=0) continue;
        const dx=(m.x+m.w/2)-b.x, dy=(m.y+m.h/2)-b.y, d=dx*dx+dy*dy;
        if(d<best){best=d;target=m;}
      }
      if(G.boss && G.boss.hp>0){
        const dx=(G.boss.x+G.boss.w/2)-b.x, dy=(G.boss.y+G.boss.h/2)-b.y, d=dx*dx+dy*dy;
        if(d<best){best=d;target=G.boss;}
      }
      if(target){
        // Homing por ángulo + velocidad constante. A diferencia de interpolar
        // vx/vy, esto nunca colapsa la magnitud de la velocidad a ~0 cuando el
        // jugador dispara hacia abajo mientras está en el aire.
        const speed=Math.max(80, Number.isFinite(b.speed)?b.speed:Math.hypot(b.vx,b.vy)||620);
        const desired=Math.atan2((target.y+target.h/2)-b.y,(target.x+target.w/2)-b.x);
        let current=Math.atan2(b.vy,b.vx);
        let delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current));
        const maxTurn=(b.homingTurn||7.5)*dt;
        delta=clamp(delta,-maxTurn,maxTurn);
        current+=delta;
        b.vx=Math.cos(current)*speed;
        b.vy=Math.sin(current)*speed;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if(b.life!==undefined) b.life-=dt;
  });

  G.bullets = G.bullets.filter(b =>
    !b.dead && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30 && (b.life===undefined || b.life>0)
  );
}

/* =========================================================
   PATRONES DE ATAQUE DE JEFES
   ========================================================= */
function bossFireAt(boss, opts = {}) {
  const p = G.player;
  const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
  const dx = (p.x + p.w / 2) - bx, dy = (p.y + p.h / 2) - by;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const speed = opts.speed || 260;
  G.enemyBullets.push({
    x: bx, y: by, w: opts.size || 10, h: opts.size || 10,
    vx: (dx / dist) * speed, vy: (dy / dist) * speed,
    dmg: opts.dmg || boss.def.contactDmg,
    type: opts.type || "straight",
    color: boss.def.color,
    gravity: opts.gravity || 0,
    turn: opts.turn || 0,
    life: opts.life || 4,
  });
  Sound.enemyShoot();
}

function bossBulletThreat(boss){let best=null,bt=Infinity;for(const b of G.bullets){const t=bulletThreatensEntity(b,boss,.9,44);if(t!==null&&t<bt){best=b;bt=t;}}return best?{bullet:best,time:bt}:null;}
function tryBossDodge(boss,dt){
  const d=difficultyConfig(); boss.dodgeCd=Math.max(0,(boss.dodgeCd||0)-dt); boss.dodgeT=Math.max(0,(boss.dodgeT||0)-dt); boss.dodgePulse=Math.max(0,(boss.dodgePulse||0)-dt);
  if(boss.dodgeT>0||boss.dodgeCd>0||boss.invuln>0)return; const threat=bossBulletThreat(boss); if(!threat)return;
  const reaction=.08+.45*d.dodgePrecision; if(Math.random()>d.dodge+(threat.time<reaction?.12:0))return;
  boss.dodgeCd=Math.max(.45,1.25-.65*d.dodgePrecision);boss.dodgeT=.18+.14*d.dodgePrecision;boss.dodgePulse=.35;boss.dodgeStyle=(boss.phaseLevel+G.floorIndex)%3;
  const b=threat.bullet; if(boss.dodgeStyle===0){const away=b.x<boss.x?1:-1;boss.dodgeVx=away*(360+220*d.dodgePrecision);}else if(boss.dodgeStyle===1){boss.dodgeVx=(b.y<boss.y?1:-1)*(260+180*d.dodgePrecision);boss.dodgeJumpV=-420-180*d.dodgePrecision;}else{boss.dodgeVx=(Math.random()<.5?-1:1)*(420+260*d.dodgePrecision);boss.dodgeJumpV=-220-140*d.dodgePrecision;}
  G.bossDodges++;spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,boss.def.color,16,{speedMin:60,speedMax:220,lifeMin:.15,lifeMax:.45});shake(3,.08);
}
function updateBossAI(dt) {
  const boss = G.boss;
  const def = boss.def;
  tryBossDodge(boss,dt);
  if(boss.dodgeT>0){boss.x+=boss.dodgeVx*dt;if(boss.dodgeJumpV){boss.y+=boss.dodgeJumpV*dt;boss.dodgeJumpV+=1050*dt;}boss.x=clamp(boss.x,ARENA_L+60,ARENA_R-boss.w);boss.y=clamp(boss.y,GROUND_Y-220,GROUND_Y-boss.h);if(boss.y>=GROUND_Y-70){boss.y=GROUND_Y-70;boss.dodgeJumpV=0;}}

  // movimiento: elige objetivo x aleatorio dentro de la arena periodicamente
  boss.retargetT -= dt;
  if (boss.retargetT <= 0) {
    boss.targetX = rand(W - 500, W - 120);
    boss.retargetT = rand(1.2, 2.4);
  }
  const dir = Math.sign(boss.targetX - boss.x);
  const moveMult = boss.enraged ? 1.25 : 1;
  if(boss.dodgeT<=0){boss.x += dir * def.moveSpeed * moveMult * dt;boss.x=clamp(boss.x,W/2-40,ARENA_R-boss.w);boss.y=GROUND_Y-boss.h+Math.sin(performance.now()/400)*8;}

  // Todos los jefes tienen fases: el final conserva su comportamiento especial,
  // pero ahora cada IA cambia de ritmo al 65% y 30% de vida.
  const hpRatio=boss.hp/boss.maxHp;
  const nextPhase=hpRatio<=0.30?3:hpRatio<=0.65?2:1;
  if(nextPhase>boss.phaseLevel){
    boss.phaseLevel=nextPhase; boss.phasePulse=1; boss.enraged=nextPhase>=3; boss.attackT=Math.min(boss.attackT,.25);
    shake(9,0.28); Sound.bossIntro(); Music.playBattle(nextPhase>=3);
    spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,def.color,28,{speedMin:80,speedMax:300,lifeMin:.25,lifeMax:.7});
  }
  const phaseSpeed=1+(boss.phaseLevel-1)*0.14;
  const effAttackEvery = def.attackEvery / phaseSpeed;

  boss.attackT -= dt;
  if (boss.invuln > 0) boss.invuln -= dt;
  if (boss.insultT > 0) boss.insultT = Math.max(0, boss.insultT - dt);

  if (boss.attackT <= 0) {
    boss.attackT = effAttackEvery;
    boss.telegraphThresh = Math.min(0.22, effAttackEvery * 0.35);
    runPattern(boss);
  }

  if (def.pattern === "summon") {
    boss.summonT -= dt;
    if (boss.summonT <= 0 && G.minions.length < 2) {
      boss.summonT = rand(4, 6);
      G.minions.push({
        x: boss.x, y: GROUND_Y - 30, w: 24, h: 28, hp: 12 * difficultyConfig().hp,
        vx: -rand(60, 100), shootT: rand(1, 2), fromBoss: true,
      });
    }
  }
}

function runPattern(boss) {
  const def = boss.def;
  switch (def.pattern) {
    case "lob": {
      bossFireAt(boss, { speed: 220, size: 12, type: "lob", gravity: 620, dmg: difficultyBossDamage(8) });
      break;
    }
    case "dash": {
      // embestida horizontal rapida hacia el jugador
      const dir = Math.sign(G.player.x - boss.x) || 1;
      boss.dashVx = dir * 620;
      boss.dashT = 0.35;
      Sound.enemyShoot();
      break;
    }
    case "homing": {
      for (let i = -1; i <= 1; i++) {
        bossFireAt(boss, { speed: 200, size: 9, type: "homing", turn: 2.4, dmg: difficultyBossDamage(9) });
      }
      break;
    }
    case "burst": {
      const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
      for (let a = -2; a <= 2 + (boss.phaseLevel-1); a++) {
        const ang = Math.atan2(G.player.y - by, G.player.x - bx) + a * 0.22;
        G.enemyBullets.push({
          x: bx, y: by, w: 8, h: 8, vx: Math.cos(ang) * 340, vy: Math.sin(ang) * 340,
          dmg: difficultyBossDamage(8), type: "straight", color: def.color, life: 3,
        });
      }
      Sound.enemyShoot();
      break;
    }
    case "summon": {
      const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;
      for (let a = -1; a <= 1; a++) {
        const ang = Math.atan2(G.player.y - by, G.player.x - bx) + a * 0.35;
        G.enemyBullets.push({
          x: bx, y: by, w: 9, h: 9, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300,
          dmg: difficultyBossDamage(9), type: "straight", color: def.color, life: 3,
        });
      }
      Sound.enemyShoot();
      break;
    }
    case "simsimi": {
      const insults = [
        "sos un bug con patas",
        "tu puntería pide vacaciones",
        "he visto bots jugar mejor que vos",
        "tu build da pena",
        "compilá primero, campeón",
        "ese disparo fue decorativo",
        "te falta una actualización"
      ];
      const bx=boss.x+boss.w/2, by=boss.y+boss.h/2;
      const insult=insults[Math.floor(Math.random()*insults.length)];
      const ang=Math.atan2(G.player.y+G.player.h/2-by,G.player.x+G.player.w/2-bx);
      G.enemyBullets.push({x:bx,y:by,w:12,h:12,vx:Math.cos(ang)*275,vy:Math.sin(ang)*275,speed:275,dmg:difficultyBossDamage(12),type:"insult",color:"#ffe15a",life:4,insult});
      if(boss.phaseLevel>=2){
        const spread=.18;
        for(const off of [-spread,spread]) G.enemyBullets.push({x:bx,y:by,w:10,h:10,vx:Math.cos(ang+off)*315,vy:Math.sin(ang+off)*315,speed:315,dmg:difficultyBossDamage(9),type:"insult",color:"#ff9f43",life:3.4,insult:insults[Math.floor(Math.random()*insults.length)]});
      }
      Sound.simsimiAttack();
      boss.currentInsult=insult; boss.insultT=1.7;
      break;
    }
    case "final": {
      // Jefe final: 4 patrones en rotacion, sin turnos "gratis" — cada
      // fase representa una amenaza real que hay que esquivar.
      boss.phase = (boss.phase + 1) % 4;
      const bx = boss.x + boss.w / 2, by = boss.y + boss.h / 2;

      if (boss.phase === 0) {
        // par de proyectiles homing que se separan y luego persiguen
        bossFireAt(boss, { speed: 240, size: 10, type: "homing", turn: 3.2, dmg: difficultyBossDamage(11) });
        const ang = Math.atan2(G.player.y - by, G.player.x - bx) - 0.5;
        G.enemyBullets.push({ x: bx, y: by, w: 10, h: 10, vx: Math.cos(ang) * 240, vy: Math.sin(ang) * 240, dmg: difficultyBossDamage(11), type: "homing", turn: -3.2, color: def.color, life: 4 });
      } else if (boss.phase === 1) {
        // lluvia de fragmentos en abanico hacia abajo
        for (let a = -3; a <= 3; a++) {
          const ang = -Math.PI / 2 + a * 0.2;
          G.enemyBullets.push({ x: bx, y: by, w: 8, h: 8, vx: Math.cos(ang) * 310, vy: Math.sin(ang) * 310, dmg: difficultyBossDamage(9), type: "straight", color: def.color, gravity: 340, life: 3 });
        }
        Sound.enemyShoot();
      } else if (boss.phase === 2) {
        // anillo radial de 8 proyectiles — obliga a moverse, no a quedarse quieto
        for (let a = 0; a < 8; a++) {
          const ang = (Math.PI * 2 * a) / 8;
          G.enemyBullets.push({ x: bx, y: by, w: 9, h: 9, vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260, dmg: difficultyBossDamage(10), type: "straight", color: def.color, life: 2.4 });
        }
        Sound.enemyShoot();
      } else {
        // triple disparo directo, cada uno un poco mas rapido que el anterior
        for (let i = 0; i < 3; i++) {
          bossFireAt(boss, { speed: 260 + i * 90, size: 9, type: "straight", dmg: difficultyBossDamage(10), life: 3 });
        }
        if (boss.enraged && G.minions.filter(m => m.fromBoss).length < 2 && Math.random() < 0.5) {
          G.minions.push({ x: boss.x, y: GROUND_Y - 30, w: 24, h: 28, hp: 14 * difficultyConfig().hp, vx: -rand(70, 110), shootT: rand(1, 1.6), fromBoss: true });
        }
      }
      break;
    }
  }
}

function updateEnemyBullets(dt) {
  const p = G.player;
  G.enemyBullets.forEach(b => {
    if (b.type === "homing" || b.type === "magnetic") {
      const dx = (p.x + p.w / 2) - b.x, dy = (p.y + p.h / 2) - b.y;
      const desired = Math.atan2(dy, dx);
      let current = Math.atan2(b.vy, b.vx);
      let delta = Math.atan2(Math.sin(desired-current), Math.cos(desired-current));
      const maxTurn = (b.turn || 0) * 1.7 * dt;
      delta = clamp(delta, -maxTurn, maxTurn);
      current += delta;
      const sp = Math.max(120, Number.isFinite(b.speed) ? b.speed : Math.hypot(b.vx,b.vy));
      const maxSp = b.type === "homing" ? 320 : 300;
      const finalSp = Math.min(sp, maxSp);
      b.vx = Math.cos(current) * finalSp;
      b.vy = Math.sin(current) * finalSp;
    }
    if (b.gravity) b.vy += b.gravity * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.life !== undefined) b.life -= dt;
  });
  G.enemyBullets = G.enemyBullets.filter(b =>
    b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30 && (b.life === undefined || b.life > 0)
  );

  // colision con jugador
  G.enemyBullets.forEach(b => {
    if (overlap(b, p)) {
      hurtPlayer(b.dmg, b);
      b.life = -1;
    }
  });
  G.enemyBullets = G.enemyBullets.filter(b => b.life !== -1);
}

function updateBossFight(dt) {
  const boss = G.boss;

  // dash del patron "dash" (Kimi)
  if (boss.dashT > 0) {
    boss.dashT -= dt;
    boss.x += boss.dashVx * dt;
    boss.x = clamp(boss.x, ARENA_L + 40, ARENA_R - boss.w);
    if (overlap(boss, G.player)) hurtPlayer(difficultyBossDamage(14));
    if (boss.dashT <= 0) shake(4, 0.15);
  } else {
    updateBossAI(dt);
  }

  updateEnemyBullets(dt);

  // minions invocados por ChatGPT
  G.minions.forEach(m => {
    m.x += m.vx * dt;
    m.x = Math.max(m.x, ARENA_L);
    m.shootT -= dt;
    if (m.shootT <= 0) {
      m.shootT = rand(1.6, 2.4);
      G.enemyBullets.push({ x: m.x, y: m.y + m.h / 2, w: 7, h: 7, vx: -240, vy: 0, dmg: 7, type: "straight", color: "#8ef0c8", life: 3 });
      Sound.enemyShoot();
    }
    if (overlap(m, G.player)) hurtPlayer(difficultyBossDamage(5));
  });
  G.bullets.forEach(b => {
    G.minions.forEach(m => {
      if (!b.dead && m.hp > 0 && overlap(b, m)) {
        const blocked = m.shielded && m.type !== "shield";
        const dealt = blocked ? b.dmg * 0.45 : b.dmg;
        m.hp -= dealt;
        if (blocked) spawnParticles(m.x+m.w/2,m.y+m.h/2,"#ffe47a",4,{speedMin:30,speedMax:80});
        b.dead = true; b.x = -999;
        spawnParticles(m.x, m.y, "#8ef0c8", 4);
        if (m.hp <= 0) { Sound.minionDown(); G.score += 25; }
      }
    });
  });
  G.minions = G.minions.filter(m => m.hp > 0);

  // contacto directo jugador-jefe
  if (overlap(boss, G.player)) hurtPlayer(boss.def.contactDmg);

  // balas del jugador vs jefe
  if (boss.invuln <= 0) {
    G.bullets.forEach(b => {
      if (overlap(b, boss)) {
        if (b.hitIds && b.hitIds.has(boss)) return;
        if (b.hitIds) b.hitIds.add(boss);
        boss.hp -= b.dmg; registerHit(boss,b,b.dmg);
        if(G.explosiveRounds || (G.synergies||[]).includes("CRITICAL BLAST")) explodeAt(b.x+b.w/2,b.y+b.h/2,b.dmg*0.55,boss.def.color);
        if(!b.pierce) { b.dead = true; b.x = -999; }
        spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.def.color, 6);
        Sound.bossHit();
        G.score += Math.round(5*(1+Math.min(2,G.combo*.05)));
      }
    });
  }

  G.bullets = G.bullets.filter(b => !b.dead);
  document.getElementById("boss-hp-fill").style.width = `${clamp((boss.hp / boss.maxHp) * 100, 0, 100)}%`;

  if (boss.hp <= 0) {
    Sound.bossDefeat();
    spawnParticles(boss.x + boss.w / 2, boss.y + boss.h / 2, boss.def.color, 26);
    shake(10, 0.35);
    G.score += 200 + G.floorIndex * 50;
    G.scrap += Math.round((100 + G.floorIndex * 35) * G.scrapMult);
    G.towerCleared[G.floorIndex] = true;
    const perfectBoss = G.bossDamageTaken <= 0;
    const bossDiff = G.difficultyKey;
    G.bossDamageTaken = 0;
    saveProfile({bossWin:true, perfectBoss, hardBossWin:bossDiff==="hard", hackerBossWin:bossDiff==="hacker"});
    G.enemyBullets = [];
    G.minions = [];
    const defeatedIndex = G.floorIndex;
    const defeatedKey = boss.def.key;
    G.boss = null;
    if (defeatedKey === "claude" && secretConditionMet()) unlockSimSimiBoss();
    if (defeatedIndex + 1 >= BOSSES.length) {
      G.hazards = [];
      G.floorMechanic = null;
      triggerWin();
    } else {
      startElevatorWait(defeatedIndex, defeatedIndex + 1);
    }
  }
}

/* =========================================================
   PARTICULAS
   ========================================================= */
function updateParticles(dt) {
  G.particles.forEach(pt => {
    pt.vy += (pt.gravity ?? 500) * dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= Math.pow(0.985, dt * 60);
    pt.life -= dt;
  });
  G.particles = G.particles.filter(pt => pt.life > 0);
  G.ambientT += dt;
  G.levelPulse = Math.max(0, G.levelPulse - dt * 0.7);
  G.transitionFlash = Math.max(0, G.transitionFlash - dt);
}

/* =========================================================
   DIBUJO
   ========================================================= */
function drawBackground() {
  const t = G.ambientT;
  const floor = Math.max(0, G.floorIndex);
  const def = G.boss?.def;
  const palettes = ["#07111b", "#0b1020", "#11100a", "#160b0b", "#0b1613", "#130b1b"];
  ctx2d.fillStyle = palettes[floor % palettes.length];
  ctx2d.fillRect(0, 0, W, H);

  // Atmosfera animada: luces, niebla y profundidad.
  const accent = def?.color || ["#39ff88", "#7fd8ff", "#ffd166", "#ff5c7a", "#8ef0c8", "#c9a6ff"][floor % 6];
  const glow = ctx2d.createRadialGradient(W * (0.25 + 0.5 * Math.sin(t * 0.17)), H * 0.35, 20, W * 0.5, H * 0.45, 520);
  glow.addColorStop(0, accent + "26"); glow.addColorStop(1, "transparent");
  ctx2d.fillStyle = glow; ctx2d.fillRect(0, 0, W, H);

  // Ventanas/luces de la torre que se desplazan lentamente.
  for (let i = 0; i < 18; i++) {
    const x = ((i * 83 + t * (10 + floor * 2)) % (W + 100)) - 50;
    const y = 55 + (i * 47) % 270 + Math.sin(t * 1.2 + i) * 4;
    ctx2d.globalAlpha = 0.08 + 0.05 * Math.sin(t * 2 + i);
    ctx2d.fillStyle = accent;
    ctx2d.fillRect(x, y, 2 + (i % 3), 16 + (i % 4) * 5);
  }
  ctx2d.globalAlpha = 1;

  ctx2d.strokeStyle = accent + "12";
  ctx2d.lineWidth = 1;
  const offset = (t * 18) % 40;
  for (let x = -40 + offset; x < W + 40; x += 40) { ctx2d.beginPath(); ctx2d.moveTo(x, 0); ctx2d.lineTo(x, H); ctx2d.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(W, y); ctx2d.stroke(); }

  // Decoración específica por piso.
  ctx2d.save();
  ctx2d.strokeStyle = accent + "38";
  ctx2d.lineWidth = 2;
  if (floor % 3 === 0) {
    for (let i = 0; i < 5; i++) {
      const y = 90 + i * 72 + Math.sin(t * 1.4 + i) * 5;
      ctx2d.beginPath(); ctx2d.moveTo(0, y); ctx2d.lineTo(160, y - 45); ctx2d.stroke();
    }
  } else if (floor % 3 === 1) {
    for (let i = 0; i < 7; i++) {
      const x = 90 + i * 145 + Math.sin(t + i) * 8;
      ctx2d.beginPath(); ctx2d.arc(x, 110 + (i % 2) * 130, 22 + Math.sin(t * 2 + i) * 3, 0, Math.PI * 2); ctx2d.stroke();
    }
  } else {
    for (let i = 0; i < 9; i++) {
      const x = i * 120 + ((t * 24) % 120);
      ctx2d.beginPath(); ctx2d.moveTo(x, 20); ctx2d.lineTo(x - 55, 250); ctx2d.stroke();
    }
  }
  ctx2d.restore();

  // Piso con líneas de energía animadas.
  ctx2d.fillStyle = "#07100d"; ctx2d.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx2d.fillStyle = accent + "70"; ctx2d.fillRect(0, GROUND_Y, W, 3);
  ctx2d.strokeStyle = accent + "24";
  for (let x = ((t * 90) % 80) - 80; x < W + 80; x += 80) {
    ctx2d.beginPath(); ctx2d.moveTo(x, GROUND_Y + 22); ctx2d.lineTo(x + 34, H); ctx2d.stroke();
  }
  ctx2d.fillStyle = accent + "10"; ctx2d.fillRect(ARENA_L, GROUND_Y - 2, ARENA_R - ARENA_L, 2);

  // Señal de entrada al nivel.
  if (G.levelPulse > 0) {
    ctx2d.globalAlpha = G.levelPulse;
    ctx2d.strokeStyle = accent;
    ctx2d.lineWidth = 3;
    ctx2d.strokeRect(ARENA_L - 8, 28, ARENA_R - ARENA_L + 16, GROUND_Y - 40);
    ctx2d.globalAlpha = 1;
  }
}
function drawPet() {
  const pet=petDef(), p=G.player; if(!pet||!p)return;
  const t=performance.now()/1000, bob=Math.sin(t*4+G.petPhase)*4, side=p.facing>=0?-1:1;
  const x=p.x+p.w/2 + side*42, y=p.y+16+bob;
  ctx2d.save();
  ctx2d.globalAlpha=0.96;
  ctx2d.shadowColor=pet.color; ctx2d.shadowBlur=14; ctx2d.strokeStyle=pet.color; ctx2d.fillStyle=pet.color; ctx2d.lineWidth=2;
  if(pet.id==="byte"){
    ctx2d.strokeRect(x-9,y-9,18,18); ctx2d.fillRect(x-4,y-3,3,3);ctx2d.fillRect(x+2,y-3,3,3);
    ctx2d.beginPath();ctx2d.moveTo(x-4,y+4);ctx2d.lineTo(x+4,y+4);ctx2d.stroke();
  } else if(pet.id==="echo"){
    ctx2d.beginPath();ctx2d.arc(x,y,10,0,Math.PI*2);ctx2d.stroke();ctx2d.beginPath();ctx2d.arc(x,y,4+Math.sin(t*6)*1.5,0,Math.PI*2);ctx2d.fill();
  } else if(pet.id==="glitch"){
    ctx2d.beginPath();ctx2d.moveTo(x,y-11);ctx2d.lineTo(x+11,y);ctx2d.lineTo(x,y+11);ctx2d.lineTo(x-11,y);ctx2d.closePath();ctx2d.stroke();ctx2d.fillRect(x-3,y-2,6,4);
  } else if(pet.id==="sentinel"){
    ctx2d.beginPath();ctx2d.arc(x,y,11,0,Math.PI*2);ctx2d.stroke();ctx2d.beginPath();ctx2d.moveTo(x,y-7);ctx2d.lineTo(x+6,y);ctx2d.lineTo(x,y+7);ctx2d.lineTo(x-6,y);ctx2d.closePath();ctx2d.fill();
  } else if(pet.id==="mimic"){
    ctx2d.fillRect(x-11,y-7,22,14);ctx2d.strokeRect(x-11,y-7,22,14);ctx2d.fillStyle="#0b0f10";ctx2d.fillRect(x-5,y-2,3,3);ctx2d.fillRect(x+2,y-2,3,3);
  } else {
    ctx2d.beginPath();ctx2d.moveTo(x,y-12);ctx2d.lineTo(x+10,y-4);ctx2d.lineTo(x+7,y+9);ctx2d.lineTo(x,y+13);ctx2d.lineTo(x-7,y+9);ctx2d.lineTo(x-10,y-4);ctx2d.closePath();ctx2d.stroke();ctx2d.fill();ctx2d.fillStyle="#0b0f10";ctx2d.fillRect(x-2,y-3,4,5);
  }
  ctx2d.shadowBlur=0;ctx2d.fillStyle=pet.color;ctx2d.font="8px 'JetBrains Mono'";ctx2d.textAlign="center";ctx2d.fillText(pet.name,x,y+24);
  ctx2d.restore();
}

function drawPlayer() {
  const p = G.player;
  const color = p.hurtFlash > 0 ? "#ff5f5f" : normalizeHexColor(G.playerColor || DEFAULT_PLAYER_COLOR);
  const cx = p.x + p.w / 2;
  const headR = 6.5;
  const headCY = p.y + headR + 1;
  const neckY = headCY + headR;
  const hipY = p.y + p.h - 15;
  const walking = p.vx !== 0 && p.onGround;
  const airborne = !p.onGround;

  ctx2d.save();
  if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) ctx2d.globalAlpha = 0.35;
  ctx2d.strokeStyle = color;
  ctx2d.fillStyle = color;
  ctx2d.lineWidth = 3;
  ctx2d.lineCap = "round";
  ctx2d.shadowColor = color;
  ctx2d.shadowBlur = 10;

  // piernas — ciclo de carrera si camina, pose en "V" si esta en el aire
  ctx2d.beginPath();
  if (airborne) {
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx - 8, p.y + p.h);
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx + 9, p.y + p.h - 4);
  } else if (walking) {
    const swing = Math.sin(p.animT) * 9;
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx + swing, p.y + p.h);
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx - swing, p.y + p.h);
  } else {
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx - 5, p.y + p.h);
    ctx2d.moveTo(cx, hipY); ctx2d.lineTo(cx + 5, p.y + p.h);
  }
  ctx2d.stroke();

  // torso
  ctx2d.beginPath();
  ctx2d.moveTo(cx, neckY);
  ctx2d.lineTo(cx, hipY);
  ctx2d.stroke();

  // brazos — el de adelante se extiende al disparar
  const shoulderY = neckY + 5;
  const shootPose = p.shootAnim > 0;
  ctx2d.beginPath();
  // brazo trasero (leve balanceo al caminar)
  const backSwing = walking ? Math.sin(p.animT + Math.PI) * 5 : 0;
  ctx2d.moveTo(cx, shoulderY);
  ctx2d.lineTo(cx - p.facing * 6, shoulderY + 10 + backSwing);
  // brazo delantero
  ctx2d.moveTo(cx, shoulderY);
  if (shootPose) {
    ctx2d.lineTo(cx + p.facing * 16, shoulderY + 1);
  } else {
    const frontSwing = walking ? Math.sin(p.animT) * 5 : 0;
    ctx2d.lineTo(cx + p.facing * 6, shoulderY + 10 + frontSwing);
  }
  ctx2d.stroke();

  // "cañon" en la mano cuando dispara
  if (shootPose) {
    ctx2d.fillRect(cx + p.facing * 16 - 2, shoulderY - 2, 8 * p.facing, 4);
  }

  // cabeza
  ctx2d.beginPath();
  ctx2d.arc(cx, headCY, headR, 0, Math.PI * 2);
  ctx2d.fill();
  // visor/gafas indicando direccion
  ctx2d.fillStyle = "#0b0f10";
  ctx2d.fillRect(p.facing > 0 ? cx : cx - 5, headCY - 1.5, 5, 3);

  ctx2d.restore();
}

function drawBullets() {
  ctx2d.fillStyle = "#39ff88";
  G.bullets.forEach(b => {
    ctx2d.shadowColor = b.stationary ? "#ff5f8f" : "#39ff88";
    ctx2d.shadowBlur = b.stationary ? 10 : 6;
    ctx2d.fillStyle = b.stationary ? "#ff5f8f" : "#39ff88";
    if (b.stationary) {
      ctx2d.beginPath();
      ctx2d.arc(b.x+b.w/2,b.y+b.h/2,Math.max(5,b.w*.65),0,Math.PI*2);
      ctx2d.fill();
      ctx2d.strokeStyle="#ffd1df"; ctx2d.lineWidth=1;
      ctx2d.stroke();
    } else {
      ctx2d.fillRect(b.x, b.y, b.w, b.h);
    }
  });
  ctx2d.shadowBlur = 0;
  G.enemyBullets.forEach(b => {
    if(b.insult){
      ctx2d.save();
      const label=String(b.insult).toUpperCase(); ctx2d.font="bold 8px 'JetBrains Mono'"; ctx2d.textAlign="center";
      const tw=Math.min(220,ctx2d.measureText(label).width+14);
      ctx2d.globalAlpha=.92;ctx2d.fillStyle="rgba(20,15,4,.94)";ctx2d.fillRect(b.x+b.w/2-tw/2,b.y-20,tw,18);
      ctx2d.strokeStyle=b.color||"#ffe15a";ctx2d.lineWidth=1;ctx2d.strokeRect(b.x+b.w/2-tw/2,b.y-20,tw,18);
      ctx2d.fillStyle="#fff8c9";ctx2d.fillText(label,b.x+b.w/2,b.y-8);ctx2d.restore();
    }
    ctx2d.fillStyle = b.color || "#ff5f5f";
    ctx2d.globalAlpha=.18; ctx2d.fillRect(b.x-b.vx*.035,b.y-b.vy*.035,b.w+Math.abs(b.vx)*.035,b.h+Math.abs(b.vy)*.035); ctx2d.globalAlpha=1;
    ctx2d.shadowColor = ctx2d.fillStyle; ctx2d.shadowBlur = 6;
    ctx2d.beginPath();
    ctx2d.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx2d.fill();
  });
  ctx2d.shadowBlur = 0;
}

function drawMinions() {
  const t = G.ambientT;
  G.minions.forEach(m => {
    const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
    const colors = { drone: "#ff8a5c", charger: "#ff3d71", turret: "#ffd166", splitter: "#b88cff", shard: "#d6b9ff", sniper: "#ffea7a", orbiter: "#5ad1ff", mine: "#ff4d8d", shield:"#62a7ff", healer:"#62ff9b", hunter:"#ff6bba" };
    const color = m.elite ? "#ff5f5f" : (m.fromBoss ? "#c9a6ff" : colors[m.type] || "#ff8a5c");
    const bob = Math.sin(t * 6 + (m.phase || 0)) * (m.type === "turret" ? 2 : 1.5);
    ctx2d.save(); ctx2d.translate(0, bob);
    ctx2d.shadowColor = color; ctx2d.shadowBlur = m.elite ? 18 : 11;
    ctx2d.fillStyle = color;
    if (m.type === "charger") {
      ctx2d.beginPath(); ctx2d.moveTo(m.x, cy); ctx2d.lineTo(cx, m.y); ctx2d.lineTo(m.x+m.w, cy); ctx2d.lineTo(cx, m.y+m.h); ctx2d.closePath(); ctx2d.fill();
      ctx2d.strokeStyle = "#fff0f4"; ctx2d.lineWidth = 2; ctx2d.beginPath(); ctx2d.moveTo(m.x+5, cy); ctx2d.lineTo(m.x+m.w-5, cy); ctx2d.stroke();
    } else if (m.type === "turret") {
      ctx2d.fillRect(m.x+4, m.y+8, m.w-8, m.h-8);
      ctx2d.fillRect(cx-3, m.y-12, 6, 18);
      ctx2d.strokeStyle = color; ctx2d.lineWidth = 2; ctx2d.strokeRect(m.x+1, m.y+5, m.w-2, m.h-3);
    } else if (m.type === "splitter") {
      ctx2d.beginPath(); ctx2d.arc(cx, cy, m.w/2, 0, Math.PI*2); ctx2d.fill();
      ctx2d.strokeStyle = "#f0e6ff"; ctx2d.lineWidth = 1.5; ctx2d.beginPath(); ctx2d.moveTo(cx, m.y+4); ctx2d.lineTo(cx, m.y+m.h-4); ctx2d.moveTo(m.x+4, cy); ctx2d.lineTo(m.x+m.w-4, cy); ctx2d.stroke();
    } else if (m.type === "sniper") {
      ctx2d.fillRect(m.x + 4, m.y + 7, m.w - 8, m.h - 14);
      ctx2d.strokeStyle = "#fff4a8"; ctx2d.lineWidth = 2;
      ctx2d.beginPath(); ctx2d.moveTo(cx, m.y + 5); ctx2d.lineTo(cx, m.y - 10); ctx2d.stroke();
      if (m.telegraph > 0 && G.player) {
        const tx = G.player.x + G.player.w / 2;
        const ty = G.player.y + G.player.h / 2;
        const alpha = 0.35 + 0.25 * Math.sin(t * 20);
        ctx2d.globalAlpha = alpha;
        ctx2d.strokeStyle = "#fff4a8";
        ctx2d.lineWidth = 2;
        ctx2d.setLineDash([7, 6]);
        ctx2d.beginPath();
        ctx2d.moveTo(cx, cy);
        ctx2d.lineTo(tx, ty);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
        ctx2d.fillStyle = "#fff4a8";
        ctx2d.beginPath(); ctx2d.arc(tx, ty, 5 + Math.sin(t * 18) * 2, 0, Math.PI * 2); ctx2d.fill();
        ctx2d.globalAlpha = 1;
      }
    } else if (m.type === "orbiter") {
      ctx2d.beginPath(); ctx2d.arc(cx, cy, m.w/2, 0, Math.PI*2); ctx2d.fill();
      ctx2d.strokeStyle = "#dff8ff"; ctx2d.lineWidth = 2;
      ctx2d.beginPath(); ctx2d.arc(cx, cy, m.w/2 + 7, m.phase, m.phase + Math.PI * 1.2); ctx2d.stroke();
      ctx2d.beginPath(); ctx2d.arc(cx, cy, m.w/2 + 12, -m.phase * 0.7, -m.phase * 0.7 + Math.PI * 0.7); ctx2d.stroke();
    } else if (m.type === "mine") {
      ctx2d.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4; const rr = i % 2 ? m.w * .38 : m.w * .58;
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        if (i === 0) ctx2d.moveTo(px, py); else ctx2d.lineTo(px, py);
      }
      ctx2d.closePath(); ctx2d.fill();
      ctx2d.strokeStyle = "#ffd0e1"; ctx2d.stroke();
      ctx2d.globalAlpha = .55 + .35 * Math.sin(t * 8); ctx2d.fillStyle = "#fff";
      ctx2d.beginPath(); ctx2d.arc(cx, cy, 3, 0, Math.PI*2); ctx2d.fill(); ctx2d.globalAlpha = 1;
    } else if (m.type === "shield") {
      ctx2d.beginPath(); ctx2d.arc(cx,cy,m.w/2,0,Math.PI*2);ctx2d.fill();
      ctx2d.strokeStyle="#d9e8ff";ctx2d.lineWidth=3;ctx2d.beginPath();ctx2d.arc(cx,cy,m.w/2+7+Math.sin(t*5)*2,-Math.PI*.8,Math.PI*.8);ctx2d.stroke();
      ctx2d.fillStyle="#10233d";ctx2d.fillRect(cx-5,cy-4,10,8);
    } else if (m.type === "healer") {
      ctx2d.fillRect(m.x+3,m.y+3,m.w-6,m.h-6);ctx2d.fillStyle="#dffff0";ctx2d.fillRect(cx-2,cy-8,4,16);ctx2d.fillRect(cx-8,cy-2,16,4);
      ctx2d.strokeStyle="#62ff9b";ctx2d.globalAlpha=.5+.3*Math.sin(t*6);ctx2d.beginPath();ctx2d.arc(cx,cy,m.w/2+8,0,Math.PI*2);ctx2d.stroke();ctx2d.globalAlpha=1;
    } else if (m.type === "hunter") {
      ctx2d.beginPath();ctx2d.moveTo(m.x,cy);ctx2d.lineTo(cx,m.y);ctx2d.lineTo(m.x+m.w,cy);ctx2d.lineTo(cx,m.y+m.h);ctx2d.closePath();ctx2d.fill();
      ctx2d.strokeStyle="#ffd1e8";ctx2d.lineWidth=2;ctx2d.beginPath();ctx2d.moveTo(cx,cy);ctx2d.lineTo(G.player.x+G.player.w/2,G.player.y+G.player.h/2);ctx2d.stroke();
    } else {
      ctx2d.beginPath(); ctx2d.moveTo(cx,m.y); ctx2d.lineTo(m.x+m.w,cy); ctx2d.lineTo(cx,m.y+m.h); ctx2d.lineTo(m.x,cy); ctx2d.closePath(); ctx2d.fill();
    }
    ctx2d.shadowBlur = 0;
    ctx2d.fillStyle = "#07100d"; ctx2d.beginPath(); ctx2d.arc(cx, cy, m.type === "turret" ? 4 : 3, 0, Math.PI*2); ctx2d.fill();
    ctx2d.fillStyle = color; ctx2d.globalAlpha = 0.7 + 0.3*Math.sin(t*8+(m.phase||0)); ctx2d.beginPath(); ctx2d.arc(cx, cy, 1.5, 0, Math.PI*2); ctx2d.fill(); ctx2d.globalAlpha = 1;
    if (m.elite) { ctx2d.strokeStyle=color; ctx2d.lineWidth=1.5; ctx2d.beginPath(); ctx2d.arc(cx,cy,m.w/2+7+Math.sin(t*4)*2,0,Math.PI*2);ctx2d.stroke(); }
    if (m.type === "charger" && m.chargeT < 0.45) { ctx2d.strokeStyle="#ff3d71"; ctx2d.lineWidth=2; ctx2d.globalAlpha=0.6; ctx2d.beginPath(); ctx2d.arc(cx,cy,m.w+10,0,Math.PI*2);ctx2d.stroke(); }
    if (m.hitFlash > 0) { ctx2d.globalAlpha=m.hitFlash*4; ctx2d.fillStyle="#fff"; ctx2d.fillRect(m.x-2,m.y-2,m.w+4,m.h+4); }
    if(m.dodgePulse>0){ctx2d.globalAlpha=Math.min(.65,m.dodgePulse*1.8);ctx2d.strokeStyle="#67e8ff";ctx2d.lineWidth=2;ctx2d.setLineDash([4,4]);ctx2d.beginPath();ctx2d.arc(cx,cy,m.w/2+9,0,Math.PI*2);ctx2d.stroke();ctx2d.setLineDash([]);ctx2d.globalAlpha=1;}
    ctx2d.restore();
  });
}
function drawHexPath(cx, cy, r, rotation, squash = 0.85) {
  ctx2d.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = rotation + (i * Math.PI) / 3;
    const px = cx + Math.cos(ang) * r;
    const py = cy + Math.sin(ang) * r * squash;
    if (i === 0) ctx2d.moveTo(px, py);
    else ctx2d.lineTo(px, py);
  }
  ctx2d.closePath();
}

function drawBoss() {
  const boss = G.boss;
  if (!boss) return;
  const def = boss.def;
  const cx = boss.x + boss.w / 2, cy = boss.y + boss.h / 2;
  const r = boss.w / 2;
  const t = performance.now() / 1000;
  const rot = t * (0.6 + G.floorIndex * 0.12);
  const isFinal = def.pattern === "final";
  if(def.key === "simsimi"){
    ctx2d.save();
    if (boss.invuln > 0 && Math.floor(boss.invuln * 20) % 2 === 0) ctx2d.globalAlpha=.4;
    ctx2d.shadowColor="#ffe15a"; ctx2d.shadowBlur=boss.enraged?30:18;
    if(simsimiImage.complete && simsimiImage.naturalWidth){ ctx2d.drawImage(simsimiImage,boss.x-8,boss.y-8,boss.w+16,boss.h+16); }
    else { ctx2d.fillStyle="#ffe15a"; ctx2d.beginPath();ctx2d.arc(cx,cy,r,0,Math.PI*2);ctx2d.fill(); }
    ctx2d.shadowBlur=0;
    ctx2d.strokeStyle="#ffe15a";ctx2d.lineWidth=2;ctx2d.strokeRect(boss.x-2,boss.y-2,boss.w+4,boss.h+4);
    if((boss.insultT||0)>0 && boss.currentInsult){
      ctx2d.font="bold 10px 'JetBrains Mono'";ctx2d.textAlign="center";
      const text=boss.currentInsult.toUpperCase(); const tw=Math.min(250,ctx2d.measureText(text).width+20);
      ctx2d.fillStyle="rgba(8,12,10,.94)";ctx2d.fillRect(cx-tw/2,boss.y-46,tw,24);
      ctx2d.strokeStyle="#ffe15a";ctx2d.strokeRect(cx-tw/2,boss.y-46,tw,24);
      ctx2d.fillStyle="#fff8c9";ctx2d.fillText(text,cx,boss.y-31);
    }
    ctx2d.fillStyle="#ffe15a";ctx2d.font="12px 'JetBrains Mono'";ctx2d.fillText("SimSimi",cx,boss.y+boss.h+18);
    ctx2d.restore();
    return;
  }
  if(boss.dodgePulse>0){ctx2d.save();ctx2d.globalAlpha=Math.min(.65,boss.dodgePulse*1.8);ctx2d.strokeStyle=def.color;ctx2d.lineWidth=3;ctx2d.setLineDash([6,5]);ctx2d.beginPath();ctx2d.arc(cx,cy,r+14+Math.sin(t*18)*3,0,Math.PI*2);ctx2d.stroke();ctx2d.setLineDash([]);ctx2d.restore();}

  // telegraph: aviso pulsante justo antes de que el jefe ataque, para que
  // el jugador tenga una señal justa a la que reaccionar
  if (boss.attackT !== undefined && boss.telegraphThresh && boss.attackT < boss.telegraphThresh) {
    const p = 1 - boss.attackT / boss.telegraphThresh;
    ctx2d.save();
    ctx2d.globalAlpha = 0.5 * p;
    ctx2d.strokeStyle = def.color;
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r + 14 + p * 16, 0, Math.PI * 2);
    ctx2d.stroke();
    ctx2d.restore();
  }

  // anillos orbitales — mas anillos cuanto mas alto el piso (progresion visual)
  const ringCount = Math.min(3, 1 + Math.floor(G.floorIndex / 2));
  ctx2d.save();
  ctx2d.strokeStyle = def.color;
  ctx2d.lineWidth = 1.2;
  for (let i = 0; i < ringCount; i++) {
    ctx2d.globalAlpha = 0.28 - i * 0.06;
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r + 12 + i * 9 + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
    ctx2d.stroke();
  }
  ctx2d.restore();

  // nucleo hexagonal (el jefe final ademas tiene 4 nodos orbitando)
  if (isFinal) {
    ctx2d.save();
    ctx2d.fillStyle = def.color;
    ctx2d.shadowColor = def.color;
    ctx2d.shadowBlur = 10;
    for (let i = 0; i < 4; i++) {
      const ang = -rot * 1.4 + (i * Math.PI) / 2;
      const nx = cx + Math.cos(ang) * (r + 22);
      const ny = cy + Math.sin(ang) * (r + 22) * 0.85;
      ctx2d.beginPath();
      ctx2d.moveTo(nx, ny - 4); ctx2d.lineTo(nx + 4, ny); ctx2d.lineTo(nx, ny + 4); ctx2d.lineTo(nx - 4, ny);
      ctx2d.closePath();
      ctx2d.fill();
    }
    ctx2d.restore();
  }

  ctx2d.save();
  if (boss.invuln > 0 && Math.floor(boss.invuln * 20) % 2 === 0) ctx2d.globalAlpha = 0.4;

  // cuerpo — hexagono giratorio
  ctx2d.fillStyle = def.color;
  ctx2d.shadowColor = def.color;
  ctx2d.shadowBlur = boss.enraged ? 30 : 18;
  drawHexPath(cx, cy, r, rot);
  ctx2d.fill();
  ctx2d.shadowBlur = 0;

  // panel interno (gira al reves, mas lento)
  ctx2d.fillStyle = def.accent;
  drawHexPath(cx, cy, r * 0.55, -rot * 0.6);
  ctx2d.fill();

  // ojo — la pupila mira hacia el jugador
  const lookDir = Math.sign((G.player.x + G.player.w / 2) - cx) || 1;
  ctx2d.fillStyle = "#0b0f10";
  ctx2d.beginPath();
  ctx2d.arc(cx + lookDir * 3, cy, 4.5, 0, Math.PI * 2);
  ctx2d.fill();
  ctx2d.fillStyle = def.color;
  ctx2d.beginPath();
  ctx2d.arc(cx + lookDir * 3, cy, 2, 0, Math.PI * 2);
  ctx2d.fill();

  // antena(s) — el jefe final lleva dos
  ctx2d.strokeStyle = def.color;
  ctx2d.lineWidth = 2;
  ctx2d.lineCap = "round";
  const antennaXs = isFinal ? [-6, 6] : [0];
  antennaXs.forEach(ax => {
    ctx2d.beginPath();
    ctx2d.moveTo(cx + ax * 0.6, cy - r * 0.8);
    ctx2d.lineTo(cx + ax, cy - r * 0.8 - 9);
    ctx2d.stroke();
    ctx2d.beginPath();
    ctx2d.arc(cx + ax, cy - r * 0.8 - 11, 2.2, 0, Math.PI * 2);
    ctx2d.fillStyle = def.color;
    ctx2d.fill();
  });

  ctx2d.restore();

  if (boss.phaseLevel > 1) {
    ctx2d.fillStyle = boss.enraged ? "#ff5f5f" : "#ffd166";
    ctx2d.font = "bold 10px 'JetBrains Mono'";
    ctx2d.textAlign = "center";
    ctx2d.fillText(`⚠ FASE ${boss.phaseLevel}${boss.enraged?" // FURIA":""}`, cx, boss.y - 26);
  }

  ctx2d.fillStyle = def.color;
  ctx2d.font = "12px 'JetBrains Mono'";
  ctx2d.textAlign = "center";
  ctx2d.fillText(def.name, cx, boss.y - 12);
}

function drawParticles() {
  G.particles.forEach(pt => {
    ctx2d.globalAlpha = clamp(pt.life / (pt.maxLife || 0.7), 0, 1);
    ctx2d.fillStyle = pt.color;
    ctx2d.shadowColor = pt.color; ctx2d.shadowBlur = 7;
    ctx2d.fillRect(pt.x, pt.y, pt.size || 4, pt.size || 4);
  });
  ctx2d.shadowBlur = 0; ctx2d.globalAlpha = 1;
}

function drawElevator() {
  const el = G.elevator;
  if (!el) return;
  const t = performance.now() / 1000;
  const pulse = 0.6 + 0.4 * Math.sin(t * 3);
  ctx2d.save();

  // hueco / marco del ascensor
  ctx2d.fillStyle = "#0a1210";
  ctx2d.fillRect(el.x - 6, el.y - 6, el.w + 12, el.h + 6);
  ctx2d.strokeStyle = "#39ff88";
  ctx2d.lineWidth = 3;
  ctx2d.shadowColor = "#39ff88";
  ctx2d.shadowBlur = 10 + pulse * 10;
  ctx2d.strokeRect(el.x, el.y, el.w, el.h);
  ctx2d.shadowBlur = 0;

  // puertas partidas al medio, con una franja que brilla
  ctx2d.strokeStyle = `rgba(57,255,136,${0.35 + pulse * 0.25})`;
  ctx2d.lineWidth = 2;
  ctx2d.beginPath();
  ctx2d.moveTo(el.x + el.w / 2, el.y + 6);
  ctx2d.lineTo(el.x + el.w / 2, el.y + el.h - 6);
  ctx2d.stroke();

  // franjas horizontales tipo panel
  ctx2d.strokeStyle = "rgba(57,255,136,0.15)";
  for (let i = 1; i < 5; i++) {
    const yy = el.y + (el.h / 5) * i;
    ctx2d.beginPath();
    ctx2d.moveTo(el.x + 4, yy);
    ctx2d.lineTo(el.x + el.w - 4, yy);
    ctx2d.stroke();
  }

  ctx2d.textAlign = "center";
  ctx2d.fillStyle = "#39ff88";
  ctx2d.font = "bold 12px 'JetBrains Mono'";
  ctx2d.globalAlpha = pulse;
  ctx2d.fillText("▲ ASCENSOR ▲", el.x + el.w / 2, el.y - 14);
  ctx2d.globalAlpha = 1;
  ctx2d.fillStyle = "#6b8f7d";
  ctx2d.font = "10px 'JetBrains Mono'";
  ctx2d.fillText("entra para elegir tu mejora", el.x + el.w / 2, el.y + el.h + 18);

  ctx2d.restore();
}

function drawAimReticle() {
  if (G.state !== "playing" || !mouseAim.active) return;

  const x = mouseAim.x;
  const y = mouseAim.y;
  const pulse = 0.72 + Math.sin(performance.now() * 0.008) * 0.16;
  const r = 11 + Math.sin(performance.now() * 0.006) * 1.2;

  ctx2d.save();
  ctx2d.translate(x, y);
  ctx2d.lineWidth = 1.5;
  ctx2d.strokeStyle = `rgba(57,255,136,${pulse})`;
  ctx2d.fillStyle = `rgba(57,255,136,${0.95})`;
  ctx2d.shadowColor = "#39ff88";
  ctx2d.shadowBlur = 8;

  // Circulo exterior + cuatro marcas: una mira clara pero poco invasiva.
  ctx2d.beginPath();
  ctx2d.arc(0, 0, r, 0, Math.PI * 2);
  ctx2d.stroke();

  ctx2d.beginPath();
  ctx2d.moveTo(0, -r - 7); ctx2d.lineTo(0, -r + 1);
  ctx2d.moveTo(0, r - 1); ctx2d.lineTo(0, r + 7);
  ctx2d.moveTo(-r - 7, 0); ctx2d.lineTo(-r + 1, 0);
  ctx2d.moveTo(r - 1, 0); ctx2d.lineTo(r + 7, 0);
  ctx2d.stroke();

  ctx2d.beginPath();
  ctx2d.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx2d.fill();

  // Punto central de la mira para que el jugador sepa exactamente donde cae el disparo.
  ctx2d.shadowBlur = 0;
  ctx2d.globalAlpha = 0.7;
  ctx2d.beginPath();
  ctx2d.arc(0, 0, 0.9, 0, Math.PI * 2);
  ctx2d.fill();
  ctx2d.restore();
}

function render() {
  ctx2d.save();
  if (G.shakeT > 0) {
    ctx2d.translate(rand(-G.shakeMag, G.shakeMag), rand(-G.shakeMag, G.shakeMag));
  }
  drawBackground();
  drawFloorMechanic();
  if (G.floorMechanic) {
    ctx2d.save(); ctx2d.font="bold 10px 'JetBrains Mono'"; ctx2d.textAlign="left"; ctx2d.fillStyle=G.floorMechanic.color; ctx2d.globalAlpha=.75; ctx2d.fillText("MECHANIC // "+G.floorMechanic.name, 48, 48); ctx2d.restore();
  }
  drawElevator();
  drawMinions();
  drawBoss();
  drawPet();
  drawPlayer();
  drawBullets();
  drawParticles();
  drawAimReticle();
  if (G.transitionFlash > 0) {
    ctx2d.globalAlpha = G.transitionFlash * 0.22;
    ctx2d.fillStyle = G.boss?.def.color || "#39ff88";
    ctx2d.fillRect(0, 0, W, H);
    ctx2d.globalAlpha = 1;
  }
  ctx2d.restore();
}

/* =========================================================
   LOOP PRINCIPAL
   ========================================================= */
function loop(time) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.033, (time - (G.lastTime || time)) / 1000);
  G.lastTime = time;

  if (G.shakeT > 0) G.shakeT -= dt;

  if (G.state === "playing") {
    updateCombo(dt);
    if (G.mode === "bossIntro") {
      // Durante la presentacion el jugador y las mecanicas quedan congelados:
      // nada puede dañarlo ni puede disparar accidentalmente mientras mira la intro.
      updateParticles(dt);
      updateBossIntro(dt);
    } else {
      updatePlayer(dt);
      updatePet(dt);
      updateBullets(dt);
      updateParticles(dt);
      updateFloorMechanic(dt);
      if (Math.random() < dt * 5) {
        const accent = G.boss?.def.color || "#39ff88";
        G.particles.push({ x: rand(45, W-45), y: rand(40, GROUND_Y-35), vx: rand(-8,8), vy: rand(-12,12), life: rand(0.7,1.5), maxLife: 1.5, color: accent, size: rand(1,2), gravity: 0 });
      }
      if (G.mode === "horde") {
        updateHorde(dt);
        // Las balas de los enemigos de las hordas también deben avanzar y colisionar.
        // Antes solo se actualizaban durante los combates contra jefes, por eso el
        // sniper podía apuntar indefinidamente sin que su disparo llegara al jugador.
        updateEnemyBullets(dt);
      } else if (G.mode === "boss") updateBossFight(dt);
      else if (G.mode === "elevator") updateElevatorWait(dt);
      updateLowHpEffect(dt);
    }
    render();
  } else if (G.state === "pause") {
    // congelado
  }
}
requestAnimationFrame(loop);
