import * as THREE from "three";

const UP = new THREE.Vector3(0, 1, 0);

export class PlayerController {
  constructor(scene, roomBounds) {
    this.roomBounds = roomBounds;
    this.group = this.#buildCat();
    scene.add(this.group);

    this.position = new THREE.Vector3(-2.8, 0, 2.6);
    this.velocity = new THREE.Vector3();
    this.moveDirection = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, 1);
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
    this.group.position.copy(this.position);

    this.#bindInput();
  }

  #buildCat() {
    const cat = new THREE.Group();

    const fur = new THREE.MeshStandardMaterial({ color: 0x28211e, roughness: 0.92 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xffab5c, roughness: 0.88 });

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 8, 12), fur);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.55;
    body.castShadow = true;
    cat.add(body);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), accent);
    belly.position.set(0.12, 0.47, 0);
    belly.scale.set(1.1, 0.8, 0.8);
    belly.castShadow = true;
    cat.add(belly);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 16), fur);
    head.position.set(0.57, 0.7, 0);
    head.castShadow = true;
    cat.add(head);

    const earGeometry = new THREE.ConeGeometry(0.1, 0.22, 4);
    const earLeft = new THREE.Mesh(earGeometry, fur);
    earLeft.position.set(0.67, 1, 0.14);
    earLeft.rotation.z = -0.32;
    earLeft.rotation.x = 0.18;
    earLeft.castShadow = true;
    cat.add(earLeft);

    const earRight = earLeft.clone();
    earRight.position.z = -0.14;
    cat.add(earRight);

    const pawGeometry = new THREE.SphereGeometry(0.11, 12, 12);
    const pawPositions = [
      [0.36, 0.18, 0.18],
      [0.36, 0.18, -0.18],
      [-0.26, 0.18, 0.2],
      [-0.26, 0.18, -0.2],
    ];
    pawPositions.forEach(([x, y, z]) => {
      const paw = new THREE.Mesh(pawGeometry, accent);
      paw.position.set(x, y, z);
      paw.castShadow = true;
      cat.add(paw);
    });

    const tailRoot = new THREE.Group();
    tailRoot.position.set(-0.55, 0.7, 0);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.75, 4, 8), fur);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.36, 0.08, 0);
    tail.castShadow = true;
    tailRoot.add(tail);
    cat.add(tailRoot);

    cat.userData = {
      body,
      head,
      tailRoot,
    };

    return cat;
  }

  #bindInput() {
    const setKey = (event, value) => {
      const key = event.code;
      if (key === "KeyW") this.keys.forward = value;
      if (key === "KeyS") this.keys.backward = value;
      if (key === "KeyA") this.keys.left = value;
      if (key === "KeyD") this.keys.right = value;
      if (key === "ShiftLeft" || key === "ShiftRight") this.keys.dash = value;
      if (key === "Space") this.keys.jump = value;
      if (key === "KeyE") this.keys.swipe = value;
    };

    window.addEventListener("keydown", (event) => {
      setKey(event, true);
      if (event.code === "Space") {
        event.preventDefault();
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
    this.position.set(-2.8, 0, 2.6);
    this.velocity.set(0, 0, 0);
    this.forward.set(0, 0, 1);
    this.group.position.copy(this.position);
    this.group.rotation.y = 0;
    this.isGrounded = true;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.swipeTimer = 0;
    this.jumpBuffer = 0;
    this.stunTimer = 0;
    this.bobTimer = 0;
    this.meowCooldown = 0;
    this.flashTimer = 0;
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

    const speed = this.dashTimer > 0 ? 9.6 : 5.3;
    const acceleration = this.isGrounded ? 14 : 7.6;
    this.moveDirection.copy(moveInput).multiplyScalar(speed);

    this.velocity.x = THREE.MathUtils.damp(
      this.velocity.x,
      this.moveDirection.x,
      acceleration,
      deltaSeconds,
    );
    this.velocity.z = THREE.MathUtils.damp(
      this.velocity.z,
      this.moveDirection.z,
      acceleration,
      deltaSeconds,
    );

    if (this.jumpBuffer > 0 && this.isGrounded && this.stunTimer <= 0) {
      this.velocity.y = 6.8;
      this.isGrounded = false;
      this.jumpBuffer = 0;
    }

    if (this.keys.dash && this.dashCooldown <= 0 && moveInput.lengthSq() > 0.01 && this.stunTimer <= 0) {
      this.dashTimer = 0.24;
      this.dashCooldown = 0.8;
    }

    this.velocity.y -= 18 * deltaSeconds;
    this.position.addScaledVector(this.velocity, deltaSeconds);

    if (this.position.y <= this.roomBounds.floorY) {
      this.position.y = this.roomBounds.floorY;
      this.velocity.y = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.position.x = THREE.MathUtils.clamp(this.position.x, this.roomBounds.minX, this.roomBounds.maxX);
    this.position.z = THREE.MathUtils.clamp(this.position.z, this.roomBounds.minZ, this.roomBounds.maxZ);

    this.group.position.copy(this.position);
    this.group.rotation.y = Math.atan2(this.forward.x, this.forward.z);

    // A little squash, head bob, and tail motion goes a long way for a simple cat rig.
    this.bobTimer += deltaSeconds * (this.velocity.length() * 0.8 + 2.2);
    const bob = Math.sin(this.bobTimer * 10) * Math.min(0.045, this.velocity.length() * 0.004);
    const bodyScale = 1 + Math.min(0.12, this.dashTimer * 0.18);
    this.group.userData.body.scale.set(bodyScale, 1 - Math.abs(bob) * 0.3, 1 - Math.abs(bob) * 0.18);
    this.group.userData.head.position.y = 0.7 + bob * 1.4 + Math.sin(this.bobTimer * 4) * 0.015;
    this.group.userData.tailRoot.rotation.z = Math.sin(this.bobTimer * 3.6) * 0.46 + 0.48;
    this.group.position.y += Math.abs(bob) * 0.2;

    if (this.swipeTimer > 0) {
      this.group.rotation.y += Math.sin(this.swipeTimer * 28) * 0.06;
      this.group.userData.head.rotation.z = Math.sin(this.swipeTimer * 24) * 0.1;
    } else {
      this.group.userData.head.rotation.z = 0;
    }

    if (this.flashTimer > 0) {
      this.group.position.addScaledVector(UP, Math.sin(this.flashTimer * 50) * 0.03);
    }
  }

  getInteractionData() {
    const forward = this.forward.clone().normalize();
    const origin = this.position.clone().add(new THREE.Vector3(0, 0.6, 0));
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
    this.stunTimer = 1.05;
    this.flashTimer = 0.24;
    this.velocity.x = pushDirection.x * 4.2;
    this.velocity.z = pushDirection.z * 4.2;
    this.velocity.y = 3.1;
  }
}
