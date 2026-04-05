export const GAME_STATES = {
  START: "start",
  PLAYING: "playing",
  ENDED: "ended",
};

export class GameStateManager {
  constructor(roundDuration = 90) {
    this.roundDuration = roundDuration;
    this.state = GAME_STATES.START;
    this.timeLeft = roundDuration;
  }

  startRound() {
    this.state = GAME_STATES.PLAYING;
    this.timeLeft = this.roundDuration;
  }

  resetRound() {
    this.state = GAME_STATES.START;
    this.timeLeft = this.roundDuration;
  }

  update(deltaSeconds) {
    if (this.state !== GAME_STATES.PLAYING) {
      return false;
    }

    this.timeLeft = Math.max(0, this.timeLeft - deltaSeconds);
    if (this.timeLeft === 0) {
      this.state = GAME_STATES.ENDED;
      return true;
    }

    return false;
  }

  endRound() {
    this.state = GAME_STATES.ENDED;
  }
}
