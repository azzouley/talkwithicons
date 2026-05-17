# TalkWithIcons — Claude Code Reference Document
## Last Updated: May 2026

---

## What This Product Is
TalkWithIcons is a paid voice phone call service. Users call AI versions of historical figures and fictional characters. Every paid call donates to rescue dog organizations. Nothing is pre-recorded or scripted — every conversation is unique and real-time.

**Tagline:** "Not a recording. Not a script. A conversation that has never happened before and never will again."

---

## The 8 Characters

| # | Name | Era/Location | Type |
|---|------|-------------|------|
| 01 | Albert Einstein | Princeton, 1955 | Historical |
| 02 | Nostradamus | Salon-de-Provence, 1555 | Historical |
| 03 | Mark Twain | New York City, 1905 | Historical |
| 04 | Nikola Tesla | Hotel New Yorker Room 3327, 1935 | Historical |
| 05 | Sherlock Holmes | 221B Baker Street | Fictional |
| 06 | Aela | Pleiadian Council Liaison | Original |
| 07 | Elizabeth Bennet | Longbourn, 1813 | Fictional |
| 08 | Marie Curie | Paris Laboratory, 1934 | Historical |

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
- Implement through Vapi when building call system

---

## Gift Packages

| Name | Duration | Price |
|------|----------|-------|
| The Einstein Evening | 15 min with Einstein | $14.99 |
| A Consultation with Holmes | 20 min at 221B | $19.99 |
| A Reading with Nostradamus | 20 min in Salon-de-Provence | $19.99 |
| An Evening with Aela | 30 min with Aela | $29.99 |
| The Grand Tour | 10 min each with all 8 characters | $69.99 |

---

## Tech Stack

| Service | Purpose | Status |
|---------|---------|--------|
| GitHub | Source control (repo: azzouley/talkwithicons) | ✅ Connected |
| Vercel | Hosting (talkwithicons.vercel.app) | ✅ Connected |
| Vapi | Call infrastructure | ⬜ Account needed |
| ElevenLabs | Voice synthesis | ⬜ Account needed |
| Stripe | Payments | ⬜ Account needed |
| Resend | Post-call email | ⬜ Account needed |
| Twilio | SMS | ⬜ Account needed |

---

## What Has Been Built

- ✅ Home page (index.html) — complete, live at talkwithicons.vercel.app
- ✅ CLAUDE.md — this file
- ✅ Character system prompts — saved separately as TalkWithIcons_Character_Prompts.md
- ⬜ Individual character pages (8)
- ⬜ Registration/payment page
- ⬜ Post-call confirmation page
- ⬜ Gift purchase flow
- ⬜ Vapi integration
- ⬜ ElevenLabs voice setup
- ⬜ Stripe integration
- ⬜ Post-call email (Resend)
- ⬜ Admin dashboard
- ⬜ Character portrait images (AI-generated, to be added)

---

## Build Order (Next Steps)

1. Set up Vapi, ElevenLabs, Stripe accounts
2. Individual character pages (8)
3. Registration/payment flow
4. Post-call confirmation page
5. Vapi call integration
6. ElevenLabs voice per character
7. Stripe payment processing
8. Post-call email (Resend)
9. Gift purchase flow
10. Admin dashboard

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

### Rule 6: Character images
Portrait images for all 8 characters are placeholders. When real AI-generated portraits are ready, they replace the placeholder divs in each character card. Image prompts will be written by Claude (chat) when ready.

---

## Character Gate Lines (Minute 3 — said in character)

- **Einstein:** "Our free introduction is nearly finished — but I find I'm not quite ready to stop. Should we continue?"
- **Twain:** "Well, we've used up the free portion of this conversation, and I was just getting warmed up. The question is whether you were too."
- **Holmes:** "Three minutes. Barely enough time to establish the facts. We haven't even begun. I assume you wish to proceed?"
- **Nostradamus:** "What has passed between us was written. What comes next — that depends on you."
- **Tesla:** "[Name]. We have reached the boundary of the complimentary period. I have considerably more to say. The choice to continue is yours."
- **Bennet:** "I confess I had formed quite a low opinion of how this conversation would go. I was wrong. Shall we see where it leads?"
- **Aela:** "The first part of our time together was a gift. What comes next is a choice. I'll be here either way."
- **Curie:** "I have never stopped an experiment at the most interesting moment. I don't intend to start now. Do you?"

---

## Character Opening Lines (First thing said when call connects)

- **Einstein:** "Ah — you called. I wondered if anyone would..." (no name used)
- **Twain:** "Well. I wasn't expecting you to sound like that, [name]..."
- **Holmes:** "Don't tell me anything yet, [name]. You've had a difficult week..."
- **Nostradamus:** "I have been expecting someone..." (no name used)
- **Tesla:** "[Name]. You have reached me at an interesting time..."
- **Bennet:** "I must warn you immediately — I have very little patience for people who ask me about Mr. Darcy within the first thirty seconds... Surprise me, [name]."
- **Aela:** "I want you to take one breath before we begin..." (no name used)
- **Curie:** "I should tell you that I almost didn't answer, [name]..."

---

## Key Business Rules

1. Card never charged until call ends
2. First 3 minutes always free — no exceptions
3. Holmes registration has optional self-description field (for deduction cold open)
4. Post-call follow-up email sends 30 minutes after call ends
5. Rescue counter displays meals not dollars
6. One free call per phone number per character
7. Always say "rescue" not "shelter"
8. The product is TalkWithIcons — rescue dogs are a result of usage, not the primary product
9. Donation split: 25% ASPCA, 75% split among 2-3 regional partners

---

## File Locations

- Home page: `C:\talkwithicons\index.html`
- GitHub: `https://github.com/azzouley/talkwithicons`
- Live site: `https://talkwithicons.vercel.app`
- Character prompts: saved as TalkWithIcons_Character_Prompts.md (ask user for location)
