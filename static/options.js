// The options page. Each change is saved at once and the form redrawn, so choices that
// depend on each other stay consistent: the bells on the method's stage or one more to
// cover, the ringer's bell among those.
function set(o) {
  opt = (o => (n => ({...o, bells: n, me: Math.min(o.me, n)}))
    (Math.min(Math.max(o.bells, METHODS[o.method].stage), METHODS[o.method].stage + 1)))({...opt, ...o});
  localStorage.practice = JSON.stringify(opt);
  render();
}

function field(name, control, note) {
  return $m('div.field', [$m('label', name), control, $m('span.note', note || '')]);
}

function select(key, values, text) {
  return $m('select', {onchange: e => set({[key]: isNaN(e.target.value) ? e.target.value : +e.target.value})},
    values.map(v => $m('option', {value: v, selected: v === opt[key]}, text ? text(v) : `${v}`)));
}

function toggle(key, text) {
  // A checkbox: `checked` is only given when true, as the attribute's presence alone ticks it.
  return $m('label.check', [$m('input', {type: 'checkbox', ...(opt[key] ? {checked: true} : {}),
    onchange: e => set({[key]: e.target.checked})}), text]);
}

function slider(key, min, max, step, note) {
  // Shows the value as it is dragged but saves it only when let go, so the redraw does not
  // pull the slider out from under the finger.
  return $m('span', [
    $m('input', {type: 'range', min, max, step, value: opt[key],
      oninput: e => $i(key).textContent = note(+e.target.value), onchange: e => set({[key]: +e.target.value})}),
    $m(`span#${key}.value`, note(opt[key]))]);
}

function render() {
  $i('app').replaceChildren(
    $m('h1', 'Options'),
    field('Method', select('method', Object.keys(METHODS))),
    field('Number of bells', select('bells', [0, 1].map(i => METHODS[opt.method].stage + i),
      n => n > METHODS[opt.method].stage ? `${n} (the ${n} covers)` : `${n}`)),
    field('Your bell', select('me', range(opt.bells).map(i => i + 1))),
    field('Speed', slider('gap', 150, 600, 10, v => `${v} ms a blow`),
      (t => `a peal in about ${Math.floor(t / 3600)}h ${Math.round(t % 3600 / 60)}m`)(5040 * (opt.bells + 0.5) * opt.gap / 1000)),
    field('Good within', slider('tolerance', 10, 150, 5, v => `${v} ms`), 'how far out a blow can be and still count as good'),
    field('Good blows for the go', $m('input', {type: 'number', min: 1, max: 24, value: opt.steady,
      onchange: e => set({steady: Math.max(1, +e.target.value || 1)})}), 'in a row, in rounds'),
    METHODS[opt.method].bob ? field('Calls', $m('input', {value: opt.touch, placeholder: 'plain course', size: 12,
      onchange: e => set({touch: e.target.value.toUpperCase().replace(/[^BP]/g, '')})}),
      (rows => `B bob, P plain, a letter a lead - ${round(rows.at(-1), method(opt)) ? `${rows.length - 1} changes`
        : 'this does not come round'}`)(course(callsOf(opt.touch), method(opt)))) : '',
    field('Assists', $m('div', [toggle('follow', 'Highlight the bell I follow next'),
      toggle('places', 'Show my place and my next place')])),
    $m('a.back', {href: '/'}, 'Back to ringing'));
}

document.addEventListener('DOMContentLoaded', render);
