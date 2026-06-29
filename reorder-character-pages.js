// reorder-character-pages.js
// For all 12 active character pages:
//   1. Remove the quote-section block
//   2. Move the bio/mystery section ABOVE the decision-section (call box)
//   3. Replace the starters-intro text with standardised copy
// Run: node reorder-character-pages.js

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname);

const CHARS = [
  { file: 'sittingbull.html', name: 'Sitting Bull',          pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'einstein.html',    name: 'Einstein',               pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'nostradamus.html', name: 'Nostradamus',            pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'davinci.html',     name: 'Leonardo',               pronoun: 'He',  bioClass: 'mystery-section' },
  { file: 'brucelee.html',    name: 'Bruce Lee',              pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'holmes.html',      name: 'Holmes',                 pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'aela.html',        name: 'Aela',                   pronoun: 'She', bioClass: 'mystery-section' },
  { file: 'bennet.html',      name: 'Elizabeth Bennet',       pronoun: 'She', bioClass: 'bio-section'     },
  { file: 'baldwin.html',     name: 'James Baldwin',          pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'evangeline.html',  name: 'Evangeline Adams',       pronoun: 'She', bioClass: 'bio-section'     },
  { file: 'houdini.html',     name: 'Houdini',                pronoun: 'He',  bioClass: 'bio-section'     },
  { file: 'frankenstein.html',name: "Frankenstein's Creature",pronoun: 'He',  bioClass: 'bio-section'     },
];

const results = [];

for (const c of CHARS) {
  const filePath = path.join(DIR, c.file);
  let html = fs.readFileSync(filePath, 'utf8');
  const original = html;

  // ── 1. REMOVE quote-section ──────────────────────────────────────────────
  // Match the entire block: newline + optional indent + <div class="quote-section"> ... </div> + newline
  const quoteRe = /\n[ ]*<!-- QUOTE -->\n[ ]*<div class="quote-section">[\s\S]*?<\/div>\n|[ ]*\n[ ]*<div class="quote-section">[\s\S]*?<\/div>\n[ ]*/;
  const afterQuoteRemoval = html.replace(quoteRe, '\n');
  if (afterQuoteRemoval === html) {
    // Try simpler pattern without comment
    const quoteRe2 = /\n  <div class="quote-section">[\s\S]*?  <\/div>\n/;
    const h2 = html.replace(quoteRe2, '\n');
    if (h2 === html) {
      console.error(`  [${c.file}] FAILED: quote-section not removed`);
      results.push({ file: c.file, ok: false, step: 'remove-quote' });
      continue;
    }
    html = h2;
  } else {
    html = afterQuoteRemoval;
  }

  // ── 2. MOVE bio/mystery section BEFORE decision-section ──────────────────
  const bioOpenTag = `<div class="${c.bioClass}">`;
  const decisionOpenTag = '<div class="decision-section"';
  const bottomCtaTag = '<div class="bottom-cta">';

  const bioStartIdx = html.indexOf(bioOpenTag);
  const bottomCtaIdx = html.indexOf(bottomCtaTag);
  const decisionIdx = html.indexOf(decisionOpenTag);

  if (bioStartIdx === -1 || bottomCtaIdx === -1 || decisionIdx === -1) {
    console.error(`  [${c.file}] FAILED: could not find bio(${bioStartIdx}), decision(${decisionIdx}), or bottom-cta(${bottomCtaIdx})`);
    results.push({ file: c.file, ok: false, step: 'move-bio' });
    continue;
  }

  if (bioStartIdx < decisionIdx) {
    // Bio is already above decision — skip (already transformed or different layout)
    console.log(`  [${c.file}] Bio is already above decision-section — skipping move step.`);
  } else {
    // Extract the bio block (from its opening tag up to, but not including, bottom-cta)
    const bioBlock = html.slice(bioStartIdx, bottomCtaIdx).trimEnd();

    // What's before the decision section
    const beforeDecision = html.slice(0, decisionIdx);

    // The decision section + everything up to the bio section (trim trailing whitespace)
    const decisionAndGap = html.slice(decisionIdx, bioStartIdx).trimEnd();

    // Everything from bottom-cta onward
    const afterBio = html.slice(bottomCtaIdx);

    // Re-assemble: beforeDecision + bioBlock + \n\n + decisionAndGap + \n\n + afterBio
    html = beforeDecision + bioBlock + '\n\n' + decisionAndGap + '\n\n' + afterBio;
  }

  // ── 3. REPLACE starters-intro text ───────────────────────────────────────
  const newIntro = `Your time with ${c.name} is your own. ${c.pronoun} will take any questions you have and the more of yourself you input to the conversation, the richer it will become. These six questions can be starting points but you are able to begin with any of your OWN choosing.`;

  // Pattern A: <p class="starters-intro">...</p>
  const startersRe = /(<p class="starters-intro">)[^<]*(<\/p>)/;
  // Pattern B: Einstein's <h2 class="section-title" ...>...</h2>
  const sectionTitleRe = /(<h2 class="section-title"[^>]*>)[^<]*(<\/h2>)/;

  if (startersRe.test(html)) {
    html = html.replace(startersRe, `$1${newIntro}$2`);
  } else if (sectionTitleRe.test(html)) {
    html = html.replace(sectionTitleRe, `$1${newIntro}$2`);
  } else {
    console.error(`  [${c.file}] FAILED: starters-intro not found`);
    results.push({ file: c.file, ok: false, step: 'replace-intro' });
    continue;
  }

  // ── Verify all three changes happened ─────────────────────────────────────
  const quoteGone    = !html.includes('<div class="quote-section">');
  const introReplaced = html.includes(newIntro);
  const bioIdx2      = html.indexOf(bioOpenTag);
  const decIdx2      = html.indexOf('<div class="decision-section"');
  const bioBeforeDec = bioIdx2 !== -1 && decIdx2 !== -1 && bioIdx2 < decIdx2;

  if (!quoteGone || !introReplaced || !bioBeforeDec) {
    console.error(`  [${c.file}] VERIFY FAIL: quoteGone=${quoteGone} introReplaced=${introReplaced} bioBeforeDec=${bioBeforeDec}`);
    results.push({ file: c.file, ok: false, step: 'verify', quoteGone, introReplaced, bioBeforeDec });
    continue;
  }

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`  [${c.file}] OK: quote removed, bio moved before call box, intro replaced.`);
  results.push({ file: c.file, ok: true });
}

console.log('\n=== SUMMARY ===');
for (const r of results) {
  console.log(`${r.ok ? '✓' : '✗'} ${r.file}${r.ok ? '' : ' — ' + r.step}`);
}
const allOk = results.every(r => r.ok);
console.log('\nOverall:', allOk ? 'SUCCESS' : 'SOME FAILURES');
process.exit(allOk ? 0 : 1);
