# REEL: "Villas-Boas" — Arthur Vance / TalkWithIcons
## Rewrite — adds the ship interior

Duration: 28s total, ends as a destination (hard stop, not a loop)

Status: BUILT AND SHIPPED (2026-09-10). This file was written retroactively
from the original chat brief to establish a spec-file format — no spec file
existed at build time. "v2" in the filename reflects Ruby's own framing of
this brief as a rewrite that added the ship-interior scene; no earlier v1
reel file exists in this project.

## SOURCING
No photo/footage of the actual 1957 event exists. Ruby-generated both
stills (ChatGPT): `ANTONIO BOAS1.JPEG` (field) and `ANTONIO BOAS2.JPEG`
(ship interior), both 1024×559.

## CONTENT NOTE
Interior still shows a being showing Villas-Boas around the ship —
explicitly NOT the blood-draw beat, not the female being, not anything
sexual, not the later part of the real case. That procedure is handled in
caption text only, never depicted. Both stills reviewed against this
constraint before motion — passed cleanly (no nudity, no medical
instruments, no second being, calm non-threatening tone).

## STILL REVIEW (done before motion)
Both 1024×559 — below the 800px resolution floor (Rule 15), same
mitigation as Ariel: short 5s clips + freeze-extend rather than longer
continuous generations.
Both stills had a baked-in watermark-style caption stamped by the
generator in the bottom-right corner ("OCT 1957. RURAL MINAS GERAIS...",
"OCT 1957. INTERIOR...") — removed via ffmpeg's `delogo` filter on both
before upload (clean on the interior still's smooth gradient wall; a
minor interpolation artifact remained on the field still's dirt texture,
judged acceptable since it's masked by the grain pass and sits in a dark,
non-focal area of frame).

## MOTION PASSES (Runway) — went ahead 2026-09-10, two separate go-aheads
Both 5s, ratio 1280:720, 60 credits each (120 total).
- Field: push toward the descending craft from the farmer's POV. Full-clip
  review found real mid-clip identity drift on the farmer's face/torso
  (~2.5s) before he exits frame by the end — flagged explicitly; Ruby
  reviewed the raw clip and said use it as-is.
- Interior: near-static with slight drift, wall light shifting, the
  being's gesture completing. Full-clip clean, no warping; the being's
  arm/leg read slightly more mobile by the end than "subtle drift" implied
  but stayed within the calm, non-threatening brief.

## CAPTION TIMING
0:00–0:03  "October 16, 1957. A farmer in rural Brazil, ploughing his fields at night to escape the heat." [Still #1, motion begins]
0:03–0:06  "A light had been tracking him and his brother for over a week. That night, it landed."
0:06–0:09  "His tractor died under him. He didn't get far before he was taken aboard."
0:09–0:15  Cut to Still #2 (interior). "Inside, they drew blood, then walked him through the ship itself. He said afterward they were never cruel — clinical, but never cruel."
0:15–0:19  "This is the case that came before the word 'abduction' existed. He never once changed his story in thirty-four years of telling it."
0:19–0:22  Silent hold on the interior image, no caption — lets the strangeness of the shot land before the cut to portrait.
0:22–0:25  PORTRAIT BEAT: images/vance.jpeg, house desaturated grain. Caption: "ARTHUR VANCE — Fifty years of case files."
0:25–0:28  END CARD.

## VISUAL TREATMENT
Field beat: desaturated night + grain, consistent with the series' night
treatment (Rendlesham/Phoenix). Interior beat: distinct cold/clinical
grade — higher contrast, cooler color balance, minimal grain — so the cut
between the two reads as a real change in location.

STANDING RULE (added after this reel): no attribution-line overlay
("— Arthur Vance") on ship-interior or other interior scenes in this
series — a first attempt placed it mid-caption-box on a long wrapped
caption and it visibly obscured the text. Attribution goes on
field/exterior beats only, and even there, check wrap-length against the
attribution's y-position before shipping.

## BUILD NOTE
First assembly attempt had a real bug: two segments each running a heavy
`gblur` pass in one single `filter_complex` graph produced a field/
interior desync (captions switched on schedule, video lagged several
seconds behind) — both segments verified correct in isolation, broke only
when combined. Fixed by rendering each segment (field, interior, portrait,
end card) to its own intermediate file first, then doing a simple final
concat. Worth remembering for any future reel with 2+ heavy-filter
segments in the same graph.

## AUDIO
Music: dark-tension.mp3. No real audio.

## END CARD
Same as house standard (see Ariel spec).

## DELIVERED
https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-vilasboas-draft1.mp4
