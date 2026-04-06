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
  constructor(scene, doorPath) {
    this.doorPath = doorPath;
    this.group = this.#buildOwner();
    this.group.position.copy(this.doorPath.outside);
    this.group.visible = false;
    scene.add(this.group);

    this.currentLine = "\"Miso...\"";
    this.state = "hidden";
    this.cooldown = 8;
    this.chaseTimer = 0;
    this.pauseTimer = 0;
    this.nextThresholdIndex = 0;
    this.thresholds = [1400, 3200, 5600];
  }

  #buildOwner() {
    const owner = new THREE.Group();
    const hoodieMaterial = new THREE.MeshStandardMaterial({ color: 0x5d73ff, roughness: 0.92 });
    const jeansMaterial = new THREE.MeshStandardMaterial({ color: 0x314b83, roughness: 0.9 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd1b8, roughness: 1 });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.84, 6, 10), hoodieMaterial);
    torso.position.y = 1.24;
    torso.castShadow = true;
    owner.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), skinMaterial);
    head.position.y = 2.05;
    head.castShadow = true;
    owner.add(head);

    const legs = [];
    [-0.16, 0.16].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.68, 4, 8), jeansMaterial);
      leg.position.set(x, 0.44, 0);
      leg.castShadow = true;
      owner.add(leg);
      legs.push(leg);
    });

    const arms = [];
    [-0.44, 0.44].forEach((x) => {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.58, 4, 8), hoodieMaterial);
      arm.position.set(x, 1.26, 0);
      arm.rotation.z = x < 0 ? 0.32 : -0.32;
      arm.castShadow = true;
      owner.add(arm);
      arms.push(arm);
    });

    owner.userData = { legs, arms };
    return owner;
  }

  reset() {
    this.group.visible = false;
    this.group.position.copy(this.doorPath.outside);
    this.group.rotation.set(0, 0, 0);
    this.state = "hidden";
    this.cooldown = 8;
    this.chaseTimer = 0;
    this.pauseTimer = 0;
    this.currentLine = "\"Miso...\"";
    this.nextThresholdIndex = 0;
    this.group.userData.legs.forEach((leg) => leg.rotation.set(0, 0, 0));
    this.group.userData.arms[0].rotation.set(0, 0, 0.32);
    this.group.userData.arms[1].rotation.set(0, 0, -0.32);
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

  #moveTowards(target, speed, deltaSeconds) {
    const offset = target.clone().sub(this.group.position);
    offset.y = 0;
    const distance = offset.length();
    if (distance < 0.001) return distance;

    offset.normalize();
    this.group.position.addScaledVector(offset, Math.min(distance, speed * deltaSeconds));
    this.group.rotation.y = Math.atan2(offset.x, offset.z);
    return distance;
  }

  #animateWalk(deltaSeconds, pace = 1) {
    const phase = performance.now() * 0.01 * pace;
    const swing = Math.sin(phase) * 0.42;
    this.group.userData.legs[0].rotation.x = swing;
    this.group.userData.legs[1].rotation.x = -swing;
    this.group.userData.arms[0].rotation.x = -swing * 0.7;
    this.group.userData.arms[1].rotation.x = swing * 0.7;
  }

  update(deltaSeconds, player, score) {
    this.cooldown = Math.max(0, this.cooldown - deltaSeconds);

    if (
      this.state === "hidden" &&
      this.nextThresholdIndex < this.thresholds.length &&
      score >= this.thresholds[this.nextThresholdIndex] &&
      this.cooldown <= 0
    ) {
      this.state = "entering";
      this.group.visible = true;
      this.group.position.copy(this.doorPath.outside);
      this.chaseTimer = 6 + this.nextThresholdIndex * 0.9;
      this.currentLine = `"${BARKS[(this.nextThresholdIndex + 1) % BARKS.length]}"`;
      this.nextThresholdIndex += 1;
    }

    let caught = false;

    if (this.state === "entering") {
      this.#animateWalk(deltaSeconds, 0.9);
      const distance = this.#moveTowards(this.doorPath.inside, 4.2, deltaSeconds);
      if (distance < 0.25) {
        this.state = "chasing";
      }
    } else if (this.state === "chasing") {
      this.#animateWalk(deltaSeconds, 1.45);
      this.chaseTimer = Math.max(0, this.chaseTimer - deltaSeconds);

      const chaseTarget = player.position.clone();
      chaseTarget.y = 0;
      const distance = this.#moveTowards(chaseTarget, 3.9, deltaSeconds);

      if (distance < 1.05 && player.stunTimer <= 0) {
        const pushDirection = player.position.clone().sub(this.group.position).setY(0);
        if (pushDirection.lengthSq() < 0.0001) {
          pushDirection.set(0, 0, 1);
        } else {
          pushDirection.normalize();
        }
        player.stun(pushDirection);
        this.currentLine = "\"TIME-OUT, GREMLIN.\"";
        this.pauseTimer = 0.75;
        this.state = "caught-pause";
        caught = true;
      } else if (this.chaseTimer === 0) {
        this.currentLine = "\"Lucky this time.\"";
        this.state = "returning";
      }
    } else if (this.state === "caught-pause") {
      this.pauseTimer = Math.max(0, this.pauseTimer - deltaSeconds);
      if (this.pauseTimer === 0) {
        this.currentLine = "\"Go think about what you've done.\"";
        this.state = "returning";
      }
    } else if (this.state === "returning") {
      this.#animateWalk(deltaSeconds, 1.1);
      const distance = this.#moveTowards(this.doorPath.inside, 3.5, deltaSeconds);
      if (distance < 0.25) {
        this.state = "exiting";
      }
    } else if (this.state === "exiting") {
      this.#animateWalk(deltaSeconds, 0.9);
      const distance = this.#moveTowards(this.doorPath.outside, 3.8, deltaSeconds);
      if (distance < 0.25) {
        this.group.visible = false;
        this.state = "hidden";
        this.cooldown = 12;
        this.currentLine = "\"I'm watching you.\"";
      }
    }

    return {
      text: this.currentLine,
      caught,
      active: this.state !== "hidden",
    };
  }
}
