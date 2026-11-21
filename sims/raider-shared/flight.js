// The two sequences the drone lives through, as functions of tau (seconds into the sequence). LAUNCH: on the deck
// with the wings stowed, the turbines spool, the nozzles point straight down and it lifts, the wings spread, the
// nozzles swing aft and it accelerates away. RECOVER: it comes back wings spread, nozzles swing down, it settles on
// the deck and the wings fold. Each gives the stroke (0 stowed, 1 spread), the height above the deck (scene units,
// 1:4), the ground speed (scene units/s), the thrust 0..1, the nozzle vector 0..1 (0 aft, 1 straight down) and the
// phase line the console shows.
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const ss = (a, b, t) => smoother((t - a) / (b - a));
export const H_MAX = 0.55;
export const V_MAX = 6;

export const SEQ = {
  takeoff: {
    dur: 6.5,
    from: 'ON DECK',
    to: 'WINGS SPREAD',
    stroke: (t) => ss(2.6, 4.6, t),
    height: (t) => H_MAX * ss(1.4, 3.6, t),
    speed: (t) => V_MAX * ss(4.6, 6.5, t),
    thrust: (t) => 0.55 * ss(0.2, 1.4, t) + 0.45 * ss(4.4, 5.6, t),
    vector: (t) => ss(0.0, 0.8, t) * (1 - ss(4.4, 5.6, t)),
    phases: [
      [0, 'ON DECK · WINGS STOWED'],
      [0.2, 'TURBINES SPOOL UP'],
      [0.8, 'NOZZLES DOWN · 80°'],
      [1.4, 'VERTICAL LIFT'],
      [2.6, 'ACTUATOR STROKES AFT'],
      [3.2, 'RACKS TURN THE SECTOR GEARS'],
      [4.6, 'WINGS SPREAD & LOCKED'],
      [5.0, 'NOZZLES AFT · FULL THRUST'],
    ],
  },
  landing: {
    dur: 7.5,
    from: 'WINGS SPREAD',
    to: 'ON DECK',
    stroke: (t) => 1 - ss(5.0, 7.0, t),
    height: (t) => H_MAX * (1 - ss(1.2, 4.6, t)),
    speed: (t) => V_MAX * (1 - ss(0, 2.4, t)),
    thrust: (t) => 1 - 0.45 * ss(0.2, 1.4, t) - 0.55 * ss(4.4, 5.4, t),
    vector: (t) => ss(0.2, 1.4, t) * (1 - ss(5.0, 5.8, t)),
    phases: [
      [0, 'RECOVERY SELECTED'],
      [0.2, 'NOZZLES SWING DOWN'],
      [1.2, 'HOVER DESCENT'],
      [4.6, 'SKIDS ON DECK'],
      [5.0, 'ACTUATOR STROKES FORWARD'],
      [5.6, 'WINGS FOLD ALONG THE HULL'],
      [7.0, 'STOWED & LOCKED'],
    ],
  },
};
export const phaseAt = (seq, t) => SEQ[seq].phases.filter(([a]) => a <= t).pop()[1];
/** the mechanism state chip: [title, sub, colour key] */
export const stateAt = (stroke, height) => {
  const where = height < 0.005 ? 'ON THE DECK' : `AIRBORNE · ${(height * 4).toFixed(1)} M`;
  if (stroke < 0.002) return ['Wings stowed & locked', where, 'ok'];
  if (stroke > 0.998) return ['Wings spread & locked', where, 'ok'];
  return ['Wings in transit', where, 'move'];
};
