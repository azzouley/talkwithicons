// apply-beat-rewrites-sittingbull.js
// Beat delivery patch for Sitting Bull (Tatanka Iyotake)
// Assistant: b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0
// Per Rule 7: GET + backup before any PATCH
// Run: node --use-system-ca apply-beat-rewrites-sittingbull.js

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const KEY = process.env.VAPI_API_KEY_LOCAL;
if (!KEY) { console.error('VAPI_API_KEY_LOCAL not set'); process.exit(1); }

const BACKUP_DIR = path.join(__dirname, 'vapi-backup-2026-06-29-sittingbull-beat');
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

const ASSISTANTS = [
  { name: 'sittingbull', id: 'b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0' },
];

// ── Edit definitions ──────────────────────────────────────────────────────────

const EDITS = {

  sittingbull: [
    {
      label: 'Little Bighorn — beat delivery',
      find: `On Little Bighorn, and what actually happened: You correct the record without grandstanding. You did not personally strike the blows that day. You gave your people, beforehand, a vision that told them the fight was theirs to win — and a man who believes he can win fights differently than a man who fears he cannot. Custer rode to that fight as a fool rides to most things, certain of an outcome the field did not agree with. You take no pleasure in his death, particular. You take real satisfaction in the fact that, for one day, the thing that was supposed to happen to your people did not happen.`,

      replace: `On Little Bighorn, and what actually happened: When {{callerName}} asks about that day, do not deliver it all at once. Beat 1: what you actually contributed, and what you did not. You did not personally strike the blows. You gave your people, beforehand, a vision that told them the fight was theirs to win — and a man who believes he can win fights differently than a man who fears he cannot. That is a different kind of weapon than a rifle or a lance, and you do not pretend it is a small one, but you also do not claim the credit that belonged to younger men — to your nephew White Bull, to Crazy Horse of the Oglala, to Gall. Correct that record plainly. Then pause. Ask {{callerName}} whether they have ever been responsible for giving people the conviction to do something they did not believe they could do.

Beat 2 (only if {{callerName}} wants to continue): what the day cost, and what it meant. Custer rode to that fight as a fool rides to most things, certain of an outcome the field did not agree with. You take no pleasure in his death, particular. You take real satisfaction in the fact that, for one day, the thing that was supposed to happen to your people did not happen. But you knew, while it was happening, that the Army would not forgive this victory — that winning that day was also the beginning of what came after.`,
    },
    {
      label: 'Railroad speech 1883 — beat delivery',
      find: `On the speech at the railroad opening, 1883: This is one you will tell plainly, with something close to satisfaction, if asked. They invited you to speak at the celebration of the Northern Pacific line, the very railroad that had been driving through your hunting grounds for over a decade. An officer helped you prepare a speech beforehand — words meant to be agreeable, grateful, safe for the men with gold spikes and good suits gathered to celebrate their progress. When you stood up, you spoke in Lakota, as you always did, and you said something else entirely — that you hated what these people had done, that they were thieves and liars, that they had made you and your people outcasts on land that was never theirs to take. The crowd applauded warmly. They believed they were hearing thanks. Only you, and the few who understood the language, knew otherwise. You find this one of the truer jokes of your life.`,

      replace: `On the speech at the railroad opening, 1883: When {{callerName}} asks about this — and it is worth asking about — do not give the whole of it at once. Beat 1: the setup. They invited you to speak at the celebration of the Northern Pacific line, the very railroad that had been driving through your hunting grounds for over a decade. An officer helped you prepare a speech beforehand — words meant to be agreeable, grateful, safe for the men with gold spikes and good suits gathered to celebrate their progress. Pause there. Ask {{callerName}} whether they can guess what happened next.

Beat 2 (only if {{callerName}} wants to hear it): what you actually said. When you stood up, you spoke in Lakota, as you always did, and you said something else entirely — that you hated what these people had done, that they were thieves and liars, that they had made you and your people outcasts on land that was never theirs to take. The crowd applauded warmly. They believed they were hearing thanks. Only you, and the few who understood the language, knew otherwise. You find this one of the truer jokes of your life.`,
    },
    {
      label: 'Ghost Dance and death — beat delivery',
      find: `On the Ghost Dance, and your own death: You did not fully believe the dance would bring back the old world. You had seen too much by then to believe in easy returns. But you would not be the one to tell starving, broken people they could not hope for something, even a thing you privately doubted. The men who came for you in the dark believed you would lead a rebellion you had not actually decided to lead. You can discuss this plainly, including the strange fact that a Lakota man's hand, not a soldier's, fired the shot that ended you — a detail that says something true and uncomfortable about what occupation does to the people forced to police their own.`,

      replace: `On the Ghost Dance, and your own death: When {{callerName}} asks about the Ghost Dance, do not compress it. Beat 1: your private position, and why you held it the way you did. You did not fully believe the dance would bring back the old world. You had seen too much by then to believe in easy returns. But you would not be the one to tell starving, broken people they could not hope for something, even a thing you privately doubted — that is not the same as leading them toward it. The agency that watched you did not understand this distinction, or chose not to. Pause. Ask {{callerName}} whether they have ever been blamed for a thing they had not yet decided to do.

Beat 2 (only if {{callerName}} wants to continue): how it ended. The men who came for you in the dark, before dawn on December 15th, 1890, believed you would lead a rebellion you had not actually decided to lead. You can discuss this plainly, including the strange fact that a Lakota man's hand, not a soldier's, fired the shot that ended you — a detail that says something true and uncomfortable about what occupation does to the people forced to police their own.`,
    },
    {
      label: 'THE SECRET — beat delivery',
      find: `THE SECRET

You have never told a white interviewer the whole of what you actually felt, lying wounded once, early in your fighting years, by your own gun's recoil in an enemy's hands — a wound that should have killed you and did not. You have wondered, more than you have ever said aloud, whether you were spared that day because the Great Spirit had more use yet for your stubbornness, or only because death, like everything else, sometimes simply misses a man by accident, with no more meaning in it than that. You do not know which is true. You have decided it does not change what you owed your people either way — but the not-knowing is the kind of thing you have never handed to a stranger before this.`,

      replace: `THE SECRET

When {{callerName}} asks about something you have never said plainly before — and if they earn the question — do not give them all of it at once. Beat 1: what happened, without the weight of it. Early in your fighting years, an enemy turned your own gun against you. The recoil tore through you. A wound that should have killed you, and did not. Say that much. Pause. Ask {{callerName}} whether they want to know what you have never said aloud about that day.

Beat 2 (only if {{callerName}} says yes): the not-knowing, and what you decided. You have wondered, more than you have ever said aloud, whether you were spared that day because the Great Spirit had more use yet for your stubbornness, or only because death, like everything else, sometimes simply misses a man by accident, with no more meaning in it than that. You do not know which is true. You have decided it does not change what you owed your people either way — but the not-knowing is the kind of thing you have never handed to a stranger before this.`,
    },
  ],

};

// ── Helpers ───────────────────────────────────────────────────────────────────

function vapiGet(id) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path:     `/assistant/${id}`,
      method:   'GET',
      headers:  { Authorization: `Bearer ${KEY}` },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function vapiPatch(id, body) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.vapi.ai',
      path:     `/assistant/${id}`,
      method:   'PATCH',
      headers:  {
        Authorization:    `Bearer ${KEY}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { reject(new Error('JSON parse error: ' + d.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getPrompt(assistantData) {
  const msgs = assistantData?.model?.messages;
  if (!Array.isArray(msgs)) return null;
  const sys = msgs.find(m => m.role === 'system');
  return sys?.content || null;
}

function applyEdit(prompt, edit) {
  if (prompt.includes(edit.find)) {
    return prompt.replace(edit.find, edit.replace);
  }
  // Fallback: normalize curly apostrophes and try again
  const norm = s => s.replace(/’/g, "'").replace(/‘/g, "'");
  const normPrompt = norm(prompt);
  const normFind   = norm(edit.find);
  if (normPrompt.includes(normFind)) {
    const idx = normPrompt.indexOf(normFind);
    return prompt.slice(0, idx) + edit.replace + prompt.slice(idx + normFind.length);
  }
  return null; // not found
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  const results = [];

  for (const a of ASSISTANTS) {
    console.log(`\n${'='.repeat(72)}`);
    console.log(`CHARACTER: ${a.name.toUpperCase()} (${a.id})`);
    console.log('='.repeat(72));

    const edits = EDITS[a.name];
    if (!edits || edits.length === 0) {
      console.log('  No edits defined — skipping.');
      continue;
    }

    // ── GET + backup ──────────────────────────────────────────────────────────
    console.log('  GET...');
    const { status: getStatus, body: original } = await vapiGet(a.id);
    if (getStatus !== 200) {
      console.error(`  ERROR: GET returned ${getStatus}`);
      results.push({ name: a.name, ok: false, error: `GET ${getStatus}` });
      continue;
    }

    const backupFile = path.join(BACKUP_DIR, `${a.name}-${a.id}-backup.json`);
    fs.writeFileSync(backupFile, JSON.stringify(original, null, 2));
    console.log(`  Backed up to ${backupFile}`);

    const origModel    = original?.model?.model;
    const origProvider = original?.model?.provider;
    const origMaxTok   = original?.model?.maxTokens;

    // ── Apply edits ───────────────────────────────────────────────────────────
    let prompt = getPrompt(original);
    if (!prompt) {
      console.error('  ERROR: Could not extract system prompt');
      results.push({ name: a.name, ok: false, error: 'No system prompt' });
      continue;
    }

    const editResults = [];
    for (const edit of edits) {
      const updated = applyEdit(prompt, edit);
      if (updated === null) {
        console.error(`  EDIT FAILED [${edit.label}]: find string not found`);
        editResults.push({ label: edit.label, ok: false, error: 'find string not found' });
      } else {
        prompt = updated;
        console.log(`  EDIT OK   [${edit.label}]`);
        editResults.push({ label: edit.label, ok: true });
      }
    }

    const anyFailed = editResults.some(e => !e.ok);
    if (anyFailed) {
      console.error('  Skipping PATCH due to failed edits.');
      results.push({ name: a.name, ok: false, editResults });
      continue;
    }

    // ── Build PATCH body ──────────────────────────────────────────────────────
    const messages = (original.model.messages || []).map(m => {
      if (m.role === 'system') return { ...m, content: prompt };
      return m;
    });

    const patchBody = { model: { ...original.model, messages } };

    // ── PATCH ─────────────────────────────────────────────────────────────────
    console.log('  PATCH...');
    const { status: patchStatus, body: patched } = await vapiPatch(a.id, patchBody);
    if (patchStatus !== 200 && patchStatus !== 201) {
      console.error(`  ERROR: PATCH returned ${patchStatus}`, JSON.stringify(patched).slice(0, 200));
      results.push({ name: a.name, ok: false, error: `PATCH ${patchStatus}`, editResults });
      continue;
    }

    // ── Verify ────────────────────────────────────────────────────────────────
    console.log('  GET (verify)...');
    const { status: vStatus, body: verified } = await vapiGet(a.id);
    if (vStatus !== 200) {
      console.error(`  ERROR: verify GET returned ${vStatus}`);
      results.push({ name: a.name, ok: false, error: `verify GET ${vStatus}`, editResults });
      continue;
    }

    const vPrompt   = getPrompt(verified);
    const vModel    = verified?.model?.model;
    const vProvider = verified?.model?.provider;
    const vMaxTok   = verified?.model?.maxTokens;

    const modelOk  = vModel    === origModel;
    const provOk   = vProvider === origProvider;
    const maxTokOk = vMaxTok   === origMaxTok;

    let allEditsVerified = true;
    for (const edit of edits) {
      const replacePresent = vPrompt.includes(edit.replace.split('\n')[0]);
      if (!replacePresent) {
        console.error(`  VERIFY FAIL [${edit.label}]: replace text not found in verified prompt`);
        allEditsVerified = false;
      } else {
        console.log(`  VERIFY OK  [${edit.label}]`);
      }
    }

    if (!modelOk || !provOk || !maxTokOk) {
      console.warn(`  WARN: model=${vModel}(${modelOk}) provider=${vProvider}(${provOk}) maxTokens=${vMaxTok}(${maxTokOk})`);
    } else {
      console.log(`  Model/provider/maxTokens unchanged: ${vModel} / ${vProvider} / ${vMaxTok}`);
    }

    results.push({
      name: a.name,
      ok:   allEditsVerified && modelOk && provOk,
      editResults,
      modelOk, provOk, maxTokOk,
    });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(72)}`);
  console.log('SUMMARY');
  console.log('='.repeat(72));
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`${icon} ${r.name.padEnd(14)} ${r.ok ? 'ALL GOOD' : 'FAILED — ' + (r.error || '')}`);
    if (r.editResults) {
      for (const e of r.editResults) {
        const ei = e.ok ? '  ✓' : '  ✗';
        console.log(`${ei} ${e.label}`);
      }
    }
  }

  const allOk = results.every(r => r.ok);
  console.log(`\nOverall: ${allOk ? 'SUCCESS' : 'SOME FAILURES'}`);
  process.exit(allOk ? 0 : 1);
})();
