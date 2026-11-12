// The methods on offer, the rows they produce, and the ringer's options, which both pages
// share through the browser's storage.
//
// A method is its stage, a lead of place notation and the bob that replaces its lead end
// change; plain hunt has no bob. Rung on one more bell than its stage, the extra bell
// covers - it rings last in every row, so whoever leads follows it.
//
// Plain Bob Doubles is &5.1.5.1.5,125 - complib.org/method/10550 and rsw.me.uk/blueline
// both give it: lead head 13524, ten rows to a lead, a plain course of four leads. Its bob
// is 145; no source I could find quotes that for Doubles, but it is the one that produces
// the textbook effects - the bell that would make seconds runs out, the one that would
// dodge 3-4 down runs in, the one that would dodge 3-4 up makes fourths, and the one doing
// long fifths is untouched.
const METHODS = {
  'Plain Hunt Doubles': {stage: 5, pn: '5.1.5.1.5.1.5.1.5.1'},
  'Plain Hunt Minor': {stage: 6, pn: 'x16x16x16x16x16x16'},
  'Plain Bob Doubles': {stage: 5, pn: '5.1.5.1.5.1.5.1.5.125', bob: '145'},
  'Plain Bob Minor': {stage: 6, pn: 'x16x16x16x16x16x12', bob: '14'},
  'Plain Bob Triples': {stage: 7, pn: '7.1.7.1.7.1.7.1.7.1.7.1.7.127', bob: '147'},
  'Plain Bob Major': {stage: 8, pn: 'x18x18x18x18x18x18x18x12', bob: '14'}
};
// gap is the time between blows and tolerance how far out a blow can be and still be good,
// both in milliseconds; steady is the good blows in a row that earn the go; touch is a
// letter a lead, B for a bob and P for plain, empty for a plain course. follow and places
// are assists: highlighting the bell the ringer follows next, and naming their places.
let opt = {method: 'Plain Bob Doubles', bells: 6, me: 2, gap: 300, steady: 1, tolerance: 45, touch: '',
  follow: true, places: true,
  ...JSON.parse(localStorage.practice || '{}')};

function method(o) {
  return (m => ({...m, lead: m.pn.match(/x|[0-9A-Z]+/g), rounds: range(m.stage).map(i => i + 1)}))(METHODS[o.method]);
}

function callsOf(touch) {
  return Object.fromEntries([...touch].map((c, i) => [i, c === 'B']));
}

function change(row, pn) {
  // Bells in the places `pn` names stay where they are; every other pair swaps. The loop
  // never runs off the end because a real change always names the last place when it
  // would otherwise be left without a partner.
  let out = [...row];
  for (let i = 1; i < row.length; i += pn.includes(`${i}`) ? 1 : 2) {
    if (!pn.includes(`${i}`)) [out[i - 1], out[i]] = [row[i], row[i - 1]];
  }
  return out;
}

function course(calls, M) {
  // Every row of the touch, from the rounds before it to the rounds that end it. Plain
  // leads bring rounds up within a course if they are going to at all, so a touch that has
  // not come round that many leads after its last call never will.
  return (rows => rows.slice(0, rows.findIndex((row, m) => m > 0 && round(row, M)) + 1 || rows.length))
    (range(M.lead.length * (Object.keys(calls).length + M.stage)).reduce((rows, i) => rows.concat([change(rows[i],
      (i + 1) % M.lead.length === 0 && M.bob && calls[Math.floor(i / M.lead.length)] ? M.bob : M.lead[i % M.lead.length])]),
      [M.rounds]));
}

function round(row, M) {
  return `${row}` === `${M.rounds}`;
}

function placeOf(row, bell) {
  return row.indexOf(bell) + 1;
}
