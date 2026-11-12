// Plain Bob Doubles, rung on six with the tenor covering.
//
// Place notation &5.1.5.1.5,125 - complib.org/method/10550 and rsw.me.uk/blueline both
// give it, and the rows it produces agree with them: lead head 13524, ten rows to a lead,
// a plain course of four leads ending in rounds, every row different. A bob is 145; no
// source I could find quotes that notation for Doubles, but it is the one that produces
// the textbook effects - the bell that would make seconds runs out, the one that would
// dodge 3-4 down runs in, the one that would dodge 3-4 up makes fourths, and the one
// doing long fifths is untouched.
const PLAIN = ['5', '1', '5', '1', '5', '1', '5', '1', '5', '125'];
const BOB = '145';
const LEAD = PLAIN.length;
const ROUNDS = [1, 2, 3, 4, 5];   // the cover is not in the method - it rings last in every row
const COVER = 6;                  // so whoever leads follows it

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

function leadOf(n) {
  return Math.floor((n - 1) / LEAD);
}

function rowAt(n, calls) {
  // Row n: 0 is the last row of rounds, 1 onwards the method's own rows. Recomputed from
  // rounds every time rather than carried along in a running state - at these lengths it
  // costs nothing, and it makes undoing a mistaken tap a matter of counting back one.
  return range(Math.max(0, n)).reduce((row, i) => change(row,
    (i + 1) % LEAD === 0 && calls[leadOf(i + 1)] ? BOB : PLAIN[i % LEAD]), ROUNDS);
}

function placeOf(row, bell) {
  return row.indexOf(bell) + 1;
}

function path(bell, n, calls) {
  // The bell's places around row n - three rows back for the blows behind it, four
  // forward for which way round a dodge goes - and where row n sits among them. It never
  // reaches back past row 0, the last row of rounds: a bell that was already standing in
  // fifths when the method started has not thereby begun its long fifths.
  return {p: range(n + 5 - Math.max(0, n - 3)).map(i => placeOf(rowAt(Math.max(0, n - 3) + i, calls), bell)),
          i: n - Math.max(0, n - 3)};
}

function runLength(p, i) {
  // How many blows in a row the bell strikes in the place it occupies at p[i].
  return range(p.length).filter(j => p[j] === p[i]
    && !p.slice(Math.min(i, j), Math.max(i, j) + 1).some(q => q !== p[i])).length;
}

function dodge(p, i) {
  // A blow where the bell turns round for one blow and comes straight back. It covers two
  // places, and is named up or down by where the bell goes once the dodge is over.
  let pair = [Math.min(p[i], p[i - 1]), Math.max(p[i], p[i - 1])];
  return `dodging ${pair[0]}-${pair[1]} `
    + ((p.slice(i + 1).find(q => q < pair[0] || q > pair[1]) ?? 0) > pair[1] ? 'up' : 'down');
}

function label(p, i) {
  // What the bell is doing at p[i], read off the places either side of it.
  if (p[i] === 1) return 'leading';
  if (runLength(p, i) > 1) return {2: 'making seconds', 3: 'making thirds', 4: 'making the bob',
    5: runLength(p, i) > 2 ? 'long fifths' : 'lying behind'}[p[i]] || '';
  if ((p[i] - p[i - 1]) * (p[i + 1] - p[i]) < 0) return dodge(p, i);
  return p[i] > p[i - 1] ? 'hunting up' : 'hunting down';
}

// What the three affected bells do instead at a bob, in the terms they are taught in.
const AT_A_BOB = {'making seconds': 'running out', 'dodging 3-4 down': 'running in',
                  'dodging 3-4 up': 'making the bob'};

function describe(bell, n, calls) {
  // Everything the ringer needs for one row: the stroke, their place, the bell they follow
  // and the work. At a bob the work is named from what the plain lead would have been,
  // which is how the three affected bells are taught to recognise it.
  let row = rowAt(n, calls), place = placeOf(row, bell);
  let plain = n < 1 ? 'rounds' : label(...Object.values(path(bell, n, {...calls, [leadOf(n)]: false})));
  return {row, place, hand: n > 0 && n % 2 === 1,
    follow: place === 1 ? `the ${COVER}` : `the ${row[place - 2]}`,
    work: n < 1 ? 'rounds' : calls[leadOf(n)] && AT_A_BOB[plain] ? AT_A_BOB[plain]
      : label(...Object.values(path(bell, n, calls)))};
}
