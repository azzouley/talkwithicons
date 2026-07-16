// fix-rescue-line-styling.js
// Bump the dim/tiny rescue-donation disclaimer styling to font-size:1rem minimum,
// color #C9A84C, no opacity dimming. Scope: .call-rescue, .rescue-line, .wf-rescue,
// .rescue-note, .hero-rescue only (confirmed with user — excludes .section-title,
// .rescue-headline, and plain body/footer/FAQ copy that already reads fine).
// One-off content-fix script, not part of the Vapi Rule 7 workflow.

const fs = require('fs');
const path = require('path');

const replacements = [
  {
    label: '.call-rescue (single-line)',
    files: [
      'aela.html', 'brucelee.html', 'celeste.html', 'curie.html', 'davinci.html',
      'evangeline.html', 'frankenstein.html', 'holmes.html', 'houdini.html',
      'nostradamus.html', 'oswald.html', 'sittingbull.html', 'tesla.html', 'twain.html',
      'stripe-work/aela.html', 'stripe-work/brucelee.html', 'stripe-work/celeste.html',
      'stripe-work/llorona.html', 'stripe-work/oswald.html', 'stripe-work/holmes.html',
      'stripe-work/nostradamus.html', 'stripe-work/twain.html',
      'stripe-output/aela.html', 'stripe-output/brucelee.html', 'stripe-output/celeste.html',
      'stripe-output/llorona.html', 'stripe-output/oswald.html', 'stripe-output/holmes.html',
      'stripe-output/nostradamus.html', 'stripe-output/twain.html',
      'uploads/aela.html',
    ],
    old: `.call-rescue { font-family: 'Space Mono', monospace; font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6dbf8a; text-align: center; }`,
    new: `.call-rescue { font-family: 'Space Mono', monospace; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A84C; text-align: center; }`,
  },
  {
    label: '.call-rescue (multi-line, einstein)',
    files: ['einstein.html', 'stripe-work/einstein.html', 'stripe-output/einstein.html'],
    old: `    .call-rescue {\n      font-family: 'Space Mono', monospace;\n      font-size: 0.58rem;\n      letter-spacing: 0.1em;\n      text-transform: uppercase;\n      color: #6dbf8a;\n      text-align: center;\n    }`,
    new: `    .call-rescue {\n      font-family: 'Space Mono', monospace;\n      font-size: 1rem;\n      letter-spacing: 0.1em;\n      text-transform: uppercase;\n      color: #C9A84C;\n      text-align: center;\n    }`,
  },
  {
    label: '.rescue-line',
    files: ['aela-deep.html', 'celeste-deep.html', 'oswald-deep.html'],
    old: `.rescue-line { margin-top: 24px; font-size: 13px; color: var(--muted); font-style: italic; }`,
    new: `.rescue-line { margin-top: 24px; font-size: 1rem; color: #C9A84C; font-style: italic; }`,
  },
  {
    label: '.wf-rescue',
    files: ['index.html', 'uploads/index.html'],
    old: `.wf-rescue { font-size: 0.68rem; color: rgba(201,149,42,0.65); text-align: center; }`,
    new: `.wf-rescue { font-size: 1rem; color: #C9A84C; text-align: center; }`,
  },
  {
    label: '.rescue-note',
    files: ['payment.html'],
    old: `.rescue-note { margin-top: 16px; font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase; color: #6dbf8a; }`,
    new: `.rescue-note { margin-top: 16px; font-family: 'Space Mono', monospace; font-size: 1rem; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A84C; }`,
  },
  {
    label: '.hero-rescue',
    files: [
      'aela-feature.html', 'brucelee-feature.html', 'celeste-feature.html', 'davinci-feature.html',
      'einstein-feature.html', 'evangeline-feature.html', 'frankenstein-feature.html',
      'holmes-feature.html', 'houdini-feature.html', 'nostradamus-feature.html',
      'oswald-feature.html', 'sittingbull-feature.html',
    ],
    old: `.hero-rescue { font-family: 'Crimson Pro', serif; font-size: 2rem; color: var(--muted); font-style: italic; line-height: 1.4; }`,
    new: `.hero-rescue { font-family: 'Crimson Pro', serif; font-size: 2rem; color: #C9A84C; font-style: italic; line-height: 1.4; }`,
  },
];

const changed = [];
const missed = [];

for (const group of replacements) {
  for (const rel of group.files) {
    const full = path.join(__dirname, rel);
    if (!fs.existsSync(full)) { missed.push(`${rel} (${group.label}): FILE NOT FOUND`); continue; }
    const content = fs.readFileSync(full, 'utf8');
    if (!content.includes(group.old)) { missed.push(`${rel} (${group.label}): pattern not found`); continue; }
    const updated = content.replace(group.old, group.new);
    fs.writeFileSync(full, updated);
    changed.push(`${rel} (${group.label})`);
  }
}

console.log(`--- CHANGED (${changed.length}) ---`);
changed.forEach(f => console.log(f));
console.log(`\n--- MISSED (${missed.length}) ---`);
missed.forEach(f => console.log(f));
