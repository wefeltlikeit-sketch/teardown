"""Score for the Emberfall Caldera film: an original, low-key bed (Dm9 / Bbmaj7 / Gm9 / A7sus, 84 bpm) the whole way,
a geared motor under each iris move, a deep rumble under each lift travel, rising air as the Kestrel lifts off,
a thud as it lands on the deck and a quiet click on every button the operator presses.

    python run_sfx.py sims/lair-shared/score.py

Times from lair-shared/film.js (SCRIPT) and flight.js (the sequences' own timings).
"""

import os

from sfx.score_kit import airy, bed, chords, hz, motor, rumble, thud
from sfx.synth import click

TIMELINE = "../lair-film/timeline.json"
OUT = os.path.join(os.environ.get("TEARDOWN_OUT", "teardown-out"), "lair-score.wav")
TARGET_LUFS = -14.0
SEED = 23

CHORDS = chords("Dm9:D2 A2 C3 E3 F3/D1", "Bbmaj7:Bb1 F2 A2 D3/Bb0", "Gm9:G2 D3 F3 A3 Bb3/G1", "A7sus:A2 D3 E3 G3/A1")
MOTIF = [(0.5, hz("A4")), (1.5, hz("F4")), (2.5, hz("D5"))]
CLICKS = (0.3, 3.0, 3.2, 5.6, 6.0, 6.3, 10.4, 10.6, 13.4, 14.6, 17.4, 17.8, 19.4, 20.6, 20.8, 21.0, 21.4, 23.4, 24.0)
LAUNCHES = (0.0, 20.6)
LANDINGS = (10.4,)


def score(mix, tl):
    dur = tl["duration"]
    left, right, low, drums = bed(dur, 84, CHORDS, MOTIF, motif_voice="epiano", kicks=(0, 2.5), snares=(), hats=8, swing=0.0, keys_vel=0.65, keys_lp=3200)
    mix.put_stereo(0, left, right, 0.12)
    mix.put(0, low, 0.13)
    mix.put(0, drums, 0.04)
    for t0 in LAUNCHES:
        # iris opens (0.4 .. 2.6), lift climbs (2.6 .. 5.6), drone spools and lifts (5.6 .. 9.6)
        mix.put(t0 + 0.4, motor(2.3, 150, 1100, 11), 0.022)
        mix.put(t0 + 2.6, rumble(3.1, lambda t: 48 + 10 * min(1.0, t / 1.5)), 0.05)
        if t0 + 6.0 < dur - 0.5:
            mix.put(t0 + 5.6, airy(min(3.6, dur - t0 - 5.8), 400, 2200, 0.7), 0.035)
    for t0 in LANDINGS:
        mix.put(t0 + 0.0, airy(2.8, 2000, 500, 0.6), 0.03)
        mix.put(t0 + 2.8, thud(70, 0.08, 0.5), 0.09)
        mix.put(t0 + 4.4, rumble(3.0, lambda t: 58 - 10 * min(1.0, t / 2.0)), 0.05)
        mix.put(t0 + 7.4, motor(2.2, 140, 1000, 11), 0.022)
    for t in CLICKS:
        mix.put(t, click(2400, 0.025), 0.05)
