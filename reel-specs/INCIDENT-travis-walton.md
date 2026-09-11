# Incident write-up: Travis Walton reel — read before touching reel work

One reel took an entire session and multiple rebuild cycles to land. Read
this alongside `REEL_PRODUCTION.md` before doing any reel work — the
lessons below have been folded into that doc, but the specifics are here
so the pattern is recognizable if it starts happening again.

## Spec-side problems (not this assistant's fault, but should have been caught earlier)

- Two of three source stills initially failed content review: Still 2 had
  5 clearly-rendered forward-facing faces plus a fully-defined craft
  shape where "diffuse glow" was specced; Still 3 had a clearly-rendered
  profile face. Both stemmed from the images being generated in Gemini
  without Travis Walton's name in the prompt — the user's own
  after-the-fact argument (no name in the prompt = not actually his
  likeness) is reasonable, but it wasn't anticipated in the original
  no-face rule, which assumed prompted likeness. **Lesson: when a
  likeness rule was written for one failure mode (prompted resemblance)
  and the actual case is a different mechanism (contextual/unprompted
  resemblance), say so explicitly rather than applying the rule
  mechanically — a still-frame face and a moving-clip face carry
  different real risk even under the same rule text.**
- The brief for this specific reel omitted the portrait beat and
  CTA/end-card entirely — every other reel in the series has one. Nobody
  caught that the brief was inconsistent with established house
  structure until after the reel was built and delivered once already.

## This assistant's own failures, in order

1. **No pre-spend cost flag.** Brief specified 10s+5s+10s = 300 credits
   (12/sec), 2.5x the ~120-credit norm for this project. Submitted without
   flagging the total first; the user had to ask why after the fact. Now
   documented as Rule 16 / `REEL_PRODUCTION.md`'s cost-flag rule — but it
   cost real money and real frustration to learn it this way.
2. **First assembly had no story.** Captions were technically-accurate
   but skipped the actual dramatic content: no beam-of-light strike, no
   reason given for why the crew drove off, no account of the 15-minute
   return and disappearance. Went straight from "one man got out of the
   truck" to "the others drove" with nothing connecting them. This is the
   single biggest miss — the case's most famous beat was never on
   screen or in text.
3. **No portrait beat, no CTA end card.** Followed the brief's own
   omission literally instead of noticing it broke from every other reel
   in the series and flagging that inconsistency before building.
4. **Caption color inverted** on the first build (white text on black
   box) against the established house style (black text, white box) —
   caught and fixed, but shouldn't have happened; the pattern was already
   established and documented.
5. **No music on the first delivered cut**, because the original brief
   said "no music sting... no sci-fi sound design" and that was taken
   as "no music, period" rather than "no dramatic musical stinger" —
   every other Vance reel has a bed track under it, and that convention
   should have overridden a literal reading of an ambiguous brief line
   without checking first.
6. **When music was added, got the volume wrong twice.** First pass:
   used `amix` with its default auto-normalization on top of a track
   whose opening bars are a quiet build-up by design — result was
   technically non-silent (confirmed with `volumedetect`) but
   imperceptible as music. Second pass overcorrected (`volume=3.2`) and
   was too loud. Third pass (`volume=1.6`, `amix normalize=0`) landed in
   a normal range. **Lesson: verify audio changes the same way video
   changes get verified — pull an actual `mean_volume`/`max_volume`
   reading with `volumedetect` before calling an audio fix done, and
   sanity-check a source track's own loudness profile before assuming a
   flat multiplier will read correctly at every point in it.**

## Where the usage actually went

No tool available gives an exact token count for this session, and no
number should be invented here. What's true and checkable: this reel
went through five full rebuild-and-reupload cycles (initial cut → add
story/CTA → add music → fix music volume too loud → fix music volume
again), each involving several tool calls (ffmpeg builds, Blob uploads,
frame/contact-sheet verification, at least one web search for case
facts). Every individual step was cheap in isolation; the actual cost was
the number of round trips caused by shipping something incomplete or
wrong and finding out from the user afterward, rather than catching each
issue before delivery. That is the pattern to break, not any single step
in it.

## What should happen differently next time

- Before building anything: compare the brief against the established
  series pattern (music, CTA, portrait beat, caption style) and flag any
  omission or deviation explicitly, rather than assuming the brief is
  complete just because it's detailed.
- Before submitting to Runway: state the total credit cost for the whole
  reel and get a explicit go-ahead on that number specifically, not just
  on "proceed with the reel."
- Before delivering any cut: check it against the full brief's narrative
  requirements, not just its technical ones (resolution, motion, faces).
  A reel can pass every technical check and still not tell the actual
  story.
- Before calling an audio change done: pull a `volumedetect` reading.
  "Signal is present" is not the same as "level is right."
