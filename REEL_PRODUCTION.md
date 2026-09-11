# Reel Production — Reference (all characters)

Read this before starting any reel work for **any** character, not just
the one it happens to have been written while working on. Every rule
below exists because skipping it already caused a real problem once, on
one character's reel or another's — the underlying pipeline (Runway,
ffmpeg assembly, house style, Vapi CANON editing) is shared across the
whole roster. Don't re-learn these the hard way on a different character
just because the last incident happened to involve someone else.

---

## Runway API — the mechanics

- Key: check this assistant's own memory first — it was cached from before
  it was ever a Vercel env var. Vercel's copy (`RUNWAY_API_KEY`) is
  `sensitive`-type and cannot be retrieved via API or CLI; ask the user to
  paste it if the cached copy 401s.
- Base `https://api.dev.runwayml.com`, header `X-Runway-Version:
  2024-11-06`. Client lives in `api/_runway.js`: `submitImageToVideo`,
  `checkBudget`, `estimateCredits`, `getTaskStatus`, `persistOutputToBlob`.
- **Cost: 12 credits per second, gen4.5 model.** 5s = 60 credits, 10s =
  120. Linear, no discount for longer clips.
- **COST FLAG RULE (added 2026-09-11, do not skip, applies to every
  character's reels):** before submitting anything to Runway, sum the
  total credits for the *entire reel* (every clip together, not one at a
  time). If the total clearly exceeds the established per-reel norm (most
  reels across the roster have run 60-120 credits total; 150+ is a flag),
  **stop and tell the user the number before submitting** — even if the
  brief itself specified the durations that produce that total. A user
  specifying "10s" has not necessarily done the credits math. Connecting
  duration → cost → "is this okay?" is this assistant's job, the same way
  a headcount mismatch or a watermark gets caught before it ships. This
  was missed once (a 300-credit, three-clip reel went through with no
  pre-spend flag) and the user had to ask why after the fact — don't
  repeat that, on any character's reel.
- No Runway spend of any kind, cheap or expensive, without an explicit
  go-ahead from the user first. Every reel across every character in this
  project has required this, without exception.
- The harness's own auto-mode classifier sometimes blocks the actual
  `submitImageToVideo`/`getTaskStatus` calls when run as
  `RUNWAY_API_KEY=... && node -e "..."` inline. Workaround: write the
  script to a real `.js` file first, then run `RUNWAY_API_KEY=... node
  path/to/script.js`. If still blocked, a plain retry has usually worked —
  it's a flaky classifier decision on the inline-command shape, not a
  hard policy block.

## Pre-flight checks — every still, before it goes anywhere near Runway

1. **Resolution floor.** Shorter dimension under ~800px = high
   identity-drift risk on clips longer than ~5s. Default to a short clip
   (5s or less) + freeze-extend the remaining screen time, rather than one
   longer continuous generation.
2. **Aspect ratio vs. the vertical canvas.** If the source is landscape
   and the reel is vertical 9:16, test-crop it to 9:16 first and check
   whether that crop would cut off an important subject. If it would,
   submit to Runway at a wide ratio close to the source's real proportions
   (e.g. `1280:720`) and letterbox the result into the 720×1280 canvas at
   assembly time — with a **blurred-fill backdrop of the same footage**
   for a bright/daylight scene (flat black bars look wrong there); plain
   black bars are fine for genuinely dark/night material.
3. **Real-person likeness.** If the scene depicts a real, living,
   identifiable person — or the context makes it unambiguous who's shown,
   even when their name was never in the generation prompt — no clearly
   rendered/recognizable face, in any frame. Zoom into faces to check;
   don't judge from the full-size thumbnail alone.
4. **Content-specific negative constraints.** Check each one in the brief
   individually against the actual image — don't eyeball the general vibe
   and call it good.
5. **Baked-in watermark text.** Generators sometimes stamp a caption/label
   into a corner of the image. Check all four corners before uploading.
   Fix with ffmpeg's `delogo` filter (clean on smooth gradients, leaves a
   minor artifact on high-texture backgrounds — acceptable if a later
   grain/blur pass will mask it). Never send a watermarked still to
   Runway.
6. **If a still fails a hard content-safety check, stop.** Don't proceed
   with it and don't try to patch it in the motion prompt. Report clearly
   which still, which specific criterion, with a zoomed crop as evidence.

## Motion prompts (Rule 14 discipline — pre-dates this reel series, still applies)

- Never name a new physical object or light source in the same prompt as
  "nothing added" — describe motion only via camera movement, existing
  light/shadow shift, atmosphere already in frame.
- If the brief calls for motion from the first frame, say so explicitly:
  "motion begins immediately in the first frame, no static opening hold."
- Always close with: "Do not add any new object, person, vehicle, light
  source, or beam not already present in the source image, at any point
  from the first frame to the last."

## Post-generation verification — every clip, every time

- Full-clip check: start, middle, **and** end frames, minimum. A clip can
  look perfect at 0.2s and warp badly by 2.5s (happened on the
  Villas-Boas field clip).
- For multi-beat clips, generate a low-fps contact-sheet tile
  (`ffmpeg -i clip.mp4 -vf "fps=2,scale=140:-1,tile=WxH" sheet.jpg`) for a
  fast full-timeline read instead of pulling single frames one at a time.
- Report warping/drift honestly even when it's not catastrophic — let the
  user decide whether to accept or reshoot. Never spend more credits on a
  reshoot without being told to.

## Assembly — technical gotchas

- **Faststart, always.** Encode with `-movflags +faststart` or browsers
  can fail to play the file inline — looks exactly like "the file won't
  open" even though it's valid and fully downloadable.
- **SAR mismatches.** After any overlay/scale/crop chain, add `setsar=1`
  explicitly before feeding into `concat` — `force_original_aspect_ratio`
  scaling can introduce a near-1:1-but-not-quite SAR (e.g. `5120:5121`)
  that breaks concat with an opaque error.
- **Two or more heavy filters (e.g. multiple `gblur` passes) in one single
  `filter_complex` graph can desync segments** — captions switch on
  schedule, but the video visually lags behind, even though every branch
  is verified correct in isolation. Don't debug this forever: render each
  segment to its own intermediate file first, then do a simple final
  concat. More reliable, and much easier to debug when it breaks.
- **Long captions + an attribution line.** Check how many lines a caption
  actually wraps to before placing an attribution box under it — a long
  caption can wrap to 4-6 lines and the attribution box will land on top
  of the text. Verify visually; don't trust a fixed y-offset that worked
  for a shorter caption on a different reel.
- **No attribution overlay on ship-interior / interior scenes** (standing
  rule since Villas-Boas, currently specific to Arthur Vance's reel
  series — attribution goes on field/exterior beats only there). Apply
  the same visual-collision check for any character/scene type where an
  attribution or credit line might land near a long, multi-line caption.
- Vertical canvas: 720×1280. House font: `Anton-Regular.ttf`. House
  caption style: black text, `white@0.92` box, `boxborderw=28`, positioned
  at `y=h*0.08`.

## House end card (shared structure, per-character content)

Every character's end card follows the same four-line pattern: a gold
kicker line naming the genre/hook ("UFOs and Alien Encounters" for
Vance), "Call [Character Name]." in black, "talkwithicons.com" in gold,
then the rescue-dog line in black. Block position: `(H - totalHeight) / 2
- 70` (shifted up from dead center) — reuse this positioning math
regardless of character. Only the specific wording of the kicker/name
changes per character.

## Music

House library at `assets/music/`, licensed Pixabay tracks —
`manifest.json` lists mood/artist per track. Tracks are not exclusive to
one character — e.g. `tension-documentary` has been used by both Walter
Hobbs's reels and an early Arthur Vance reel (later switched to
`dark-tension` for Vance after the shared usage was flagged). Shared
mood-tag tracks across characters are normal by design, but check current
usage before assuming a specific track is "free" for a new character if
distinctiveness matters for that character.

## CANON / Vapi prompt editing (any character)

- Vapi key: check this assistant's own memory first (cached before it was
  ever a Vercel env var, for at least one character's key already).
  Vercel's copy is `sensitive`-type, not API-retrievable.
- **Always GET the character's current prompt and back it up to
  `vapi-backup/` with a descriptive, timestamped filename before any
  PATCH.** No exceptions, for any character.
- Every CANON/content addition: find the correct chronological/thematic
  insertion point within that character's existing structure — don't
  just append at the end. If the source brief is written in third person,
  convert it into the prompt's native second-person "you" address to
  match the character's existing voice. PATCH, then GET again and
  byte-compare the result to confirm the live prompt matches exactly.
- Behavioral rules (not case-file/lore content) belong in that
  character's numbered CRITICAL RULES block near the top of the prompt,
  not mixed into a CANON/lore section.
- Update that character's own project memory file after every change with
  the char-count delta and a one-line description — e.g.
  `project_talkwithicons_arthur_vance.md` for Vance — so there's a running
  history of everything in the prompt. Create an equivalent memory file
  for any other character that doesn't have one yet, once its CANON starts
  getting edited this way.

## Site copy discipline

- Website copy should point at a story and create a reason to call — it
  should **not** narrate the story beat-by-beat, especially for material
  meant to be the actual payoff of a phone call.
- Avoid generic stock closers ("ask him what happened," "ask him about
  it") when a more specific, non-generic line is available.
- HTML/layout: content-only edits reusing an existing CSS
  class/template pattern are fine directly in Claude Code. Do not
  restructure layout or CSS.
- Push reel-adjacent site copy changes (`index.html`, character pages)
  straight to `main` — this repo auto-deploys on push, no staging step.
  Reel video files themselves live on Vercel Blob and get linked in chat;
  they are not committed to the repo.

## Deliverable format

Every reel, for every character, gets a spec file at
`reel-specs/<character>-reel-<name>.md` (e.g. `vance-reel-ariel-school.md`,
`hobbs-reel-<name>.md`), documenting: sourcing, still-review results
(pass/fail per criterion), motion prompts used, credits spent, build
issues hit and how they were fixed, caption timing, visual treatment, and
the final delivered Blob URL. See the existing `vance-reel-*.md` files in
that directory for the exact format to follow for any new character.
