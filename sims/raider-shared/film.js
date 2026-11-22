// VANTOR RX-9 KESTREL film: the drone (raider.js) over the flight deck (stage.js) under the console (console.js).
// The operator flies two launches and two recoveries (flight.js) and walks the views and display modes: the launch
// bay ghost, the wing root with the labels on, the engines as the nozzles swing, the x-ray hull from the front, the
// section from above as the wings fold, the exploded set on the plan, and an orbit for the last recovery.
import {runSim} from '../kit/runtime.js';
import {createConsole, DISPLAY} from './console.js';
import {phaseAt, SEQ, stateAt} from './flight.js';
import {G, PIVOT, rackOffset, wingAngle} from './raider.js';
import {createRaiderStage} from './stage.js';
import * as THREE from 'three';

export const SCRIPT = [
  {t: 0, seq: 'takeoff', view: 'hero'},
  {t: 0.9, display: 'fuselage'},
  {t: 2.1, view: 'gearbox'},
  {t: 2.6, display: 'xray'},
  {t: 3.0, display: 'fuselage'},
  {t: 3.3, display: 'labels'},
  {t: 6.8, seq: 'landing'},
  {t: 7.0, view: 'sidetube'},
  {t: 9.2, view: 'front'},
  {t: 10.9, display: 'labels'},
  {t: 11.4, view: 'top'},
  {t: 11.6, display: 'xray'},
  {t: 11.9, display: 'section'},
  {t: 14.6, seq: 'takeoff'},
  {t: 14.8, display: 'section'},
  {t: 15.0, view: 'plan'},
  {t: 17.4, display: 'exploded'},
  {t: 19.0, display: 'exploded'},
  {t: 19.5, view: 'hero'},
  {t: 19.9, display: 'orbit'},
  {t: 21.2, seq: 'landing'},
];
export const DURATION = 28.8;
export const DEFAULTS = {duration: DURATION, fps: 60, theme: 'light', hud: {enabled: false, title: 'raider', subtitle: ''}, director: {enabled: false}, watermark: ''};
const D2R = Math.PI / 180;
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const ss = (a, b, t) => smoother((t - a) / (b - a));

// ------------------------------------------------------------ the sequence, the display toggles at film time t
export const seqAt = (t) => {
  const e = SCRIPT.filter((x) => x.seq && x.t <= t).pop();
  return {seq: e.seq, tau: Math.min(SEQ[e.seq].dur, t - e.t)};
};
export const displayAt = (t) => {
  const out = Object.fromEntries(DISPLAY.map((k) => [k, 0]));
  for (const e of SCRIPT) if (e.display && e.t <= t) out[e.display] = out[e.display] ? 0 : 1;
  return out;
};
const lastFlip = (key, t) => SCRIPT.filter((e) => e.display === key && e.t <= t).pop()?.t ?? -9;
// an eased 0..1 for a display toggle
export const easedDisplay = (key, t, dur = 0.7) => {
  const on = displayAt(t)[key];
  const k = ss(lastFlip(key, t), lastFlip(key, t) + dur, t);
  return on ? k : 1 - k;
};
export const mechAt = (seq, tau) => {
  const S = SEQ[seq];
  return {stroke: S.stroke(tau), height: S.height(tau), speed: S.speed(tau), thrust: S.thrust(tau), vector: S.vector(tau)};
};
// the runway distance and the wheel spin, integrated over the film
const DT = 1 / 240;
const DIST = [0];
const ROLL = [0];
{
  let w = 0;
  for (let i = 1; i * DT <= DURATION + 1; i++) {
    const t = (i - 0.5) * DT;
    const {seq, tau} = seqAt(t);
    const m = mechAt(seq, tau);
    DIST.push(DIST[i - 1] + m.speed * DT);
    // the turbines spin with the thrust
    w = 6 + 60 * m.thrust;
    ROLL.push(ROLL[i - 1] + w * DT);
  }
}
const look = (A, t) => {
  const u = Math.max(0, Math.min(A.length - 2, t / DT));
  const i = Math.floor(u);
  return A[i] + (A[i + 1] - A[i]) * (u - i);
};
export const distAt = (t) => look(DIST, t);
export const rollAt = (t) => look(ROLL, t);

// ------------------------------------------------------------ views (target relative to the gear), u = seconds on
export const VIEW_FN = {
  hero: (u) => ({tx: 0, ty: 0.02, tz: -0.1, az: 38 + 2.5 * u, el: 20, d: 6.4, sx: 0, sy: -40}),
  front: (u) => ({tx: 0, ty: 0.02, tz: 0, az: 2 + 1.5 * u, el: 10, d: 5.6, sx: 0, sy: -40}),
  plan: (u) => ({tx: 0, ty: 0, tz: -0.15, az: 180 + 1.5 * u, el: 86, d: 7.0, sx: 0, sy: -30}),
  top: (u) => ({tx: 0, ty: 0, tz: -0.2, az: 152 + 2 * u, el: 52, d: 6.6, sx: 0, sy: -34}),
  gearbox: (u) => ({tx: 0.2, ty: -0.03, tz: -0.12, az: 58 + 3 * u, el: 40, d: 4.9, sx: 0, sy: -34}),
  sidetube: (u) => ({tx: 0.1, ty: 0.0, tz: -0.75, az: 140 + 3 * u, el: 14, d: 4.8, sx: 0, sy: -34}),
};
const VIEWS = SCRIPT.filter((e) => e.view).map((e) => [e.t, e.view]);
const blend = (a, b, k) => {
  const o = {};
  for (const key in b) o[key] = key === 'az' ? a.az + ((((b.az - a.az + 540) % 360) - 180) * k) : a[key] + (b[key] - a[key]) * k;
  const swing = Math.min(1, Math.abs(((b.az - a.az + 540) % 360) - 180) / 90);
  o.d += Math.max(0, Math.max(a.d, b.d) + 0.6 * swing - o.d) * Math.sin(Math.PI * k);
  return o;
};
export const camAt = (t, orbit = 0) => {
  let i = 0;
  while (i < VIEWS.length - 1 && VIEWS[i + 1][0] <= t) i++;
  const cur = VIEW_FN[VIEWS[i][1]](t - VIEWS[i][0]);
  let o = cur;
  if (i > 0) {
    const k = ss(VIEWS[i][0], VIEWS[i][0] + 1.6, t);
    if (k < 1) o = blend(VIEW_FN[VIEWS[i - 1][1]](t - VIEWS[i - 1][0]), cur, k);
  }
  // the orbit: a steady turn from when it came on
  if (orbit > 0) o = {...o, az: o.az + 14 * Math.max(0, t - lastFlip('orbit', t)) * orbit};
  return o;
};
export const viewAt = (t) => VIEWS.filter(([a]) => a <= t).pop();

// ------------------------------------------------------------ the operator's pointer
const REST = [[860, 470], [760, 420], [940, 520], [820, 380]];
export function makeCursor(ui) {
  const EV = SCRIPT.filter((e) => e.t > 0).flatMap((e) => {
    const out = [];
    if (e.seq) out.push({t: e.t, spot: ui.spots[e.seq]});
    if (e.view) out.push({t: e.t + (e.seq ? 0.35 : 0), spot: ui.spots[e.view]});
    if (e.display) out.push({t: e.t, spot: ui.spots[e.display]});
    return out;
  });
  const WP = [[0, 900, 600]];
  EV.forEach((e, i) => {
    WP.push([e.t - 0.16, ...e.spot], [e.t + 0.22, ...e.spot]);
    WP.push([e.t + 1.4, ...REST[i % REST.length]]);
  });
  WP.sort((a, b) => a[0] - b[0]);
  return (t) => {
    let i = 0;
    while (i < WP.length - 2 && t > WP[i + 1][0]) i++;
    const [t0, x0, y0] = WP[i];
    const [t1, x1, y1] = WP[i + 1];
    const k = ss(t0, t1, t);
    const len = Math.hypot(x1 - x0, y1 - y0);
    const bow = Math.sin(Math.PI * k) * Math.min(24, len * 0.07);
    let press = false;
    let ring = 0;
    let rx = 0;
    let ry = 0;
    for (const e of EV) {
      if (t >= e.t - 0.07 && t < e.t + 0.09) press = true;
      if (t >= e.t && t < e.t + 0.55) {
        ring = 1 - (t - e.t) / 0.55;
        [rx, ry] = e.spot;
      }
    }
    return {x: x0 + (x1 - x0) * k + (len ? (-(y1 - y0) / len) * bow : 0), y: y0 + (y1 - y0) * k + (len ? ((x1 - x0) / len) * bow : 0), press, ring, ringX: rx, ringY: ry};
  };
}

// ------------------------------------------------------------ the labels: parts of the right side, in the model's frame (metres)
const V3 = THREE.Vector3;
const RACK_X = G.pivotX - G.gearR;
const wingPt = (m, u, v) => new V3(u, 0.05, v).applyAxisAngle(new V3(0, 1, 0), wingAngle(m.stroke)).add(PIVOT).add(new V3(0.7 * (m.explode ?? 0), -0.35 * (m.explode ?? 0), 0));
const PARTS = [
  {name: 'SENSOR CLUSTER', sub: 'SEVEN OPTICS · NOSE TURRET', at: (m) => new V3(0, 0.36 + 0.9 * (m.explode ?? 0), 2.62)},
  {name: 'POWER CELL', sub: 'FEEDS BOTH TURBINES', at: () => new V3(0.12, 0.1, 0.9)},
  {name: 'HYDRAULIC ACTUATOR', sub: 'STROKES 358 MM', at: (m) => new V3(0, -0.12 - 0.35 * (m.explode ?? 0), -1.9)},
  {name: 'CROSSHEAD', sub: 'CARRIES BOTH RACKS', at: (m) => new V3(-0.25, -0.12 - 0.35 * (m.explode ?? 0), G.pivotZ - G.rackLen / 2 - 0.04 + rackOffset(m.stroke) - G.travel / 2)},
  {name: 'GEAR RACK', sub: '12 MM MODULE', at: (m) => new V3(RACK_X - 0.03, -0.12 - 0.35 * (m.explode ?? 0), G.pivotZ + rackOffset(m.stroke) - G.travel / 2 + 0.22)},
  {name: 'SECTOR GEAR', sub: '36 TEETH · 432 MM PCD', at: (m) => new V3(G.pivotX + 0.7 * (m.explode ?? 0), -0.12 - 0.35 * (m.explode ?? 0), G.pivotZ - G.gearR * 0.8)},
  {name: 'SWING WING', sub: '95° FROM STOWED TO SPREAD', at: (m) => wingPt(m, 2.2, 0.8)},
  {name: 'VECTORING NOZZLE', sub: 'SWINGS 0–80° DOWN', at: (m) => new V3(0.42 + 0.7 * (m.explode ?? 0), 0.06 - 0.35 * (m.explode ?? 0), -3.95 - 0.9 * (m.explode ?? 0))},
];
export function makeLabels(st) {
  return (m, o) => {
    if (o < 0.02) return [];
    const root = st.gear.root;
    const pts = PARTS.map((p) => {
      const q = root.localToWorld(p.at(m));
      return {p, at: st.project(q.x, q.y, q.z)};
    }).filter((x) => x.at && x.at[0] > 320 && x.at[0] < 1300 && x.at[1] > 130 && x.at[1] < 745);
    // two columns, stacked by height so no two labels touch
    const L = pts.filter((x) => x.at[0] < 800).sort((a, b) => a.at[1] - b.at[1]);
    const R = pts.filter((x) => x.at[0] >= 800).sort((a, b) => a.at[1] - b.at[1]);
    const out = [];
    const stack = (col, x, w) => {
      let y = 150;
      for (const c of col) {
        y = Math.max(y, Math.min(700, c.at[1] - 10));
        out.push({name: c.p.name, sub: c.p.sub, at: c.at, label: [x, y], w, o});
        y += 34;
      }
    };
    stack(L, 340, 170);
    stack(R, 1110, 170);
    return out;
  };
}

export function makeConsoleFrame(ui, st) {
  const labels = makeLabels(st);
  return (t, s) => {
    const S = SEQ[s.seq];
    const m = s.mech;
    const climb = (S.height(Math.min(S.dur, s.tau + 0.05)) - S.height(s.tau)) / 0.05;
    ui.update({
      state: stateAt(m.stroke, m.height),
      stroke: m.stroke,
      seq: s.seq,
      prog: s.tau / S.dur,
      height: m.height,
      climb,
      roll: s.roll,
      thrust: m.thrust,
      view: s.view,
      display: s.display,
      paused: s.paused ?? false,
      from: S.from,
      to: S.to,
      phase: phaseAt(s.seq, s.tau),
      tau: s.tau,
      dur: S.dur,
      speed: s.speed ?? 1,
      speedK: s.speedK ?? 0.5,
      callouts: labels({...m, explode: s.explode}, s.labels),
      cursor: s.cursor,
    });
  };
}

export function makeFilm() {
  return async ({canvas, capture}) => {
    const st = createRaiderStage({canvas});
    const resize = () => st.resize(1600, 900, capture ? devicePixelRatio || 1 : Math.min(devicePixelRatio || 1, 2));
    resize();
    const ui = createConsole(document.getElementById('app'));
    const cursorAt = makeCursor(ui);
    const frame = makeConsoleFrame(ui, st);
    window.CS = st;
    return {
      resize,
      render(t) {
        const {seq, tau} = seqAt(t);
        const m = mechAt(seq, tau);
        const disp = displayAt(t);
        const explode = easedDisplay('exploded', t, 0.8);
        const cam = camAt(t, disp.orbit);
        st.frame(
          {stroke: m.stroke, roll: rollAt(t), height: m.height, dist: distAt(t), thrust: m.thrust, vector: m.vector, t, fuselage: easedDisplay('fuselage', t) * 0.9, xray: easedDisplay('xray', t), explode, section: !!disp.section},
          {...cam, az: cam.az * D2R, el: cam.el * D2R},
        );
        const [vt0, view] = viewAt(t);
        frame(t, {seq, tau, mech: m, roll: rollAt(t), view, display: disp, explode, labels: easedDisplay('labels', t, 0.5) * ss(vt0 + 1.1, vt0 + 1.7, t), cursor: cursorAt(t)});
        return {};
      },
    };
  };
}

export const run = () => runSim(DEFAULTS, makeFilm());
