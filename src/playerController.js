import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

export class PlayerController {
  constructor(
    scene,
    roomBounds,
    spawnPoint = new THREE.Vector3(-6.5, 0, 4.5),
    collisionWorld = { staticColliders: [], walkableSurfaces: [] },
  ) {
    this.roomBounds = roomBounds;
    this.spawnPoint = spawnPoint.clone();
    this.collisionWorld = collisionWorld;
    this.group = this.#buildCat();
    scene.add(this.group);

    this.position = this.spawnPoint.clone();
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      dash: false,
      swipe: false,
    };

    this.isGrounded = true;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.swipeTimer = 0;
    this.jumpBuffer = 0;
    this.stunTimer = 0;
    this.bobTimer = 0;
    this.meowCooldown = 0;
    this.flashTimer = 0;
    this.colliderRadius = 0.34;
    this.supportSnapHeight = 0.28;
    this.group.position.copy(this.position);

    this.#bindInput();
  }

  #buildLeg(material, x, z) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.26, z);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 6, 12), material);
    upper.castShadow = true;
    upper.position.y = 0.18;
    leg.add(upper);

    const paw = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 18, 16),
      new THREE.MeshStandardMaterial({ color: 0xffd1aa, roughness: 0.94 }),
    );
    paw.position.y = 0.01;
    paw.scale.set(1.05, 0.55, 1.25);
    paw.castShadow = true;
    leg.add(paw);

    return leg;
  }

  #buildCat() {
    const cat = new THREE.Group();

    const fur = new THREE.MeshStandardMaterial({ color: 0x242129, roughness: 0.9 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xf1a55f, roughness: 0.9 });
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xff9b86, roughness: 0.95 });
    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xbfff72,
      emissive: 0x294214,
      emissiveIntensity: 0.28,
      roughness: 0.35,
    });

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.92, 10, 22), fur);
    torso.rotation.x = Math.PI / 2;
    torso.position.set(0, 0.56, 0.02);
    torso.castShadow = true;
    cat.add(torso);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 20), accent);
    chest.scale.set(1.1, 1.1, 0.75);
    chest.position.set(0, 0.48, 0.36);
    chest.castShadow = true;
    cat.add(chest);

    const hips = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 20), fur);
    hips.scale.set(1.1, 0.95, 0.9);
    hips.position.set(0, 0.52, -0.38);
    hips.castShadow = true;
    cat.add(hips);

    const headAnchor = new THREE.Group();
    headAnchor.position.set(0, 0.78, 0.74);
    cat.add(headAnchor);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 28), fur);
    head.scale.set(1, 0.9, 1.02);
    head.castShadow = true;
    headAnchor.add(head);

    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.17, 22, 18), accent);
    muzzle.position.set(0, -0.06, 0.23);
    muzzle.scale.set(1.2, 0.8, 1.15);
    muzzle.castShadow = true;
    headAnchor.add(muzzle);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 14), noseMaterial);
    nose.position.set(0, -0.02, 0.38);
    nose.scale.set(1.2, 0.75, 1);
    headAnchor.add(nose);

    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 18, 14), eyeMaterial);
    eyeLeft.position.set(0.12, 0.04, 0.28);
    headAnchor.add(eyeLeft);

    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = -0.12;
    headAnchor.add(eyeRight);

    const earGeometry = new THREE.ConeGeometry(0.12, 0.24, 6, 2);
    const earLeft = new THREE.Mesh(earGeometry, fur);
    earLeft.position.set(0.18, 0.27, 0.02);
    earLeft.rotation.z = -0.34;
    earLeft.rotation.x = 0.14;
    earLeft.castShadow = true;
    headAnchor.add(earLeft);

    const earRight = earLeft.clone();
    earRight.position.x = -0.18;
    earRight.rotation.z = 0.34;
    headAnchor.add(earRight);

    const stripeGeometry = new THREE.BoxGeometry(0.06, 0.02, 0.18);
    const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0x151317, roughness: 1 });
    [-0.14, 0, 0.14].forEach((x) => {
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      stripe.position.set(x, 0.12, 0.16 - Math.abs(x) * 0.1);
      stripe.rotation.x = -0.2;
      headAnchor.add(stripe);
    });

    const legs = [
      this.#buildLeg(fur, 0.22, 0.32),
      this.#buildLeg(fur, -0.22, 0.32),
      this.#buildLeg(fur, 0.24, -0.34),
      this.#buildLeg(fur, -0.24, -0.34),
    ];
    legs.forEach((leg) => cat.add(leg));

    const tailRoot = new THREE.Group();
    tailRoot.position.set(0, 0.76, -0.74);
    const tailBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.42, 6, 16), fur);
    tailBase.rotation.x = Math.PI / 2;
    tailBase.position.set(0, 0.12, -0.26);
    tailBase.castShadow = true;
    tailRoot.add(tailBase);

    const tailTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 6, 16), accent);
    tailTip.rotation.x = Math.PI / 2;
    tailTip.position.set(0, 0.26, -0.56);
    tailTip.castShadow = true;
    tailRoot.add(tailTip);
    cat.add(tailRoot);

    cat.userData = {
      torso,
      headAnchor,
      tailRoot,
      legs,
    };

    return cat;
  }

  #bindInput() {
    const setKey = (event, value) => {
      const key = event.code;
      if (key === "KeyW" || key === "ArrowUp") this.keys.forward = value;
      if (key === "KeyS" || key === "ArrowDown") this.keys.backward = value;
      if (key === "KeyA" || key === "ArrowLeft") this.keys.left = value;
      if (key === "KeyD" || key === "ArrowRight") this.keys.right = value;
      if (key === "ShiftLeft" || key === "ShiftRight") this.keys.dash = value;
      if (key === "Space") this.keys.jump = value;
      if (key === "KeyE") this.keys.swipe = value;
    };

    window.addEventListener("keydown", (event) => {
      setKey(event, true);
      if (
        event.code === "Space" ||
        event.code === "ArrowUp" ||
        event.code === "ArrowDown" ||
        event.code === "ArrowLeft" ||
        event.code === "ArrowRight"
      ) {
        event.preventDefault();
      }
      if (event.code === "Space") {
        this.jumpBuffer = 0.18;
      }
      if (event.code === "KeyE") {
        this.swipeTimer = Math.max(this.swipeTimer, 0.2);
      }
    });

    window.addEventListener("keyup", (event) => setKey(event, false));
    window.addEventListener("pointerdown", () => {
      this.swipeTimer = Math.max(this.swipeTimer, 0.2);
    });
  }

  reset() {
    this.position.copy(this.spawnPoint);
    this.velocity.set(0, 0, 0);
    this.forward.set(0, 0, -1);
    this.group.position.copy(this.position);
    this.group.rotation.y = Math.PI;
    this.isGrounded = true;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.swipeTimer = 0;
    this.jumpBuffer = 0;
    this.stunTimer = 0;
    this.bobTimer = 0;
    this.meowCooldown = 0;
    this.flashTimer = 0;
    this.group.userData.torso.scale.set(1, 1, 1);
    this.group.userData.headAnchor.position.set(0, 0.78, 0.74);
    this.group.userData.headAnchor.rotation.set(0, 0, 0);
    this.group.userData.tailRoot.rotation.set(0, 0, 0);
    this.group.userData.legs.forEach((leg, index) => {
      leg.rotation.set(0, 0, 0);
      leg.position.y = 0.26;
      leg.position.x = index % 2 === 0 ? 0.22 + (index > 1 ? 0.02 : 0) : -0.22 - (index > 1 ? 0.02 : 0);
      leg.position.z = index < 2 ? 0.32 : -0.34;
    });
  }

  update(deltaSeconds) {
    this.jumpBuffer = Math.max(0, this.jumpBuffer - deltaSeconds);
    this.dashCooldown = Math.max(0, this.dashCooldown - deltaSeconds);
    this.dashTimer = Math.max(0, this.dashTimer - deltaSeconds);
    this.swipeTimer = Math.max(0, this.swipeTimer - deltaSeconds);
    this.stunTimer = Math.max(0, this.stunTimer - deltaSeconds);
    this.meowCooldown = Math.max(0, this.meowCooldown - deltaSeconds);
    this.flashTimer = Math.max(0, this.flashTimer - deltaSeconds);

    const moveInput = new THREE.Vector3(
      Number(this.keys.right) - Number(this.keys.left),
      0,
      Number(this.keys.backward) - Number(this.keys.forward),
    );

    if (this.stunTimer > 0) {
      moveInput.set(0, 0, 0);
    }

    if (moveInput.lengthSq() > 0.001) {
      moveInput.normalize();
      this.forward.lerp(moveInput, 0.24);
      this.forward.normalize();
    }

    const speed = this.dashTimer > 0 ? 10.2 : 5.8;
    const acceleration = this.isGrounded ? 16 : 8;
    this.moveDirection.copy(moveInput).multiplyScalar(speed);

    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.moveDirection.x, acceleration, deltaSeconds);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.moveDirection.z, acceleration, deltaSeconds);

    if (this.jumpBuffer > 0 && this.isGrounded && this.stunTimer <= 0) {
      this.velocity.y = 7.1;
      this.isGrounded = false;
      this.jumpBuffer = 0;
    }

    if (this.keys.dash && this.dashCooldown <= 0 && moveInput.lengthSq() > 0.01 && this.stunTimer <= 0) {
      this.dashTimer = 0.24;
      this.dashCooldown = 0.85;
    }

    this.velocity.y -= 18 * deltaSeconds;

    const candidate = this.position.clone().addScaledVector(this.velocity, deltaSeconds);
    const resolvedHorizontal = this.#resolveHorizontalCollisions(candidate);
    this.position.x = THREE.MathUtils.clamp(resolvedHorizontal.x, this.roomBounds.minX, this.roomBounds.maxX);
    this.position.z = THREE.MathUtils.clamp(resolvedHorizontal.z, this.roomBounds.minZ, this.roomBounds.maxZ);
    this.position.y = candidate.y;

    const groundY = this.#findGroundHeight();
    if (this.velocity.y <= 0 && this.position.y <= groundY + this.supportSnapHeight) {
      this.position.y = groundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.group.position.copy(this.position);
    this.group.rotation.y = Math.atan2(this.forward.x, this.forward.z);

    // The cat uses a simple trot cycle so it still feels alive without a full rig.
    this.bobTimer += deltaSeconds * (this.velocity.length() * 0.9 + 1.8);
    const runFactor = Math.min(1, this.velocity.length() / 6.5);
    const step = Math.sin(this.bobTimer * 11) * runFactor;
    const bob = Math.abs(step) * 0.05;
    const dashStretch = 1 + Math.min(0.16, this.dashTimer * 0.25);

    this.group.userData.torso.scale.set(1, 1 - bob * 0.45, dashStretch);
    this.group.userData.headAnchor.position.y = 0.78 + bob * 0.6;
    this.group.userData.headAnchor.rotation.x = -0.08 + this.velocity.y * 0.03 + Math.abs(step) * 0.05;
    this.group.userData.tailRoot.rotation.x = 0.7 + step * 0.16 + runFactor * 0.12;
    this.group.userData.tailRoot.rotation.y = Math.sin(this.bobTimer * 5.2) * 0.18;

    const legOffsets = [step, -step, -step, step];
    this.group.userData.legs.forEach((leg, index) => {
      leg.rotation.x = legOffsets[index] * 0.55 + Math.max(0, this.velocity.y * 0.04);
      leg.position.y = 0.26 + Math.max(0, -legOffsets[index]) * 0.04;
    });

    this.group.position.y += bob * 0.24;

    if (this.swipeTimer > 0) {
      this.group.rotation.y += Math.sin(this.swipeTimer * 28) * 0.06;
      this.group.userData.headAnchor.rotation.z = Math.sin(this.swipeTimer * 24) * 0.12;
    } else {
      this.group.userData.headAnchor.rotation.z = 0;
    }

    if (this.flashTimer > 0) {
      this.group.position.addScaledVector(UP, Math.sin(this.flashTimer * 50) * 0.03);
    }
  }

  getInteractionData() {
    const forward = this.forward.clone().normalize();
    const origin = this.position.clone().add(new THREE.Vector3(0, 0.55, 0));
    return {
      origin,
      forward,
      isDashing: this.dashTimer > 0,
      isSwiping: this.swipeTimer > 0.02,
      speed: this.velocity.length(),
      radius: this.dashTimer > 0 ? 1.55 : 1.15,
    };
  }

  canMeow() {
    if (this.meowCooldown > 0) return false;
    this.meowCooldown = 1.8;
    return true;
  }

  stun(pushDirection) {
    this.stunTimer = 1.15;
    this.flashTimer = 0.24;
    this.velocity.x = pushDirection.x * 4.2;
    this.velocity.z = pushDirection.z * 4.2;
    this.velocity.y = 3.1;
  }

  applyExternalDisplacement(offset) {
    const candidate = this.position.clone().add(offset);
    const resolved = this.#resolveHorizontalCollisions(candidate);
    this.position.x = THREE.MathUtils.clamp(resolved.x, this.roomBounds.minX, this.roomBounds.maxX);
    this.position.z = THREE.MathUtils.clamp(resolved.z, this.roomBounds.minZ, this.roomBounds.maxZ);
  }

  #resolveHorizontalCollisions(candidate) {
    const resolved = this.position.clone();
    resolved.x = candidate.x;
    resolved.z = candidate.z;
    resolved.x = this.#resolveAxis("x", resolved, this.position.x);
    resolved.z = this.#resolveAxis("z", resolved, this.position.z);
    return resolved;
  }

  #resolveAxis(axis, resolved, previousValue) {
    const radius = this.colliderRadius;
    for (const collider of this.collisionWorld.staticColliders) {
      if (this.position.y >= collider.topY - 0.12) continue;

      const insideOtherAxis =
        axis === "x"
          ? resolved.z + radius > collider.minZ && resolved.z - radius < collider.maxZ
          : resolved.x + radius > collider.minX && resolved.x - radius < collider.maxX;
      if (!insideOtherAxis) continue;

      if (axis === "x") {
        if (previousValue <= collider.minX - radius && resolved.x > collider.minX - radius) {
          resolved.x = collider.minX - radius;
          this.velocity.x = Math.min(0, this.velocity.x);
        } else if (previousValue >= collider.maxX + radius && resolved.x < collider.maxX + radius) {
          resolved.x = collider.maxX + radius;
          this.velocity.x = Math.max(0, this.velocity.x);
        }
      } else {
        if (previousValue <= collider.minZ - radius && resolved.z > collider.minZ - radius) {
          resolved.z = collider.minZ - radius;
          this.velocity.z = Math.min(0, this.velocity.z);
        } else if (previousValue >= collider.maxZ + radius && resolved.z < collider.maxZ + radius) {
          resolved.z = collider.maxZ + radius;
          this.velocity.z = Math.max(0, this.velocity.z);
        }
      }
    }

    return axis === "x" ? resolved.x : resolved.z;
  }

  #findGroundHeight() {
    let groundY = this.roomBounds.floorY;
    for (const surface of this.collisionWorld.walkableSurfaces) {
      const inset = this.colliderRadius * 0.25;
      const inside =
        this.position.x > surface.xMin + inset &&
        this.position.x < surface.xMax - inset &&
        this.position.z > surface.zMin + inset &&
        this.position.z < surface.zMax - inset;
      if (!inside) continue;

      if (surface.y > groundY && this.position.y >= surface.y - this.supportSnapHeight) {
        groundY = surface.y;
      }
    }
    return groundY;
  }
}
