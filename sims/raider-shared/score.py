"""Score for the Vantor RX-9 Kestrel film: a light bed (Dmaj9 chords, 96 bpm) the whole way, a hydraulic whine under
every wing transit, rising air at each launch, a thud as the skids touch the deck on recovery and a quiet click on
every button the operator presses.

    python run_sfx.py sims/raider-shared/score.py

Times from raider-shared/film.js (SCRIPT) and flight.js (the sequences' own timings).
"""

import os

from sfx.score_kit import airy, bed, chords, hz, motor, thud
from sfx.synth import click

TIMELINE = "../raider-film/timeline.json"
OUT = os.path.join(os.environ.get("TEARDOWN_OUT", "teardown-out"), "raider-score.wav")
TARGET_LUFS = -14.0
SEED = 17

CHORDS = chords("Dmaj9:D2 A2 C#3 E3 F#3/D1", "Bm9:B1 F#2 A2 C#3 D3/B0", "Gmaj7:G2 D3 F#3 B3/G1", "A6sus:A2 D3 E3 F#3 B3/A1")
MOTIF = [(0.5, hz("F#5")), (1.5, hz("A5")), (2.5, hz("E5"))]
CLICKS = (0.9, 2.1, 2.6, 3.0, 3.3, 6.8, 7.0, 9.2, 10.9, 11.4, 11.6, 11.9, 14.6, 14.8, 15.0, 17.4, 19.0, 19.5, 19.9, 21.2)
TAKEOFFS = (0.0, 14.6)
LANDINGS = (6.8, 21.2)


def score(mix, tl):
    dur = tl["duration"]
    left, right, low, drums = bed(dur, 96, CHORDS, MOTIF, motif_voice="epiano", kicks=(0, 2.5), snares=(), hats=8, swing=0.0, keys_vel=0.7, keys_lp=3600)
    mix.put_stereo(0, left, right, 0.12)
    mix.put(0, low, 0.12)
    mix.put(0, drums, 0.045)
    for t0 in TAKEOFFS:
        # spool and lift (0.2 .. 3.6), wings spread (2.6 .. 4.6)
        mix.put(t0 + 0.2, airy(3.4, 400, 1800, 0.6), 0.03)
        mix.put(t0 + 2.6, motor(2.0, 190, 1300, 14), 0.02)
    for t0 in LANDINGS:
        # hover descent, skids touch at 4.6, wings fold (5.0 .. 7.0)
        if t0 + 4.6 < dur - 0.3:
            mix.put(t0 + 4.6, thud(80, 0.05, 0.4), 0.09)
        if t0 + 5.0 < dur - 0.5:
            mix.put(t0 + 5.0, motor(min(2.0, dur - t0 - 5.2), 175, 1200, 14), 0.02)
    for t in CLICKS:
        mix.put(t, click(2400, 0.025), 0.055)
