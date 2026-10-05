import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/*
 * Procedural smartphone model, rebuilt directly against the reference photos
 * in Mockup/ (Free_iPhone_16_Mockup_1..5.jpg): a titanium-black iPhone with
 * a triple-lens 2x2 camera module. Dimensions are in cm; 1 Three.js unit =
 * 1cm. Proportions below were measured off the reference crops (corner
 * radius, bezel width, Dynamic Island size, camera module scale), not
 * guessed -- the first pass under-rounded the corners and over-thickened
 * the bezel, which is why it read as a generic slab instead of this phone.
 */

const MATERIALS_SPEC = {
  // Titanium frame + camera housing: dark, satin, cool-neutral. Needs a real
  // environment (see createSmartphoneLighting) to read as metal at all --
  // direct lights alone leave a metalness:0.9 surface almost black.
  metalFrame: { color: "#3a3b3f", metalness: 0.92, roughness: 0.38, envMapIntensity: 1.4 },
  glassBackMatte: { color: "#26272b", metalness: 0.15, roughness: 0.5, envMapIntensity: 0.9 },
  glassLensGloss: { color: "#04050a", metalness: 0.2, roughness: 0.06, envMapIntensity: 1.6 },
  metalBezelRing: { color: "#1b1c20", metalness: 0.95, roughness: 0.22, envMapIntensity: 1.5 },
};

function buildMaterials() {
  const map = {};
  for (const [id, spec] of Object.entries(MATERIALS_SPEC)) {
    map[id] = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(spec.color),
      metalness: spec.metalness,
      roughness: spec.roughness,
      envMapIntensity: spec.envMapIntensity,
      clearcoat: spec.metalness < 0.5 ? 0.6 : 0.15,
      clearcoatRoughness: 0.2,
    });
  }
  return map;
}

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);
  return shape;
}

// A true stadium/pill outline (semicircle caps), used flat -- unlike
// CapsuleGeometry, which is a real 3D capsule with depth equal to its
// radius. Rotating that to lie horizontal still leaves it protruding
// `radius` out of the screen plane (about 3mm here), which is why the
// Dynamic Island first read as a raised bump instead of a flat cutout.
function stadiumShape(length, radius) {
  const shape = new THREE.Shape();
  const halfL = Math.max(length / 2 - radius, 0);
  shape.moveTo(-halfL, radius);
  shape.lineTo(halfL, radius);
  shape.absarc(halfL, 0, radius, Math.PI / 2, -Math.PI / 2, true);
  shape.lineTo(-halfL, -radius);
  shape.absarc(-halfL, 0, radius, -Math.PI / 2, Math.PI / 2, true);
  return shape;
}

function roundedPlaneGeometry(width, height, radius) {
  const w = width / 2;
  const h = height / 2;
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 12);

  // ShapeGeometry's generated UVs are the raw shape-space coordinates, not
  // normalized to [0,1] -- remap them so the emissive canvas texture maps
  // onto the full panel instead of only its near-origin fraction.
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (uv.getX(i) + w) / (2 * w), (uv.getY(i) + h) / (2 * h));
  }
  uv.needsUpdate = true;

  return geometry;
}

// A real phone's face corners are far rounder than its paper-thin edge
// chamfer -- RoundedBoxGeometry uses ONE radius for both, so pushing it up
// enough for a proper squircle face also blew out the 0.8cm-thick edge into
// a pill cross-section (or got silently clamped by the thin dimension).
// Extruding a rounded-rect face with its own separate edge bevel is what
// actually decouples the two, matching how the real part is shaped.
function roundedSlabGeometry(width, height, depth, faceRadius, edgeBevel) {
  const shape = roundedRectShape(width, height, faceRadius);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - edgeBevel * 2,
    bevelEnabled: true,
    bevelThickness: edgeBevel,
    bevelSize: edgeBevel,
    bevelSegments: 6,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -depth / 2 + edgeBevel);
  geometry.computeVertexNormals();
  return geometry;
}

function buildScreenMaterial(texture) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#050505"),
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 0.8,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: texture,
    emissiveIntensity: 1.05,
    side: THREE.FrontSide,
  });
}

/**
 * Builds the full component hierarchy for the phone. Returns
 * { root, screenTexture, setScreenTexture(texture) }.
 */
export function createSmartphoneModel() {
  const materials = buildMaterials();
  const root = new THREE.Group();
  root.name = "Smartphone";

  // ---- chassis (macro) ----
  // Real iPhone body: 7.15 x 14.96 x 0.825cm. Face corner radius set to a
  // proper "squircle" (~34% of the half-width) with its own thin edge
  // bevel, independent of the face radius -- see roundedSlabGeometry.
  const CHASSIS_W = 7.15;
  const CHASSIS_H = 14.96;
  const CHASSIS_D = 0.825;
  const CORNER_R = 1.22;

  const chassisGeo = roundedSlabGeometry(CHASSIS_W, CHASSIS_H, CHASSIS_D, CORNER_R, 0.11);
  const chassis = new THREE.Mesh(chassisGeo, materials.metalFrame);
  chassis.name = "chassis";
  root.add(chassis);

  // back panel: inset plane over the back face, matte glass
  const back = new THREE.Mesh(
    roundedPlaneGeometry(CHASSIS_W - 0.35, CHASSIS_H - 0.35, CORNER_R - 0.16),
    materials.glassBackMatte
  );
  back.name = "chassis/backPanel";
  back.position.set(0, 0, -0.42);
  back.rotation.y = Math.PI;
  chassis.add(back);

  // ---- screen (macro) ----
  // Reference shows a near-hairline bezel (screen content runs almost to
  // the frame edge) -- 0.14cm (~1.4mm) margin per side, not the ~4mm the
  // first pass used.
  const screenTexture = new THREE.CanvasTexture(document.createElement("canvas"));
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  const screenMat = buildScreenMaterial(screenTexture);
  const screenGeo = roundedPlaneGeometry(CHASSIS_W - 0.28, CHASSIS_H - 0.28, CORNER_R - 0.1);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = "screen";
  screen.position.set(0, 0, 0.415);
  chassis.add(screen);

  // Dynamic Island: real iPhone dimensions are ~126x37pt on a 393pt-wide
  // screen (32% of screen width, ~3.4:1 aspect), sitting only ~11pt (1.3%
  // of screen height) below the top edge. Flat (see stadiumShape) and
  // pure unlit black, flush with the screen glass -- it is a display
  // cutout, not a raised part, so it must not pick up any 3D shading.
  const islandGeo = new THREE.ShapeGeometry(stadiumShape(2.06, 0.325), 32);
  const island = new THREE.Mesh(islandGeo, new THREE.MeshBasicMaterial({ color: 0x000000 }));
  island.name = "screen/dynamicIsland";
  island.position.set(0, 6.83, 0.006);
  screen.add(island);

  // ---- camera module (meso) ----
  // 2x2 grid: top-left=main, top-right=flash, bottom-left=ultra-wide,
  // bottom-right=telephoto -- confirmed by close-up crops of Mockup_1.jpg.
  const camGeo = roundedSlabGeometry(2.7, 2.7, 0.34, 0.92, 0.05);
  const camModule = new THREE.Mesh(camGeo, materials.metalFrame);
  camModule.name = "cameraModule";
  camModule.position.set(-1.55, 5.3, -0.44);
  chassis.add(camModule);

  // Each lens sits in its own small recessed collar (a slightly wider, flush
  // dark disc) so it reads as a socket even at a distance/grazing angle --
  // color contrast alone (a flat ring at almost the same height as the
  // housing) was not enough to separate it visually from the module body.
  function makeLens(radius) {
    const group = new THREE.Group();
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.22, radius * 1.22, 0.06, 40),
      materials.glassBackMatte
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.z = -0.03;
    group.add(collar);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, 0.4, 40),
      materials.metalBezelRing
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, 0.1, 40),
      materials.glassLensGloss
    );
    glass.rotation.x = Math.PI / 2;
    glass.position.z = 0.24;
    group.add(glass);
    return group;
  }

  const GRID = 0.64;

  const lensMain = makeLens(0.52);
  lensMain.name = "cameraModule/lensMain";
  lensMain.position.set(-GRID, GRID, 0.17);
  camModule.add(lensMain);

  const lensUltrawide = makeLens(0.52);
  lensUltrawide.name = "cameraModule/lensUltrawide";
  lensUltrawide.position.set(-GRID, -GRID, 0.17);
  camModule.add(lensUltrawide);

  const lensTele = makeLens(0.52);
  lensTele.name = "cameraModule/lensTele";
  lensTele.position.set(GRID, -GRID, 0.17);
  camModule.add(lensTele);

  const flashCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.06, 28),
    materials.glassBackMatte
  );
  flashCollar.rotation.x = Math.PI / 2;
  flashCollar.position.z = -0.03;
  const flashRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 0.36, 28),
    materials.metalBezelRing
  );
  flashRing.rotation.x = Math.PI / 2;
  const flashGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.1, 28),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#efe9dc"),
      metalness: 0,
      roughness: 0.3,
      clearcoat: 0.6,
      envMapIntensity: 1.1,
    })
  );
  flashGlass.rotation.x = Math.PI / 2;
  flashGlass.position.z = 0.22;
  const flash = new THREE.Group();
  flash.add(flashCollar, flashRing, flashGlass);
  flash.name = "cameraModule/flashDot";
  flash.position.set(GRID, GRID, 0.17);
  camModule.add(flash);

  // ---- side buttons (micro) ----
  function makeButton(localY, height) {
    const btn = new THREE.Mesh(
      new RoundedBoxGeometry(0.1, height, 0.46, 3, 0.05),
      materials.metalFrame
    );
    btn.position.set(-3.62, localY, 0);
    return btn;
  }
  const buttonAction = makeButton(4.2, 0.85);
  buttonAction.name = "buttonAction";
  chassis.add(buttonAction);
  const buttonVolUp = makeButton(2.3, 1.05);
  buttonVolUp.name = "buttonVolUp";
  chassis.add(buttonVolUp);
  const buttonVolDown = makeButton(0.7, 1.05);
  buttonVolDown.name = "buttonVolDown";
  chassis.add(buttonVolDown);

  return {
    root,
    screenTexture,
    // Swaps in a real screenshot/photo texture (e.g. a loaded PNG) instead
    // of the placeholder canvas -- used for the hero and "comment ça marche" phones.
    setScreenTexture(texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      screenMat.emissiveMap = texture;
      screenMat.needsUpdate = true;
    },
  };
}

export function createSmartphoneLighting(scene) {
  // Reflections carry a metal/glass phone; direct lights alone cannot.
  // A room environment gives the frame and lenses believable soft
  // highlights instead of reading flat/matte. Combined with a couple of
  // directional lights to keep a clear key-light direction on the edges.
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 6, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.9);
  rim.position.set(3, 2, -6);
  scene.add(rim);

  const ambient = new THREE.HemisphereLight(0x3a4560, 0x05070d, 0.35);
  scene.add(ambient);

  return { key, rim, ambient };
}
