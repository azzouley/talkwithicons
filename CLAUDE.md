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
| 01 | Albert Einstein | Princeton, 1955 | Historical |
| 02 | Nostradamus | Salon-de-Provence, 1555 | Historical |
| 03 | Da Vinci | Florence/Milan/France, 1500s | Historical |
| 04 | Bruce Lee | Hong Kong · Los Angeles, 1973 | Historical |
| 05 | Sherlock Holmes | 221B Baker Street | Fictional |
| 06 | Aela | Pleiadian Council Liaison | Original |
| 07 | Elizabeth Bennet | Longbourn, 1813 | Fictional |
| 08 | James Baldwin | Harlem, 1963 | Historical |
| 09 | Evangeline Adams | New York City, 1930s | Historical |
| 10 | La Llorona | — | Legend |
| 11 | Houdini | New York City, 1920s | Historical |
| 12 | Frankenstein's Creature | — | Fictional |

Tesla and Curie were removed and replaced by Bruce Lee and Baldwin respectively. Evangeline Adams was added as a 9th character with a specialised natal chart flow. La Llorona, Houdini, and Frankenstein's Creature were added to expand the roster to 12.

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
| The Einstein Evening | 15 min with Albert Einstein | $11.99 |
| A Consultation with Holmes | 20 min at 221B Baker Street | $16.99 |
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
| Brave Search | Web search for Holmes (via /api/tavily-search.js) | ✅ Active |
| Stripe | Payments | ⬜ Pending — blocked on DBA + business checking account |
| Twilio | SMS | ❌ Removed |

---

## What Has Been Built

- ✅ Home page (index.html) — live
- ✅ CLAUDE.md — this file
- ✅ Character pages: einstein.html, holmes.html, baldwin.html, brucelee.html (confirmed complete)
- ⚠️ Character pages: nostradamus.html, twain.html, aela.html, bennet.html, evangeline.html (exist but need audit — Other Icons grids still link to old tesla.html and curie.html)
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
- Holmes — sonar-pro, built-in search, deduction, optional self-description field at registration for cold open
- La Llorona — GPT 4.1, Brave web search tool (searchWeb → /api/tavily-search), ElevenLabs voice (Rachel placeholder — update in Vapi dashboard)

**Assistant IDs:**
| Character | Assistant ID | Phone Number |
|-----------|-------------|--------------|
| Einstein | b98cec95-47a4-455d-92c8-3a08aacb556d | +15853162340 |
| Nostradamus | bca7797f-d4c5-4b67-b22c-7506a0b045b9 | +15854073813 ⚠️ verify — may share Aela's line |
| Da Vinci | 23ef91d2-fc8f-4fee-9c2e-25e93b51c331 | +15858009390 (phone record af4c55a0; inbound routing updated to real Da Vinci 2026-06-27) |
| Bruce Lee | 099b6a90-1fa9-4e6a-bc4d-8c127c6b1141 | +15854073450 |
| Holmes | b65fb3ab-df3c-4a5b-8a96-3e865d9315b6 | +15854073131 |
| Aela | 9647119e-7cf6-4d22-968d-25f3f455a834 | +15854073813 |
| Bennet | 0560582f-8258-4803-8f2b-78b364fa23ca | +15854073507 |
| Baldwin | 2f0047c1-eeb7-412d-b455-f8f731bdd232 | +15853781304 |
| Evangeline Adams | 7fd88fa7-f013-4693-9b52-ab8937e4225d | +15853121359 |
| La Llorona | a30672aa-7bbb-4cff-91ed-7a2f01b5823a | +15854073097 |
| Houdini | ca384c56-f276-4940-b20b-1ae939bef23b | (confirm in Vercel) |
| Frankenstein | f96bb0a5-6e8f-4153-8bee-6b76fa14f881 | (confirm in Vercel) |

---

## ElevenLabs Voices

**API Key:** `6f723f94682599cf1fecba2071951b0820943ec820a9524cfd3e94bfd480595c`

| Character | Voice | Notes |
|-----------|-------|-------|
| James Baldwin | Voice ID: 3W2XyWxiiSb9Oj5yL3lv | Instant clone from archive.org audio ("Living and Growing in a White World") |
| Bruce Lee | San Chi | Shared Chinese-accented voice — cloning rejected permanently (see below) |
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

- **Einstein:** "Our free introduction is nearly finished — but I find I'm not quite ready to stop. Should we continue?"
- **Twain:** "Well, we've used up the free portion of this conversation, and I was just getting warmed up. The question is whether you were too."
- **Holmes:** "Three minutes. Barely enough time to establish the facts. We haven't even begun. I assume you wish to proceed?"
- **Nostradamus:** "What has passed between us was written. What comes next — that depends on you."
- **Bruce Lee:** "Three minutes. That's enough time to warm up — nothing more. The real work hasn't started yet. Are you staying?"
- **Bennet:** "I confess I had formed quite a low opinion of how this conversation would go. I was wrong. Shall we see where it leads?"
- **Aela:** "The first part of our time together was a gift. What comes next is a choice. I'll be here either way."
- **Baldwin:** "We've reached the end of what was free. But I don't think either of us is finished. Are you?"
- **Evangeline:** "The chart is open. What I see does not stop here. Shall we continue?"

---

## Character Opening Lines (First thing said when call connects)

- **Einstein:** "Ah — you called. I wondered if anyone would..." (no name used)
- **Twain:** "Well. I wasn't expecting you to sound like that, [name]..."
- **Holmes:** "Don't tell me anything yet, [name]. You've had a difficult week..."
- **Nostradamus:** "I have been expecting someone..." (no name used)
- **Bruce Lee:** "...Hm. So you found me. Good. That means you were looking. What do you want to know?"
- **Bennet:** "I must warn you immediately — I have very little patience for people who ask me about Mr. Darcy within the first thirty seconds... Surprise me, [name]."
- **Aela:** "I want you to take one breath before we begin..." (no name used)
- **Baldwin:** "I should tell you — I almost didn't answer. But here we are. What's on your mind, [name]?"
- **Evangeline:** "You've given me your birth data. Good. The chart is already speaking."

---

## Key Business Rules

1. Card never charged until call ends
2. First 2 minutes always free — no exceptions
3. Holmes registration has optional self-description field (for deduction cold open)
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
