# TalkWithIcons Session Notes - May 28 2026

## PROJECT STATUS

### Live and Working
- Evangeline Adams - full natal chart flow, form collects birth data, outbound call, chart injected into prompt. WORKING.
- Einstein - prompt rewritten with pre-mortem architecture. WORKING.
- Nostradamus - prompt written, voice set, phone number assigned. WORKING.
- Twain - prompt written, voice set, phone number assigned. WORKING.
- Tesla - prompt written, voice set, phone number assigned. WORKING.
- Aela - prompt written with Pleiadian races section, voice set, phone number assigned. WORKING.
- Elizabeth Bennet - prompt written, voice set, phone number assigned. WORKING.
- Marie Curie - prompt written, voice set, phone number assigned. WORKING.
- Holmes - prompt written, voice set, phone number assigned. BROKEN - see below.

### Site
- talkwithicons.vercel.app
- 9 character pages each with First Name + Phone Number form triggering outbound call
- Pricing: First 3 minutes free. Minutes 4-6 $2.99 total. After that $1.00/min.
- World Tour: $75 for all 9 characters
- Evangeline has additional birth data form (date, time, city, country)
- ASPCA rescue dog donation mention on all pages

### Tech Stack
- Vapi for voice calls
- ElevenLabs for voices (11labs)
- GPT 4.1 model on all assistants
- Brave Search API for web search (BRAVE_API_KEY in Vercel)
- Vercel for hosting + serverless functions
- GitHub repo: azzouley/talkwithicons

### Vercel Environment Variables Set
- VAPI_API_KEY (private key)
- VAPI_ASSISTANT_ID_EVANGELINE
- VAPI_PHONE_NUMBER_ID (Evangeline's number)
- VAPI_ASSISTANT_ID_EINSTEIN, NOSTRADAMUS, TWAIN, TESLA, HOLMES, AELA, BENNET, CURIE
- VAPI_PHONE_NUMBER_ID_EINSTEIN, NOSTRADAMUS, TWAIN, TESLA, HOLMES, AELA, BENNET, CURIE
- BRAVE_API_KEY
- GMAIL_USER, GMAIL_PASS (for failure alerts)
- TAVILY_API_KEY (deprecated, not used)

### API Files
- /api/start-call.js - Evangeline outbound call with natal chart calculation
- /api/start-call-basic.js - all other 8 characters outbound call with first name injection
- /api/tavily-search.js - Brave Search endpoint (despite the name, uses Brave not Tavily)

## HOLMES SEARCH PROBLEM - CRITICAL

Holmes has a web search tool (search_web) pointing to /api/tavily-search which calls Brave Search API.

The search WORKS - Brave returns 200 with correct results every time.
GPT 4.1 receives the results but says "just a sec...curious" and then says it found no information.
This happened after prompt changes on May 28.
The original Holmes prompt was 14,280 characters - UNRECOVERABLE (Vapi has no version history).
Current prompt is the rewritten version at ~11,000 characters.
Every prompt fix attempt has failed.
Model was briefly changed to Claude Sonnet - reverted back to GPT 4.1.
Result format is { result: "string" } which is correct for GPT 4.1.

WHAT NEEDS TO BE TRIED:
- Check Vapi call logs to see what GPT 4.1 actually receives from the tool
- The Vapi logs tab on the Holmes assistant shows full conversation including tool results

## WHAT STILL NEEDS DOING

1. Fix Holmes search result usage - top priority
2. Wire Stripe payment - waiting on DBA and business checking account
3. Post-call email with transcript - 30 min after call
4. Background noise cancellation - check all assistants in Vapi
5. The "just a sec" filler phrase on Holmes - related to search issue
6. Test all 8 non-Evangeline characters for quality
7. Build social clip workflow for TikTok/Instagram

## NONPROFIT PARTNERSHIP MODEL - APPROVED

### Concept
Sub-sites that partner with nonprofits for 2-4 week fundraising campaigns. Nonprofit emails their membership to drive traffic. Members call TalkWithIcons characters for fun while raising money.

### Split Structure
- 50% to nonprofit partner
- 50% to Steve (rescue dog donation comes from Steve's 50%)
- Local dog rescue gets 100% of the rescue portion
- Each campaign uses a named local rescue, not ASPCA

### Technical Requirements
- Subdomain per campaign (e.g. atlanta.talkwithicons.com)
- Campaign tracking via URL code to attribute calls to correct campaign
- Stripe required (already pending DBA/business checking)
- Simple one-page partnership agreement needed (not a lawyer job)

### Nonprofit Pitch
- 3-week campaign
- Their members call famous historical figures for fun
- They email their list twice (launch + reminder)
- They keep 50% of every call with zero overhead on their end

### Character Changes
- Replacing Marie Curie with James Baldwin and Bruce Lee
- Baldwin: race, love, America - contemporary relevance
- Bruce Lee: philosophy, discipline, identity - massive audience
- No legal barriers at current scale (both deceased)
- Bruce Lee estate is active but voice call service is unlikely to be an issue

### Status
- Stripe pending
- Characters pending voice selection and prompt writing
- Campaign subdomain build pending

## MARKETING STRATEGY - INSTAGRAM & TIKTOK

### Primary Content: Reaction Videos
- Format: Split screen or speaker phone - caller's face + Holmes/character audio
- Capture method: Caller films themselves with Holmes on speaker (Option 2 - raw/authentic performs best on TikTok)
- Alternative: Caller at laptop, films with phone while Holmes plays through laptop speakers
- Content: Genuine reactions to shocking answers - jaw drops, laughter, disbelief
- Hook formula: "I called a 150-year-old detective and asked him who really killed JFK. This is what he said."
- End every video with: call him yourself + site URL
- Best characters for virality: Holmes on conspiracies, Aela on alien contact, Nostradamus on predictions
- Start with friends/family to get first 5-6 strong reaction clips for launch

### Secondary Content: Carousels
- Purpose: Build brand and feed algorithm between video posts
- Angle: The thing nobody knows about each icon - not biography
- Format: Dark background, single str [TRUNCATED - more content to be added]

## CLAUDE RULES FOR THIS PROJECT
- Always use Claude Code for any Vapi, Vercel, or site changes - never ask Steve to do it manually unless absolutely no programmatic option exists
- Always save/backup before changing anything that is working
- Never change multiple things at once
- Prompts for copying go in code blocks, never as files
- Max duration for all Vapi assistants: 2400 seconds
- First message always starts with ...Mm.... to prevent cutoff
- All assistants use GPT 4.1 model unless specifically changed
- Vapi private API key: 913294a5-6b47-4465-83c3-9cbea9bfb10a
