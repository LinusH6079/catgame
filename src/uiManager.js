export class UIManager {
  constructor() {
    this.startScreen = document.getElementById("start-screen");
    this.endScreen = document.getElementById("end-screen");
    this.hud = document.getElementById("hud");
    this.startButton = document.getElementById("start-button");
    this.restartButton = document.getElementById("restart-button");
    this.scoreValue = document.getElementById("score-value");
    this.timerValue = document.getElementById("timer-value");
    this.comboBar = document.getElementById("combo-bar");
    this.comboText = document.getElementById("combo-text");
    this.ownerText = document.getElementById("owner-text");
    this.endRank = document.getElementById("end-rank");
    this.endScore = document.getElementById("end-score");
    this.bestScore = document.getElementById("best-score");
    this.toastLayer = document.getElementById("toast-layer");
    this.shell = document.querySelector(".app-shell");
  }

  bind(onStart, onRestart) {
    this.startButton.addEventListener("click", onStart);
    this.restartButton.addEventListener("click", onRestart);
  }

  showStart() {
    this.startScreen.classList.remove("hidden");
    this.hud.classList.add("hidden");
    this.endScreen.classList.add("hidden");
  }

  showHud() {
    this.startScreen.classList.add("hidden");
    this.hud.classList.remove("hidden");
    this.endScreen.classList.add("hidden");
  }

  showEnd({ score, rank, bestScore }) {
    this.endRank.textContent = rank;
    this.endScore.textContent = `${score.toLocaleString()} points`;
    this.bestScore.textContent = `Best: ${bestScore.toLocaleString()}`;
    this.endScreen.classList.remove("hidden");
    this.hud.classList.add("hidden");
  }

  updateHud({ score, timeLeft, comboProgress, comboText, ownerText }) {
    this.scoreValue.textContent = score.toLocaleString();
    this.timerValue.textContent = timeLeft.toFixed(1);
    this.comboBar.style.width = `${Math.max(0, Math.min(100, comboProgress * 100))}%`;
    this.comboText.textContent = comboText;
    this.ownerText.textContent = ownerText;
  }

  toast(message, { big = false } = {}) {
    const toast = document.createElement("div");
    toast.className = `toast${big ? " toast--big" : ""}`;
    toast.textContent = message;
    this.toastLayer.appendChild(toast);
    window.setTimeout(() => toast.remove(), 900);
  }

  shakeScreen() {
    this.shell.classList.remove("screen-shake");
    void this.shell.offsetWidth;
    this.shell.classList.add("screen-shake");
  }
}
