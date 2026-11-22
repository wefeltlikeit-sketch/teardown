// The Vantor RX-9 "Kestrel" autonomous strike drone, an original design built from code in metres (the whole model
// is drawn at 1:4, root.scale = 0.25). An arrowhead lifting body, a hex sensor cluster in the nose, twin nacelles
// with vectoring nozzles aft, and a swing wing each side. One degree of freedom folds and spreads the wings: a
// hydraulic actuator on the centreline strokes a crosshead that carries two racks, each meshing a 36-tooth sector
// gear (12 mm module) on the wing pivot. 358 mm of rack travel turns the gears, and the wings, through 95°.
// The right side is built once; the left is its mirror (scale.x = -1).
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const V3 = THREE.Vector3;
export const SCALE = 0.25;
export const G = {
  teeth: 36,
  module: 0.012,
  gearR: 0.216, // 36 teeth x 12 mm module = 432 mm pitch diameter
  sweep: (95 * Math.PI) / 180, // stowed to spread
  travel: 0.358, // rack travel = gearR x sweep
  pivotX: 0.78,
  pivotZ: -0.35,
  rackLen: 0.78,
  span: 3.6, // one wing, pivot to tip
  rootChord: 2.1,
  tipChord: 0.62,
  hullHalfW: 1.0,
  hullLen: 7.2,
  fanR: 0.26,
  skid: 0.75, // belly to deck
};
export const PIVOT = new V3(G.pivotX, 0, G.pivotZ);
/** the wing angle (radians about +y) at stroke 0 (stowed) .. 1 (spread) */
export const wingAngle = (stroke) => G.sweep * (1 - stroke);
/** the rack's forward offset from the spread position */
export const rackOffset = (stroke) => G.gearR * wingAngle(stroke);
/** the deck height of the model's origin (scene units) */
export const GROUND = G.skid * SCALE;

// ------------------------------------------------------------ geometry
function gearGeo(teeth, rp, width, depth, holeR = 0) {
  const ra = rp + depth * 0.45;
  const rr = rp - depth * 0.55;
  const sh = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const da = (Math.PI * 2) / teeth;
    const pts = [[rr, a0], [rr, a0 + da * 0.18], [ra, a0 + da * 0.34], [ra, a0 + da * 0.6], [rr, a0 + da * 0.76]];
    pts.forEach(([r, a], k) => (i === 0 && k === 0 ? sh.moveTo(r * Math.cos(a), r * Math.sin(a)) : sh.lineTo(r * Math.cos(a), r * Math.sin(a))));
  }
  sh.closePath();
  if (holeR) {
    const h = new THREE.Path();
    h.absarc(0, 0, holeR, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const h = new THREE.Path();
    h.absarc(Math.cos(a) * rp * 0.58, Math.sin(a) * rp * 0.58, rp * 0.17, 0, Math.PI * 2, true);
    sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, {depth: width, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 1, curveSegments: 10});
  g.translate(0, 0, -width / 2);
  g.rotateX(Math.PI / 2); // axis vertical
  return g;
}
// a rack along z, its teeth on the +x face, pitch line at x = 0
function rackGeo(len, w, h, pitch, depth) {
  const sh = new THREE.Shape(); // shape x -> z, shape y -> x
  const body = h;
  sh.moveTo(-len / 2, -body);
  sh.lineTo(len / 2, -body);
  sh.lineTo(len / 2, -depth * 0.55);
  const n = Math.floor(len / pitch);
  for (let i = n - 1; i >= 0; i--) {
    const z0 = -len / 2 + i * pitch;
    sh.lineTo(z0 + pitch * 0.78, -depth * 0.55);
    sh.lineTo(z0 + pitch * 0.62, depth * 0.45);
    sh.lineTo(z0 + pitch * 0.38, depth * 0.45);
    sh.lineTo(z0 + pitch * 0.22, -depth * 0.55);
  }
  sh.lineTo(-len / 2, -depth * 0.55);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth: w, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1});
  g.translate(0, 0, -w / 2);
  // shape (x, y, depth) -> world (z, ?, ?): map shape x -> z, shape y -> x, depth -> y
  const m = new THREE.Matrix4().set(0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1);
  g.applyMatrix4(m);
  g.computeVertexNormals();
  return g;
}
// a plan form in (x, z), extruded through its thickness along y and centred on y = 0
function slab(points, thick, bevel, segs = 3) {
  const sh = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z)));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs});
  g.rotateX(Math.PI / 2);
  g.translate(0, thick / 2, 0);
  return g;
}
const mirrorPts = (half) => [...half, ...half.slice(1, -1).reverse().map(([x, z]) => [-x, z])];
// the right wing in its own frame: the pivot at the origin, the root chord running forward (+z), the span outboard
function wingGeo() {
  const {span, rootChord: rc, tipChord: tc} = G;
  const sweepBack = 1.25;
  const P = [[0.0, 0.0], [0.0, rc], [span * 0.35, rc - 0.25], [span, rc - sweepBack - 0.05], [span, rc - sweepBack - tc], [span * 0.55, 0.05]];
  const g = slab(P, 0.06, 0.03, 2);
  return g;
}
function nacelleGeo() {
  const prof = [[0.001, 0.9], [0.18, 0.84], [0.3, 0.6], [0.34, 0.2], [0.34, -0.5], [0.31, -0.8], [0.26, -0.82], [0.24, -0.6], [0.001, -0.6]];
  const g = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), 40);
  g.rotateX(Math.PI / 2);
  return g;
}
function nozzleGeo() {
  const prof = [[0.27, 0.0], [0.29, -0.05], [0.25, -0.38], [0.21, -0.42], [0.2, -0.4], [0.235, -0.05], [0.235, 0.0]];
  const g = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), 40);
  g.rotateX(Math.PI / 2);
  return g;
}
function fanGeo() {
  const g = new THREE.Group();
  return g;
}
function plumeGeo() {
  const g = new THREE.CylinderGeometry(0.17, 0.05, 1.6, 28, 1, true);
  g.translate(0, -0.8, 0);
  g.rotateX(Math.PI / 2); // the wide end at the nozzle, trailing aft along -z
  return g;
}

const PLUME_VERT = /* glsl */ `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const PLUME_FRAG = /* glsl */ `uniform vec3 uCol; uniform float uA; uniform float uT; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    float f = abs(dot(normalize(vN), normalize(vV)));
    float along = clamp(vUv.y, 0.0, 1.0);
    float band = 0.75 + 0.25 * sin(along * 38.0 - uT * 40.0);
    float a = uA * pow(max(along, 0.0001), 1.6) * f * band;
    gl_FragColor = vec4(uCol * 0.95, clamp(a, 0.0, 0.9));
  }`;

export function buildRaider() {
  const M = {
    hull: new THREE.MeshPhysicalMaterial({color: '#7d868d', roughness: 0.5, metalness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.55}),
    dark: new THREE.MeshPhysicalMaterial({color: '#2b3034', roughness: 0.45, metalness: 0.4, clearcoat: 0.3}),
    wing: new THREE.MeshPhysicalMaterial({color: '#9aa3a9', roughness: 0.48, metalness: 0.5, clearcoat: 0.2, envMapIntensity: 0.55}),
    teal: new THREE.MeshPhysicalMaterial({color: '#0f9a8a', roughness: 0.35, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.25}),
    steel: new THREE.MeshStandardMaterial({color: '#c9ccd1', roughness: 0.25, metalness: 1}),
    brass: new THREE.MeshStandardMaterial({color: '#b28a3e', roughness: 0.32, metalness: 0.9}),
    black: new THREE.MeshStandardMaterial({color: '#17191b', roughness: 0.55, metalness: 0.3}),
    lens: new THREE.MeshStandardMaterial({color: '#0b2a27', roughness: 0.15, metalness: 0.2, emissive: new THREE.Color('#19d3bd'), emissiveIntensity: 0.4}),
    core: new THREE.MeshStandardMaterial({color: '#0d3b36', roughness: 0.3, metalness: 0.2, emissive: new THREE.Color('#25e0c8'), emissiveIntensity: 0.3}),
    body: null,
  };
  M.body = M.steel.clone();
  M.body.color.set('#dfe3e6');
  const plumeMat = new THREE.ShaderMaterial({
    vertexShader: PLUME_VERT,
    fragmentShader: PLUME_FRAG,
    uniforms: {uCol: {value: new THREE.Color('#5fe9d6')}, uA: {value: 0}, uT: {value: 0}},
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });
  const all = [];
  const add = (parent, geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    all.push(m);
    return m;
  };
  const root = new THREE.Group();
  root.scale.setScalar(SCALE);
  const model = new THREE.Group();
  root.add(model);

  // ------------------------------------------------------------ hull: lower body, dorsal deck, keel, nose
  const hull = new THREE.Group();
  model.add(hull);
  const HL = G.hullLen / 2;
  const lower = mirrorPts([[0.0, HL], [0.42, HL - 1.0], [0.86, 1.2], [1.0, 0.2], [1.0, -2.7], [0.82, -HL], [0.5, -HL + 0.25], [0.0, -HL + 0.25]]);
  add(hull, slab(lower, 0.42, 0.12, 4), M.hull).position.y = -0.04;
  const deck = mirrorPts([[0.0, 2.1], [0.3, 1.5], [0.6, 0.4], [0.66, -1.9], [0.5, -3.2], [0.0, -3.2]]);
  add(hull, slab(deck, 0.2, 0.08, 3), M.hull).position.y = 0.28;
  // a raised spine with the intake slots either side
  const spine = mirrorPts([[0.0, 1.3], [0.16, 1.0], [0.2, -2.4], [0.0, -2.7]]);
  add(hull, slab(spine, 0.12, 0.05, 2), M.dark).position.y = 0.45;
  for (const s of [1, -1]) {
    const slot = add(hull, new RoundedBoxGeometry(0.16, 0.08, 0.9, 2, 0.03), M.black);
    slot.position.set(s * 0.42, 0.4, -0.6);
  }
  // the belly keel and the three skids
  const keel = mirrorPts([[0.0, 2.4], [0.34, 1.8], [0.4, -2.2], [0.0, -2.6]]);
  add(hull, slab(keel, 0.12, 0.05, 2), M.dark).position.y = -0.32;
  const skids = [[0, 2.2], [0.7, -1.9], [-0.7, -1.9]];
  for (const [x, z] of skids) {
    const leg = add(hull, new THREE.CylinderGeometry(0.045, 0.06, G.skid - 0.38, 14), M.dark);
    leg.position.set(x, -0.38 - (G.skid - 0.38) / 2, z);
    const pad = add(hull, new THREE.CylinderGeometry(0.13, 0.15, 0.04, 22), M.black);
    pad.position.set(x, -G.skid + 0.02, z);
  }
  // the nose sensor cluster: seven lenses in a hex on a dark mount
  const sensor = new THREE.Group();
  sensor.position.set(0, 0.3, 2.55);
  hull.add(sensor);
  const mount = add(sensor, new THREE.CylinderGeometry(0.22, 0.26, 0.08, 6), M.dark);
  mount.rotation.x = Math.PI / 2;
  const lenses = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r = i === 6 ? 0 : 0.13;
    const l = add(sensor, new THREE.SphereGeometry(i === 6 ? 0.07 : 0.05, 18, 12), M.lens);
    l.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.05);
    lenses.push(l);
  }
  sensor.rotation.x = -0.6;
  // twin cannon pods under the nose shoulders
  for (const s of [1, -1]) {
    const pod = add(hull, new THREE.CylinderGeometry(0.06, 0.07, 0.9, 16), M.dark);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(s * 0.55, -0.44, 1.5);
    const muz = add(hull, new THREE.CylinderGeometry(0.025, 0.025, 0.25, 10), M.steel);
    muz.rotation.x = Math.PI / 2;
    muz.position.set(s * 0.55, -0.44, 2.05);
  }
  // panel trim: thin teal strips along the deck edges
  for (const s of [1, -1]) {
    const strip = add(hull, new THREE.BoxGeometry(0.03, 0.02, 2.6), M.teal);
    strip.position.set(s * 0.7, 0.39, -0.4);
    strip.rotation.y = s * 0.025;
  }

  // ------------------------------------------------------------ internals: power cell, actuator, crosshead, racks
  const inner = new THREE.Group();
  model.add(inner);
  const IY = -0.12;
  const core = add(inner, new THREE.CylinderGeometry(0.2, 0.2, 0.8, 32), M.core);
  core.rotation.x = Math.PI / 2;
  core.position.set(0, 0.02, 0.9);
  for (const z of [0.5, 1.3]) {
    const band = add(inner, new THREE.CylinderGeometry(0.235, 0.235, 0.06, 32), M.dark);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, 0.02, z);
  }
  const act = new THREE.Group();
  inner.add(act);
  const AZ0 = -2.35;
  const AZ1 = -1.45;
  const body = add(act, new THREE.CylinderGeometry(0.075, 0.075, AZ1 - AZ0, 28), M.body);
  body.rotation.x = Math.PI / 2;
  body.position.set(0, IY, (AZ0 + AZ1) / 2);
  for (const z of [AZ0 + 0.04, AZ1 - 0.04]) {
    const band = add(act, new THREE.CylinderGeometry(0.084, 0.084, 0.05, 28), M.dark);
    band.rotation.x = Math.PI / 2;
    band.position.set(0, IY, z);
  }
  const clevis = add(act, new RoundedBoxGeometry(0.12, 0.12, 0.12, 3, 0.02), M.brass);
  clevis.position.set(0, IY, AZ0 - 0.04);
  const rod = add(act, new THREE.CylinderGeometry(0.03, 0.03, 1, 18), M.steel);
  rod.rotation.x = Math.PI / 2;
  const cross = new THREE.Group();
  inner.add(cross);
  cross.userData.y = IY;
  const RACK_X = G.pivotX - G.gearR;
  add(cross, new RoundedBoxGeometry(2 * RACK_X + 0.08, 0.07, 0.09, 2, 0.02), M.teal);
  add(cross, new RoundedBoxGeometry(0.14, 0.12, 0.14, 3, 0.02), M.teal);
  const pitch = (2 * Math.PI * G.gearR) / G.teeth;
  const rackG = rackGeo(G.rackLen, 0.05, 0.06, pitch, 0.03);
  const racks = [1, -1].map((s) => {
    const r = add(cross, rackG, M.brass);
    r.scale.x = s;
    r.position.set(s * RACK_X, 0, G.rackLen / 2 + 0.04);
    return r;
  });
  // a guide rail under each rack
  for (const s of [1, -1]) {
    const rail = add(inner, new RoundedBoxGeometry(0.05, 0.03, 1.3, 2, 0.01), M.dark);
    rail.position.set(s * (RACK_X - 0.04), IY - 0.05, G.pivotZ);
  }

  // ------------------------------------------------------------ one side: sector gear, wing; nacelle and nozzle
  const sides = [1, -1].map((sx) => {
    const side = new THREE.Group();
    side.scale.x = sx;
    model.add(side);
    const pivot = new THREE.Group();
    pivot.position.copy(PIVOT);
    side.add(pivot);
    const gear = add(pivot, gearGeo(G.teeth, G.gearR, 0.05, 0.03, 0.05), M.brass);
    gear.position.y = -0.12;
    const shaft = add(side, new THREE.CylinderGeometry(0.045, 0.045, 0.5, 18), M.steel);
    shaft.position.copy(PIVOT);
    const hubTop = add(pivot, new THREE.CylinderGeometry(0.09, 0.09, 0.06, 20), M.teal);
    hubTop.position.y = -0.06;
    const wing = new THREE.Group();
    pivot.add(wing);
    const wingMesh = add(wing, wingGeo(), M.wing);
    wingMesh.position.y = 0.0;
    // the wing root fairing, a tip pod, and a teal stripe along the leading edge
    const root2 = add(wing, new RoundedBoxGeometry(0.2, 0.12, G.rootChord - 0.1, 3, 0.04), M.dark);
    root2.position.set(0.12, 0, G.rootChord / 2);
    const tip = add(wing, new THREE.CylinderGeometry(0.045, 0.055, 0.9, 14), M.dark);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(G.span, 0, G.rootChord - 1.25 - 0.3);
    const tipL = add(wing, new THREE.SphereGeometry(0.04, 12, 8), M.lens);
    tipL.position.set(G.span, 0, G.rootChord - 1.25 + 0.17);
    const le = new THREE.CatmullRomCurve3([new V3(0.3, 0.035, G.rootChord - 0.03), new V3(G.span * 0.35, 0.035, G.rootChord - 0.28), new V3(G.span - 0.06, 0.035, G.rootChord - 1.3)]);
    add(wing, new THREE.TubeGeometry(le, 30, 0.018, 6), M.teal);
    // nacelle, nozzle (vectors about x), turbine
    const nac = new THREE.Group();
    nac.position.set(0.42, 0.06, -3.0);
    side.add(nac);
    add(nac, nacelleGeo(), M.hull);
    const nozzle = new THREE.Group();
    nozzle.position.z = -0.8;
    nac.add(nozzle);
    add(nozzle, nozzleGeo(), M.dark);
    const fan = new THREE.Group();
    fan.position.z = -0.62;
    nac.add(fan);
    const hubF = add(fan, new THREE.ConeGeometry(0.08, 0.16, 20), M.steel);
    hubF.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 11; i++) {
      const b = add(fan, new THREE.BoxGeometry(0.035, 0.2, 0.012), M.steel);
      b.position.set(Math.cos((i / 11) * Math.PI * 2) * 0.13, Math.sin((i / 11) * Math.PI * 2) * 0.13, 0);
      b.rotation.z = (i / 11) * Math.PI * 2 - Math.PI / 2;
      b.rotation.y = 0.5;
    }
    const plume = new THREE.Mesh(plumeGeo(), plumeMat);
    plume.position.z = -0.4;
    plume.renderOrder = 8;
    plume.castShadow = false;
    nozzle.add(plume);
    return {side, pivot, wing, gear, nac, nozzle, fan, plume};
  });

  // display modes: x-ray (the hull to glass), section (the hull cut at the centreline), exploded
  const CLIP = new THREE.Plane(new V3(-1, 0, 0), 0);
  const hullMats = [M.hull, M.dark];
  const hullOnly = (fn) => hull.traverse((o) => o.isMesh && fn(o));
  // the hull gets its own materials so x-ray and section reach only it
  const HM = {hull: M.hull.clone(), dark: M.dark.clone(), black: M.black.clone()};
  hullOnly((o) => {
    if (o.material === M.hull) o.material = HM.hull;
    else if (o.material === M.dark) o.material = HM.dark;
    else if (o.material === M.black) o.material = HM.black;
  });
  void hullMats;
  let xrayNow = -1;
  let sectionNow = false;
  const setXray = (k) => {
    if (Math.abs(k - xrayNow) < 1e-3) return;
    xrayNow = k;
    for (const m of Object.values(HM)) {
      m.transparent = k > 0.001;
      m.opacity = 1 - 0.82 * k;
      m.depthWrite = k < 0.5;
      m.needsUpdate = true;
    }
  };
  const setSection = (on) => {
    if (on === sectionNow) return;
    sectionNow = on;
    for (const m of Object.values(HM)) {
      m.clippingPlanes = on ? [CLIP] : null;
      m.side = on ? THREE.DoubleSide : THREE.FrontSide;
      m.needsUpdate = true;
    }
  };
  const out = {theta: 0, d: 0, CLIP};
  /** stroke 0..1 (0 stowed, 1 spread), roll (turbine angle), thrust 0..1, vector 0..1 (0 aft, 1 straight down), xray, section, explode, t */
  const update = ({stroke = 0, roll = 0, thrust = 0, vector = 0, xray = 0, section = false, explode = 0, t = 0} = {}) => {
    setXray(xray);
    setSection(section);
    const e = explode;
    hull.position.y = 0.9 * e;
    const th = wingAngle(stroke);
    const d = rackOffset(stroke);
    out.theta = th;
    out.d = d;
    // the crosshead and racks: forward by d when stowed; the gears turn by d / r
    const zc = G.pivotZ - G.rackLen / 2 - 0.04 + d - G.travel / 2;
    cross.position.set(0, IY - 0.35 * e, zc);
    const rodFrom = AZ1;
    const zRod = zc;
    rod.scale.y = Math.max(0.01, zRod - rodFrom);
    rod.position.set(0, IY, (zRod + rodFrom) / 2);
    act.position.y = -0.35 * e;
    core.material.emissiveIntensity = 0.25 + 0.6 * thrust;
    for (const l of lenses) l.material.emissiveIntensity = 0.35 + 0.5 * thrust;
    plumeMat.uniforms.uA.value = thrust;
    plumeMat.uniforms.uT.value = t;
    for (const s of sides) {
      s.side.position.set(0.7 * e * s.side.scale.x, -0.35 * e, 0);
      s.pivot.rotation.y = th;
      s.nac.position.z = -3.0 - 0.9 * e;
      s.nozzle.rotation.x = -vector * (80 * Math.PI) / 180;
      s.fan.rotation.z = roll;
      s.plume.scale.set(1, 1, 0.4 + 0.8 * thrust);
      s.plume.visible = thrust > 0.01;
    }
  };
  update();
  return {root, update, M, all, hull, inner, act, cross, racks, sides, out, plumeMat};
}
export const buildGear = buildRaider;
void fanGeo;
