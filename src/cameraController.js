import * as THREE from "three";

export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3();
    this.lookAt = new THREE.Vector3();
    this.shakeTimer = 0;
    this.shakeStrength = 0;
  }

  triggerShake(strength = 0.12) {
    this.shakeTimer = Math.max(this.shakeTimer, 0.16);
    this.shakeStrength = Math.max(this.shakeStrength, strength);
  }

  update(deltaSeconds, player) {
    const followOffset = new THREE.Vector3(0, 2.45, 4.9);
    const desired = player.position.clone().add(followOffset);
    desired.x += player.forward.x * 0.9;
    desired.z += player.forward.z * 0.9;

    this.target.lerp(desired, 1 - Math.exp(-deltaSeconds * 7));
    this.lookAt.lerp(player.position.clone().add(new THREE.Vector3(0, 0.78, 0)), 1 - Math.exp(-deltaSeconds * 9));

    this.shakeTimer = Math.max(0, this.shakeTimer - deltaSeconds);
    const shakeAmount = this.shakeTimer > 0 ? this.shakeStrength * (this.shakeTimer / 0.16) : 0;
    const jitter = new THREE.Vector3(
      (Math.random() - 0.5) * shakeAmount,
      (Math.random() - 0.5) * shakeAmount,
      (Math.random() - 0.5) * shakeAmount,
    );

    this.camera.position.copy(this.target).add(jitter);
    this.camera.lookAt(this.lookAt);
  }
}
