import * as THREE from "three";
import { createSceneWorld } from "./scene.js";
import { PlayerController } from "./playerController.js";
import { CameraController } from "./cameraController.js";
import { InteractableManager } from "./interactables.js";
import { ScoringSystem } from "./scoringSystem.js";
import { OwnerSystem } from "./ownerSystem.js";
import { UIManager } from "./uiManager.js";
import { GameStateManager, GAME_STATES } from "./gameState.js";
import { AudioManager } from "./audioManager.js";

const canvas = document.getElementById("game");
const world = createSceneWorld(canvas);
const ui = new UIManager();
const gameState = new GameStateManager(90);
const scoring = new ScoringSystem();
const audio = new AudioManager();
const player = new PlayerController(world.scene, world.roomBounds);
const cameraController = new CameraController(world.camera);
const interactables = new InteractableManager(world.scene, world.supports);
const owner = new OwnerSystem(world.scene, world.ownerDoor.position.clone());
const clock = new THREE.Clock();

let ownerLine = "\"Miso...\"";
let dramaticCooldown = 0;
let ambienceTimer = 0;
let hitStopTimer = 0;

function applyChaosEvent(event) {
  if (event.kind === "score") {
    const result = scoring.addChaos(event.points, event.label);
    ownerLine = owner.reactToEvent(event.type, result.totalScore);
    ui.toast(`+${result.added} ${event.label}`);

    if (result.comboCount >= 2) {
      ui.toast(`${result.comboCount}x combo!`, { big: result.comboCount >= 4 });
      audio.combo(result.comboCount);
    }

    if (event.type === "tv" || event.type === "laptop" || event.points >= 500) {
      cameraController.triggerShake(0.18);
      ui.shakeScreen();
      hitStopTimer = Math.max(hitStopTimer, 0.05);
    } else {
      cameraController.triggerShake(0.09);
    }

    if (event.break) {
      audio.breakCrash();
    } else {
      audio.impact(0.8);
    }
  }

  if (event.kind === "break" && dramaticCooldown <= 0) {
    dramaticCooldown = 0.28;
    ui.toast(event.type === "tv" ? "ABSOLUTE CINEMA" : "CRASH!", {
      big: event.type === "tv",
    });
  }
}

function resetRun() {
  gameState.startRound();
  scoring.reset();
  interactables.reset();
  owner.reset();
  player.reset();
  ownerLine = "\"Miso...\"";
  dramaticCooldown = 0;
  ambienceTimer = 0;
  hitStopTimer = 0;
  ui.showHud();
  ui.updateHud({
    score: 0,
    timeLeft: gameState.timeLeft,
    comboProgress: 0,
    comboText: "Calm for now",
    ownerText: ownerLine,
  });
}

async function startGame() {
  await audio.unlock();
  resetRun();
}

async function restartGame() {
  await audio.unlock();
  resetRun();
}

ui.bind(startGame, restartGame);
ui.showStart();
interactables.reset();

function maybeMeow() {
  if (Math.random() < 0.004 && player.canMeow()) {
    audio.meow();
  }
}

function updatePlaying(deltaSeconds) {
  player.update(deltaSeconds);
  cameraController.update(deltaSeconds, player);
  scoring.update(deltaSeconds);
  dramaticCooldown = Math.max(0, dramaticCooldown - deltaSeconds);
  ambienceTimer += deltaSeconds;

  const interactionData = player.getInteractionData();
  if (interactionData.isSwiping || interactionData.isDashing) {
    // Swipes and dashes both use the same interaction pass so the core loop stays simple.
    const hits = interactables.tryInteract(interactionData);
    if (hits.length > 0) {
      const strongest = hits.reduce((max, hit) => Math.max(max, hit.intensity), 0.35);
      audio.impact(strongest);
      cameraController.triggerShake(Math.min(0.1, strongest * 0.06));
      maybeMeow();
    }
  }

  const chaosEvents = interactables.update(deltaSeconds);
  chaosEvents.forEach(applyChaosEvent);

  const ownerState = owner.update(deltaSeconds, player, scoring.score);
  if (ownerState.stunned) {
    ownerLine = ownerState.text;
    ui.toast("Caught!", { big: true });
    audio.ownerAlert();
    cameraController.triggerShake(0.16);
    ui.shakeScreen();
  } else if (ownerState.text) {
    ownerLine = ownerState.text;
  }

  if (ambienceTimer > 7) {
    ambienceTimer = 0;
    maybeMeow();
  }

  const ended = gameState.update(deltaSeconds);
  ui.updateHud({
    score: scoring.score,
    timeLeft: gameState.timeLeft,
    comboProgress: scoring.getComboProgress(),
    comboText: scoring.lastComboLabel,
    ownerText: ownerLine,
  });

  if (ended) {
    scoring.saveBestIfNeeded();
    ui.showEnd({
      score: scoring.score,
      rank: scoring.getRank(),
      bestScore: scoring.bestScore,
    });
  }
}

function renderIdle(deltaSeconds) {
  cameraController.update(deltaSeconds, player);
}

function animate() {
  requestAnimationFrame(animate);
  const deltaSeconds = Math.min(clock.getDelta(), 0.033);

  if (hitStopTimer > 0) {
    hitStopTimer = Math.max(0, hitStopTimer - deltaSeconds);
    world.renderer.render(world.scene, world.camera);
    return;
  }

  if (gameState.state === GAME_STATES.PLAYING) {
    updatePlaying(deltaSeconds);
  } else {
    renderIdle(deltaSeconds);
  }

  world.renderer.render(world.scene, world.camera);
}

animate();

window.addEventListener("resize", () => {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
});
