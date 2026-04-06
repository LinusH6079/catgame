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

function addWall(room, width, height, x, y, z, rotationY = 0) {
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.98 }),
  );
  wall.position.set(x, y, z);
  wall.rotation.y = rotationY;
  room.add(wall);
}

function createSupport(
  group,
  supports,
  staticColliders,
  walkableSurfaces,
  { name, width, height, depth, x, y, z, color, topThickness = 0.16, legHeight = height, legInset = 0.2 },
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

  const support = {
    name,
    xMin: x - width / 2,
    xMax: x + width / 2,
    zMin: z - depth / 2,
    zMax: z + depth / 2,
    topY: y + legHeight + topThickness / 2,
  };

  supports.push(support);
  staticColliders.push({
    name,
    minX: support.xMin,
    maxX: support.xMax,
    minZ: support.zMin,
    maxZ: support.zMax,
    topY: support.topY,
  });
  walkableSurfaces.push({
    name,
    xMin: support.xMin,
    xMax: support.xMax,
    zMin: support.zMin,
    zMax: support.zMax,
    y: support.topY,
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
  scene.fog = new THREE.Fog(0xffedc9, 30, 62);

  const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 7, 12);

  const ambient = new THREE.HemisphereLight(0xfff7ef, 0xb46c43, 1.35);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff1cf, 1.85);
  sun.position.set(8, 18, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  scene.add(sun);

  const room = new THREE.Group();
  scene.add(room);
  const staticColliders = [];
  const walkableSurfaces = [
    { name: "floor", xMin: -18, xMax: 18, zMin: -18, zMax: 18, y: 0 },
  ];

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  room.add(floor);

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(4.4, 48),
    new THREE.MeshStandardMaterial({ color: 0xffd36a, roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-1.8, 0.02, 1.7);
  room.add(rug);

  addWall(room, 36, 10, 0, 5, -18);
  addWall(room, 36, 10, -18, 5, 0, Math.PI / 2);
  addWall(room, 12, 10, 18, 5, -12, -Math.PI / 2);
  addWall(room, 12, 10, 18, 5, 8, -Math.PI / 2);
  addWall(room, 3.4, 2.2, 18, 8.9, -2, -Math.PI / 2);

  const windowFrame = createRoundedBox(7.8, 3.2, 0.2, 0xffffff);
  windowFrame.position.set(-5.4, 5.8, -17.86);
  room.add(windowFrame);

  const skyPane = createRoundedBox(7.3, 2.7, 0.06, 0x8fd8ff);
  skyPane.position.set(-5.4, 5.8, -17.74);
  room.add(skyPane);

  const doorFrame = createRoundedBox(0.25, 4.6, 3.2, 0xf7c58d);
  doorFrame.position.set(17.82, 2.3, -2);
  room.add(doorFrame);

  const ownerDoor = new THREE.Group();
  const door = createRoundedBox(1.6, 3.5, 0.16, 0xffab5f);
  door.position.set(0, 1.75, 0);
  ownerDoor.add(door);
  ownerDoor.position.set(17.78, 0, -2);
  ownerDoor.rotation.y = -Math.PI / 2;
  room.add(ownerDoor);

  const counter = createRoundedBox(8.6, 1.2, 1.4, 0xf3c48e);
  counter.position.set(11.6, 0.6, -13.8);
  room.add(counter);

  const cabinets = createRoundedBox(9.2, 1.5, 0.9, 0xff8d4b);
  cabinets.position.set(11.6, 2.7, -14.8);
  room.add(cabinets);

  const island = createRoundedBox(4.5, 1.1, 1.8, 0xf7c38f);
  island.position.set(8.2, 0.55, -4.2);
  room.add(island);

  const supports = [];
  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "coffee-table",
    width: 4.8,
    height: 1.2,
    depth: 2.3,
    x: -2.4,
    y: 0,
    z: 2.2,
    color: 0x7d4a2c,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "bookshelf",
    width: 3.8,
    height: 3,
    depth: 1.1,
    x: -14.1,
    y: 0,
    z: -11.4,
    color: 0x8d5934,
    topThickness: 0.12,
    legInset: 0.26,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "tv-stand",
    width: 4.6,
    height: 1.15,
    depth: 1.4,
    x: 2.8,
    y: 0,
    z: 10.8,
    color: 0x6d4329,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "side-table",
    width: 1.4,
    height: 1.05,
    depth: 1.4,
    x: -12.4,
    y: 0,
    z: 5.2,
    color: 0x8d5934,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "dining-table",
    width: 4.8,
    height: 1.18,
    depth: 2.3,
    x: 9.2,
    y: 0,
    z: 6.4,
    color: 0x7a4a2b,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "console-table",
    width: 3.8,
    height: 1.08,
    depth: 1.2,
    x: 13.4,
    y: 0,
    z: 11.8,
    color: 0x8a5330,
  });

  createSupport(room, supports, staticColliders, walkableSurfaces, {
    name: "wide-shelf",
    width: 4.2,
    height: 1.26,
    depth: 1.1,
    x: -12.4,
    y: 0,
    z: 12.8,
    color: 0x896044,
  });

  supports.push({
    name: "kitchen-counter",
    xMin: 7.3,
    xMax: 15.9,
    zMin: -14.5,
    zMax: -13.1,
    topY: 1.2,
  });
  staticColliders.push({
    name: "kitchen-counter",
    minX: 7.3,
    maxX: 15.9,
    minZ: -14.5,
    maxZ: -13.1,
    topY: 1.2,
  });
  walkableSurfaces.push({
    name: "kitchen-counter",
    xMin: 7.3,
    xMax: 15.9,
    zMin: -14.5,
    zMax: -13.1,
    y: 1.2,
  });

  supports.push({
    name: "kitchen-island",
    xMin: 6,
    xMax: 10.4,
    zMin: -5.1,
    zMax: -3.3,
    topY: 1.1,
  });
  staticColliders.push({
    name: "kitchen-island",
    minX: 6,
    maxX: 10.4,
    minZ: -5.1,
    maxZ: -3.3,
    topY: 1.1,
  });
  walkableSurfaces.push({
    name: "kitchen-island",
    xMin: 6,
    xMax: 10.4,
    zMin: -5.1,
    zMax: -3.3,
    y: 1.1,
  });

  const sofaBase = createRoundedBox(5.8, 1, 2.1, 0x89d6c2);
  sofaBase.position.set(-10.8, 0.5, 12.7);
  room.add(sofaBase);
  staticColliders.push({
    name: "sofa-seat",
    minX: -13.7,
    maxX: -7.9,
    minZ: 11.65,
    maxZ: 13.75,
    topY: 1,
  });
  walkableSurfaces.push({
    name: "sofa-seat",
    xMin: -13.6,
    xMax: -8,
    zMin: 11.75,
    zMax: 13.65,
    y: 1,
  });

  const sofaBack = createRoundedBox(5.8, 1.4, 0.5, 0x79c4b2);
  sofaBack.position.set(-10.8, 1.25, 13.55);
  room.add(sofaBack);
  staticColliders.push({
    name: "sofa-back",
    minX: -13.7,
    maxX: -7.9,
    minZ: 13.3,
    maxZ: 13.8,
    topY: 1.95,
  });

  const armLeft = createRoundedBox(0.55, 1.25, 2.1, 0x79c4b2);
  armLeft.position.set(-13.45, 0.62, 12.7);
  room.add(armLeft);
  staticColliders.push({
    name: "sofa-arm-left",
    minX: -13.72,
    maxX: -13.18,
    minZ: 11.65,
    maxZ: 13.75,
    topY: 1.25,
  });

  const armRight = createRoundedBox(0.55, 1.25, 2.1, 0x79c4b2);
  armRight.position.set(-8.15, 0.62, 12.7);
  room.add(armRight);
  staticColliders.push({
    name: "sofa-arm-right",
    minX: -8.42,
    maxX: -7.88,
    minZ: 11.65,
    maxZ: 13.75,
    topY: 1.25,
  });

  const standingLampPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 2.6, 14),
    new THREE.MeshStandardMaterial({ color: 0x9b8a5b, roughness: 0.9 }),
  );
  standingLampPole.position.set(-13.8, 1.3, 4.8);
  standingLampPole.castShadow = true;
  room.add(standingLampPole);

  const lampShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 0.8, 18),
    new THREE.MeshStandardMaterial({ color: 0xfff7cf, roughness: 1 }),
  );
  lampShade.position.set(-13.8, 2.9, 4.8);
  lampShade.castShadow = true;
  room.add(lampShade);

  const bigTv = createRoundedBox(3.2, 1.8, 0.12, 0x20253b);
  bigTv.position.set(2.8, 2.95, 10.8);
  room.add(bigTv);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.5, 0.18, 20),
    new THREE.MeshStandardMaterial({ color: 0x63c7ff, roughness: 0.95 }),
  );
  bowl.position.set(-4.8, 0.09, 7.4);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  room.add(bowl);

  const roomBounds = {
    minX: -17,
    maxX: 17,
    minZ: -17,
    maxZ: 17,
    floorY: 0,
  };

  return {
    renderer,
    scene,
    camera,
    supports,
    staticColliders,
    walkableSurfaces,
    roomBounds,
    ownerDoor,
    ownerPath: {
      inside: new THREE.Vector3(15.7, 0, -2),
      outside: new THREE.Vector3(20.7, 0, -2),
    },
    spawnPoint: new THREE.Vector3(-6.5, 0, 4.5),
  };
}
