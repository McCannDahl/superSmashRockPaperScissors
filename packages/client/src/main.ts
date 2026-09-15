import {
  AttackType,
  CombatEvent,
  DEFAULT_ARENA,
  MatchPhase,
  PlayerState,
  RoomState,
} from '@rps-boom/shared';
import { Renderer } from './graphics/Renderer.js';
import { SoundManager, sound } from './audio/SoundManager.js';
import { NetworkClient } from './network/NetworkClient.js';
import { ads } from './ads/AdManager.js';
import { analyticsClient } from './analytics/AnalyticsClient.js';

// DOM Elements
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const screenMainMenu = document.getElementById('screen-main-menu')!;
const screenLobby = document.getElementById('screen-lobby')!;
const screenGameOver = document.getElementById('screen-game-over')!;
const screenTutorial = document.getElementById('screen-tutorial')!;
const hudOverlay = document.getElementById('hud-overlay')!;

const playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
const roomCodeInput = document.getElementById('room-code-input') as HTMLInputElement;
const colorPicker = document.getElementById('color-picker')!;
const lobbyCodeDisplay = document.getElementById('lobby-code-display')!;
const lobbyRoster = document.getElementById('lobby-roster')!;
const roomCodeTag = document.getElementById('room-code-tag')!;

const btnQuickPlay = document.getElementById('btn-quick-play')!;
const btnCreatePrivate = document.getElementById('btn-create-private')!;
const btnJoinCode = document.getElementById('btn-join-code')!;
const btnHowToPlay = document.getElementById('btn-how-to-play')!;
const btnCloseTutorial = document.getElementById('btn-close-tutorial')!;
const btnCopyLink = document.getElementById('btn-copy-link')!;
const btnReadyToggle = document.getElementById('btn-ready-toggle')!;
const btnLeaveLobby = document.getElementById('btn-leave-lobby')!;
const btnRematch = document.getElementById('btn-rematch')!;
const btnReturnMenu = document.getElementById('btn-return-menu')!;
const btnMuteToggle = document.getElementById('mute-toggle-btn')!;

const gameOverTitle = document.getElementById('game-over-title')!;
const gameOverDesc = document.getElementById('game-over-desc')!;
const statDamage = document.getElementById('stat-damage')!;
const statKos = document.getElementById('stat-kos')!;
const statClashes = document.getElementById('stat-clashes')!;

// Instances
const renderer = new Renderer(canvas);
const network = new NetworkClient();

// Local State
let selectedColor = '#00f0ff';
let isReady = false;
let currentRoomState: RoomState | null = null;
let currentPlayers: Record<string, PlayerState> = {};
let currentPhase: MatchPhase = 'lobby';
let currentCountdownTimer: number = 0;
let currentWinnerId: string | null = null;
let lastCountdownSecond: number = -1;

// Key state
const keysDown: Record<string, boolean> = {};
let pendingAttack: AttackType | null = null;

// Initialize Random Nickname
const randomAdjectives = ['Swift', 'Cyber', 'Neon', 'Hyper', 'Sonic', 'Blazing', 'Apex', 'Iron'];
const randomNouns = ['Striker', 'Crusher', 'Ninja', 'Blade', 'Titan', 'Viper', 'Phantom', 'Brawler'];
const randomNum = Math.floor(10 + Math.random() * 90);
const initialName = `${randomAdjectives[Math.floor(Math.random() * randomAdjectives.length)]}${randomNouns[Math.floor(Math.random() * randomNouns.length)]}${randomNum}`;
playerNameInput.value = initialName;

// Color Selection Handlers
colorPicker.addEventListener('click', (ev) => {
  const target = (ev.target as HTMLElement).closest('.color-option') as HTMLElement;
  if (!target) return;
  document.querySelectorAll('.color-option').forEach((el) => el.classList.remove('selected'));
  target.classList.add('selected');
  selectedColor = target.dataset.color || '#00f0ff';
});

// Sound Mute Toggle
btnMuteToggle.addEventListener('click', () => {
  const muted = sound.toggleMute();
  btnMuteToggle.textContent = muted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
});

// Tutorial Handlers
btnHowToPlay.addEventListener('click', () => {
  screenTutorial.classList.remove('hidden');
  analyticsClient.track('tutorial_view', { completed: false });
});

btnCloseTutorial.addEventListener('click', () => {
  screenTutorial.classList.add('hidden');
  analyticsClient.track('tutorial_view', { completed: true });
});

// Network Event Handlers
network.onRoomJoined((playerId, roomState) => {
  currentRoomState = roomState;
  currentPlayers = roomState.players;
  currentPhase = roomState.phase;
  currentCountdownTimer = roomState.countdownTimer;
  currentWinnerId = roomState.winnerId;

  lobbyCodeDisplay.textContent = roomState.code;
  roomCodeTag.textContent = `ROOM: ${roomState.code}`;
  isReady = false;
  btnReadyToggle.textContent = 'Ready Up';
  btnReadyToggle.className = 'btn btn-primary';

  screenMainMenu.classList.add('hidden');
  screenGameOver.classList.add('hidden');
  screenLobby.classList.remove('hidden');

  updateRosterUI(roomState.players);
  ads.showBanner('lobby-ad-slot');
  analyticsClient.track('match_joined', { roomId: roomState.id, isPrivate: roomState.isPrivate });
});

network.onStateUpdate((tick, phase, countdownTimer, winnerId, players, events) => {
  currentPhase = phase;
  currentCountdownTimer = countdownTimer;
  currentWinnerId = winnerId;
  currentPlayers = players;

  // Process combat audio and particle events
  for (const ev of events) {
    handleCombatEvent(ev);
  }

  // Phase transitions UI
  if (phase === 'lobby') {
    screenLobby.classList.remove('hidden');
    screenGameOver.classList.add('hidden');
    updateRosterUI(players);
  } else if (phase === 'countdown') {
    screenLobby.classList.add('hidden');
    screenGameOver.classList.add('hidden');
    ads.hideBanner('lobby-ad-slot');

    const sec = Math.ceil(countdownTimer);
    if (sec !== lastCountdownSecond) {
      lastCountdownSecond = sec;
      sound.playCountdown(sec === 0);
    }
  } else if (phase === 'playing') {
    screenLobby.classList.add('hidden');
    screenGameOver.classList.add('hidden');
  } else if (phase === 'match_over') {
    showMatchOverUI(winnerId, players);
  }
});

network.onError((msg) => {
  alert(`Game Notice: ${msg}`);
});

function handleCombatEvent(ev: CombatEvent): void {
  if (ev.type === 'clash') {
    sound.playClash();
    renderer.triggerCameraShake(14, 0.25);
    renderer.triggerHitstop(0.1);
    renderer.particleSystem.emitClashShockwave(ev.x, ev.y);

    if (ev.outcome === 'tie') {
      renderer.showBanner('⚡ CLASH TIE! OPPOSING RECOIL! ⚡', 1.2);
    } else if (ev.attackA === 'rock' && ev.attackB === 'scissors') {
      renderer.showBanner('✊ ROCK CRUSHES ✌ SCISSORS!', 1.4);
    } else if (ev.attackA === 'scissors' && ev.attackB === 'paper') {
      renderer.showBanner('✌ SCISSORS CUTS ✋ PAPER!', 1.4);
    } else if (ev.attackA === 'paper' && ev.attackB === 'rock') {
      renderer.showBanner('✋ PAPER COVERS ✊ ROCK!', 1.4);
    } else if (ev.attackB === 'rock' && ev.attackA === 'scissors') {
      renderer.showBanner('✊ ROCK CRUSHES ✌ SCISSORS!', 1.4);
    } else if (ev.attackB === 'scissors' && ev.attackA === 'paper') {
      renderer.showBanner('✌ SCISSORS CUTS ✋ PAPER!', 1.4);
    } else if (ev.attackB === 'paper' && ev.attackA === 'rock') {
      renderer.showBanner('✋ PAPER COVERS ✊ ROCK!', 1.4);
    }
  } else if (ev.type === 'hit') {
    if (ev.attack === 'rock') {
      sound.playRockHit();
      renderer.particleSystem.emitRockHitDebris(ev.x, ev.y);
    } else if (ev.attack === 'paper') {
      sound.playPaperHit();
      renderer.particleSystem.emitPaperFlutter(ev.x, ev.y);
    } else {
      sound.playScissorsHit();
      renderer.particleSystem.emitScissorsSparks(ev.x, ev.y);
    }
    renderer.triggerCameraShake(8, 0.16);
  } else if (ev.type === 'elimination') {
    sound.playBlastZoneKO();
    renderer.triggerCameraShake(20, 0.35);
    renderer.particleSystem.emitBlastZoneExplosion(ev.x, ev.y);
  } else if (ev.type === 'match_end') {
    sound.playVictory();
  }
}

function updateRosterUI(players: Record<string, PlayerState>): void {
  lobbyRoster.innerHTML = '';
  for (const p of Object.values(players)) {
    const item = document.createElement('div');
    item.className = 'roster-item';

    const left = document.createElement('div');
    left.className = 'roster-player-name';

    const dot = document.createElement('div');
    dot.className = 'roster-color-dot';
    dot.style.background = p.color;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name + (p.isHost ? ' (Host)' : '');

    left.appendChild(dot);
    left.appendChild(nameSpan);

    const badge = document.createElement('div');
    badge.className = `ready-badge ${p.ready ? 'is-ready' : 'not-ready'}`;
    badge.textContent = p.ready ? 'READY' : 'WAITING';

    item.appendChild(left);
    item.appendChild(badge);
    lobbyRoster.appendChild(item);
  }
}

function showMatchOverUI(winnerId: string | null, players: Record<string, PlayerState>): void {
  screenGameOver.classList.remove('hidden');

  const winner = winnerId ? players[winnerId] : null;
  const localId = network.getLocalPlayerId();
  const isMe = localId && winnerId === localId;

  if (winner) {
    gameOverTitle.textContent = isMe ? '🏆 VICTORY! YOU WON!' : `💀 ${winner.name.toUpperCase()} WINS!`;
    gameOverDesc.textContent = isMe
      ? 'Outstanding tactical RPS reads and launch control!'
      : 'Brush off the blast dust and prepare your rematch strategy!';
  } else {
    gameOverTitle.textContent = 'DRAW MATCH!';
    gameOverDesc.textContent = 'Both fighters were eliminated simultaneously in the blast zone!';
  }

  // Populate local player stats
  if (localId && players[localId]) {
    const stats = players[localId].stats;
    statDamage.textContent = `${Math.round(stats.damageDealt)}`;
    statKos.textContent = `${stats.kos}`;
    statClashes.textContent = `${stats.clashesWon} / ${stats.clashesLost} / ${stats.clashesTied}`;
  }
}

// User Actions
async function joinMatch(isPrivate: boolean = false, code?: string) {
  const name = playerNameInput.value.trim() || 'Fighter';
  try {
    await network.connect();
    network.joinRoom(name, selectedColor, code, isPrivate);
  } catch (e) {
    alert('Unable to connect to game server. Ensure server is running.');
  }
}

btnQuickPlay.addEventListener('click', () => joinMatch(false));
btnCreatePrivate.addEventListener('click', () => joinMatch(true));
btnJoinCode.addEventListener('click', () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (!code) {
    alert('Please enter a room code');
    return;
  }
  joinMatch(false, code);
});

btnReadyToggle.addEventListener('click', () => {
  isReady = !isReady;
  network.setReady(isReady);
  btnReadyToggle.textContent = isReady ? 'Waiting for Others...' : 'Ready Up';
  btnReadyToggle.className = isReady ? 'btn btn-secondary' : 'btn btn-primary';
});

btnLeaveLobby.addEventListener('click', () => {
  window.location.reload();
});

btnCopyLink.addEventListener('click', () => {
  if (!currentRoomState) return;
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoomState.code}`;
  navigator.clipboard.writeText(inviteUrl).then(() => {
    btnCopyLink.textContent = '✅ Copied to Clipboard!';
    setTimeout(() => {
      btnCopyLink.textContent = '📋 Copy Invite Link';
    }, 2000);
  });
});

btnRematch.addEventListener('click', () => {
  network.requestRematch();
  btnRematch.textContent = 'Rematch Requested...';
  analyticsClient.track('rematch_request', { roomId: currentRoomState?.id });
});

btnReturnMenu.addEventListener('click', () => {
  window.location.reload();
});

// Keyboard Listeners
window.addEventListener('keydown', (ev) => {
  keysDown[ev.code] = true;

  // Attack inputs: Z/J = Rock, X/K = Paper, C/L = Scissors
  if (ev.code === 'KeyZ' || ev.code === 'KeyJ') {
    pendingAttack = 'rock';
    sound.playAttackSwing();
  } else if (ev.code === 'KeyX' || ev.code === 'KeyK') {
    pendingAttack = 'paper';
    sound.playAttackSwing();
  } else if (ev.code === 'KeyC' || ev.code === 'KeyL') {
    pendingAttack = 'scissors';
    sound.playAttackSwing();
  } else if (ev.code === 'KeyW' || ev.code === 'Space' || ev.code === 'ArrowUp') {
    sound.playJump();
  }
});

window.addEventListener('keyup', (ev) => {
  keysDown[ev.code] = false;
});

// Fixed Input Sample & Dispatch Loop (~30Hz)
setInterval(() => {
  if (currentPhase !== 'playing' && currentPhase !== 'countdown') return;

  let moveX = 0;
  if (keysDown['KeyA'] || keysDown['ArrowLeft']) moveX -= 1;
  if (keysDown['KeyD'] || keysDown['ArrowRight']) moveX += 1;

  const jump = Boolean(keysDown['KeyW'] || keysDown['Space'] || keysDown['ArrowUp']);
  const attack = pendingAttack;
  pendingAttack = null; // Consume

  network.sendInput(moveX, jump, attack);
}, 1000 / 30);

// Render Loop (60 FPS)
let lastFrameTime = performance.now();

function gameLoop(timestamp: number) {
  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
  lastFrameTime = timestamp;

  renderer.render(
    dt,
    DEFAULT_ARENA,
    currentPlayers,
    currentPhase,
    currentCountdownTimer,
    currentWinnerId,
    network.getLocalPlayerId()
  );

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Initial ad banner & URL param auto-join check
ads.showBanner('menu-ad-slot');

const urlParams = new URLSearchParams(window.location.search);
const roomParam = urlParams.get('room');
if (roomParam) {
  roomCodeInput.value = roomParam.toUpperCase();
}
