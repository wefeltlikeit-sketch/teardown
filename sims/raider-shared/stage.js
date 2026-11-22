// The landing gear's stage: a warm peach studio over a runway (centreline dashes, edge bars, threshold letters drawn
// in a shader and a canvas), soft shadows, GTAO kept off the ground. frame(state, cam) poses the gear, slides the
// runway under it by the distance rolled and draws one frame.
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {buildGear, GROUND} from './raider.js';

const V3 = THREE.Vector3;
export const COL = {bg: '#e4eae9', ground: '#dbe2e1', mark: '#a9b6b4', shadow: '#2e3f3c'};

const GROUND_VERT = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const GROUND_FRAG = /* glsl */ `uniform vec3 uG; uniform vec3 uM; uniform vec3 uBg; uniform float uRoll; uniform vec3 uC; varying vec3 vW;
  void main(){
    // a flight deck: plate seams on a 1.2 grid, a launch lane with chevrons, hazard bars at the lane edges;
    // the deck slides under the drone by uRoll
    float z = vW.z - uRoll;
    float x = vW.x;
    float m = 0.0;
    vec2 g = abs(fract(vec2(x, z) / 1.2 + 0.5) - 0.5) * 1.2;
    m = max(m, 0.45 * (1.0 - step(0.012, min(g.x, g.y))));
    // lane edge bars, 0.5 on 0.5 off
    m = max(m, step(abs(abs(x) - 1.6), 0.07) * step(mod(z, 1.0), 0.5));
    // chevrons pointing forward down the lane
    float cz = mod(z - abs(x) * 0.6, 3.0);
    m = max(m, step(abs(x), 1.1) * step(cz, 0.16));
    // the spot: a ring under the drone's pad
    float r = length(vec2(x, vW.z));
    m = max(m, (1.0 - step(0.03, abs(r - 0.95))) * step(uRoll, 0.001));
    float n = fract(sin(dot(floor(vW.xz * 40.0), vec2(12.9898, 78.233))) * 43758.5453);
    vec3 col = mix(uG, uM, m * 0.85) * (0.985 + 0.03 * n);
    float d = length(vW.xz - uC.xz);
    gl_FragColor = vec4(mix(col, uBg, smoothstep(5.0, 16.0, d)), 1.0);
  }`;

// the airframe as a ghost: a fresnel shell, bright at the silhouette, nearly clear face on
const GHOST_VERT = /* glsl */ `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const GHOST_FRAG = /* glsl */ `uniform vec3 uCol; uniform float uA; varying vec3 vN; varying vec3 vV;
  void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4); gl_FragColor = vec4(uCol, uA * (0.05 + 0.6 * f)); }`;
// the launch bay as a ghost: a run of arched frames over the deck spot, a roof spine and the bay doors' rails
function buildGhost(mat) {
  const g = new THREE.Group();
  const add = (geo, f) => {
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = 6;
    f(m);
    g.add(m);
    return m;
  };
  for (let i = 0; i < 6; i++) {
    const z = -2.6 + i * 1.04;
    add(new THREE.TorusGeometry(1.75, 0.035, 8, 48, Math.PI), (m) => m.position.set(0, 0, z));
  }
  add(new THREE.BoxGeometry(0.06, 0.06, 5.4), (m) => m.position.set(0, 1.75, 0));
  for (const x of [-1.24, 1.24]) add(new THREE.BoxGeometry(0.05, 0.05, 5.4), (m) => m.position.set(x, 1.24, 0));
  return g;
}

export function createRaiderStage({canvas}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  scene.fog = new THREE.Fog(COL.bg, 8, 22);
  const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.02, 80);
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(4, 4, {type: THREE.HalfFloatType, samples: 8}));
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 4, 4);
  gtao.output = GTAOPass.OUTPUT.Default;
  gtao.blendIntensity = 0.8;
  gtao.updateGtaoMaterial({radius: 0.06, distanceExponent: 1.4, thickness: 0.6, scale: 1.0, samples: 16, distanceFallOff: 1.0, screenSpaceRadius: false});
  gtao.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16});
  class Toggle extends Pass {
    constructor(fn) {
      super();
      this.needsSwap = false;
      this.fn = fn;
    }
    render() {
      this.fn();
    }
  }
  const groundVis = (v) => () => {
    ground.visible = v;
    shade.visible = v;
    for (const o of ghosts) o.visible = v && o.userData.on;
  };
  const ghosts = [];
  composer.addPass(new Toggle(groundVis(false)));
  composer.addPass(gtao);
  composer.addPass(new Toggle(groundVis(true)));
  composer.addPass(new OutputPass());

  {
    const env = new THREE.Scene();
    env.background = new THREE.Color('#dde5e4');
    const box = (w, h, pos, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(1, 0.98, 0.95).multiplyScalar(k), side: THREE.DoubleSide}));
      m.position.copy(pos);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    box(12, 12, new V3(0, 14, 2), 2.4);
    box(3, 14, new V3(-12, 4, 6), 3.0);
    box(3, 14, new V3(12, 4, -4), 2.0);
    box(18, 2, new V3(0, 2, 14), 1.5);
    const g = new THREE.Mesh(new THREE.CircleGeometry(40, 32), new THREE.MeshBasicMaterial({color: '#c3cecc', side: THREE.DoubleSide}));
    g.rotation.x = -Math.PI / 2;
    g.position.y = -2;
    env.add(g);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.02).texture;
    scene.environmentIntensity = 0.95;
    pm.dispose();
  }
  const SUN_DIR = new V3(-0.35, 0.82, 0.45).normalize();
  const sun = new THREE.DirectionalLight('#fbfdff', 2.4);
  sun.castShadow = true;
  const EXT = 1.9;
  Object.assign(sun.shadow.camera, {left: -EXT, right: EXT, top: EXT, bottom: -EXT, near: 0.5, far: 20});
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.radius = 8;
  sun.shadow.blurSamples = 20;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.002;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight('#f6fbff', '#b9c7c4', 0.7));

  const groundMat = new THREE.ShaderMaterial({
    vertexShader: GROUND_VERT,
    fragmentShader: GROUND_FRAG,
    uniforms: {uG: {value: new THREE.Color(COL.ground)}, uM: {value: new THREE.Color(COL.mark)}, uBg: {value: new THREE.Color(COL.bg)}, uRoll: {value: 0}, uC: {value: new V3()}},
    toneMapped: false,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const shade = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({color: COL.shadow, opacity: 0.3, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8}),
  );
  shade.rotation.x = -Math.PI / 2;
  shade.receiveShadow = true;
  scene.add(shade);

  const gear = buildGear();
  scene.add(gear.root);
  const ghostMat = new THREE.ShaderMaterial({vertexShader: GHOST_VERT, fragmentShader: GHOST_FRAG, uniforms: {uCol: {value: new THREE.Color('#0f9a8a')}, uA: {value: 0}}, transparent: true, depthWrite: false, side: THREE.DoubleSide});
  const ghost = buildGhost(ghostMat);
  ghost.userData.on = false;
  ghost.visible = false;
  scene.add(ghost);
  ghosts.push(ghost);

  const size = {w: 1600, h: 900};
  const resize = (w, h, pr) => {
    size.w = w;
    size.h = h;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const tmp = new V3();
  const right = new V3().crossVectors(new V3(0, 1, 0), SUN_DIR).normalize();
  const upL = new V3().crossVectors(SUN_DIR, right);
  let texel = (2 * EXT) / sun.shadow.mapSize.x;

  // st: {stroke, roll (turbine angle), height (above the deck), dist (deck slid), thrust, vector, t}
  // cam: {tx, ty, tz, az, el, d (radians, metres), sx, sy}; the target is relative to the gear
  const frame = (st, cam) => {
    gear.update(st);
    ghostMat.uniforms.uA.value = (st.fuselage ?? 0) * 0.8;
    ghost.userData.on = (st.fuselage ?? 0) > 0.01;
    ghost.visible = ghost.userData.on;
    const y = GROUND + (st.height ?? 0);
    gear.root.position.set(0, y, 0);
    groundMat.uniforms.uRoll.value = st.dist ?? 0;
    const tx = cam.tx;
    const ty = cam.ty + y;
    const tz = cam.tz;
    camera.position.set(tx + cam.d * Math.cos(cam.el) * Math.sin(cam.az), ty + cam.d * Math.sin(cam.el), tz + cam.d * Math.cos(cam.el) * Math.cos(cam.az));
    camera.lookAt(tx, ty, tz);
    camera.setViewOffset(size.w, size.h, -(cam.sx ?? 0), -(cam.sy ?? 0), size.w, size.h);
    camera.updateMatrixWorld();
    groundMat.uniforms.uC.value.set(tx, 0, tz);
    tmp.set(0, y * 0.5 + 0.1, -0.1);
    const rr = Math.round(tmp.dot(right) / texel) * texel;
    const uu = Math.round(tmp.dot(upL) / texel) * texel;
    sun.target.position.copy(right).multiplyScalar(rr).addScaledVector(upL, uu).addScaledVector(SUN_DIR, tmp.dot(SUN_DIR));
    sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, 8);
    sun.target.updateMatrixWorld();
    composer.render();
  };
  const pv = new V3();
  const project = (x, y, z) => {
    pv.set(x, y, z).project(camera);
    if (pv.z > 1) return null;
    return [(pv.x * 0.5 + 0.5) * size.w, (-pv.y * 0.5 + 0.5) * size.h];
  };
  const setQuality = ({samples, ao, shadow}) => {
    if (samples !== undefined)
      for (const t of [composer.renderTarget1, composer.renderTarget2]) {
        t.samples = samples;
        t.dispose();
      }
    if (ao !== undefined) gtao.enabled = ao;
    if (shadow !== undefined) {
      sun.shadow.mapSize.set(shadow, shadow);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
      texel = (2 * EXT) / shadow;
    }
  };
  return {renderer, scene, camera, gear, composer, gtao, sun, resize, frame, project, size, ghosts, setQuality};
}
