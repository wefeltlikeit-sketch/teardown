// The two sequences the lair runs, as functions of tau (seconds into the sequence).
// LAUNCH: the iris opens, the lift climbs 40 m to the crater, the Kestrel spools up, lifts off its deck, spreads its
// wings and climbs out. RECOVER: the Kestrel comes down onto the deck and folds its wings, the lift descends to the
// hangar and the iris seals. Each gives the lair stroke (0 sealed & down .. 1 open & up) and the drone's own state.
const smoother = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const ss = (a, b, t) => smoother((t - a) / (b - a));
export const H_MAX = 2.6; // drone climb above the deck, model units (52 m)

export const SEQ = {
  takeoff: {
    dur: 10,
    from: 'SEALED · HANGAR',
    to: 'DRONE AWAY',
    stroke: (t) => ss(0.4, 5.6, t),
    droneH: (t) => H_MAX * Math.pow(ss(6.6, 9.6, t), 1.4),
    droneStroke: (t) => ss(7.4, 8.8, t),
    thrust: (t) => 0.6 * ss(5.6, 6.5, t) + 0.4 * ss(8.4, 9.4, t),
    vector: (t) => ss(5.6, 6.2, t) * (1 - ss(8.6, 9.6, t)),
    phases: [
      [0, 'IRIS SEALED · LIFT DOWN'],
      [0.4, 'PINION TURNS THE RING'],
      [1.0, 'EIGHT BLADES SWING OPEN'],
      [2.4, 'SCREW JACKS SPIN'],
      [3.2, 'LIFT CLIMBS THE SHAFT'],
      [5.6, 'DECK AT THE CRATER · SPOOL UP'],
      [6.6, 'KESTREL LIFTS OFF'],
      [7.4, 'WINGS SPREAD'],
      [8.6, 'CLIMB OUT'],
    ],
  },
  landing: {
    dur: 10,
    from: 'DRONE INBOUND',
    to: 'SEALED · HANGAR',
    stroke: (t) => 1 - ss(4.4, 9.6, t),
    droneH: (t) => H_MAX * Math.pow(1 - ss(0, 2.8, t), 1.4),
    droneStroke: (t) => 1 - ss(2.9, 4.1, t),
    thrust: (t) => 1 - 0.4 * ss(0, 0.8, t) - 0.6 * ss(2.8, 3.6, t),
    vector: (t) => ss(0, 0.6, t) * (1 - ss(3.0, 3.6, t)),
    phases: [
      [0, 'KESTREL ON APPROACH'],
      [0.6, 'HOVER DESCENT'],
      [2.8, 'ON THE DECK'],
      [2.9, 'WINGS FOLD'],
      [4.4, 'LIFT DESCENDS'],
      [7.2, 'RING TURNS BACK'],
      [8.0, 'IRIS CLOSES'],
      [9.6, 'SEALED'],
    ],
  },
};
export const phaseAt = (seq, t) => SEQ[seq].phases.filter(([a]) => a <= t).pop()[1];
/** the state chip: [title, sub, colour key] */
export const stateAt = (iris, lift) => {
  const sub = lift < 0.002 ? 'LIFT IN THE HANGAR' : lift > 0.998 ? 'LIFT AT THE CRATER' : `LIFT ${(lift * 40).toFixed(1)} M UP`;
  if (iris < 0.002) return ['Iris sealed', sub, 'ok'];
  if (iris > 0.998 && (lift < 0.002 || lift > 0.998)) return ['Iris open', sub, 'ok'];
  return [iris > 0.998 ? 'Lift moving' : 'Iris moving', sub, 'move'];
};
