import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createSmartphoneModel, createSmartphoneLighting } from "./phone3d.js";
import { getScreenCanvas } from "./phone-screens.js";

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function loadTexture(url, onLoad) {
  const cached = textureCache.get(url);
  if (cached) {
    onLoad(cached);
    return;
  }
  textureLoader.load(url, (texture) => {
    textureCache.set(url, texture);
    onLoad(texture);
  });
}

/**
 * Sets up an independent Three.js scene rendered into `canvasEl`, containing
 * one procedural smartphone model. Rendering is driven externally by calling
 * `render()` from a shared ticker (see main.js), so it stays in lockstep with
 * GSAP/ScrollTrigger instead of running its own competing rAF loop.
 */
export function createPhoneScene(canvasEl, { initialState = "score", initialImage = null } = {}) {
  const scene = new THREE.Scene();
  // Distance gives enough margin that the phone's rotated silhouette (idle
  // float + the per-step tilts in main.js, up to ~20 degrees combined with
  // roll) never reaches the frustum edge and gets clipped by the canvas --
  // the previous framing was sized for the phone at rest, with almost no
  // slack once it actually starts rotating.
  const camera = new THREE.PerspectiveCamera(24, 1, 1, 100);
  camera.position.set(0, 0, 47);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // A metal/glass phone needs reflections, not just direct light, to read
  // as a polished product render instead of a flat plastic toy -- this is
  // what a studio softbox room does for a real photo.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  createSmartphoneLighting(scene);

  const { root, setScreenCanvas, setScreenTexture } = createSmartphoneModel();
  scene.add(root);
  let requestedImage = null;
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  function showImage(url) {
    requestedImage = url;
    loadTexture(url, (texture) => {
      if (requestedImage !== url) return;
      texture.anisotropy = maxAnisotropy;
      setScreenTexture(texture);
    });
  }
  if (initialImage) {
    showImage(initialImage);
  } else {
    setScreenCanvas(getScreenCanvas(initialState));
  }

  function resize() {
    const rect = canvasEl.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvasEl);
  resize();

  return {
    group: root,
    camera,
    setState(state) {
      setScreenCanvas(getScreenCanvas(state));
    },
    setImage: showImage,
    preload(urls) {
      urls.forEach((url) => loadTexture(url, () => {}));
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      resizeObserver.disconnect();
      renderer.dispose();
    },
  };
}
