// EMBERFALL CALDERA, an original spy-thriller lair built from code. One model unit is 20 m. A hollow peak with a
// shaft down to a hangar cavern; across the crater a steel collar carries an 8-blade iris roof, its top faces
// dressed as ash so the crater reads as solid from the air. One input, stroke 0..1, drives the whole sequence:
//   - the first part turns the actuation ring (240 teeth) 30° through a 16-tooth drive pinion (1.25 turns), and the
//     ring's drive pins swing every blade 70° on its own pivot, clearing the 40 m aperture;
//   - the second part spins four screw jacks (500 mm lead) 80 turns, raising the launch lift 40 m to the crater.
// The Kestrel RX-9 drone (../raider-shared/raider.js) rides the lift as the payload.
// All numbers are fictional but self-consistent.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {buildRaider, G as KG} from '../raider-shared/raider.js';

const V3 = THREE.Vector3;
export const UNIT = 20; // metres per model unit
export const L = {
  blades: 8,
  pivotR: 1.15,
  aperture: 1.0,
  bladeOpen: (70 * Math.PI) / 180,
  ringTeeth: 240,
  pinionTeeth: 16,
  ringTurn: (30 * Math.PI) / 180,
  liftTravel: 2.0, // 40 m
  lead: 0.5, // metres per screw turn
  floorY: -2.0,
  collarY: 0.08,
  jackR: 0.93,
  liftR: 0.84,
  droneScale: 0.05,
};
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** the iris part of the stroke, 0 sealed .. 1 open */
export const irisAt = (stroke) => smoother(stroke / 0.42);
/** the lift part of the stroke, 0 on the hangar floor .. 1 at the crater */
export const liftAt = (stroke) => smoother((stroke - 0.4) / 0.6);
export const bladeAngle = (stroke) => L.bladeOpen * irisAt(stroke);
export const ringAngle = (stroke) => L.ringTurn * irisAt(stroke);
export const pinionTurns = (stroke) => (ringAngle(stroke) / (2 * Math.PI)) * (L.ringTeeth / L.pinionTeeth);
export const liftMetres = (stroke) => liftAt(stroke) * L.liftTravel * UNIT;
export const screwTurns = (stroke) => liftMetres(stroke) / L.lead;
/** the lift deck's height (model units) */
export const deckY = (stroke) => L.floorY + 0.06 + liftAt(stroke) * (L.liftTravel - 0.1);

// the mountain's half-section (r, y), revolved: crater lip, flanks, base, then back in along the cavern and shaft
const MOUNTAIN = [
  [1.0, 0.0], [1.06, 0.06], [1.45, 0.1], [1.75, 0.02], [2.3, -0.55], [3.0, -1.35], [3.7, -1.9], [4.1, -2.0],
  [2.45, -2.0], [2.45, -1.35], [2.0, -0.9], [1.35, -0.62], [1.0, -0.5],
];
export const CAVERN = MOUNTAIN.slice(8);

const lathe = (prof, seg = 96) => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// a closed profile revolved: the lathe takes the points in order, so close the loop by repeating the first
const closedLathe = (prof, seg) => lathe([...prof, prof[0]], seg);

// a plan form in (x, z), extruded down through thick along y, top face at y = 0
function plate(points, thick, bevel = 0.004) {
  const sh = new THREE.Shape();
  points.forEach(([x, z], i) => (i ? sh.lineTo(x, z) : sh.moveTo(x, z)));
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1});
  g.rotateX(Math.PI / 2);
  return g;
}
function ringGear(teeth, rOut, rIn, width, depth) {
  const sh = new THREE.Shape();
  const ra = rOut + depth * 0.5;
  const rr = rOut - depth * 0.5;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const da = (Math.PI * 2) / teeth;
    const pts = [[rr, a0], [rr, a0 + da * 0.2], [ra, a0 + da * 0.35], [ra, a0 + da * 0.6], [rr, a0 + da * 0.75]];
    pts.forEach(([r, a], k) => (i === 0 && k === 0 ? sh.moveTo(r * Math.cos(a), r * Math.sin(a)) : sh.lineTo(r * Math.cos(a), r * Math.sin(a))));
  }
  sh.closePath();
  const h = new THREE.Path();
  h.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  sh.holes.push(h);
  const g = new THREE.ExtrudeGeometry(sh, {depth: width, bevelEnabled: false, curveSegments: 64});
  g.rotateX(Math.PI / 2);
  return g;
}
function spurGear(teeth, rp, width, depth) {
  const sh = new THREE.Shape();
  const ra = rp + depth * 0.5;
  const rr = rp - depth * 0.5;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const da = (Math.PI * 2) / teeth;
    const pts = [[rr, a0], [rr, a0 + da * 0.2], [ra, a0 + da * 0.35], [ra, a0 + da * 0.6], [rr, a0 + da * 0.75]];
    pts.forEach(([r, a], k) => (i === 0 && k === 0 ? sh.moveTo(r * Math.cos(a), r * Math.sin(a)) : sh.lineTo(r * Math.cos(a), r * Math.sin(a))));
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {depth: width, bevelEnabled: false});
  g.rotateX(Math.PI / 2);
  return g;
}
// a canvas texture of ash and scattered rock for the blade tops and the crater floor
function ashTex(seed = 3) {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#7a7470';
  g.fillRect(0, 0, 512, 512);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    const v = 90 + Math.floor(rnd() * 60);
    g.fillStyle = `rgba(${v},${v - 6},${v - 10},${0.25 + rnd() * 0.4})`;
    g.beginPath();
    g.arc(rnd() * 512, rnd() * 512, 1 + rnd() * 7, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function buildLair() {
  const ash = ashTex();
  const M = {
    rock: new THREE.MeshStandardMaterial({color: '#6f6560', roughness: 0.92, metalness: 0, envMapIntensity: 0.6, flatShading: true}),
    cave: new THREE.MeshStandardMaterial({color: '#4a4542', roughness: 0.95, metalness: 0, side: THREE.BackSide}),
    ashTop: new THREE.MeshStandardMaterial({map: ash, color: '#c8c2bc', roughness: 0.95, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2}),
    steel: new THREE.MeshStandardMaterial({color: '#aeb4b8', roughness: 0.4, metalness: 0.85, envMapIntensity: 0.6}),
    dark: new THREE.MeshStandardMaterial({color: '#2b3034', roughness: 0.5, metalness: 0.5}),
    brass: new THREE.MeshStandardMaterial({color: '#b28a3e', roughness: 0.32, metalness: 0.9}),
    teal: new THREE.MeshPhysicalMaterial({color: '#0f9a8a', roughness: 0.35, metalness: 0.1, clearcoat: 0.5}),
    deck: new THREE.MeshStandardMaterial({color: '#545b60', roughness: 0.6, metalness: 0.5}),
    glow: new THREE.MeshStandardMaterial({color: '#0c3a35', emissive: new THREE.Color('#2fe3cb'), emissiveIntensity: 0.7, roughness: 0.4}),
    screw: new THREE.MeshStandardMaterial({color: '#c9ccd1', roughness: 0.28, metalness: 1}),
  };
  const all = [];
  const add = (parent, geo, mat, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    all.push(m);
    return m;
  };
  const root = new THREE.Group();

  // ------------------------------------------------------------ the mountain, the cavern floor, the hangar
  const mountain = new THREE.Group();
  root.add(mountain);
  // two halves (x > 0 and x < 0) so the exploded view can split the peak open; the flanks get rocky ridges
  const rocky = (geo, prof, from, to) => {
    const pos = geo.attributes.position;
    const n = prof.length + 1; // the closed profile repeats its first point
    for (let i = 0; i < pos.count; i++) {
      const j = i % n;
      if (j < from || j > to) continue;
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const a = Math.atan2(x, z);
      const k = 1 + 0.09 * Math.sin(5 * a + y * 3.1) + 0.06 * Math.sin(11 * a - y * 6.3 + 1.3) + 0.04 * Math.sin(23 * a + y * 9 + 0.4);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
      pos.setY(i, y + 0.05 * Math.sin(7 * a + 0.8) * Math.min(1, -y));
    }
    geo.computeVertexNormals();
    return geo;
  };
  // reversed so the lathe's faces point out of the rock (the profile runs clockwise in (r, y))
  const prof = [...MOUNTAIN, MOUNTAIN[0]].reverse().map(([r, y]) => new THREE.Vector2(r, y));
  const halves = [0, Math.PI].map((phi0) => {
    const h = new THREE.Group();
    mountain.add(h);
    add(h, rocky(new THREE.LatheGeometry(prof, 60, phi0, Math.PI), MOUNTAIN, 6, 10), M.rock);
    h.userData.dir = phi0 === 0 ? 1 : -1;
    return h;
  });
  const shell = halves[0];
  const floor = add(root, new THREE.CircleGeometry(2.45, 72), M.deck, false);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = L.floorY + 0.002;
  // hangar props: a ring of light strips on the cavern wall, a control gallery, fuel bowsers
  const props = new THREE.Group();
  root.add(props);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const strip = add(props, new THREE.BoxGeometry(0.03, 0.22, 0.02), M.glow, false);
    strip.position.set(Math.cos(a) * 2.38, L.floorY + 0.4, Math.sin(a) * 2.38);
    strip.rotation.y = -a;
  }
  const gallery = add(props, new RoundedBoxGeometry(0.9, 0.22, 0.32, 3, 0.03), M.dark);
  gallery.position.set(-1.7, L.floorY + 0.75, -1.1);
  gallery.rotation.y = 0.9;
  const win = add(props, new THREE.BoxGeometry(0.8, 0.08, 0.02), M.glow, false);
  win.position.set(0, 0.03, 0.165);
  gallery.add(win);
  for (const [x, z, r] of [[1.6, 1.2, 0.5], [1.9, 0.6, 0.2], [-1.4, 1.5, -0.4]]) {
    const tank = add(props, new THREE.CapsuleGeometry(0.07, 0.3, 4, 16), M.teal);
    tank.rotation.z = Math.PI / 2;
    tank.rotation.y = r;
    tank.position.set(x, L.floorY + 0.09, z);
  }
  // floor markings: a teal ring round the lift well
  const mark = add(props, new THREE.RingGeometry(1.0, 1.03, 96), M.teal, false);
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = L.floorY + 0.006;

  // ------------------------------------------------------------ the collar, the actuation ring, the pinion, the iris
  const top = new THREE.Group();
  root.add(top);
  const collarGeo = new THREE.RingGeometry(1.0, 1.42, 96);
  collarGeo.rotateX(-Math.PI / 2);
  const collar = add(top, collarGeo, M.steel);
  collar.position.y = L.collarY - 0.02;
  const collarSide = add(top, new THREE.CylinderGeometry(1.0, 1.0, 0.12, 96, 1, true), M.dark);
  collarSide.position.y = L.collarY - 0.08;
  collarSide.material = M.dark.clone();
  collarSide.material.side = THREE.DoubleSide;
  const ring = add(top, ringGear(L.ringTeeth, 1.36, 1.24, 0.03, 0.012), M.brass);
  ring.position.y = L.collarY + 0.012;
  // the ring's drive pins, one per blade
  const pins = [];
  for (let i = 0; i < L.blades; i++) {
    const p = add(ring, new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10), M.teal);
    const a = (i / L.blades) * Math.PI * 2 + 0.22;
    p.position.set(Math.cos(a) * 1.3, 0.02, Math.sin(a) * 1.3);
    pins.push(p);
  }
  const pinionR = (1.36 * L.pinionTeeth) / L.ringTeeth;
  const pinion = new THREE.Group();
  pinion.position.set(1.36 + pinionR + 0.004, L.collarY + 0.012, 0);
  top.add(pinion);
  add(pinion, spurGear(L.pinionTeeth, pinionR, 0.03, 0.012), M.brass);
  const motor = add(top, new THREE.CylinderGeometry(0.06, 0.06, 0.12, 24), M.dark);
  motor.position.set(pinion.position.x, L.collarY + 0.12, 0);
  const motorCap = add(top, new THREE.CylinderGeometry(0.062, 0.062, 0.02, 24), M.teal);
  motorCap.position.set(pinion.position.x, L.collarY + 0.19, 0);

  // the blades: blade 0's wedge in plan from its pivot P0 to the centre and on past P1, built relative to the pivot
  const blades = [];
  const P = (k) => [L.pivotR * Math.cos((2 * Math.PI * k) / L.blades), L.pivotR * Math.sin((2 * Math.PI * k) / L.blades)];
  const P0 = P(0);
  const P1e = P(1.25);
  const wedge = [[0, 0], [-P0[0], -P0[1]], [P1e[0] - P0[0], P1e[1] - P0[1]]];
  const bladeGeo = plate(wedge, 0.018);
  const bladeTop = new THREE.ShapeGeometry(new THREE.Shape(wedge.map(([x, z]) => new THREE.Vector2(x, z))));
  bladeTop.rotateX(Math.PI / 2);
  // uv for the ash: plan position
  {
    const pos = bladeTop.attributes.position;
    const uv = bladeTop.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) * 0.9, pos.getZ(i) * 0.9);
  }
  for (let i = 0; i < L.blades; i++) {
    const base = new THREE.Group();
    base.rotation.y = -(2 * Math.PI * i) / L.blades;
    top.add(base);
    const piv = new THREE.Group();
    piv.position.set(P0[0], L.collarY + 0.06 + i * 0.006, P0[1]);
    base.add(piv);
    add(piv, bladeGeo, M.steel, false);
    const face = add(piv, bladeTop, M.ashTop, false);
    face.position.y = 0.0015;
    face.material = M.ashTop;
    const boss = add(piv, new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), M.dark);
    boss.position.y = -0.02;
    blades.push({base, piv});
  }

  // ------------------------------------------------------------ the shaft: four screw jacks and the lift deck
  const shaft = new THREE.Group();
  root.add(shaft);
  const jacks = [];
  const JL = -L.floorY + L.collarY - 0.06;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const j = new THREE.Group();
    j.position.set(Math.cos(a) * L.jackR, L.floorY + JL / 2, Math.sin(a) * L.jackR);
    shaft.add(j);
    add(j, new THREE.CylinderGeometry(0.022, 0.022, JL, 14), M.screw);
    // a helical stripe so the spin reads
    const pts = [];
    for (let k = 0; k <= 200; k++) {
      const u = k / 200;
      pts.push(new V3(Math.cos(u * Math.PI * 2 * 18) * 0.023, -JL / 2 + u * JL, Math.sin(u * Math.PI * 2 * 18) * 0.023));
    }
    add(j, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.004, 4), M.dark, false);
    const gearbox = add(shaft, new RoundedBoxGeometry(0.1, 0.08, 0.1, 2, 0.015), M.teal);
    gearbox.position.set(j.position.x, L.floorY + 0.04, j.position.z);
    jacks.push(j);
  }
  const lift = new THREE.Group();
  shaft.add(lift);
  const deck = add(lift, new THREE.CylinderGeometry(L.liftR, L.liftR, 0.05, 64), M.deck);
  deck.position.y = -0.025;
  const deckRing = add(lift, new THREE.RingGeometry(0.6, 0.64, 64), M.teal, false);
  deckRing.rotation.x = -Math.PI / 2;
  deckRing.position.y = 0.002;
  const deckX = add(lift, new THREE.BoxGeometry(0.9, 0.004, 0.04), M.teal, false);
  deckX.position.y = 0.002;
  const nuts = [];
  for (const j of jacks) {
    const nut = add(lift, new RoundedBoxGeometry(0.11, 0.08, 0.11, 2, 0.02), M.dark);
    nut.position.set(j.position.x, -0.02, j.position.z);
    nuts.push(nut);
  }
  // the payload
  const drone = buildRaider();
  drone.root.scale.setScalar(L.droneScale);
  root.add(drone.root);

  // ------------------------------------------------------------ display modes
  const CLIP = new THREE.Plane(new V3(-1, 0, 0), 0);
  const rockMats = [M.rock];
  let xrayNow = -1;
  let sectionNow = false;
  const setXray = (k) => {
    if (Math.abs(k - xrayNow) < 1e-3) return;
    xrayNow = k;
    for (const m of rockMats) {
      m.transparent = k > 0.001;
      m.opacity = 1 - 0.8 * k;
      m.depthWrite = k < 0.5;
      m.needsUpdate = true;
    }
  };
  const setSection = (on) => {
    if (on === sectionNow) return;
    sectionNow = on;
    for (const m of rockMats) {
      m.clippingPlanes = on ? [CLIP] : null;
      m.side = on ? THREE.DoubleSide : m === M.cave ? THREE.BackSide : THREE.FrontSide;
      m.needsUpdate = true;
    }
  };
  const out = {CLIP};
  /**
   * stroke 0..1 (sealed and down .. open and up), drone {height (above the deck, units), stroke, thrust, vector,
   * roll, t}, xray, section, explode
   */
  const update = ({stroke = 0, drone: d = {}, xray = 0, section = false, explode = 0} = {}) => {
    setXray(xray);
    setSection(section);
    const e = explode;
    for (const h of halves) h.position.x = h.userData.dir * 3.2 * e;
    top.position.y = 0.9 * e;
    const ba = bladeAngle(stroke);
    for (const b of blades) b.piv.rotation.y = ba;
    ring.rotation.y = -ringAngle(stroke);
    pinion.rotation.y = pinionTurns(stroke) * Math.PI * 2 * (L.ringTeeth > 0 ? 1 : -1);
    const sTurn = screwTurns(stroke);
    for (const j of jacks) j.rotation.y = sTurn * Math.PI * 2 * 0.05; // shown slowed 20x so the stripe reads
    const y = deckY(stroke);
    lift.position.y = y;
    const dy = y + (d.height ?? 0) + KG.skid * L.droneScale;
    drone.root.position.set(0, dy, 0);
    drone.update({stroke: d.stroke ?? 0, roll: d.roll ?? 0, thrust: d.thrust ?? 0, vector: d.vector ?? 0, t: d.t ?? 0});
    out.deckY = y;
  };
  update();
  return {root, update, M, all, blades, ring, pinion, jacks, lift, drone, mountain, top, out, shell};
}
