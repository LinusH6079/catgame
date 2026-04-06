const COMBO_WINDOW = 2.4;

export class ScoringSystem {
  constructor() {
    this.score = 0;
    this.bestScore = Number.parseInt(localStorage.getItem("chaos-cat-best") ?? "0", 10);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastComboLabel = "Calm for now";
  }

  reset() {
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastComboLabel = "Calm for now";
  }

  update(deltaSeconds) {
    if (this.comboTimer > 0) {
      this.comboTimer = Math.max(0, this.comboTimer - deltaSeconds);
      if (this.comboTimer === 0) {
        this.comboCount = 0;
        this.lastComboLabel = "Calm for now";
      }
    }
  }

  addChaos(points, label) {
    this.comboCount += 1;
    this.comboTimer = COMBO_WINDOW;
    const multiplier = 1 + Math.min(2.5, (this.comboCount - 1) * 0.3);
    const total = Math.round(points * multiplier);
    this.score += total;

    this.lastComboLabel =
      this.comboCount > 1
        ? `${this.comboCount}x combo - ${label}`
        : `${label}`;

    return {
      added: total,
      multiplier,
      comboCount: this.comboCount,
      comboProgress: this.comboTimer / COMBO_WINDOW,
      label: this.lastComboLabel,
      totalScore: this.score,
    };
  }

  getComboProgress() {
    return this.comboTimer / COMBO_WINDOW;
  }

  penalize(points) {
    this.score = Math.max(0, this.score - points);
    this.comboCount = 0;
    this.comboTimer = 0;
    this.lastComboLabel = "Combo broken";
    return this.score;
  }

  saveBestIfNeeded() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem("chaos-cat-best", String(this.score));
    }
  }

  getRank() {
    if (this.score >= 8000) return "Apocalypse Kitty";
    if (this.score >= 5500) return "Agent of Ruin";
    if (this.score >= 3500) return "Goblin Cat";
    if (this.score >= 1800) return "Tiny Disaster";
    return "Indoor Menace";
  }
}
