import * as THREE from "three";

const BARKS = [
  "MISO!!",
  "GET OFF THE COUNTER!",
  "WHY ARE YOU LIKE THIS?",
  "NO. NO. NO.",
  "I LEFT FOR TWO SECONDS!",
  "NOT THE TV!",
];

export class OwnerSystem {
  constructor(scene, entryPosition) {
    this.entryPosition = entryPosition;
    this.group = this.#buildOwner();
    this.group.visible = false;
    scene.add(this.group);

    this.currentLine = "\"Miso...\"";
    this.active = false;
    this.timer = 0;
    this.cooldown = 8;
    this.nextThresholdIndex = 0;
    this.thresholds = [1400, 3200, 5600];
  }

  #buildOwner() {
    const owner = new THREE.Group();
    const hoodie = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.36, 0.9, 6, 10),
      new THREE.MeshStandardMaterial({ color: 0x5d73ff, roughness: 0.92 }),
    );
    hoodie.position.y = 1.2;
    hoodie.castShadow = true;
    owner.add(hoodie);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd1b8, roughness: 1 }),
    );
    head.position.y = 2.02;
    head.castShadow = true;
    owner.add(head);

    return owner;
  }

  reset() {
    this.group.visible = false;
    this.group.position.copy(this.entryPosition);
    this.active = false;
    this.timer = 0;
    this.cooldown = 8;
    this.currentLine = "\"Miso...\"";
    this.nextThresholdIndex = 0;
  }

  reactToEvent(type, score) {
    if (type === "tv") {
      this.currentLine = "\"NOT THE TV!\"";
      return this.currentLine;
    }
    if (type === "laptop") {
      this.currentLine = "\"MY LAPTOP?!\"";
      return this.currentLine;
    }
    if (type === "vase") {
      this.currentLine = "\"THAT WAS THE NICE VASE!\"";
      return this.currentLine;
    }
    if (score > 4800) {
      this.currentLine = "\"YOU ARE A FURRY NATURAL DISASTER.\"";
      return this.currentLine;
    }

    this.currentLine = `"${BARKS[Math.floor(Math.random() * BARKS.length)]}"`;
    return this.currentLine;
  }

  update(deltaSeconds, player, score) {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);

    if (
      this.nextThresholdIndex < this.thresholds.length &&
      score >= this.thresholds[this.nextThresholdIndex] &&
      this.cooldown <= 0
    ) {
      this.active = true;
      this.group.visible = true;
      this.group.position.copy(this.entryPosition);
      this.timer = 4.5 + this.nextThresholdIndex * 0.8;
      this.cooldown = 12;
      this.currentLine = `"${BARKS[(this.nextThresholdIndex + 1) % BARKS.length]}"`;
      this.nextThresholdIndex += 1;
    }

    let stunned = false;
    if (this.active) {
      this.timer = Math.max(0, this.timer - deltaSeconds);
      const chaseTarget = player.position.clone();
      chaseTarget.y = 0;
      const offset = chaseTarget.sub(this.group.position);
      const distance = offset.length();
      if (distance > 0.001) {
        offset.normalize();
        this.group.position.addScaledVector(offset, deltaSeconds * 3.3);
        this.group.rotation.y = Math.atan2(offset.x, offset.z);
      }

      if (distance < 1.1 && player.stunTimer <= 0) {
        player.stun(offset);
        stunned = true;
        this.currentLine = "\"TIME-OUT, GREMLIN.\"";
      }

      if (this.timer === 0) {
        this.active = false;
        this.group.visible = false;
        this.currentLine = "\"I'm watching you.\"";
      }
    }

    return {
      text: this.currentLine,
      stunned,
      active: this.active,
    };
  }
}
