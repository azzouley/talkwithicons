// reorder-other-icons.js
// Reorders each page's "Other Icons" / "Also available" cross-link section to match
// the new site-wide character rotation (excluding the page's own character).
const fs = require('fs');

const MASTER_ORDER = ['aela','oswald','davinci','brucelee','watson','silver','celeste','nostradamus','evangeline','houdini','frankenstein','friday'];

const MAIN_PAGES = MASTER_ORDER.map(s => s + '.html');
const FEATURE_PAGES = MASTER_ORDER.map(s => s + '-feature.html');

function keyFromHref(href) {
  return href.replace('.html', '');
}

const results = [];

// --- MAIN PAGES: <a class="other-card" href="X.html">...</a> blocks ---
for (const file of MAIN_PAGES) {
  if (!fs.existsSync(file)) { results.push({ file, ok: false, note: 'file not found' }); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const selfKey = keyFromHref(file);

  const cardRegex = /<a class="other-card" href="([a-z]+\.html)">[\s\S]*?<\/a>/g;
  const matches = [...html.matchAll(cardRegex)];
  if (matches.length === 0) { results.push({ file, ok: false, note: 'no other-card blocks found' }); continue; }

  const cardsByKey = {};
  for (const m of matches) cardsByKey[keyFromHref(m[1])] = m[0];

  const orderedKeys = MASTER_ORDER.filter(k => k !== selfKey);
  const missing = orderedKeys.filter(k => !cardsByKey[k]);
  if (missing.length) { results.push({ file, ok: false, note: 'missing cards for: ' + missing.join(',') }); continue; }

  const newCards = orderedKeys.map(k => cardsByKey[k]);
  const blockStart = html.indexOf(matches[0][0]);
  const lastMatch = matches[matches.length - 1];
  const blockEnd = html.indexOf(lastMatch[0]) + lastMatch[0].length;

  const newBlock = newCards.join('\n      ');
  html = html.slice(0, blockStart) + newBlock + html.slice(blockEnd);
  fs.writeFileSync(file, html);
  results.push({ file, ok: true, count: newCards.length });
}

// --- FEATURE PAGES: <a class="other-pill" href="X.html">Name</a> lines ---
for (const file of FEATURE_PAGES) {
  if (!fs.existsSync(file)) { results.push({ file, ok: false, note: 'file not found' }); continue; }
  let html = fs.readFileSync(file, 'utf8');
  const selfKey = keyFromHref(file.replace('-feature.html', '.html'));

  const pillRegex = /<a class="other-pill" href="([a-z]+\.html)">([^<]*)<\/a>/g;
  const matches = [...html.matchAll(pillRegex)];
  if (matches.length === 0) { results.push({ file, ok: false, note: 'no other-pill lines found' }); continue; }

  const pillsByKey = {};
  for (const m of matches) pillsByKey[keyFromHref(m[1])] = m[0];

  const orderedKeys = MASTER_ORDER.filter(k => k !== selfKey);
  const missing = orderedKeys.filter(k => !pillsByKey[k]);
  if (missing.length) { results.push({ file, ok: false, note: 'missing pills for: ' + missing.join(',') }); continue; }

  const newPills = orderedKeys.map(k => pillsByKey[k]);
  const blockStart = html.indexOf(matches[0][0]);
  const lastMatch = matches[matches.length - 1];
  const blockEnd = html.indexOf(lastMatch[0]) + lastMatch[0].length;

  const newBlock = newPills.join('\n      ');
  html = html.slice(0, blockStart) + newBlock + html.slice(blockEnd);
  fs.writeFileSync(file, html);
  results.push({ file, ok: true, count: newPills.length });
}

console.log('File                       | OK    | Count/Note');
for (const r of results) {
  console.log(r.file.padEnd(26), '|', (r.ok ? 'OK   ' : 'FAIL '), '|', r.ok ? r.count : r.note);
}
