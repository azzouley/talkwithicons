# TalkWithIcons — Claude Code Reference Document
## Last Updated: June 2026

---

## What This Product Is
TalkWithIcons is a paid voice phone call service. Users call AI versions of historical figures and fictional characters. Every paid call donates to rescue dog organizations. Nothing is pre-recorded or scripted — every conversation is unique and real-time.

**Tagline:** "Not a recording. Not a script. A conversation that has never happened before and never will again."

---

## The 9 Characters

| # | Name | Era/Location | Type |
|---|------|-------------|------|
| 01 | Albert Einstein | Princeton, 1955 | Historical |
| 02 | Nostradamus | Salon-de-Provence, 1555 | Historical |
| 03 | Mark Twain | New York City, 1905 | Historical |
| 04 | Bruce Lee | Hong Kong · Los Angeles, 1973 | Historical |
| 05 | Sherlock Holmes | 221B Baker Street | Fictional |
| 06 | Aela | Pleiadian Council Liaison | Original |
| 07 | Elizabeth Bennet | Longbourn, 1813 | Fictional |
| 08 | James Baldwin | Harlem, 1963 | Historical |
| 09 | Evangeline Adams | New York City, 1930s | Historical |

Tesla and Curie were removed and replaced by Bruce Lee and Baldwin respectively. Evangeline Adams was added as a 9th character with a specialised natal chart flow.

---

## Pricing Structure

- **Minutes 1–3:** FREE — always, no card required
- **Minutes 4–6:** $2.99 flat gate
- **Minute 7+:** $1.00 per minute
- **Monthly package:** $29.99 for 30 minutes
- **Card is NEVER charged until the call ends**

### Example Calls
- 3 min call = $0.00 (free)
- 5 min call = $2.99
- 10 min call = $6.99
- 20 min call = $16.99
- 30 min call = $26.99

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

| Name | Duration | Price |
|------|----------|-------|
| The Einstein Evening | 15 min with Einstein | $14.99 |
| A Consultation with Holmes | 20 min at 221B | $19.99 |
| A Reading with Nostradamus | 20 min in Salon-de-Provence | $19.99 |
| An Evening with Aela | 30 min with Aela | $29.99 |
| The Grand Tour | 10 min each with all 9 characters | $75.00 |

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

---

## Vapi Configuration

**API Key:** `[REDACTED]`

**All assistants:**
- Model: Perplexity sonar-pro via custom-llm (all 9 assistants — switched from GPT 4.1 on 2026-06-04)
- Max duration: 2400 seconds
- First message: always begins with `...Mm....` to prevent audio cutoff
- Server URL: `https://www.talkwithicons.com/api/call-ended` (set on all 10 assistants)
- All assistants now use Perplexity sonar-pro (custom-llm, url: https://api.perplexity.ai/chat/completions)
- Holmes — sonar-pro, built-in search, deduction, optional self-description field at registration for cold open

**Assistant IDs:**
| Character | Assistant ID | Phone Number ID |
|-----------|-------------|-----------------|
| Einstein | b98cec95-47a4-455d-92c8-3a08aacb556d | +15853162340 |
| Nostradamus | bca7797f-d4c5-4b67-b22c-7506a0b045b9 | +15854073813 ⚠️ verify — may share Aela's line |
| Twain | 3a6a8107-3faf-4cdd-a67b-5f71023c027d | +15858009390 |
| Bruce Lee | 099b6a90-1fa9-4e6a-bc4d-8c127c6b1141 | +15854073450 |
| Holmes | b65fb3ab-df3c-4a5b-8a96-3e865d9315b6 | +15854073131 |
| Aela | 9647119e-7cf6-4d22-968d-25f3f455a834 | +15854073813 |
| Bennet | 0560582f-8258-4803-8f2b-78b364fa23ca | +15854073507 |
| Baldwin | 2f0047c1-eeb7-412d-b455-f8f731bdd232 | +15853781304 |
| Evangeline Adams | 7fd88fa7-f013-4693-9b52-ab8937e4225d | +15853121359 |

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
- `VAPI_ASSISTANT_ID_EINSTEIN`, `_NOSTRADAMUS`, `_TWAIN`, `_BRUCE_LEE`, `_HOLMES`, `_AELA`, `_BENNET`, `_BALDWIN`
- `VAPI_PHONE_NUMBER_ID_EINSTEIN`, `_NOSTRADAMUS`, `_TWAIN`, `_BRUCE_LEE`, `_HOLMES`, `_AELA`, `_BENNET`, `_BALDWIN`
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
2. First 3 minutes always free — no exceptions
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

### Rule 3: Git push always goes to main
Always push to main branch: `git push origin HEAD:main`
Never push to master only — Vercel watches main.

### Rule 4: Verify before moving on
After every change, open the browser and confirm it looks correct before making the next change.

### Rule 5: Regional partners update
Regional rescue partners change every 2 weeks. Update is done directly in GitHub web editor — plain text change, no Claude Code needed.

### Rule 6: Node.js HTTPS on this machine
All Node.js HTTPS calls require the `--use-system-ca` flag: `node --use-system-ca -e "..."`

### Rule 7: Always backup before patching Vapi
Before PATCHing any Vapi assistant, GET the current state first and log it. Vapi has no version history.
