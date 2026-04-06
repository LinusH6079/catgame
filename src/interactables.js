import * as THREE from "three";

const FLOOR_IMPACT_Y = 0.08;

const OBJECT_DEFS = {
  cup: { score: 110, color: 0xffffff, fragile: true, label: "Cup catastrophe" },
  plate: { score: 150, color: 0xfff1d6, fragile: true, label: "Plate panic" },
  books: { score: 190, color: 0x5d73ff, fragile: false, label: "Book barrage" },
  plant: { score: 280, color: 0x4ebd68, fragile: true, label: "Pot drop" },
  lamp: { score: 340, color: 0xffd06a, fragile: true, label: "Lamp launch" },
  vase: { score: 520, color: 0x8fe5ff, fragile: true, label: "Vase erased" },
  laptop: { score: 800, color: 0xb6bcc6, fragile: true, label: "Laptop launched" },
  tv: { score: 1250, color: 0x1d2338, fragile: true, label: "TV yeeted" },
};

function standardMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.06 });
}

function normalizeMeshToFloor(mesh) {
  const box = new THREE.Box3().setFromObject(mesh);
  mesh.position.y -= box.min.y;
  const normalizedBox = new THREE.Box3().setFromObject(mesh);
  return normalizedBox.getSize(new THREE.Vector3());
}

function makeCup(def) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 0.26, 28), standardMaterial(def.color));
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.025, 12, 24), standardMaterial(0xffb188));
  handle.position.set(0.13, 0.14, 0);
  handle.rotation.y = Math.PI / 2;
  body.position.y = 0.13;
  group.add(body, handle);
  return group;
}

function makePlate(def) {
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 32), standardMaterial(def.color));
  plate.position.y = 0.025;
  return plate;
}

function makeBooks() {
  const group = new THREE.Group();
  const colors = [0xef6d44, 0x5d73ff, 0xf3c45b];
  colors.forEach((color, index) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.24),
      standardMaterial(color),
    );
    book.position.y = 0.04 + index * 0.085;
    group.add(book);
  });
  return group;
}

function makePlant(def) {
  const group = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.24, 24), standardMaterial(0xb16c42));
  pot.position.y = 0.12;
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), standardMaterial(def.color));
  leaves.position.y = 0.46;
  group.add(pot, leaves);
  return group;
}

function makeLamp(def) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 24), standardMaterial(0x9b8a5b));
  base.position.y = 0.06;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 20), standardMaterial(0x9b8a5b));
  stem.position.y = 0.31;
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.22, 28), standardMaterial(def.color));
  shade.position.y = 0.59;
  group.add(base, stem, shade);
  return group;
}

function makeVase(def) {
  const vase = new THREE.Mesh(new THREE.SphereGeometry(0.2, 26, 22), standardMaterial(def.color));
  vase.scale.set(0.9, 1.3, 0.9);
  vase.position.y = 0.26;
  return vase;
}

function makeLaptop(def) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.32), standardMaterial(def.color));
  base.position.y = 0.02;
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.03), standardMaterial(0x273049));
  screen.position.set(0, 0.16, -0.13);
  screen.rotation.x = -1.1;
  group.add(base, screen);
  return group;
}

function makeTV() {
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.54, 0.05), standardMaterial(0x141924));
  frame.position.y = 0.42;
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), standardMaterial(0x464d60));
  stand.position.set(0, 0.06, 0);
  group.add(frame, stand);
  return group;
}

function createMeshForType(type, def) {
  let mesh = makeCup(def);
  if (type === "plate") mesh = makePlate(def);
  if (type === "books") mesh = makeBooks(def);
  if (type === "plant") mesh = makePlant(def);
  if (type === "lamp") mesh = makeLamp(def);
  if (type === "vase") mesh = makeVase(def);
  if (type === "laptop") mesh = makeLaptop(def);
  if (type === "tv") mesh = makeTV(def);

  const size = normalizeMeshToFloor(mesh);
  return { mesh, size };
}

function supportCenter(support) {
  return new THREE.Vector3(
    (support.xMin + support.xMax) * 0.5,
    support.topY,
    (support.zMin + support.zMax) * 0.5,
  );
}

function spawnLayout(supports) {
  const byName = Object.fromEntries(supports.map((support) => [support.name, support]));
  return [
    { type: "cup", support: byName["coffee-table"], offset: [-1.5, 0.75] },
    { type: "plate", support: byName["coffee-table"], offset: [-0.4, -0.55] },
    { type: "vase", support: byName["coffee-table"], offset: [1.45, 0.62] },
    { type: "laptop", support: byName["coffee-table"], offset: [0.55, 0.18], rotationY: 0.4 },
    { type: "books", support: byName["coffee-table"], offset: [1.1, -0.62], rotationY: 0.9 },
    { type: "cup", support: byName["coffee-table"], offset: [-1.2, -0.45] },
    { type: "books", support: byName["bookshelf"], offset: [-1.05, -0.28] },
    { type: "books", support: byName["bookshelf"], offset: [-0.2, 0.18] },
    { type: "plant", support: byName["bookshelf"], offset: [1.05, 0.05] },
    { type: "vase", support: byName["bookshelf"], offset: [0.38, -0.16] },
    { type: "cup", support: byName["bookshelf"], offset: [-1.2, 0.2] },
    { type: "lamp", support: byName["side-table"], offset: [0, 0] },
    { type: "cup", support: byName["side-table"], offset: [0.26, -0.22] },
    { type: "tv", support: byName["tv-stand"], offset: [0, 0] },
    { type: "vase", support: byName["tv-stand"], offset: [-1.55, 0.28] },
    { type: "cup", support: byName["tv-stand"], offset: [1.45, -0.28] },
    { type: "books", support: byName["tv-stand"], offset: [0.95, 0.25] },
    { type: "cup", support: byName["kitchen-counter"], offset: [-3.4, -0.2] },
    { type: "plate", support: byName["kitchen-counter"], offset: [-2.1, 0.25] },
    { type: "books", support: byName["kitchen-counter"], offset: [-0.6, -0.15] },
    { type: "plant", support: byName["kitchen-counter"], offset: [1.2, 0.18] },
    { type: "cup", support: byName["kitchen-counter"], offset: [3.15, -0.22] },
    { type: "vase", support: byName["kitchen-counter"], offset: [2.35, 0.2] },
    { type: "plate", support: byName["kitchen-counter"], offset: [0.25, -0.15] },
    { type: "laptop", support: byName["kitchen-island"], offset: [0.8, 0], rotationY: -0.9 },
    { type: "cup", support: byName["kitchen-island"], offset: [-1.15, -0.2] },
    { type: "plate", support: byName["kitchen-island"], offset: [-0.1, 0.15] },
    { type: "books", support: byName["kitchen-island"], offset: [1.45, -0.25] },
    { type: "plant", support: byName["dining-table"], offset: [-1.45, 0.7] },
    { type: "plate", support: byName["dining-table"], offset: [-1.1, -0.55] },
    { type: "plate", support: byName["dining-table"], offset: [1.25, 0.65] },
    { type: "cup", support: byName["dining-table"], offset: [1.55, -0.5] },
    { type: "vase", support: byName["dining-table"], offset: [0, 0] },
    { type: "books", support: byName["dining-table"], offset: [0.65, -0.65], rotationY: 0.8 },
    { type: "laptop", support: byName["console-table"], offset: [0.2, 0.05], rotationY: 0.2 },
    { type: "cup", support: byName["console-table"], offset: [-1.05, -0.22] },
    { type: "lamp", support: byName["console-table"], offset: [1.05, 0.08] },
    { type: "books", support: byName["wide-shelf"], offset: [-1.25, -0.15] },
    { type: "books", support: byName["wide-shelf"], offset: [-0.25, 0.18] },
    { type: "vase", support: byName["wide-shelf"], offset: [1.2, -0.18] },
    { type: "plant", support: byName["wide-shelf"], offset: [0.35, 0.18] },
  ];
}

export class InteractableManager {
  constructor(scene, supports) {
    this.scene = scene;
    this.supports = supports;
    this.items = [];
    this.particles = [];
  }

  reset() {
    this.items.forEach((item) => this.scene.remove(item.mesh));
    this.particles.forEach((particle) => this.scene.remove(particle.mesh));
    this.items = [];
    this.particles = [];
    this.#spawnItems();
  }

  #spawnItems() {
    const layout = spawnLayout(this.supports);
    layout.forEach(({ type, support, offset, rotationY = Math.random() * Math.PI }) => {
      const def = OBJECT_DEFS[type];
      const { mesh, size } = createMeshForType(type, def);
      const center = supportCenter(support);
      mesh.position.set(center.x + offset[0], support.topY + 0.01, center.z + offset[1]);
      mesh.rotation.y = rotationY;
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(mesh);
      this.items.push({
        type,
        def,
        mesh,
        size,
        support,
        anchored: true,
        pendingFall: 0,
        wobble: 0,
        scored: false,
        broken: false,
        hitCooldown: 0,
        velocity: new THREE.Vector3(),
        angularVelocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
        ),
      });
    });
  }

  tryInteract(playerData) {
    const hits = [];

    this.items.forEach((item) => {
      if (item.broken || item.hitCooldown > 0) return;

      const toItem = item.mesh.position.clone().sub(playerData.origin);
      const planar = new THREE.Vector2(toItem.x, toItem.z);
      const distance = planar.length();
      const verticalDelta = Math.abs(toItem.y);
      if (distance > playerData.radius + item.size.length() * 0.15 || verticalDelta > 1.8) return;

      const forwardPlanar = new THREE.Vector2(playerData.forward.x, playerData.forward.z).normalize();
      const itemDirection = planar.lengthSq() > 0.0001 ? planar.clone().normalize() : forwardPlanar.clone();
      const facing = forwardPlanar.dot(itemDirection);
      if (facing < -0.25) return;

      const powerBase = playerData.isDashing ? 6.6 : playerData.isSwiping ? 4.8 : 3.2;
      const power = Math.max(2.8, powerBase + playerData.speed * 0.45);
      const impulse = new THREE.Vector3(
        itemDirection.x,
        0.18 + (playerData.isDashing ? 0.18 : 0.08),
        itemDirection.y,
      ).normalize().multiplyScalar(power);

      item.wobble = 0.34;
      item.pendingFall = Math.max(item.pendingFall, playerData.isDashing ? 0.04 : 0.11);
      item.hitCooldown = playerData.isDashing ? 0.16 : 0.22;
      item.velocity.add(impulse);
      hits.push({ item, intensity: power / 7.5 });
    });

    return hits;
  }

  resolvePlayerContact(player, deltaSeconds) {
    let strongestContact = 0;
    const playerRadius = player.colliderRadius ?? 0.34;

    this.items.forEach((item) => {
      if (item.broken) return;

      const objectRadius = Math.max(item.size.x, item.size.z) * 0.34;
      const verticalDelta = Math.abs(item.mesh.position.y - player.position.y);
      if (verticalDelta > 0.72) return;

      const offset = new THREE.Vector3(
        item.mesh.position.x - player.position.x,
        0,
        item.mesh.position.z - player.position.z,
      );
      const distance = offset.length();
      const minDistance = playerRadius + objectRadius;
      if (distance >= minDistance) return;

      const direction = distance > 0.0001 ? offset.normalize() : new THREE.Vector3(1, 0, 0);
      const overlap = minDistance - distance;
      const pushStrength = Math.max(1.15, player.velocity.length() * 0.34 + overlap * 6);

      item.mesh.position.x += direction.x * overlap * 0.58;
      item.mesh.position.z += direction.z * overlap * 0.58;
      player.applyExternalDisplacement(direction.clone().multiplyScalar(-overlap * 0.42));

      item.velocity.addScaledVector(direction, pushStrength);
      item.pendingFall = Math.max(item.pendingFall, 0.08);
      item.hitCooldown = Math.max(item.hitCooldown, 0.08);
      strongestContact = Math.max(strongestContact, pushStrength);
    });

    return strongestContact;
  }

  update(deltaSeconds) {
    const events = [];

    this.items.forEach((item) => {
      item.hitCooldown = Math.max(0, item.hitCooldown - deltaSeconds);

      if (item.anchored && item.wobble > 0) {
        item.wobble = Math.max(0, item.wobble - deltaSeconds);
      }

      if (item.anchored) {
        const centerX = THREE.MathUtils.clamp(item.mesh.position.x, item.support.xMin, item.support.xMax);
        const centerZ = THREE.MathUtils.clamp(item.mesh.position.z, item.support.zMin, item.support.zMax);
        const edgeDistance = Math.hypot(item.mesh.position.x - centerX, item.mesh.position.z - centerZ);

        if (item.pendingFall > 0) {
          // Give props a tiny "oh no" wobble before they commit to the fall.
          item.pendingFall = Math.max(0, item.pendingFall - deltaSeconds);
          item.mesh.rotation.z = Math.sin(item.pendingFall * 32) * 0.15;
          if (item.pendingFall === 0 || edgeDistance > 0.1 || item.velocity.length() > 3.2) {
            item.anchored = false;
          }
        } else {
          item.mesh.rotation.z = THREE.MathUtils.damp(item.mesh.rotation.z, 0, 8, deltaSeconds);
        }

        item.mesh.position.x += item.velocity.x * deltaSeconds * 0.22;
        item.mesh.position.z += item.velocity.z * deltaSeconds * 0.22;
        item.velocity.multiplyScalar(0.82);
      }

      if (!item.anchored && !item.broken) {
        // Lightweight arcade physics: gravity, spin, one floor bounce, then settle.
        item.velocity.y -= 18 * deltaSeconds;
        item.velocity.multiplyScalar(0.992);
        item.mesh.position.addScaledVector(item.velocity, deltaSeconds);
        item.mesh.rotation.x += item.angularVelocity.x * deltaSeconds;
        item.mesh.rotation.y += item.angularVelocity.y * deltaSeconds;
        item.mesh.rotation.z += item.angularVelocity.z * deltaSeconds;

        if (item.mesh.position.y <= FLOOR_IMPACT_Y) {
          item.mesh.position.y = FLOOR_IMPACT_Y;
          if (Math.abs(item.velocity.y) > 2.2 || !item.scored) {
            const shatter = item.def.fragile;
            if (!item.scored) {
              item.scored = true;
              events.push({
                kind: "score",
                type: item.type,
                points: item.def.score,
                label: item.def.label,
                break: shatter,
                position: item.mesh.position.clone(),
              });
            }
            if (shatter && !item.broken) {
              item.broken = true;
              item.mesh.visible = false;
              this.#burst(item.mesh.position, item.def.color, item.type === "tv" ? 18 : 12, 0.8);
              events.push({
                kind: "break",
                type: item.type,
                position: item.mesh.position.clone(),
              });
            }
          }

          item.velocity.y *= -0.18;
          item.velocity.x *= 0.78;
          item.velocity.z *= 0.78;
          item.angularVelocity.multiplyScalar(0.92);
        }
      }
    });

    this.particles = this.particles.filter((particle) => {
      particle.life -= deltaSeconds;
      if (particle.life <= 0) {
        this.scene.remove(particle.mesh);
        return false;
      }

      particle.velocity.y -= 13 * deltaSeconds;
      particle.mesh.position.addScaledVector(particle.velocity, deltaSeconds);
      particle.mesh.rotation.x += particle.spin.x * deltaSeconds;
      particle.mesh.rotation.y += particle.spin.y * deltaSeconds;
      particle.mesh.rotation.z += particle.spin.z * deltaSeconds;
      particle.mesh.scale.setScalar(Math.max(0.1, particle.life / particle.maxLife));
      return true;
    });

    return events;
  }

  #burst(position, color, count, spread) {
    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15 }),
      );
      mesh.position.copy(position);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        life: 0.7 + Math.random() * 0.35,
        maxLife: 1,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * spread * 3,
          Math.random() * spread * 3,
          (Math.random() - 0.5) * spread * 3,
        ),
        spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      });
    }
  }
}
