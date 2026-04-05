import * as THREE from "three";

const WALL_COLOR = 0xfff5e4;
const FLOOR_COLOR = 0xe0a468;

function createRoundedBox(width, height, depth, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.04 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createSupport(
  group,
  supports,
  { name, width, height, depth, x, y, z, color, topThickness = 0.16, legHeight = height, legInset = 0.14 },
) {
  const body = new THREE.Group();
  const top = createRoundedBox(width, topThickness, depth, color);
  top.position.y = legHeight;
  body.add(top);

  const legGeometry = new THREE.BoxGeometry(0.18, legHeight, 0.18);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
  const legOffsets = [
    [width / 2 - legInset, depth / 2 - legInset],
    [-width / 2 + legInset, depth / 2 - legInset],
    [width / 2 - legInset, -depth / 2 + legInset],
    [-width / 2 + legInset, -depth / 2 + legInset],
  ];

  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(legGeometry, material);
    leg.position.set(lx, legHeight / 2, lz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    body.add(leg);
  }

  body.position.set(x, y, z);
  group.add(body);

  supports.push({
    name,
    xMin: x - width / 2,
    xMax: x + width / 2,
    zMin: z - depth / 2,
    zMax: z + depth / 2,
    topY: y + legHeight + topThickness / 2,
  });
}

export function createSceneWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffedc9);
  scene.fog = new THREE.Fog(0xffedc9, 16, 34);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 5, 8);

  const ambient = new THREE.HemisphereLight(0xfff7ef, 0xb46c43, 1.3);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff1cf, 1.8);
  sun.position.set(4, 9, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  scene.add(sun);

  const room = new THREE.Group();
  scene.add(room);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 18),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(2.2, 32),
    new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.5, 0.02, 0.8);
  room.add(rug);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.98 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), wallMaterial);
  backWall.position.set(0, 4, -9);
  room.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-9, 4, 0);
  room.add(leftWall);

  const windowFrame = createRoundedBox(4.6, 2.6, 0.2, 0xffffff);
  windowFrame.position.set(-2.1, 4.8, -8.86);
  room.add(windowFrame);

  const skyPane = createRoundedBox(4.2, 2.2, 0.06, 0x8fd8ff);
  skyPane.position.set(-2.1, 4.8, -8.74);
  room.add(skyPane);

  const counter = createRoundedBox(4.6, 1.2, 1.2, 0xf3c48e);
  counter.position.set(4.7, 0.6, -6.4);
  room.add(counter);

  const cabinets = createRoundedBox(4.9, 1.4, 0.9, 0xff8d4b);
  cabinets.position.set(4.7, 2.5, -7.2);
  room.add(cabinets);

  const supports = [];
  createSupport(room, supports, {
    name: "coffee-table",
    width: 2.8,
    height: 1.2,
    depth: 1.3,
    x: -1.2,
    y: 0,
    z: 0.7,
    color: 0x7d4a2c,
  });

  createSupport(room, supports, {
    name: "bookshelf",
    width: 2.5,
    height: 2.8,
    depth: 0.8,
    x: -6.3,
    y: 0,
    z: -5.8,
    color: 0x8d5934,
    topThickness: 0.12,
    legInset: 0.22,
  });

  createSupport(room, supports, {
    name: "tv-stand",
    width: 2.8,
    height: 1.1,
    depth: 1,
    x: 2.1,
    y: 0,
    z: 4.9,
    color: 0x6d4329,
  });

  createSupport(room, supports, {
    name: "side-table",
    width: 1,
    height: 1.05,
    depth: 1,
    x: -5.5,
    y: 0,
    z: 2.6,
    color: 0x8d5934,
  });

  supports.push({
    name: "kitchen-counter",
    xMin: 2.5,
    xMax: 6.9,
    zMin: -7.0,
    zMax: -5.8,
    topY: 1.2,
  });

  const sofaBase = createRoundedBox(3.4, 0.9, 1.4, 0x89d6c2);
  sofaBase.position.set(-4.6, 0.45, 5.7);
  room.add(sofaBase);

  const sofaBack = createRoundedBox(3.4, 1.2, 0.4, 0x79c4b2);
  sofaBack.position.set(-4.6, 1.15, 6.3);
  room.add(sofaBack);

  const lampStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 2.2, 12),
    new THREE.MeshStandardMaterial({ color: 0x9b8a5b, roughness: 0.9 }),
  );
  lampStand.position.set(-6.1, 1.1, 2.4);
  lampStand.castShadow = true;
  room.add(lampStand);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.55, 0.6, 18),
    new THREE.MeshStandardMaterial({ color: 0xfff7cf, roughness: 1 }),
  );
  lampShade.position.set(-6.1, 2.35, 2.4);
  lampShade.castShadow = true;
  room.add(lampShade);

  const tv = createRoundedBox(1.9, 1.1, 0.1, 0x20253b);
  tv.position.set(2.1, 2.05, 4.9);
  room.add(tv);

  const ownerDoor = new THREE.Group();
  const door = createRoundedBox(1.6, 3.4, 0.18, 0xffab5f);
  door.position.set(0, 1.7, 0);
  ownerDoor.add(door);
  ownerDoor.position.set(8.18, 0, -3.2);
  ownerDoor.rotation.y = -Math.PI / 2;
  room.add(ownerDoor);

  const roomBounds = {
    minX: -8.2,
    maxX: 8.2,
    minZ: -8.2,
    maxZ: 8.2,
    floorY: 0,
  };

  return {
    renderer,
    scene,
    camera,
    supports,
    roomBounds,
    ownerDoor,
  };
}
