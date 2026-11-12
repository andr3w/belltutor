// The coach's page: two people, one phone. The coach taps Tenor on every tenor blow -
// the tenor covers, so that is one tap per row - and the list says what the ringer's bell
// does. Eventually the phone will hear the tenor for itself.
//
// The rows are a scrolling list rather than a couple of lines: the row being rung is
// brightest, what is coming is dimmer the further off it is, and what has gone is faded
// above it, so both of them can see where they are without anyone reading a counter.
let bell = null, next = 0, calls = {}, going = false, lines = [];
const AHEAD = 14;   // rows drawn past the one being rung, for looking ahead
const PLACE = ['', 'lead', '2nds', '3rds', '4ths', '5ths'];

function stroke(n) {
  // The method starts at a handstroke, so its odd rows are handstrokes. Row 0 is the
  // backstroke of rounds that follows the call.
  return n > 0 && n % 2 === 1 ? 'H' : 'B';
}

function bobPending() {
  return !!calls[leadOf(Math.max(next, 1))];
}

function lineFor(n) {
  let d = describe(bell, n, calls);
  return $m('div.line', [
    $m('span.n', n < 1 ? '·' : `${n}`),
    $m('span.s', stroke(n)),
    $m('span.p', PLACE[d.place]),
    $m('span.f', d.follow.replace('the ', '')),
    $m('span.w', d.work)
  ]);
}

function grow() {
  // Extend the list rather than rebuild it: the drawn rows are what the scrolling moves
  // through, and replacing them would throw away the position the eye is holding.
  while (lines.length <= next + AHEAD) {
    lines.push(lineFor(lines.length));
    $i('rows').appendChild(lines[lines.length - 1]);
  }
}

function show(pulse) {
  grow();
  lines.forEach((el, n) => el.className = 'line '
    + (n < next ? 'past' : n === next ? 'now' : `d${Math.min(3, n - next)}`));
  lines[next].scrollIntoView({behavior: 'smooth', block: 'center'});
  if (pulse) {
    lines[next].classList.add('pulse');
    setTimeout(() => lines[next] && lines[next].classList.remove('pulse'), 400);
  }
  $i('status').textContent = next === 0 ? 'one more backstroke of rounds, then the method starts'
    : `lead ${leadOf(next) + 1}${bobPending() ? ' — BOB at this lead end' : ''}`;
  $i('go').textContent = 'Tenor (next)';
  $i('go').className = 'tenor';
}

function tap() {
  // GO marks the call itself. The call is made at a handstroke, so one backstroke of
  // rounds follows it and the method starts at the next handstroke: that is row 0, then
  // row 1. After that every tap is one more row.
  if (!going) { going = true; next = 0; } else next++;
  show(true);
}

function bob() {
  // A bob changes every row from its lead end on, so the drawn future is thrown away and
  // redrawn. Rows already rung are left alone - the call cannot reach back into them.
  calls[leadOf(Math.max(next, 1))] = true;
  lines.splice(next).forEach(el => el.remove());
  show(false);
}

function reset() {
  [bell, next, calls, going, lines] = [null, 0, {}, false, []];
  start();
}

function start() {
  $i('app').replaceChildren(bell ? $m('div#ringing', [
    $m('div#head', [$m('span.n', '#'), $m('span.s', ''), $m('span.p', 'place'),
                    $m('span.f', 'follow'), $m('span.w', 'doing')]),
    $m('div#rows'),
    $m('div#status', 'Tap GO when "go bob doubles" is called'),
    $m('div#buttons', [
      $m('button#bob', 'BOB', bob),
      $m('button#undo', 'Prev', () => (next = Math.max(0, next - 1), show(false))),
      $m('button#reset', 'Start again', reset)
    ]),
    $m('button#go.go', {onclick: tap}, 'GO')
  ]) : $m('div#pick', [
    $m('h1', 'Bob Doubles'),
    $m('p', 'Rung on six, the tenor covering. Which bell is the ringer on?'),
    $m('div.bells', [1, 2, 3, 4, 5].map(b => $m('button.bell', `${b}`, () => { bell = b; start(); }))),
    $m('p.note', 'The coach taps GO as the call is made, then Tenor on every tenor blow. '
      + 'The space bar does the same.')
  ]));
}

document.addEventListener('DOMContentLoaded', () => {
  start();
  // Registered so the page can be installed to the home screen and, once installed, works
  // in a tower with no signal. It is not required: uninstalled in a browser tab the page
  // behaves the same, and a browser without service workers just skips this.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && bell) { e.preventDefault(); tap(); }
  });
});
