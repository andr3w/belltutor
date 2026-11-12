// Practice for one ringer: the computer rings the other bells and conducts, the ringer
// rings theirs with the space bar or by tapping its rope. Look to starts rounds; once the
// ringer has struck enough good blows in a row the computer calls go, rings the touch,
// calls that's all as rounds come up and stand a few rows later. Its bells ring to time
// whatever the ringer does - they never wait or close up a gap - so a bad blow is heard as
// one, and the meter shows how far out each blow was. The options are on their own page.
const M = method(opt);
const NOMINAL = [2, 15 / 8, 5 / 3, 3 / 2, 4 / 3, 5 / 4, 9 / 8, 1].map(r => 440 * r);  // a major scale down from the treble
let ctx = null, S = null, blows = [];

function at(r, p) {
  // When the blow in place p of row r is due. Row 0 is the first handstroke of rounds, and
  // every handstroke after it has a gap of one blow before it, the open handstroke lead.
  return S.t0 + (opt.bells * r + Math.floor(r / 2) + p - 1) * opt.gap / 1000;
}

function rowOf(r) {
  // Rounds until the go, the touch from the backstroke after it, then rounds again; any
  // cover rings last.
  return [...(S.go === null ? M.rounds : S.rows[r - S.go - 1] || M.rounds), ...range(opt.bells - M.stage).map(i => M.stage + i + 1)];
}

function nth(p) {
  return p === 1 ? 'lead' : `${p}${{2: 'nds', 3: 'rds'}[p] || 'ths'}`;
}

function assist() {
  // For the blow the ringer is to strike next: the bell they follow - at lead, the last
  // bell of the row before - and their place in it and in the row after.
  (([row, place]) => {
    $q('g.rope.follow').forEach(el => el.classList.remove('follow'));
    if (opt.follow) $i(`b${place > 1 ? row[place - 2] : rowOf(S.mine - 1).at(-1)}`).classList.add('follow');
    $i('assist').textContent = opt.places ? `${nth(place)}, then ${nth(placeOf(rowOf(S.mine + 1), opt.me))}` : '';
  })((row => [row, placeOf(row, opt.me)])(rowOf(S.mine)));
}

function due(r) {
  return at(r, placeOf(rowOf(r), opt.me));
}

function later(t, f) {
  setTimeout(f, Math.max(0, t - ctx.currentTime) * 1000);
}

function flash(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;   // so the animation starts again
  el.classList.add(cls);
}

function sound(bell, t) {
  // A bell's partials - hum, prime, tierce, quint, nominal and two above it - each dying
  // away in its own time, the hum longest. The treble is the top of the scale whatever
  // the number of bells.
  [[1 / 4, .5, 4], [1 / 2, .4, 2.5], [.6, .3, 1.5], [3 / 4, .15, 1.2], [1, .5, 1], [5 / 4, .15, .6], [3 / 2, .1, .4]]
    .forEach(([ratio, level, decay]) => (o => {
      o.frequency.value = NOMINAL[bell - 1] * ratio;
      o.connect((g => {
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level * 0.08, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        return g;
      })(ctx.createGain())).connect(ctx.destination);
      o.start(t);
      o.stop(t + decay);
    })(ctx.createOscillator()));
}

function swing(bell, t) {
  // At each blow the rope goes the other way: up to show the tail end after a handstroke,
  // down to bring the sally back after a backstroke.
  later(t, () => {
    $i(`b${bell}`).classList.toggle('back');
    flash($i(`b${bell}`), 'struck');
  });
}

function call(text, t) {
  if (text) later(t, () => {
    $i('call').textContent = text;
    flash($i('call'), 'new');
  });
}

function grade(e) {
  return Math.abs(e) * 1000 < opt.tolerance ? 'good' : Math.abs(e) * 1000 < 2 * opt.tolerance ? 'ok' : 'bad';
}

function run() {
  // Good blows the ringer has struck in a row, counting back from the latest.
  return blows.length - 1 - blows.findLastIndex(e => e === null || grade(e) !== 'good');
}

function conduct(r) {
  // Called as each row starts. Go and bob are called at a handstroke a whole pull before
  // they take effect, that's all as rounds come up, and stand at the first handstroke
  // three whole pulls later - the bells ring the backstroke after it and stop.
  (m => call(S.go === null ? (r % 2 === 0 && run() >= opt.steady ? (S.go = r, `Go ${opt.method}`) : null)
    : m === S.rows.length - 1 ? "That's all"
    : m > S.rows.length + 4 && r % 2 === 0 && S.last === Infinity ? (S.last = r + 1, 'Stand')
    : m % M.lead.length === M.lead.length - 3 && m < S.rows.length && M.bob && S.calls[Math.floor(m / M.lead.length)]
      ? 'Bob' : null, at(r, 1)))(r - S.go - 1);
}

function tick() {
  // Schedules the computer's blows a little ahead of time, so the audio clock places them
  // exactly; marks a blow the ringer has let go by as missed; stops once all is rung.
  if (S.mine <= S.last && ctx.currentTime > due(S.mine) + opt.bells * opt.gap / 2000) score(null);
  while (S.sr <= S.last && at(S.sr, S.sp) < ctx.currentTime + 0.1) {
    if (S.sp === 1) conduct(S.sr);
    if (rowOf(S.sr)[S.sp - 1] !== opt.me) [sound, swing].forEach(f => f(rowOf(S.sr)[S.sp - 1], at(S.sr, S.sp)));
    [S.sr, S.sp] = S.sp === opt.bells ? [S.sr + 1, 1] : [S.sr, S.sp + 1];
  }
  if (S.sr > S.last && ctx.currentTime > at(S.last, opt.bells) + 4 * opt.gap / 1000) return stop();
  assist();
}

function ring() {
  // The ringer's blow, heard at once; while ringing, scored against the next blow due.
  if (!ctx) return;
  [sound, swing].forEach(f => f(opt.me, ctx.currentTime));
  if (S && S.mine <= S.last) score(ctx.currentTime - due(S.mine));
}

function score(e) {
  blows.push(e);
  S.mine++;
  meter();
  $i('status').textContent = S.go === null ? `Rounds: ${Math.min(run(), opt.steady)} of ${opt.steady} good blows for the go`
    : `${opt.method}: change ${Math.max(0, Math.min(S.mine - S.go - 2, S.rows.length - 1))} of ${S.rows.length - 1}`;
}

function meter() {
  // The last dozen blows as marks either side of the line where each belonged - the edges
  // are half a gap early and half a gap late - the newest biggest; then the averages.
  (recent => $i('marks').replaceChildren(...recent.map((e, i) => e === null ? null : $m(`s:circle.${grade(e)}`, {
    cx: 100 + Math.max(-.5, Math.min(.5, e * 1000 / opt.gap)) * 200, cy: 12, r: i === recent.length - 1 ? 7 : 4,
    opacity: (i + 1) / recent.length})).filter(c => c)))(blows.slice(-12));
  $i('stats').textContent = [
    blows.at(-1) === null ? 'missed' : `${Math.round(Math.abs(blows.at(-1)) * 1000)} ms ${blows.at(-1) < 0 ? 'early' : 'late'}`,
    ...[['last 12', blows.slice(-12)], ['all', blows]].map(([name, ls]) => (hit => `${name} ${hit.length
      ? Math.round(sum(hit.map(Math.abs)) / hit.length * 1000) : '-'} ms`)(ls.filter(e => e !== null))),
    `${blows.filter(e => e === null).length} missed`].join(' · ');
}

function lookTo() {
  ctx = ctx || new AudioContext();
  ctx.resume();
  blows = [];
  render();
  S = {t0: ctx.currentTime + 3.5, go: null, last: Infinity, sr: 0, sp: 1, mine: 0,
    calls: callsOf(opt.touch), rows: course(callsOf(opt.touch), M), timer: setInterval(tick, 25)};
  [['Look to', ctx.currentTime], ["Treble's going", S.t0 - 1.8], ["She's gone", S.t0 - 0.4]].forEach(c => call(...c));
  controls();
}

function stop() {
  clearInterval(S.timer);
  S = null;
  $q('g.rope.follow').forEach(el => el.classList.remove('follow'));
  $i('assist').textContent = '';
  controls();
}

function controls() {
  $i('look').textContent = S ? 'Stand' : 'Look to';
  $i('look').disabled = !S && !round(course(callsOf(opt.touch), M).at(-1), M);
  $i('options').classList.toggle('hidden', !!S);
}

function rope(b, k) {
  // A rope seen from the ringing circle, in a window that shows the sally at handstroke
  // and the tail end at backstroke, its number beside it. The circle is an oval so the
  // ropes at the sides clear each other; seat 0 is the bottom of it, the ringer's.
  return $m(`s:g#b${b}.rope${b === opt.me ? '.mine' : ''}`, {
    transform: `translate(${50 + 38 * Math.cos(Math.PI / 2 + k * 2 * Math.PI / opt.bells)} ${50 + 34 * Math.sin(Math.PI / 2 + k * 2 * Math.PI / opt.bells)}) scale(${Math.min(1.25, 10 / opt.bells)})`,
    ...(b === opt.me ? {onpointerdown: ring} : {})}, [
    $m('s:g', {'clip-path': 'url(#window)'}, $m('s:g.pull', [
      $m('s:line', {x1: 0, y1: -40, x2: 0, y2: 6}),
      $m('s:rect.sally', {x: -1.8, y: -9, width: 3.6, height: 10, rx: 1.8, fill: `url(#${b === opt.me ? 'mine' : 'sally'})`}),
      $m('s:path', {d: 'M0 6v4q0 1.5-1.2 1v-4'})])),
    $m('s:rect.hit', {x: -6, y: -11, width: 16, height: 23}),
    $m('s:text', {x: 4, y: 2}, `${b}`)]);
}

function render() {
  $i('app').replaceChildren(
    $m('div#top', [
      $m('span', `${opt.method} on ${opt.bells} · your bell ${opt.me}${opt.touch ? ` · ${opt.touch}` : ''}`),
      $m('a#options', {href: '/options'}, 'Options')]),
    $m('div#stage', $m('div#tower', [
      $m('s:svg', {viewBox: '0 0 100 100'}, [
        $m('s:defs', [
          ...[['sally', '#b33', '#eee', '#35a'], ['mine', '#2a8fd8', '#eee', '#2a8fd8']].map(([id, ...c]) =>
            $m(`s:pattern#${id}`, {width: 3, height: 3, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)'},
              c.map((fill, i) => $m('s:rect', {x: 0, y: i, width: 3, height: 1, fill})))),
          $m('s:clipPath#window', $m('s:rect', {x: -6, y: -11, width: 12, height: 23}))]),
        ...range(opt.bells).map(i => i + 1).map(b => rope(b, (b - opt.me + opt.bells) % opt.bells))]),
      $m('div#call')])),
    $m('div#assist'),
    $m('s:svg#meter', {viewBox: '0 0 200 24'}, [
      $m('s:rect.band', {x: 100 - opt.tolerance / opt.gap * 200, y: 0, width: opt.tolerance / opt.gap * 400, height: 24}),
      $m('s:line', {x1: 100, y1: 0, x2: 100, y2: 24}),
      $m('s:text', {x: 2, y: 15}, 'early'),
      $m('s:text.late', {x: 198, y: 15}, 'late'),
      $m('s:g#marks')]),
    $m('div#stats'),
    $m('div#status', 'Press Look to, then ring your bell with the space bar or by tapping its rope'),
    $m('button#look', e => (e.currentTarget.blur(), S ? (call('Stand', ctx.currentTime), stop()) : lookTo())),
    $m('button#ring', {onpointerdown: ring}, 'Ring'));
  controls();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (!e.repeat) ring();
    }
  });
});
