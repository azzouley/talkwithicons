# REEL: "Owatonna" — Arthur Vance / TalkWithIcons

Duration: 26.66s total, ends as a destination (hard stop, not a loop)

Status: BUILT AND DELIVERED (2026-09-17).

## SOURCING
Ruby-generated (Gemini/Nano Banana) 6 stills from the prompts in
`reel-specs/vance-reel-owatonna-still-prompts.md`: 4 reel beats
(sighting, trance, visitor, jello) + 2 bonus stills reserved for the
follow-up carousel. All 572×1024 (Gemini's fixed output size),
downloaded from Downloads as `owatanna1-6.jpeg` (misspelled/inconsistent
filenames), renamed into the scratchpad as `beat1-sighting.jpeg`
through `beat4-jello.jpeg` plus `bonusA-establishing.jpeg` /
`bonusB-offer.jpeg`.

## STILL REVIEW (done before motion)
All 4 reel stills reviewed against their prompts: strong match, no
watermarks, no real-person likeness issue (Mrs. Butler and "Major
Richard French" are anonymous 1960s folklore figures with no real photo
on record — fully generated, not a recreation of any actual photo).
Beats 3 and 4 confirmed to share the same "Major French" identity
across both stills. 572×1024 is below the 800px resolution floor —
mitigated the same way as prior sub-floor stills in this series: short
5s clips rather than one longer continuous generation. Aspect ratio
(0.559) already close to the vertical 9:16 canvas (0.5625), so no
letterbox/blurred-fill treatment was needed (unlike the landscape
sourced stills on Ariel/Villas-Boas) — submitted directly at Runway
ratio `720:1280`.

## MOTION PASSES (Runway) — went ahead 2026-09-17, user confirmed "y" at the 240-credit estimate
All 4 beats, 5s each, ratio 720:1280, gen4.5, 60 credits each (240 total).
- Beat 1 (sighting): grass sway, one distant light pulsing faintly, the
  two women nearly still. Full-clip clean, no drift.
- Beat 2 (trance): kneeling woman's lips move faintly, glassy unblinking
  eyes, standing woman shifts nervously behind her. Full-clip clean,
  consistent face throughout.
- Beat 3 (visitor): near-rigid stillness with a faint sway, leaves
  rustling, porch light flickering subtly. Full-clip clean, consistent
  face/suit/car throughout.
- Beat 4 (jello): slow tilt of the bowl toward the mouth, small realistic
  sipping motion, faint light flicker. Full-clip clean, consistent face
  and identity match with beat 3.
All 4 verified via 2fps contact sheets across the full 5.04s runtime,
not just opening frames — no warping, no identity drift, no
hallucinated added objects on any clip.

## CAPTION TIMING
0:00–0:05.04  Beat 1 (sighting). "November 1966. Two women in a field outside Owatonna, Minnesota — watching lights locals called 'little flashers.'"
0:05.04–0:10.08  Beat 2 (trance). "One light dropped low. Her friend fell to her knees and began speaking in a flat, metallic voice that wasn't her own."
0:10.08–0:15.12  Beat 3 (visitor). "Five months later, a man in a brand-new suit showed up at her door. He called himself Major Richard French."
0:15.12–0:20.16  Beat 4 (jello). "She offered him Jello. He picked up the bowl and tried to drink it — like he'd never once seen it before."
0:20.16–0:23.16  PORTRAIT BEAT: images/vance.jpeg, desaturated + light grain (house style). Caption: "ARTHUR VANCE — Fifty years of case files."
0:23.16–0:26.66  END CARD.

No attribution-line overlay used on any beat this time — the narrative
carries itself without a punchy pull-quote, and beat 4 (the jello scene)
is a kitchen interior, so an attribution there would have violated the
standing interior-scene rule from Villas-Boas anyway.

## VISUAL TREATMENT
All 4 beats kept in natural, un-desaturated color grade (night-blue for
beats 1-2, dusk/warm-interior for beats 3-4) — the tonal shift itself
(cold field night → warm domestic absurdity) is part of what makes the
story land, so it wasn't flattened to a single grade. Desaturation +
light film grain (`eq=saturation=0.55:contrast=1.05`, `noise=alls=6`)
applied only at the portrait beat, per house convention (see Ariel
spec).

## BUILD NOTES
- Beat 2 (trance) shipped with a real defect on first pass: the house
  default caption position (top of frame) landed directly over the
  standing second woman's face, hiding it completely for the whole
  clip. Caught by Ruby after delivery. Fixed by moving that beat's
  caption to the bottom of frame (`captionY: 0.72`) — the other 3 beats
  didn't need this since their subjects sit lower in frame. Added a
  standing check to `REEL_PRODUCTION.md` (render one captioned frame per
  beat and look at it, not just the raw still) so this gets caught
  before delivery next time.
- Rendered each of the 6 segments (4 beats, portrait, end card) to its
  own intermediate file first, then did a single final concat — per the
  standing house rule from the Villas-Boas incident (multiple
  heavy-filter segments in one `filter_complex` graph can desync).
- Concat demuxer file-list paths must NOT be colon-escaped
  (`escapeForFilter`'s `C\:/...` form is for drawtext filter strings
  only) — using it in the concat list caused "Impossible to open" on
  every segment. Fixed by writing plain forward-slash paths in the
  concat list instead.
- Confirmed post-build: 720×1280, SAR 1:1, 24fps, faststart applied,
  `volumedetect` mean -16.7dB / max -2.1dB (present and unclipped, not
  silent).

## AUDIO
Music: mystery-tension.mp3 (house library), continuous through the
portrait beat and end card, fading out only in the final 1s of the
whole video — never cut to silence at the content/end-card boundary,
per the standing house rule.

## END CARD
Same as house standard (see Ariel spec): "UFOs and Alien Encounters"
(gold kicker) / "Call Arthur Vance." / "talkwithicons.com" (gold) /
"Real conversations feed real rescue dogs."

## DELIVERED
https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-owatonna-draft1.mp4

## NEXT
Carousel follow-up planned (explicitly deferred until after this reel),
reusing beats 1-4 stills plus the 2 bonus stills (establishing wide
shot of the farmhouse/Mustang, and the untouched Jello-bowl still life).
