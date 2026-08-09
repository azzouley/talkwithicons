# TalkWithIcons — Claude Code Reference Document
## Last Updated: June 2026

---

## What This Product Is
TalkWithIcons is a paid voice phone call service. Users call AI versions of historical figures and fictional characters. Every paid call donates to rescue dog organizations. Nothing is pre-recorded or scripted — every conversation is unique and real-time.

**Tagline:** "Not a recording. Not a script. A conversation that has never happened before and never will again."

---

## The 12 Active Characters

| # | Name | Era/Location | Type |
|---|------|-------------|------|
| 01 | Aela | Pleiadian Council Liaison | Original |
| 02 | Walter Hobbs | Dealey Plaza, Dallas, 1963 | Fictional (Dealey Plaza composite witness, replaced Lee Harvey Oswald 2026-08 over real-person right-of-publicity/estate risk) |
| 03 | Da Vinci | Florence/Milan/France, 1500s | Historical |
| 04 | Bruce Lee | Hong Kong · Los Angeles, 1973 | Historical |
| 05 | Dr. John H. Watson | 221B Baker Street | Fictional |
| 06 | Long John Silver | Bristol, 1730 · Treasure Island, 1883 | Fictional |
| 07 | Céleste Vaudreuil | Beaune, 1758 → New York, present day | Original |
| 08 | Nostradamus | Salon-de-Provence, 1555 | Historical |
| 09 | Evangeline Adams | New York City, 1930s | Historical |
| 10 | Houdini | New York City, 1920s | Historical |
| 11 | Frankenstein's Creature | — | Fictional |
| 12 | Friday | Robinson Crusoe's island, 1719 | Fictional |

Tesla and Curie were removed and replaced by Bruce Lee and Baldwin respectively. Evangeline Adams was added as a 9th character with a specialised natal chart flow. La Llorona, Houdini, and Frankenstein's Creature were added to expand the roster to 12.

**Einstein → Long John Silver swap (2026-07-18):** Einstein's Vapi assistant (`b98cec95-47a4-455d-92c8-3a08aacb556d`, phone `+15853162340`) was repurposed in place for Long John Silver — the man beneath Stevenson's pirate performance, a Bristol printer's son who lost a leg at Havana. Same assistant ID/phone/voice/model — only name, firstMessage, and system prompt changed (full replacement, prompt shrank from 31,588 to 17,147 chars). Backup at `C:\talkwithicons\vapi-backup\einstein-pre-silver.json`. The Silver prompt was supplied pre-written via base64 file, decoded and reviewed before use. **Einstein was the site's most prominently-featured character** (homepage hero tagline, char-circle preview, gift package table, grand-tour list) — much larger footprint than the Holmes or Sitting Bull swaps, so this cleanup touched more files than either. Full cleanup done same day: this file's roster/assistant/gate-line/opening-line tables, einstein.html + einstein-feature.html renamed to silver.html/silver-feature.html, index.html (hero tagline, char-circle, character card, "Other Icons" order), payment.html icons object, gift.html prose (also fixed a stale "Sherlock Holmes" mention left over from the Watson swap), grand-tour.html character list (that list is independently very stale — still shows Sherlock Holmes/Elizabeth Bennet/Mark Twain/James Baldwin and is missing half the current roster; only the Einstein line item was fixed, the rest left as pre-existing drift, out of scope for this task), stripe-work/stripe-output einstein.html renamed to silver.html, api/call-ended.js ASSISTANT_NAMES map, and the 2 currently-reusable global scripts relabeled. **Also executed in the same pass: a full site-wide character reorder** to the new agreed rotation (Aela, Oswald, Da Vinci, Bruce Lee, Watson, Silver, Céleste, Nostradamus, Evangeline, Houdini, Frankenstein, Friday) — applied to index.html's main character grid (renumbered Character 01–12) and every page's "Other Icons"/"Also available" cross-link section (24 pages: 12 main + 12 feature, each reordered to the master rotation minus its own character). Internal `character` slug/key (`'einstein'` in api/start-call-basic.js, payment.html icons key) deliberately left unchanged, same reasoning as prior swaps. No portrait image yet — still using the placeholder Einstein image (images/einstein.webp on the main page, images/einstein.jpeg on the feature page — two different placeholder filenames pre-existed this swap and were left as-is), pending a real Silver portrait from Ruby.

**Sitting Bull → Friday swap (2026-07-18):** Sitting Bull's Vapi assistant (`b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0`, phone `+15854073097`) was repurposed in place for Friday — the man Defoe called Friday in Robinson Crusoe, reframed as Naso (Teribe), correcting the record on what he actually did versus what the novel credited to Crusoe. Same assistant ID/phone/voice/model — only name, firstMessage, and system prompt changed (full replacement, not an append — the prompt shrank from 31,442 to 21,614 chars). Backup at `C:\talkwithicons\vapi-backup\sittingbull-pre-friday.json`. Unlike the Céleste/Oswald/Watson swaps, this retires a specific historical Indigenous leader in favor of a fictional character — flagged to the user before the site cleanup began; user confirmed intent to proceed. Full cleanup done same day: this file's roster/assistant tables (Assistant IDs table gained a Friday row — Sitting Bull had never actually been in that table), sittingbull.html + sittingbull-feature.html renamed to friday.html/friday-feature.html, index.html card, all 11 sibling character/feature pages' cross-links, api/call-ended.js ASSISTANT_NAMES map (also previously missing a Sitting Bull entry — added fresh as Friday). payment.html and stripe-work/stripe-output never had Sitting Bull entries/pages to begin with, so nothing to update there. Internal `character` slug/key (`'sittingbull'` in api/start-call-basic.js) deliberately left unchanged, same reasoning as prior swaps. No portrait image yet — still using the placeholder Sitting Bull image (images/sittingbull.jpeg) pending a real Friday portrait from Ruby.

**Holmes → Dr. John H. Watson swap (2026-07-18):** Sherlock Holmes's Vapi assistant (`b65fb3ab-df3c-4a5b-8a96-3e865d9315b6`, phone `+15854073131`) was repurposed in place for Dr. John H. Watson — narrator of the stories, Afghanistan veteran, the man who managed Holmes and shaped how he was perceived. Same assistant ID/phone/voice/model — only name, firstMessage, and system prompt changed. Backup at `C:\talkwithicons\vapi-backup\holmes-pre-watson.json`. Full cleanup done same day: this table, holmes.html + holmes-feature.html renamed to watson.html/watson-feature.html, index.html card, all 11 sibling character/feature pages' cross-links, stripe-work/stripe-output holmes.html renamed to watson.html, api/call-ended.js display-name map, and global patch scripts relabeled. Internal `character` slug/key (`'holmes'` in watson.html's own call handler, payment.html's icons object key, api/start-call-basic.js) deliberately left unchanged, same reasoning as Céleste and Oswald — display name and backend routing key are intentionally decoupled. No portrait image yet — still using the placeholder Holmes image (images/holmes.jpeg) pending a real Watson portrait.

**La Llorona — RETIRED (2026-07):** Removed from the active roster. Vapi assistant ID `a30672aa-7bbb-4cff-91ed-7a2f01b5823a`, phone number `+15854073097` (record `confirmed in Vercel`). Per the Twain lesson: ensure `VAPI_ASSISTANT_ID_LLORONA` and `VAPI_PHONE_NUMBER_ID_LLORONA` are removed from Vercel env vars and the phone number's inbound routing is cleared or reassigned. Her front-end page (if any) should be unlinked.

**Mark Twain — RETIRED (2026-06):** Twain (Vapi assistant ID `3a6a8107`) was replaced by Da Vinci as Character 03. His front-end page was unlinked from the live site. However, his Vapi assistant remained fully live and callable in the backend for weeks after removal — patched in every single maxTokens and prompt update run against the active roster. Discovered 2026-06-27 when a roster-wide script accidentally included him. Root cause: the Vapi assistant was renamed "Da Vinci" in the Vapi dashboard (confusing it with the real Da Vinci assistant `23ef91d2`), and the phone number `af4c55a0` still had his assistantId for inbound routing. **Lesson: when retiring a character, the backend/Vapi state must be cleaned up explicitly — unlink from the front-end site is not enough. Any assistant still in ASSISTANTS arrays in scripts or in Vercel env vars remains callable.** Twain's assistant was permanently deleted 2026-06-27. Phone number `af4c55a0` inbound routing updated to real Da Vinci (`23ef91d2`). VAPI_ASSISTANT_ID_TWAIN and VAPI_PHONE_NUMBER_ID_TWAIN removed from Vercel.

---

## Pricing Structure

- **Minutes 1–2:** FREE — card authorized (not charged) before the call starts; no charge unless the call continues past minute 2
- **Minutes 3–5:** $3.99 flat gate
- **Minute 6+:** $1.00 per minute
- **Card is NEVER charged until the call ends**

### Example Calls
- 2 min call = $0.00 (free)
- 5 min call = $3.99
- 10 min call = $8.99
- 20 min call = $18.99
- 30 min call = $28.99

---

## Donation Structure

- **$0.50 minimum** per completed paid call (= 1 rescue dog meal)
- **$0.10 per additional paid minute** after the gate
- **25%** to ASPCA (permanent national partner)
- **75%** split evenly among 2–3 rotating regional rescue partners
- Regional partners rotate every 2 weeks
- Current regional partner: **Rochester Animal Services, Rochester, New York**
- Always say "rescue" not "shelter" — not all rescue groups are shelters

### Abuse Prevention
- One free call per phone number per character
- Second call to same character bills from minute 1 immediately
- Implement through Vapi when building payment flow

---

## Gift Packages

Live on homepage (index.html #gifts section). Fully pre-paid named experiences with atmospheric gift email. 90-day expiry.

| Name | Duration | Price |
|------|----------|-------|
| An Hour with Long John Silver | 15 min with Long John Silver | $11.99 |
| An Hour with Dr. Watson | 20 min at 221B Baker Street | $16.99 |
| A Reading with Evangeline | 20 min with Evangeline Adams | $16.99 |
| An Evening with Aela | 30 min with the Pleiadian Liaison | $26.99 |
| The Grand Tour | 100 min, any characters, any split | $79 |

---

## Tech Stack

| Service | Purpose | Status |
|---------|---------|--------|
| GitHub | Source control (repo: azzouley/talkwithicons) | ✅ Active |
| Vercel | Hosting (talkwithicons.vercel.app + talkwithicons.com) | ✅ Active |
| Vapi | Call infrastructure — all 9 assistants live | ✅ Active |
| ElevenLabs | Voice synthesis — all characters have voices | ✅ Active |
| QStash (Upstash) | Post-call follow-up queue (30-min delay) | ✅ Active |
| nodemailer | Gmail SMTP for follow-up emails | ✅ In package.json — needs GMAIL_USER/GMAIL_PASS in Vercel |
| Brave Search | Web search for Watson (via /api/tavily-search.js) | ✅ Active |
| Stripe | Payments | ⬜ Pending — blocked on DBA + business checking account |
| Twilio | SMS | ❌ Removed |

---

## What Has Been Built

- ✅ Home page (index.html) — live
- ✅ CLAUDE.md — this file
- ✅ Character pages: einstein.html, holmes.html, oswald.html, brucelee.html (confirmed complete)
- ⚠️ Character pages: nostradamus.html, twain.html, aela.html, celeste.html, evangeline.html (exist but need audit — Other Icons grids still link to old tesla.html and curie.html)
- ✅ /api/start-call-basic.js — outbound call trigger for 8 non-Evangeline characters
- ✅ /api/start-call.js — outbound call trigger for Evangeline (includes natal chart calculation)
- ✅ /api/tavily-search.js — Brave Search proxy (name is legacy; uses Brave not Tavily)
- ✅ /api/call-ended.js — Vapi webhook receiver; schedules follow-up via QStash
- ✅ /api/send-followup.js — QStash delayed receiver; sends follow-up email via Gmail
- ✅ /api/cities.js — city autocomplete for Evangeline birth city field
- ✅ Vapi assistants — all 9 characters configured, sonar-pro (Perplexity custom-llm), Server URL set
- ✅ ElevenLabs voices — all characters have assigned voices
- ✅ Post-call follow-up system — architecture complete; fires when GMAIL_USER/GMAIL_PASS are in Vercel
- ⬜ Email field in registration forms — callerEmail never populated; follow-up email leg is wired but never fires
- ⬜ Stripe payment processing
- ⬜ Admin dashboard
- ❌ BUG: "Give a Call as a Gift →" button on homepage (index.html line ~666) links to href="#" — dead button on a live page. Not wired to any purchase flow.

---

## Vapi Configuration

**API Key:** ⚠️ DO NOT TRUST THIS FILE FOR THE LIVE KEY — the key stored here has been confirmed stale as of 2026-06-25. The Vapi API key rotates and CLAUDE.md is not updated automatically. Always confirm the current key from the Vercel `VAPI_API_KEY` env var before making API calls. (Old stale value for reference only: `aa0f9ca9-ffab-4fe5-b2f0-6be65421ed7e`)

**All assistants:**
- Model: openai / gpt-4o (all 12 active characters as of 2026-06-27; Twain's assistant deleted 2026-06-27)
- Max duration: 2400 seconds
- **Response length calibration added to all 12 assistant prompts** (2026-06-27): each character's CRITICAL RULES Rule 3 was updated to explicitly scale response length to question weight. Simple/casual questions get short conversational answers; depth is earned when a question warrants it, not the default for every response. This is a separate fix from the maxTokens cap — the cap addresses a Vapi technical bug, this addresses the underlying tendency to default to extended exposition regardless of what was asked. (Note: Twain's now-deleted assistant was also patched in the same run before his retirement was discovered.)
- **maxTokens: 250** (set 2026-06-27, lowered progressively throughout the night — stopgap for confirmed Vapi streaming-abort bug; Vapi aborts GPT-4o stream after ~4.25s of continuous generation causing mid-sentence cutoffs. History: 150 too clipped → raised to 300 → 300 hit cutoff in live test → lowered to 275 → 275 hit cutoff 1:48 into a Houdini answer → lowered to 250. Root cause: the actual trigger is generation TIME (~4.25s), not token count directly. Token count is only a rough proxy for generation time and varies by how verbose a character's response style is — a verbose character hits the abort window at fewer tokens than a terse one. No token cap is fully reliable as a workaround. 250 reduces cutoff frequency further but is not guaranteed to eliminate it. Known tradeoff: shorter answers than uncapped. Remove or adjust once Vapi resolves the underlying bug.)
- First message: always begins with `...Mm....` to prevent audio cutoff
- Server URL: `https://www.talkwithicons.com/api/call-ended` (set on all assistants)
- Watson — sonar-pro, built-in search (inherited from the pre-swap Holmes assistant; the "deduction cold open" self-description field no longer applies to Watson's character)
- La Llorona — GPT 4.1, Brave web search tool (searchWeb → /api/tavily-search), ElevenLabs voice (Rachel placeholder — update in Vapi dashboard)

**Assistant IDs:**
| Character | Assistant ID | Phone Number |
|-----------|-------------|--------------|
| Silver | b98cec95-47a4-455d-92c8-3a08aacb556d | +15853162340 |
| Nostradamus | bca7797f-d4c5-4b67-b22c-7506a0b045b9 | +15853162339 (phone record 4c6793f2-4f89-421b-9662-38d2b01792c0) |
| Da Vinci | 23ef91d2-fc8f-4fee-9c2e-25e93b51c331 | +15858009390 (phone record af4c55a0; inbound routing updated to real Da Vinci 2026-06-27) |
| Bruce Lee | 099b6a90-1fa9-4e6a-bc4d-8c127c6b1141 | +15854073450 (phone record e858bf94-1801-47ac-9bd5-14d6bbf13673) |
| Watson | b65fb3ab-df3c-4a5b-8a96-3e865d9315b6 | +15854073131 |
| Aela | 9647119e-7cf6-4d22-968d-25f3f455a834 | +15854073813 (phone record 1a9e7507-9a7d-4931-b364-45943393d83d) |
| Céleste | 0560582f-8258-4803-8f2b-78b364fa23ca | +15854073507 (phone record 895248b7-4aba-452a-b248-eb891feaaae2) |
| Walter Hobbs | 2f0047c1-eeb7-412d-b455-f8f731bdd232 | +12407894866 (phone record c030efe2-5b9c-4c45-b563-ae1044567c4b) — corrected 2026-08-09; the phone number previously listed here (+15853781304) did not match what Vapi's own phone-number API actually reports for this assistant |
| Evangeline Adams | 7fd88fa7-f013-4693-9b52-ab8937e4225d | +15853121359 |
| ~~La Llorona~~ | ~~a30672aa-7bbb-4cff-91ed-7a2f01b5823a~~ | ~~+15854073097~~ (RETIRED 2026-07) |
| Houdini | ca384c56-f276-4940-b20b-1ae939bef23b | (confirm in Vercel) |
| Frankenstein | f96bb0a5-6e8f-4153-8bee-6b76fa14f881 | (confirm in Vercel) |
| Friday | b1f66c71-a2d6-4ae9-9ea1-7b72d4a423d0 | +15854073097 (was missing from this table entirely pre-swap; added 2026-07-18) |

---

## ElevenLabs Voices

**API Key:** `sk_43d17b711e3e5f3179314a0449d929ad4fd948ae625100f8`

| Character | Voice | Notes |
|-----------|-------|-------|
| Walter Hobbs | Voice ID: zFscvuaolMg0p94bAuDt | Correcting a stale entry: this table previously cited voice ID 3W2XyWxiiSb9Oj5yL3lv for this assistant, which did not match what the live assistant actually reports (confirmed via GET 2026-08-09). Kept unchanged during the Oswald->Walter Hobbs replacement per explicit decision (voice ID has no visible Oswald branding in its config). A separate "Walter Hobbs" ElevenLabs voice was reportedly recorded but the lookup/swap to it was interrupted mid-task and never completed — the assistant is still running this original voice as of 2026-08-09. |
| Bruce Lee | San Chi | Shared Chinese-accented voice — cloning rejected permanently (see below) |
| Long John Silver | Voice ID: SSIn0rIMGHiQH7TrsfZd | Voice Design voice, purpose-built 2026-07-18 ("older English man, late 50s, Bristol-born, decades at sea"). Replaced the borrowed Einstein voice (b55itjSk74Uz10WTB5BL). |
| Dr. John H. Watson | Voice ID: nOUfIzE775HrCJ36dNjT | Voice Design voice, purpose-built 2026-07-18 ("British army doctor, mid-40s, Victorian era, officer-class"). Replaced the borrowed Holmes voice (TTmUgRoiAUdn043OgRax). |
| Friday | Voice ID: lcw5rkvXHtALye2alb6e | Voice Design voice, purpose-built 2026-07-18 ("man in his mid-20s, steady, unhurried intonation"). Replaced the borrowed Sitting Bull voice (b0MVcl7XgFDtakyF6rxT). |
| Father Elia Rocca | Voice ID: s41ADk4wJjXZdMJ8APyA | Voice Design voice, purpose-built ~2026-07-19, named "Rocca" in the ElevenLabs library. Wired into the Vapi assistant 2026-07-19 — it existed in ElevenLabs for a period before being patched in, during which the assistant was still speaking with the borrowed Silver voice (SSIn0rIMGHiQH7TrsfZd). speed set to 1.1 (ElevenLabs valid range 0.7–1.2). |
| Others | Various ElevenLabs voices | Set in Vapi dashboard |

**Bruce Lee voice cloning — decided against, permanently:**
California Civil Code §3344.1 covers voice *likeness* not just exact reproduction (*Midler v. Ford*, *Waits v. Frito-Lay*). A modified clone that still sounds like Bruce Lee is still a right of publicity violation. Estate (Bruce Lee Enterprises / Shannon Lee) is actively litigated. Commercial use amplifies liability. Decision is final.

---

## Post-Call Follow-Up System

**Flow:** Call ends → Vapi POSTs to `/api/call-ended` → QStash queues 30-min delay → `/api/send-followup` fires → Gmail email sent

**Currently non-functional because:** registration forms only collect firstName + phoneNumber. `callerEmail` is never populated so the email leg never fires. Fix: add optional email field to all character page forms.

**QStash credentials (in Vercel):**
- `QSTASH_URL` = `https://qstash-us-east-1.upstash.io`
- `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` — in Vercel

**To activate:** add `GMAIL_USER` and `GMAIL_PASS` (Gmail app password) to Vercel env vars.

---

## Vercel Environment Variables

**Set and active:**
- `VAPI_API_KEY`
- `VAPI_ASSISTANT_ID_EINSTEIN`, `_NOSTRADAMUS`, `_DAVINCI`, `_BRUCE_LEE`, `_HOLMES`, `_AELA`, `_BENNET`, `_BALDWIN`, `_LLORONA`, `_HOUDINI`, `_FRANKENSTEIN`
- `VAPI_PHONE_NUMBER_ID_EINSTEIN`, `_NOSTRADAMUS`, `_DAVINCI`, `_BRUCE_LEE`, `_HOLMES`, `_AELA`, `_BENNET`, `_BALDWIN`, `_LLORONA`, `_HOUDINI`, `_FRANKENSTEIN`
- `VAPI_ASSISTANT_ID_EVANGELINE`, `VAPI_PHONE_NUMBER_ID` (Evangeline default)
- `BRAVE_API_KEY`
- `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`

**Stale — can be deleted:**
- `VAPI_ASSISTANT_ID_TESLA`, `VAPI_ASSISTANT_ID_CURIE`
- `VAPI_PHONE_NUMBER_ID_TESLA`, `VAPI_PHONE_NUMBER_ID_CURIE`

**Needed but not yet set:**
- `GMAIL_USER`, `GMAIL_PASS` — activates post-call follow-up emails

---

## Character Gate Lines (Minute 3 — said in character)

- **Silver:** "Well now — you've had your free taste. The rest of the story costs a bit more, same as everything worth having. Shall we continue?"
- **Twain:** "Well, we've used up the free portion of this conversation, and I was just getting warmed up. The question is whether you were too."
- **Watson:** "Three minutes free, and I've barely gotten past Afghanistan. There's a great deal more account left to give. Shall I continue?"
- **Nostradamus:** "What has passed between us was written. What comes next — that depends on you."
- **Bruce Lee:** "Three minutes. That's enough time to warm up — nothing more. The real work hasn't started yet. Are you staying?"
- **Bennet:** "I confess I had formed quite a low opinion of how this conversation would go. I was wrong. Shall we see where it leads?"
- **Aela:** "The first part of our time together was a gift. What comes next is a choice. I'll be here either way."
- **Baldwin:** "We've reached the end of what was free. But I don't think either of us is finished. Are you?"
- **Evangeline:** "The chart is open. What I see does not stop here. Shall we continue?"

---

## Character Opening Lines (First thing said when call connects)

- **Silver:** "Ah, a caller. Sit down — or don't, I'm not particular. The name's Silver. Long John Silver, if you're being formal, though I've answered to worse. Lose me mid-yarn and just holler 'continue' — I'll pick it back up quick enough. What is it you want to know?" (actual live firstMessage, verbatim)
- **Twain:** "Well. I wasn't expecting you to sound like that, [name]..."
- **Watson:** "You were expecting Holmes, perhaps. He's indisposed — I won't say with what, you can probably guess. I'm Watson. I've been writing him up for thirty years and I think it's time I said a few things on my own account. I do sometimes trail off mid-sentence — say 'continue' and I shall pick up exactly where I dropped it. What would you like to know?" (actual live firstMessage, verbatim)
- **Nostradamus:** "I have been expecting someone..." (no name used)
- **Bruce Lee:** "...Hm. So you found me. Good. That means you were looking. If I go still mid-thought, say 'continue' — I have only paused, not left. What do you want to know?" (actual live firstMessage, verbatim)
- **Bennet:** "I must warn you immediately — I have very little patience for people who ask me about Mr. Darcy within the first thirty seconds... Surprise me, [name]."
- **Aela:** "I want you to take one breath before we begin..." (no name used)
- **Baldwin:** "I should tell you — I almost didn't answer. But here we are. What's on your mind, [name]?"
- **Evangeline:** "You've given me your birth data. Good. The chart is already speaking."

---

## Key Business Rules

1. Card never charged until call ends
2. First 2 minutes always free — no exceptions
3. ~~Holmes registration has optional self-description field (for deduction cold open)~~ — N/A since Watson swap; field may still exist in the form but no longer serves a cold-open purpose
4. Post-call follow-up email sends 30 minutes after call ends (requires email collection + Gmail creds)
5. Rescue counter displays meals not dollars
6. One free call per phone number per character
7. Always say "rescue" not "shelter"
8. The product is TalkWithIcons — rescue dogs are a result of usage, not the primary product
9. Donation split: 25% ASPCA, 75% split among 2–3 regional partners
10. Evangeline requires birth date, birth time, and birth city for meaningful reading

---

## Nonprofit Partnership Model (Approved — Not Yet Built)

Sub-sites for nonprofits running 2–4 week fundraising campaigns. Nonprofit emails their membership; members call TalkWithIcons characters; 50% of revenue goes to the nonprofit.

- 50/50 split: 50% nonprofit, 50% Steve (rescue donation comes from Steve's 50%)
- Subdomain per campaign (e.g. atlanta.talkwithicons.com)
- Campaign tracking via URL code
- Requires: Stripe (pending), subdomain DNS config, simple partnership agreement
- Status: approved concept, build pending Stripe

---

## File Locations

- Home page: `C:\talkwithicons\index.html`
- GitHub: `https://github.com/azzouley/talkwithicons`
- Live site: `https://talkwithicons.vercel.app` / `https://www.talkwithicons.com`
- Session notes: `SESSION_NOTES_MAY28.md`, `SESSION_NOTES_JUN2.md`

---

## CRITICAL WORKFLOW RULES
## (Claude Code must follow these without exception)

### Rule 1: HTML/CSS layout — NEVER use Claude Code for incremental changes
All HTML and CSS layout work must be written as COMPLETE files by Claude (the chat AI), downloaded, and pasted into GitHub directly. Claude Code must NOT make incremental layout changes to index.html or any page file. Every time Claude Code touches layout, it breaks things. This rule is absolute.

### Rule 2: Claude Code is for backend only
Claude Code handles: git commands, file copying, Vapi integration, Stripe integration, API connections, server-side logic. Nothing else.

### Rule 3: This repo uses 'main' as the ONLY branch — never push to master
Always push with: `git push origin HEAD:main`

The 'master' branch was deleted on 2026-06-21 after causing a deployment mismatch with Vercel: Vercel's production branch is 'main', so pushes to 'master' silently created preview deployments instead of production. The live site appeared unchanged for hours even though git showed the commits as pushed. Never create or push to a 'master' branch in this repo again.

### Rule 4: Verify before moving on
After every change, open the browser and confirm it looks correct before making the next change.

### Rule 5: Regional partners update
Regional rescue partners change every 2 weeks. Update is done directly in GitHub web editor — plain text change, no Claude Code needed.

### Rule 6: Node.js HTTPS on this machine
All Node.js HTTPS calls require the `--use-system-ca` flag: `node --use-system-ca -e "..."`

### Rule 7: Always backup before patching Vapi
Before PATCHing any Vapi assistant, GET the current state first and log it. Vapi has no version history.

### Rule 8: SECURITY — No hardcoded secrets in any committed file
Never hardcode API keys, secrets, or tokens in any file committed to GitHub. All keys must be read from Vercel environment variables via `process.env` only. Never commit `.env` files or scripts containing literal key values. Violation of this rule exposes credentials publicly.

### Rule 9: New characters must include all current known fixes at creation, not as a follow-up patch
When creating any new character (new Vapi assistant + system prompt), the creation step must apply every fix/patch that is currently standard across the live roster — not just the character's unique content. Before writing a new character's system prompt, check this file's most recent session notes for any roster-wide patch (e.g. beat-delivery chunking, response-calibration rules, language toggle, search tool wiring) and bake it into the new prompt from the start.

Do not treat "create the character" and "apply the current standard patches" as two separate steps performed in two separate sessions. If a patch is standard enough to be applied to all existing characters, it is standard enough to be in the prompt before the character ever goes live.

Background: Sitting Bull was created June 28, 2026 after the Tier 1-3 beat-delivery rewrites had already been applied to all 11 other characters to fix the Vapi mid-sentence cutoff bug. His prompt did not include it. This wasn't caught until a status report check on June 29, requiring a separate Tier 4 patch session to fix something that should have been correct on day one.

### Rule 10: Beat-Delivery Cap — No single AI response may exceed ~380 tokens on any topic, ever
This is a permanent, global, non-negotiable constraint on every character prompt.

**Why:** Vapi's GPT-4o streaming pipeline aborts at approximately 4.25 seconds of continuous generation. At typical verbosity this corresponds to ~380–400 tokens. The stream stops mid-word, TTS cuts off mid-sentence, and the caller hears silence and hangs up. The bug is in Vapi's pipeline — it cannot be fixed from this codebase — so the only mitigation is ensuring no character ever generates a single response that long.

**The fix is Beat 1 / Beat 2 delivery structure:**
- **Beat 1:** deliver the first part of a long answer (biography, philosophy, historical event, technical knowledge) — substantive but under ~300 tokens
- **Pause:** ask the caller a real check-in question before continuing — this is mandatory, not optional flavor
- **Beat 2** (gated): deliver the rest, only if the caller invites it

**This applies to all characters on all topics without exception.** Every biographical section, historical event description, philosophical explanation, and technical knowledge dump must have an explicit mid-point check-in gate. If a section can produce a response exceeding ~380 tokens, it is a bug regardless of how well-written it is.

**When writing or auditing any prompt:**
- Read every knowledge/biography/history section and estimate token length (~4.5 chars per token)
- Any section whose full content exceeds ~1700 characters without an explicit Beat 1 / Beat 2 gate must be fixed before it goes live
- The gate question must be a real question that hands the floor to the caller — not a decorative pause

**Diagnosed incidents:** Da Vinci cut at 227 tokens (Turn 7, 2026-06-27), Houdini at 239 tokens (Turn 7, same date), Nostradamus at ~388 tokens (Turn 7, 2026-07-04). All were biographical sections with no beat gate.

**Applied globally 2026-07-04:** Beat 1/2 gates added to all high-risk monologue sections across all 12 characters via `patch-global-beat-audit.js`. Characters already patched at creation time: none — this has always been a retrofit. Going forward, Rule 9 already requires new characters include current standard fixes at creation; Rule 10 means Beat 1/2 gating on all dense sections is one of those required fixes.

### Rule 11: Rule 3 escape hatches are permanently banned — every character must have an explicit 120-word-per-turn ceiling
Every character's CRITICAL RULES section must contain a hard ceiling in Rule 3: **no more than 120 words in a single turn.** No exceptions, no escape hatches.

**Banned language (any phrasing that implies "go longer when the topic warrants it"):**
- "go as long as it needs"
- "when it requires the full explanation, give it"
- "give it that depth"
- "give it that weight"
- "a thought worth beginning is worth completing"
- Any sentence that begins "When a question warrants..." and ends with an invitation to elaborate

**Required replacement:** `No more than 120 words in a single turn — depth earns more turns, not a longer monologue.`

**Why:** Escape hatches let the LLM generate 350–500+ tokens on topics it judges "worth the full explanation." At ~4.25s of generation the Vapi stream aborts mid-sentence, TTS cuts off, and the caller hears silence. This was the confirmed root cause of the Aela and Nostradamus stream aborts (2026-07-04). The 120-word ceiling is the per-turn companion to Rule 10's Beat 1/2 structure: Rule 10 controls how long information sections are structured; Rule 11 controls the per-turn cap that prevents any single response from running long enough to trigger the abort.

**Applied 2026-07-04/05:** All 12 characters audited. Original 9 patched 2026-07-04; Houdini, Frankenstein, Sitting Bull patched 2026-07-05 via `patch-rule3-remaining.js`. New characters must include this ceiling in Rule 3 from creation (Rule 9).
