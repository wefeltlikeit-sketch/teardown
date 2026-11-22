// The Emberfall Caldera console, laid out at 1600 x 900: the orange 337 badge and the title,
// the mechanism state with its live schematic, the flight panel, the system overview, the sequence switch, the views,
// the display toggles, the gear operation timeline, floor notes and the labels with leaders into the mechanism.
// update(s) redraws every live part from the frame's state.
export const C = {ink: '#1f2a29', mute: '#7f908d', faint: '#c6d2d0', line: '#d9e3e1', panel: 'rgba(248,251,251,.95)', or: '#0f9a8a', green: '#2f8f4e', blue: '#3c6fa8'};
export const VIEWS = ['hero', 'front', 'plan', 'top', 'gearbox', 'sidetube'];
export const VIEW_LABEL = {hero: 'HERO', front: 'FRONT', plan: 'PLAN', top: 'TOP ¾', gearbox: 'IRIS', sidetube: 'SHAFT'};
export const DISPLAY = ['labels', 'section', 'xray', 'exploded', 'fuselage', 'orbit'];
export const DISPLAY_LABEL = {labels: 'LABELS', section: 'SECTION', xray: 'X-RAY ROCK', exploded: 'EXPLODED', fuselage: 'GHOST CAVERN', orbit: 'ORBIT'};
const CSS = `
#app{font-family:Inter,system-ui,sans-serif;color:${C.ink};-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
.ui{position:absolute;inset:0;pointer-events:none}
.mo{font-family:'JetBrains Mono',ui-monospace,monospace}
.cp{position:absolute;background:${C.panel};border:1px solid ${C.line};border-radius:6px;box-shadow:0 2px 10px rgba(40,70,66,.08)}
.ph{position:absolute;display:flex;align-items:center;gap:9px;font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:1.8px}
.ph i{display:block;width:3px;height:13px;background:${C.or}}
.pn{position:absolute;font:500 9.5px 'JetBrains Mono',monospace;color:${C.mute};letter-spacing:1px}
.sm{font:500 9px 'JetBrains Mono',monospace;letter-spacing:1.6px;color:${C.mute};text-transform:uppercase;white-space:nowrap}
.bt{position:absolute;height:21px;padding:0 10px;display:flex;align-items:center;justify-content:center;border:1px solid ${C.faint};border-radius:4px;background:#fbfdfd;font:700 9.4px 'JetBrains Mono',monospace;letter-spacing:1.3px;color:${C.ink};white-space:nowrap}
.call{position:absolute;white-space:nowrap}
.call b{display:flex;align-items:center;gap:6px;font:700 9.4px 'JetBrains Mono',monospace;letter-spacing:1.3px;color:${C.ink}}
.call b i{display:block;width:6px;height:6px;background:${C.or}}
.call span{display:block;font:500 7.8px 'JetBrains Mono',monospace;letter-spacing:1.2px;color:${C.mute};margin-top:2px}
.cur{position:absolute;left:0;top:0;z-index:50;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}
.ring{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1.5px solid ${C.or};opacity:0;z-index:49}
`;
const el = (h) => {
  const d = document.createElement('div');
  d.innerHTML = h.trim();
  return d.firstElementChild;
};

export function createConsole(app) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  const ui = el(`<div class="ui"></div>`);
  app.appendChild(ui);
  const add = (h) => {
    const n = el(h);
    ui.appendChild(n);
    return n;
  };
  const panel = (x, y, w, h, title, n) => {
    add(`<div class="cp" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`);
    add(`<div class="ph" style="left:${x + 14}px;top:${y + 13}px"><i></i>${title}</div>`);
    add(`<div class="pn" style="right:${1600 - x - w + 14}px;top:${y + 15}px">${n}</div>`);
  };

  // ------------------------------------------------------------ header
  add(`<div style="position:absolute;left:0;top:0;width:160px;height:89px;background:${C.or}"></div>`);
  add(`<svg style="position:absolute;left:22px;top:28px" width="52" height="32"><path d="M0 32L18 6H34L52 32Z" fill="#fff"/><path d="M20 6Q26 0 32 6" fill="none" stroke="#fff" stroke-width="2.5"/></svg>`);
  add(`<div class="mo" style="position:absolute;left:85px;top:35px;color:#fff;font-size:16px;font-weight:600;letter-spacing:4px">EF1</div>`);
  add(`<div class="sm" style="position:absolute;left:182px;top:22px;letter-spacing:2.4px">FICTIONAL SPY-THRILLER LAIR · ORIGINAL DESIGN</div>`);
  add(`<div style="position:absolute;left:181px;top:37px;font-size:33px;font-weight:700;letter-spacing:-.6px;line-height:1">Emberfall Caldera <span style="color:${C.or};font-weight:400">/</span></div>`);
  add(`<div class="mo" style="position:absolute;left:182px;top:77px;font-size:11.2px;letter-spacing:2.2px;color:#6d6357">IRIS ROOF / SCREW-JACK LAUNCH LIFT</div>`);
  add(`<div class="sm" style="position:absolute;left:1087px;top:49px;letter-spacing:2.6px;font-size:9.6px">HOLLOW PEAK · 40 M APERTURE</div>`);
  add(`<div class="mo" style="position:absolute;left:1352px;top:47px;color:${C.or};font-size:12px;letter-spacing:-1px">//////</div>`);
  add(`<div style="position:absolute;left:1418px;top:34px;color:${C.or};font-size:39px;font-weight:700;letter-spacing:-.8px;line-height:1">EF1</div>`);
  add(`<div style="position:absolute;left:1500px;top:33px;width:1px;height:44px;background:${C.faint}"></div>`);
  add(`<div class="sm" style="position:absolute;left:1516px;top:34px;line-height:14px;letter-spacing:2.2px">OPEN<br>RAISE<br>LAUNCH</div>`);
  {
    let h = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) h += `<path d="M${c * 25.5 + 4} ${r * 25.5}v8M${c * 25.5} ${r * 25.5 + 4}h8" stroke="${C.or}" stroke-width="1.1" opacity=".75"/>`;
    add(`<svg style="position:absolute;left:808px;top:80px" width="300" height="64">${h}</svg>`);
  }

  // ------------------------------------------------------------ 01 mechanism state
  panel(28, 126, 282, 254, 'MECHANISM STATE', '01');
  const chip = add(`<div style="position:absolute;left:42px;top:166px;width:13px;height:24px;border-radius:2px"></div>`);
  const stTitle = add(`<div style="position:absolute;left:66px;top:164px;font-size:15px;font-weight:600"></div>`);
  const stSub = add(`<div class="sm" style="position:absolute;left:67px;top:183px"></div>`);
  add(`<div style="position:absolute;left:42px;top:202px;width:254px;height:1px;background:${C.line}"></div>`);
  const sch = add(`<svg style="position:absolute;left:42px;top:214px" width="254" height="156"></svg>`);

  // ------------------------------------------------------------ 02 flight
  panel(28, 394, 282, 232, 'LAUNCH', '02');
  const fl = add(`<svg style="position:absolute;left:42px;top:430px" width="254" height="70"></svg>`);
  const bars = ['IRIS', 'LIFT', 'DRONE'].map((n, i) => {
    const y = 508 + i * 23;
    add(`<div class="sm" style="position:absolute;left:42px;top:${y}px">${n}</div>`);
    add(`<div style="position:absolute;left:97px;top:${y + 4}px;width:134px;height:4px;background:#e3ebea;border-radius:2px"></div>`);
    const f = add(`<div style="position:absolute;left:97px;top:${y + 4}px;height:4px;background:${C.or};border-radius:2px"></div>`);
    const v = add(`<div class="mo" style="position:absolute;right:${1600 - 296}px;top:${y - 2}px;font-size:11px;font-weight:600"></div>`);
    return {f, v};
  });
  add(`<div style="position:absolute;left:42px;top:578px;width:254px;height:1px;background:${C.line}"></div>`);
  add(`<div class="sm" style="position:absolute;left:42px;top:596px">PINION</div>`);
  const wheelIcon = add(`<svg style="position:absolute;left:274px;top:590px" width="22" height="22"><g data-r><circle cx="11" cy="11" r="9" fill="none" stroke="${C.blue}" stroke-width="1.5"/><path d="M11 11V2M11 11l7.8 4.5M11 11l-7.8 4.5" stroke="${C.blue}" stroke-width="1.4"/><circle cx="11" cy="11" r="2.4" fill="${C.blue}"/></g></svg>`);

  // ------------------------------------------------------------ 03 system overview
  panel(1313, 126, 258, 210, 'SYSTEM OVERVIEW', '03');
  add(`<div class="mo" style="position:absolute;left:1327px;top:163px;font-size:10.5px;font-weight:700;letter-spacing:1.6px">IRIS ROOF & LIFT</div>`);
  add(`<div class="mo" style="position:absolute;left:1327px;top:183px;width:232px;font-size:9.4px;line-height:1.75;color:#5f564b">A 16-tooth pinion turns a 240-tooth ring 30°; its pins swing eight blades 70° each. Then four screw jacks lift the deck 40 m.</div>`);
  add(`<div style="position:absolute;left:1327px;top:276px;width:232px;height:1px;background:${C.line}"></div>`);
  [['8', 'BLADES'], ['4', 'JACKS'], ['40 M', 'LIFT']].forEach(([v, n], i) => {
    const x = 1327 + i * 85;
    if (i) add(`<div style="position:absolute;left:${x - 8}px;top:286px;width:1px;height:38px;background:${C.line}"></div>`);
    add(`<div style="position:absolute;left:${x}px;top:288px;font-size:20px;font-weight:700">${v}</div>`);
    add(`<div class="sm" style="position:absolute;left:${x}px;top:313px">${n}</div>`);
  });

  // ------------------------------------------------------------ 04 sequence, 05 views, 06 display
  const btn = {};
  panel(1313, 353, 258, 82, 'SEQUENCE', '04');
  add(`<div style="position:absolute;left:1327px;top:390px;width:230px;height:30px;border-radius:5px;background:#e3ebea"></div>`);
  btn.takeoff = add(`<div class="bt" style="left:1330px;top:393px;width:112px;height:24px;border:none;background:transparent">LAUNCH</div>`);
  btn.landing = add(`<div class="bt" style="left:1442px;top:393px;width:112px;height:24px;border:none;background:transparent">RECOVER</div>`);
  const btnRow = (keys, labels, x0, y, wmax = 230) => {
    let x = x0;
    let yy = y;
    for (const k of keys) {
      const w = Math.round(labels[k].length * 7.1 + 22);
      if (x + w > x0 + wmax) {
        x = x0;
        yy += 31;
      }
      btn[k] = add(`<div class="bt" style="left:${x}px;top:${yy}px;width:${w}px;height:23px">${labels[k]}</div>`);
      x += w + 6;
    }
  };
  panel(1313, 450, 258, 107, 'VIEWS', '05');
  btnRow(VIEWS, VIEW_LABEL, 1327, 487);
  panel(1313, 572, 258, 138, 'DISPLAY', '06');
  btnRow(DISPLAY, DISPLAY_LABEL, 1327, 609);

  // ------------------------------------------------------------ 07 gear operation
  panel(430, 752, 740, 108, 'LAUNCH SEQUENCE', '07');
  btn.play = add(`<div class="bt" style="left:445px;top:795px;width:44px;height:44px;border-radius:50%;border:none;background:${C.or};color:#fff;font-size:15px"></div>`);
  const opFrom = add(`<div class="sm" style="position:absolute;left:506px;top:791px"></div>`);
  const opPhase = add(`<div class="mo" style="position:absolute;left:506px;width:500px;top:790px;text-align:center;font-size:9.6px;font-weight:700;letter-spacing:1.6px;color:${C.or}"></div>`);
  const opTo = add(`<div class="sm" style="position:absolute;right:${1600 - 1010}px;top:791px"></div>`);
  const TL = {x: 508, w: 504};
  add(`<div style="position:absolute;left:${TL.x}px;top:820px;width:${TL.w}px;height:3px;background:#e3ebea;border-radius:2px"></div>`);
  const tlFill = add(`<div style="position:absolute;left:${TL.x}px;top:820px;height:3px;background:${C.or};border-radius:2px"></div>`);
  const tlKnob = add(`<div style="position:absolute;top:814px;width:15px;height:15px;margin-left:-7.5px;border-radius:50%;background:#fff;border:2px solid ${C.or};box-sizing:border-box"></div>`);
  const tlTime = add(`<div class="mo" style="position:absolute;left:506px;top:834px;font-size:9.6px;color:${C.mute};letter-spacing:1px"></div>`);
  add(`<div class="sm" style="position:absolute;left:1029px;top:805px">SPEED</div>`);
  const SP = {x: 1031, w: 92};
  add(`<div style="position:absolute;left:${SP.x}px;top:823px;width:${SP.w}px;height:3px;background:#e3ebea;border-radius:2px"></div>`);
  const spFill = add(`<div style="position:absolute;left:${SP.x}px;top:823px;height:3px;background:${C.or};border-radius:2px"></div>`);
  const spKnob = add(`<div style="position:absolute;top:817px;width:15px;height:15px;margin-left:-7.5px;border-radius:50%;background:#fff;border:2px solid ${C.or};box-sizing:border-box"></div>`);
  const spVal = add(`<div class="mo" style="position:absolute;left:1128px;top:818px;font-size:10px;font-weight:700"></div>`);

  // ------------------------------------------------------------ footer and floor notes
  add(`<div class="sm" style="position:absolute;left:27px;top:882px;letter-spacing:2.2px">FICTIONAL LAIR &nbsp;·&nbsp; PROCEDURAL MODEL &nbsp;·&nbsp; SINGLE DEGREE OF FREEDOM</div>`);
  add(`<div class="sm" style="position:absolute;right:28px;top:882px;letter-spacing:2.2px">ONE UNIT = 20 M · NUMBERS ARE INVENTED <span style="color:${C.or}">//////</span></div>`);
  const notes = add(`<div style="position:absolute;inset:0"></div>`);
  notes.innerHTML = `<div class="sm" style="position:absolute;left:367px;top:658px;line-height:16px;letter-spacing:2px">CRATER SEEN FROM<br>THE SOUTH-EAST</div>
    <svg style="position:absolute;left:752px;top:658px" width="48" height="10"><path d="M0 5h40" stroke="${C.mute}" stroke-width="1.2"/><path d="M40 1l7 4-7 4z" fill="${C.mute}"/></svg>
    <div class="sm" style="position:absolute;left:768px;top:677px">FWD</div>
    <div class="sm" style="position:absolute;left:912px;top:682px;line-height:16px;letter-spacing:2px"><span style="color:${C.mute}">//////</span><br>EMBERFALL CALDERA<br>LEVEL -40</div>
    <div style="position:absolute;left:1046px;top:690px;font-size:28px;font-weight:700;color:rgba(127,144,141,.25)">EF1</div>
    <svg style="position:absolute;left:398px;top:162px" width="90" height="80"><path d="M0 80V0h80" fill="none" stroke="${C.or}" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/></svg>
    <svg style="position:absolute;left:1088px;top:606px" width="80" height="80"><path d="M80 0v76H0" fill="none" stroke="${C.or}" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/></svg>`;

  // ------------------------------------------------------------ labels, the pointer
  const callSvg = add(`<svg data-callouts style="position:absolute;inset:0;overflow:visible" width="1600" height="900"></svg>`);
  const callG = add(`<div data-callouts style="position:absolute;inset:0"></div>`);
  const ring = add(`<div class="ring"></div>`);
  const cur = add(`<div class="cur"><svg width="22" height="22" viewBox="0 0 34 34"><path d="M4 3 L30 13.5 L17.5 17.5 L13.5 30 Z" fill="#111" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/></svg></div>`);
  const centre = (n) => {
    const r = n.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };
  const spots = Object.fromEntries(Object.entries(btn).map(([k, n]) => [k, centre(n)]));
  const pointer = (c) => {
    cur.style.display = c.x < 0 ? 'none' : 'block';
    cur.style.transform = `translate(${(c.x - 3).toFixed(2)}px, ${(c.y - 2).toFixed(2)}px) scale(${c.press ? 0.88 : 1})`;
    ring.style.left = `${c.ringX}px`;
    ring.style.top = `${c.ringY}px`;
    ring.style.opacity = String(c.ring * 0.85);
    ring.style.transform = `scale(${(0.35 + 0.9 * (1 - c.ring)).toFixed(3)})`;
  };
  const fmt = (s) => `00:${String(Math.floor(s)).padStart(2, '0')}`;

  return {
    spots,
    btn,
    root: ui,
    timeline: (k) => [TL.x + k * TL.w, 821],
    speedKnob: (k) => [SP.x + k * SP.w, 824],
    TL,
    SP,
    update(s) {
      // state chip and the schematic: actuator, rack, pinion, shaft, the two legs from the front
      const [title, sub, kind] = s.state;
      chip.style.background = kind === 'ok' ? C.green : C.or;
      stTitle.textContent = title;
      stSub.textContent = sub;
      {
        // left: the iris from above, its eight blades; right: the shaft in section with the lift deck
        const t = (txt, x, y, anchor = 'start') => `<text x="${x}" y="${y}" font-size="7.4" letter-spacing="1" fill="${C.mute}" font-family="JetBrains Mono" text-anchor="${anchor}">${txt}</text>`;
        const cx = 66;
        const cy = 74;
        const R = 46;
        const Rp = R * 1.15;
        let h = `<circle cx="${cx}" cy="${cy}" r="${R * 1.42}" fill="#f6faf9" stroke="${C.ink}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${R}" fill="#e3ebea" stroke="${C.ink}" stroke-width="1"/>`;
        const ba = s.blade;
        for (let i = 0; i < 8; i++) {
          const a0 = (i / 8) * Math.PI * 2;
          const P0 = [Rp * Math.cos(a0), Rp * Math.sin(a0)];
          const P1 = [Rp * Math.cos(a0 + (Math.PI * 2 * 1.25) / 8), Rp * Math.sin(a0 + (Math.PI * 2 * 1.25) / 8)];
          // rotate the wedge (P0, centre, P1) about P0 by -ba in plan (x, z) as the 3D blade turns
          const rot = ([x, y]) => {
            const dx = x - P0[0];
            const dy = y - P0[1];
            const c = Math.cos(-ba);
            const sn = Math.sin(-ba);
            return [P0[0] + dx * c - dy * sn, P0[1] + dx * sn + dy * c];
          };
          const pts = [P0, rot([0, 0]), rot(P1)].map(([x, y]) => `${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`).join(' ');
          h += `<polygon points="${pts}" fill="${C.or}" fill-opacity=".16" stroke="${C.or}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${(cx + P0[0]).toFixed(1)}" cy="${(cy + P0[1]).toFixed(1)}" r="1.8" fill="${C.ink}"/>`;
        }
        // the shaft section
        const sx0 = 176;
        const sTop = 14;
        const sBot = 140;
        const dy = sBot - (sBot - sTop - 8) * s.lift;
        h += `<path d="M${sx0} ${sTop}V${sBot}M${sx0 + 60} ${sTop}V${sBot}" stroke="${C.ink}" stroke-width="1.1"/><line x1="${sx0 - 6}" x2="${sx0 + 66}" y1="${sBot + 1}" y2="${sBot + 1}" stroke="${C.ink}" stroke-width="1.4"/>`;
        for (const x of [sx0 + 6, sx0 + 54]) {
          h += `<line x1="${x}" x2="${x}" y1="${sTop}" y2="${sBot}" stroke="${C.mute}" stroke-width="2"/>`;
          for (let k = 0; k < 14; k++) {
            const yy = sTop + ((k * 9 + s.screw * 4.5) % 126);
            h += `<line x1="${x - 2.5}" x2="${x + 2.5}" y1="${yy.toFixed(1)}" y2="${(yy + 3).toFixed(1)}" stroke="${C.ink}" stroke-width=".8"/>`;
          }
        }
        const lid = (1 - s.iris) * 26;
        h += `<rect x="${sx0}" y="${sTop - 5}" width="${lid.toFixed(1)}" height="4" fill="${C.or}"/><rect x="${(sx0 + 60 - lid).toFixed(1)}" y="${sTop - 5}" width="${lid.toFixed(1)}" height="4" fill="${C.or}"/>`;
        h += `<rect x="${sx0 + 2}" y="${(dy - 5).toFixed(1)}" width="56" height="5" fill="${C.ink}"/><path d="M${sx0 + 22} ${(dy - 5).toFixed(1)}l8 -5l8 5z" fill="${C.or}"/>`;
        h += t('IRIS', 4, 150) + t('SHAFT', 250, 150, 'end');
        sch.innerHTML = h;
      }
      // flight: the climb or the descent, the marker where the aircraft is
      {
        const W = 254;
        const X = (u) => 20 + u * (W - 30);
        const Y = (h) => 58 - h * 46;
        let p = '';
        for (let i = 0; i <= 40; i++) {
          const u = i / 40;
          const h = s.curve(u);
          p += `${i ? 'L' : 'M'}${X(u).toFixed(1)} ${Y(h).toFixed(1)}`;
        }
        const u = s.prog;
        const mh = s.curve(s.prog);
        const dir = s.seq === 'takeoff' ? 1 : -1;
        const ang = 0;
        fl.innerHTML = `<line x1="0" x2="${W}" y1="58" y2="58" stroke="${C.ink}" stroke-width="1"/><path d="${p}" fill="none" stroke="${C.or}" stroke-width="1.1" stroke-dasharray="3 3"/><g transform="translate(${X(u).toFixed(1)} ${Y(mh).toFixed(1)}) scale(${dir} 1) rotate(${ang.toFixed(1)})"><path d="M-10 -6L8 0L-10 6L-6 0z" fill="${C.or}"/></g>`;
        const vals = [[s.iris, `${Math.round((s.blade * 180) / Math.PI)}° OPEN`], [s.lift, `${(s.lift * 40).toFixed(1)} m`], [s.thrust ?? 0, `${(s.droneH * 20).toFixed(0)} m · ${Math.round((s.thrust ?? 0) * 100)}%`]];
        bars.forEach((b, i) => {
          b.f.style.width = `${(Math.min(1, vals[i][0]) * 134).toFixed(1)}px`;
          b.v.textContent = vals[i][1];
        });
        wheelIcon.querySelector('[data-r]').setAttribute('transform', `rotate(${(s.pinion * 360) % 360} 11 11)`);
      }
      // sequence, views, display
      const onBtn = (k, on) => {
        btn[k].style.background = on ? C.or : '#fffdf9';
        btn[k].style.color = on ? '#fff' : C.ink;
        btn[k].style.borderColor = on ? C.or : C.faint;
      };
      for (const k of ['takeoff', 'landing']) {
        const on = s.seq === k;
        btn[k].style.background = on ? C.or : 'transparent';
        btn[k].style.color = on ? '#fff' : '#8d8274';
        btn[k].style.borderRadius = '4px';
      }
      for (const k of VIEWS) onBtn(k, s.view === k);
      for (const k of DISPLAY) onBtn(k, !!s.display[k]);
      // the operation timeline
      btn.play.innerHTML = s.paused ? '▶' : '❚❚';
      opFrom.textContent = s.from;
      opTo.textContent = s.to;
      opPhase.textContent = s.phase;
      const kx = TL.x + s.prog * TL.w;
      tlFill.style.width = `${(s.prog * TL.w).toFixed(1)}px`;
      tlKnob.style.left = `${kx.toFixed(1)}px`;
      tlTime.textContent = `${fmt(s.tau)} / ${fmt(s.dur)}`;
      const sk = SP.x + s.speedK * SP.w;
      spFill.style.width = `${(s.speedK * SP.w).toFixed(1)}px`;
      spKnob.style.left = `${sk.toFixed(1)}px`;
      spVal.textContent = `${s.speed.toFixed(1)}×`;
      // labels: an orange square, the name, the note, a thin leader to the part
      let lh = '';
      let ch = '';
      for (const c of s.callouts) {
        if (c.o < 0.02 || !c.at) continue;
        const [ax, ay] = c.at;
        const [lx, ly] = c.label;
        const right = lx > ax;
        const ex = right ? lx - 6 : lx + c.w + 6;
        lh += `<polyline points="${ax.toFixed(1)},${ay.toFixed(1)} ${ex.toFixed(1)},${(ly + 6).toFixed(1)}" fill="none" stroke="${C.or}" stroke-width=".9" opacity="${c.o.toFixed(2)}"/><circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="2.4" fill="${C.or}" opacity="${c.o.toFixed(2)}"/>`;
        ch += `<div class="call" style="left:${lx.toFixed(1)}px;top:${(ly - 1).toFixed(1)}px;opacity:${c.o.toFixed(2)}"><b><i></i>${c.name}</b><span>${c.sub}</span></div>`;
      }
      callSvg.innerHTML = lh;
      callG.innerHTML = ch;
      pointer(s.cursor);
    },
    pointer,
  };
}
