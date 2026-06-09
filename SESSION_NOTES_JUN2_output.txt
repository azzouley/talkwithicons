# TalkWithIcons — Session Notes
## June 2, 2026

---

## WHAT WAS COMPLETED THIS SESSION

### 1. Site Update — Tesla → Bruce Lee, Curie → Baldwin (completed from prior session)

**brucelee.html** — created from scratch (same structure as baldwin.html)
- Eyebrow: "Philosopher · Martial Artist · Filmmaker · 1940–1973"
- Hero quote: "Be like water making its way through cracks..."
- Full water quote in quote section
- 6 starters: water unpacked, mastery from nothing, Asian in Hollywood, fear and mastery, MMA/JKD, what people misunderstand
- Bio: Hong Kong → Seattle → Long Beach demo → Wong Jack Man fight → JKD → Hollywood refusal → HK films → Enter the Dragon
- Bottom CTA: "The philosopher who moved faster than thought. Still moving."
- JS: `character: 'brucelee'`
- Others grid includes Baldwin, links to all 7 other characters

**index.html** — updated:
- Character 04: Tesla → Bruce Lee (image: brucelee.jpeg, era: "Hong Kong · Los Angeles, 1973", link: brucelee.html)
- Character 08: Curie → Baldwin (image: baldwin.jpeg, era: "Harlem, 1963", link: baldwin.html)

**api/start-call-basic.js** — updated:
- `tesla` key → `brucelee`, env var `VAPI_ASSISTANT_ID_TESLA` → `VAPI_ASSISTANT_ID_BRUCE_LEE`
- `curie` key → `baldwin`, env var `VAPI_ASSISTANT_ID_CURIE` → `VAPI_ASSISTANT_ID_BALDWIN`
- Same for PHONE_NUMBER_ID vars

**Vercel env vars added:**
- `VAPI_ASSISTANT_ID_BRUCE_LEE` = `099b6a90-1fa9-4e6a-bc4d-8c127c6b1141`
- `VAPI_PHONE_NUMBER_ID_BRUCE_LEE` = `e858bf94-1801-47ac-9bd5-14d6bbf13673`
- `VAPI_ASSISTANT_ID_BALDWIN` = `2f0047c1-eeb7-412d-b455-f8f731bdd232`
- `VAPI_PHONE_NUMBER_ID_BALDWIN` = `19e49174-4ad9-4665-9c34-5fd36d68d213`

Note: Old `VAPI_ASSISTANT_ID_TESLA` and `VAPI_ASSISTANT_ID_CURIE` env vars still exist in Vercel but are unused — can be deleted from the Vercel dashboard at any time.

---

### 2. Post-Call Follow-Up System — Built and Deployed

**Architecture:** Vapi webhook → QStash (30-min delay) → send-followup

**QStash env vars added to Vercel:**
- `QSTASH_URL` = `https://qstash-us-east-1.upstash.io`
- `QSTASH_TOKEN` = `eyJVc2VySUQi...` (full token in Vercel)
- `QSTASH_CURRENT_SIGNING_KEY` = `sig_6Vnsf5uxUrRt6YU5obNCcZv2p3GK`
- `QSTASH_NEXT_SIGNING_KEY` = `sig_5YVBXyu2Amazkk7igFunNKgXosNi`

**api/call-ended.js** — Vapi webhook receiver
- Registered as Server URL on all 10 Vapi assistants (see below)
- Accepts all Vapi event types, only acts on `end-of-call-report`
- Skips calls under 60 seconds (test dials / immediate hangups)
- Maps assistantId → character name via hardcoded lookup table
- Publishes to QStash with `Upstash-Delay: 1800s` (30 min)
- Target URL: `https://www.talkwithicons.com/api/send-followup`
- Payload: `{ callerPhone, callerName, callerEmail, characterName, durationSeconds, transcript }`
- Uses `SITE_URL` env var if set, falls back to `https://talkwithicons.vercel.app`

**api/send-followup.js** — QStash delayed receiver (email only)
- Disables Vercel body parser to read raw bytes for QStash signature verification
- Verifies QStash HS256 JWT signature with key rotation (current → next)
- Sends email via nodemailer + Gmail SMTP (GMAIL_USER, GMAIL_PASS)
- Email only fires if `callerEmail` is present in payload — currently never set since registration only collects firstName + phoneNumber
- Character-specific closing lines for all 9 icons in `CHARACTER_HOOKS` object
- Dark HTML email template matching site aesthetic (gold accents, dark background)

**Twilio was removed** — initially built with SMS + email, stripped to email only per user decision.

---

### 3. Vapi Server URL — Set on All Assistants

All 10 Vapi assistants now have Server URL set to:
```
https://www.talkwithicons.com/api/call-ended
```

Confirmed via API — all returned 200 with the URL in response. Assistants patched:
Baldwin, Bennet, Aela, Holmes, Bruce Lee, Twain, Nostradamus, Evangeline Adams, Einstein, Riley

---

## CURRENT CHARACTER ROSTER (as of this session)

| # | Name | Vapi Assistant ID | Phone Number |
|---|------|-------------------|--------------|
| 01 | Albert Einstein | b98cec95-47a4-455d-92c8-3a08aacb556d | +15853162340 |
| 02 | Nostradamus | bca7797f-d4c5-4b67-b22c-7506a0b045b9 | +15854073813 (Aela's line — check) |
| 03 | Mark Twain | 3a6a8107-3faf-4cdd-a67b-5f71023c027d | +15858009390 |
| 04 | Bruce Lee | 099b6a90-1fa9-4e6a-bc4d-8c127c6b1141 | +15854073450 (was Tesla) |
| 05 | Sherlock Holmes | b65fb3ab-df3c-4a5b-8a96-3e865d9315b6 | +15854073525 |
| 06 | Aela | 9647119e-7cf6-4d22-968d-25f3f455a834 | +15854073813 |
| 07 | Elizabeth Bennet | 0560582f-8258-4803-8f2b-78b364fa23ca | +15854073507 |
| 08 | James Baldwin | 2f0047c1-eeb7-412d-b455-f8f731bdd232 | +15853781304 (was Curie) |
| 09 | Evangeline Adams | 7fd88fa7-f013-4693-9b52-ab8937e4225d | +15853121359 |
| — | Riley | a7298832-7dca-4954-a88a-9b18acaedfb8 | unknown |

---

## VOICE DECISIONS

**Baldwin:** ElevenLabs instant voice clone from archive.org audio ("Living and Growing in a White World"). Voice ID: `3W2XyWxiiSb9Oj5yL3lv`

**Bruce Lee:** Using San Chi (Chinese-accented ElevenLabs shared voice). Decision is final — see below.

**Bruce Lee voice cloning — decided against, permanently:**
- California Civil Code §3344.1 — right of publicity for deceased persons, active until 2043 (died 1973)
- *Midler v. Ford* (1988) and *Waits v. Frito-Lay* — 9th Circuit holds that voice *likeness* is protected, not just exact reproduction. A modified clone that still sounds like Bruce Lee is still a right of publicity violation.
- "Modified enough to not be recognizable" = no commercial value. The protection gap does not exist.
- Bruce Lee Enterprises / Shannon Lee actively enforces IP.
- TalkWithIcons is a paid service — commercial use amplifies liability.
- San Chi + strong prompt is the correct approach. The value is in what he says, not in sounding exactly like him.

---

## WHAT IS NOT YET DONE

### Immediate / next session
- [ ] **Add email collection to registration forms** — callerEmail is never populated currently; send-followup.js email leg is wired but never fires. Need to add optional email field to all character pages (baldwin.html, brucelee.html, einstein.html, holmes.html, etc.)
- [ ] **Delete stale Vercel env vars** — `VAPI_ASSISTANT_ID_TESLA`, `VAPI_ASSISTANT_ID_CURIE`, `VAPI_PHONE_NUMBER_ID_TESLA`, `VAPI_PHONE_NUMBER_ID_CURIE` still exist in Vercel, unused
- [ ] **Update other character pages** (einstein.html, holmes.html, nostradamus.html, twain.html, aela.html, bennet.html) — their "Other Icons" grids still link to tesla.html and curie.html; should point to brucelee.html and baldwin.html
- [ ] **Verify Nostradamus phone number** — +15854073813 appears to be Aela's line per Vapi phone list; Nostradamus may be sharing or misconfigured

### Requires accounts / credentials
- [ ] **Stripe** — waiting on DBA and business checking account; no payment processing yet
- [ ] **Gmail credentials** — add GMAIL_USER and GMAIL_PASS to Vercel to activate email follow-ups
- [ ] **Post-call email with transcript** — architecture is built; fires when email + Gmail creds are in place

### Larger features
- [ ] **Individual character pages for remaining 7** — only einstein.html, holmes.html, baldwin.html, brucelee.html confirmed complete; nostradamus.html, twain.html, aela.html, bennet.html, evangeline.html need audit
- [ ] **Registration/payment flow** — blocked on Stripe
- [ ] **Admin dashboard**
- [ ] **Background noise cancellation** — check all assistants in Vapi
- [ ] **Test all characters** — especially Holmes (Perplexity sonar-pro model), Baldwin (voice clone), Bruce Lee (San Chi)
- [ ] **Social clip workflow** — TikTok/Instagram

---

## CLAUDE RULES (must remain in effect)
- Always use Claude Code for Vapi, Vercel, and site changes — never ask Steve to do it manually
- Always save/backup before changing anything that is working
- Never change multiple things at once
- Prompts for copying go in code blocks, never as files
- Max duration for all Vapi assistants: 2400 seconds
- First message always starts with `...Mm....` to prevent cutoff
- All assistants use GPT 4.1 model unless specifically changed
- Vapi private API key: `[REDACTED]`
- Git push always to main: `git push origin HEAD:main`
- Node.js HTTPS calls require `--use-system-ca` flag on this Windows machine
- HTML/CSS layout changes: complete files only, written by Claude chat — never incremental edits by Claude Code
