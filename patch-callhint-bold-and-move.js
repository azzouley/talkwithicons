// patch-callhint-bold-and-move.js
// 1. Bold/enlarge "yes" and "please continue" in both call-hint paragraphs on all 12 pages.
// 2. Move the pre-submit call-hint to just above the Stripe card-element.
//    (Evangeline's real payment form has no pre-submit call-hint today — her decision-box
//    hint, currently above the "Start Your Reading" link, is moved to above her actual
//    card-element instead, which is the closest equivalent.)
// The post-submit/confirmation call-hint stays in place on all 12, text-only update.

const fs = require('fs');

const STANDARD = ['einstein','nostradamus','davinci','brucelee','watson','aela','celeste',
                   'oswald','houdini','frankenstein','friday'];

const OLD_TEXT = 'If your icon pauses in thought, say &#34;yes&#34; or &#34;please continue&#34; to invite them to go on.';
const NEW_TEXT = 'If your icon pauses in thought, say <strong style="font-size:1.1em">"yes"</strong> or <strong style="font-size:1.1em">"please continue"</strong> to invite them to go on.';

const HINT_RE = /<p class="call-hint" style="([^"]*)">If your icon pauses in thought, say &#34;yes&#34; or &#34;please continue&#34; to invite them to go on\.<\/p>/g;

function findMatches(html) {
  const matches = [];
  let m;
  HINT_RE.lastIndex = 0;
  while ((m = HINT_RE.exec(html)) !== null) {
    matches.push({ start: m.index, end: m.index + m[0].length, style: m[1], full: m[0] });
  }
  return matches;
}

function lineBounds(html, idx) {
  const lineStart = html.lastIndexOf('\n', idx - 1) + 1;
  let lineEnd = html.indexOf('\n', idx);
  if (lineEnd === -1) lineEnd = html.length; else lineEnd += 1; // consume trailing \n
  return { lineStart, lineEnd };
}

function cardElementAnchor(html) {
  const idx = html.indexOf('<div id="card-element"');
  if (idx === -1) throw new Error('card-element not found');
  const lineStart = html.lastIndexOf('\n', idx - 1) + 1;
  const indent = html.slice(lineStart, idx);
  return { insertAt: lineStart, indent };
}

function newHintLine(indent, style) {
  return `${indent}<p class="call-hint" style="${style}">${NEW_TEXT}</p>\n`;
}

const results = [];

function process(name, moveIdx, editIdx) {
  const filePath = `C:/talkwithicons/${name}.html`;
  let html = fs.readFileSync(filePath, 'utf8');
  const before = html;

  const matches = findMatches(html);
  if (matches.length !== 2) {
    results.push({ name, ok: false, error: `expected 2 call-hint matches, found ${matches.length}` });
    return;
  }

  const moveMatch = matches[moveIdx];
  const editMatch = matches[editIdx];
  const { insertAt, indent: cardIndent } = cardElementAnchor(html);

  // Sanity: ops must be applied right-to-left by position to keep indices valid.
  const ops = [
    { pos: moveMatch.start, kind: 'delete-line', ref: moveMatch },
    { pos: editMatch.start, kind: 'edit-text', ref: editMatch },
    { pos: insertAt, kind: 'insert', ref: null },
  ].sort((a, b) => b.pos - a.pos);

  for (const op of ops) {
    if (op.kind === 'delete-line') {
      const { lineStart, lineEnd } = lineBounds(html, op.ref.start);
      html = html.slice(0, lineStart) + html.slice(lineEnd);
    } else if (op.kind === 'edit-text') {
      html = html.slice(0, op.ref.start) + newHintLine('', op.ref.style).trim() + html.slice(op.ref.end);
    } else if (op.kind === 'insert') {
      html = html.slice(0, insertAt) + newHintLine(cardIndent, moveMatch.style) + html.slice(insertAt);
    }
  }

  fs.writeFileSync(filePath, html);

  // Verify
  const written = fs.readFileSync(filePath, 'utf8');
  const strongCount = (written.match(/<strong style="font-size:1.1em">/g) || []).length;
  const oldTextGone = !written.includes(OLD_TEXT);
  const cardIdx = written.indexOf('<div id="card-element"');
  const hintBeforeCardIdx = written.lastIndexOf('call-hint', cardIdx);
  const hintNowBeforeCard = hintBeforeCardIdx !== -1 && hintBeforeCardIdx < cardIdx && (cardIdx - hintBeforeCardIdx) < 400;
  const stillTwoHints = (written.match(/class="call-hint"/g) || []).length === 2;

  results.push({
    name, ok: strongCount === 4 && oldTextGone && hintNowBeforeCard && stillTwoHints,
    strongCount, oldTextGone, hintNowBeforeCard, stillTwoHints,
    beforeLen: before.length, afterLen: written.length,
  });
}

for (const name of STANDARD) {
  // matches[0] = pre-submit hint (move), matches[1] = post-callmsg confirmation hint (edit in place)
  process(name, 0, 1);
}
// Evangeline: matches[0] = confirmation hint inside #form-success (edit in place),
// matches[1] = decision-box hint above "Start Your Reading" (move to above real card-element)
process('evangeline', 1, 0);

console.log('\nCharacter      | OK    | strong x4 | old text gone | hint before card | still 2 hints | chars');
console.log('---------------|-------|-----------|----------------|-------------------|---------------|-------');
for (const r of results) {
  if (r.error) { console.log(r.name.padEnd(14) + ' | ERROR: ' + r.error); continue; }
  console.log(
    r.name.padEnd(14) + ' | ' + (r.ok ? 'OK   ' : 'FAIL ') +
    ' | ' + String(r.strongCount).padEnd(9) +
    ' | ' + String(r.oldTextGone).padEnd(14) +
    ' | ' + String(r.hintNowBeforeCard).padEnd(17) +
    ' | ' + String(r.stillTwoHints).padEnd(13) +
    ' | ' + r.beforeLen + '->' + r.afterLen
  );
}
