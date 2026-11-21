// EMBERFALL CALDERA film: the lair (lair.js) on its ash plain (stage.js) under the console (console.js). The operator
// runs two launches and two recoveries (flight.js) and walks the views and display modes: the ghost cavern, the iris
// close up with the labels on, the shaft in section as the lift climbs, x-ray rock, the exploded set, and an orbit.
import {runSim} from '../kit/runtime.js';
import {createConsole, DISPLAY} from './console.js';
import {phaseAt, SEQ, stateAt} from './flight.js';
import {bladeAngle, deckY, irisAt, L, liftAt, pinionTurns, screwTurns} from './lair.js';
import {createLairStage} from './stage.js';
import * as THREE from 'three';

export const SCRIPT = [
  {t: 0, seq: 'takeoff', view: 'gearbox'},
  {t: 0.3, display: 'labels'},
  {t: 3.0, view: 'sidetube'},
  {t: 3.2, display: 'section'},
  {t: 5.6, display: 'labels'},
  {t: 6.0, view: 'hero'},
  {t: 6.3, display: 'section'},
  {t: 10.4, seq: 'landing'},
  {t: 10.6, view: 'top'},
  {t: 13.4, display: 'xray'},
  {t: 14.6, view: 'front'},
  {t: 17.4, display: 'xray'},
  {t: 17.8, view: 'plan'},
  {t: 19.4, display: 'fuselage'},
  {t: 20.6, seq: 'takeoff'},
  {t: 20.8, display: 'fuselage'},
  {t: 21.0, view: 'hero'},
  {t: 21.4, display: 'exploded'},
  {t: 23.4, display: 'exploded'},
  {t: 24.0, display: 'orbit'},
];
export const DURATION = 31.0;
export const DEFAULTS = {duration: DURATION, fps: 60, theme: 'light', hud: {enabled: false, title: 'lair', subtitle: ''}, director: {enabled: false}, watermark: ''};
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
  return {stroke: S.stroke(tau), height: 0, speed: 0, droneH: S.droneH(tau), droneStroke: S.droneStroke(tau), thrust: S.thrust(tau), vector: S.vector(tau)};
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
  hero: (u) => ({tx: 0, ty: -0.7, tz: 0, az: 32 + 2.5 * u, el: 24, d: 14.5, sx: 0, sy: -40}),
  front: (u) => ({tx: 0, ty: -0.9, tz: 0, az: 4 + 1.5 * u, el: 6, d: 13.5, sx: 0, sy: -40}),
  plan: (u) => ({tx: 0, ty: -0.5, tz: 0, az: 180 + 1.5 * u, el: 86, d: 12.5, sx: 0, sy: -30}),
  top: (u) => ({tx: 0, ty: -0.3, tz: 0, az: 150 + 2 * u, el: 48, d: 10.5, sx: 0, sy: -34}),
  gearbox: (u) => ({tx: 0.15, ty: 0.05, tz: 0, az: 64 + 3 * u, el: 44, d: 7.6, sx: 0, sy: -34}),
  sidetube: (u) => ({tx: 0, ty: -1.0, tz: 0, az: 88 + 2 * u, el: 9, d: 9.5, sx: 0, sy: -36}),
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

// ------------------------------------------------------------ the labels, in world units
const V3 = THREE.Vector3;
const ex = (m) => m.explode ?? 0;
const bladePt = (m) => {
  // a point two thirds of the way from blade 1's pivot towards where the centre of its wedge has swung
  const a0 = (2 * Math.PI) / L.blades;
  const P0 = new V3(L.pivotR * Math.cos(a0), 0, -L.pivotR * Math.sin(a0));
  const q = new V3(-P0.x, 0, -P0.z).multiplyScalar(0.55).applyAxisAngle(new V3(0, 1, 0), bladeAngle(m.stroke));
  return P0.add(q).add(new V3(0, L.collarY + 0.08 + 0.9 * ex(m), 0));
};
const PARTS = [
  {name: 'IRIS BLADE ×8', sub: 'ASH-DRESSED · SWINGS 70°', at: bladePt},
  {name: 'ACTUATION RING', sub: '240 TEETH · TURNS 30°', at: (m) => new V3(-1.3, L.collarY + 0.03 + 0.9 * ex(m), 0.0)},
  {name: 'DRIVE PINION', sub: '16 TEETH · 1.25 TURNS', at: (m) => new V3(1.45, L.collarY + 0.06 + 0.9 * ex(m), 0)},
  {name: 'SCREW JACK ×4', sub: '500 MM LEAD · 80 TURNS', at: () => new V3(L.jackR * Math.cos(Math.PI / 4), -1.3, L.jackR * Math.sin(Math.PI / 4))},
  {name: 'LAUNCH LIFT', sub: '40 M OF TRAVEL', at: (m) => new V3(0.5, deckY(m.stroke) - 0.03, 0.5)},
  {name: 'HANGAR CAVERN', sub: '98 M ACROSS', at: () => new V3(-1.9, L.floorY + 0.5, 1.2)},
  {name: 'KESTREL RX-9', sub: 'THE PAYLOAD', at: (m) => new V3(0, deckY(m.stroke) + m.droneH + 0.06, 0)},
];
export function makeLabels(st) {
  return (m, o) => {
    if (o < 0.02) return [];
    const pts = PARTS.map((p) => {
      const q = p.at(m);
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
    const curve = (u) => S.stroke(u * S.dur);
    ui.update({
      state: stateAt(irisAt(m.stroke), liftAt(m.stroke)),
      stroke: m.stroke,
      iris: irisAt(m.stroke),
      blade: bladeAngle(m.stroke),
      lift: liftAt(m.stroke),
      screw: screwTurns(m.stroke),
      pinion: pinionTurns(m.stroke),
      droneH: m.droneH,
      thrust: m.thrust,
      curve,
      seq: s.seq,
      prog: s.tau / S.dur,
      height: m.height,
      climb: 0,
      roll: s.roll,
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
    const st = createLairStage({canvas});
    // a software renderer cannot afford AO, 8x MSAA and a 4K shadow map per frame: ?fast trades them for time
    if (new URLSearchParams(location.search).has('fast') || window.TEARDOWN_FAST) st.setQuality({samples: 2, ao: false, shadow: 1024});
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
          {stroke: m.stroke, drone: {height: m.droneH, stroke: m.droneStroke, thrust: m.thrust, vector: m.vector, roll: rollAt(t), t}, fuselage: easedDisplay('fuselage', t) * 0.9, xray: easedDisplay('xray', t), explode, section: !!disp.section},
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
