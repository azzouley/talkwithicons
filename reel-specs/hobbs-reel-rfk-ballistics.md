# Walter Hobbs — Reel: "RFK Ballistics"

## Summary
Four-beat reel on the RFK assassination's physical-evidence problems: the
eight-round revolver vs. the twelve-shot count, the destroyed doorframe
evidence, ending on Walter's portrait/CTA. 23.12s final, delivered not
deployed.

## Sourcing

**Clip 1 — RFK backstage, moments before his final speech.**
Real photograph, user-supplied (`RFK MOMENTS BEFORE.JPEG`, 1200x833).
Original brief called for U.S. Secret Service film footage of the primary
victory speech itself (National Archives-attributed). That source was
searched for directly — confirmed the item is well-attested to exist
(multiple secondary sources cite "Secret Service film... courtesy of the
National Archives") but no actual accessible digital copy could be located:
`catalog.archives.gov` is a JS-only SPA not reachable by fetch, and the one
full video found (archive.org item `VAM073`) is KCRA-TV's own rebroadcast,
rights-held by the Center for Sacramento History, non-commercial only —
exactly the kind of network-copyright layer the brief said to avoid. Stopped
and reported rather than substitute a restricted source. User supplied the
real photo directly instead. **Fact-check catch:** the brief's on-screen
text said "June 5, 1968" for this scene, but RFK's speech was delivered the
evening of June 4, crossing into the shooting just after midnight on June 5
— corrected on-screen text to "The night of June 4, 1968" since this shot
depicts him backstage before the speech, not the shooting itself.
Zero Runway cost — animated via a free ffmpeg Ken Burns push-in
(`zoompan`), not Runway, since it's a real photo with no identity-drift
risk to manage.

**Clip 2 — the revolver.**
Original brief called for an AI-illustrative evidence-photo-style revolver
still (open cylinder, eight countable chambers). Two consecutive Runway
`text_to_image` attempts failed the same specific requirement (chamber
visibility) — attempt 1 showed a mostly-closed cylinder with only 2-3
chambers dimly visible; attempt 2 was worse (cylinder fully closed, wrong
gun profile, garbled legible text on the evidence tag, background clutter).
Per the established two-strike rule, stopped before a third blind attempt
and asked for a real reference image instead of continuing to guess-prompt.
User supplied a real Alamy stock photo first (rejected — visible "Alamy"
watermark, licensed stock, not rights-cleared, same class of problem as the
Clip 1 KCRA footage), then a second real, unwatermarked press photo of the
actual Sirhan revolver (`SIRHAN REVOLVER2.JPEG`, 359x500 — resolution well
below the 800px Rule 15 floor, but that rule targets Runway motion identity
drift, not a static real photo, so it doesn't block use here). This photo
doesn't show all eight chambers clearly either, but the on-screen text
states a fact about the gun's capacity, not a claim about what the photo
shows, so no text change was needed beyond swapping from "illustrative, not
authentic" framing to treating it as what it now actually is — a real photo
of the real gun. Zero Runway cost — same free ffmpeg Ken Burns treatment as
Clip 1, kept deliberately minimal (very slight push, no aggressive zoom)
given the low native resolution.

**Clip 3 — the doorframe.**
AI-generated illustrative still, per the original brief. First attempt
passed inspection cleanly on the first try (bullet-hole cluster, chalk-circle
diagram marks, plaster wall, no people/text/watermark). 8 credits.

## Runway spend — actual, itemized
| Item | Result | Credits |
|---|---|---|
| Revolver still v1 | Failed (chambers not visible) | 8 |
| Revolver still v2 | Failed (worse — closed cylinder, garbled text, clutter) | 8 |
| Doorframe still | Passed | 8 |
| Doorframe motion (5s, gen4.5) | Passed after trim (see below) | 60 |
| **Total real Runway spend** | | **84 credits** |

Original estimate was ~120-130 credits (two 60-credit motion clips + two
~8-credit stills). Actual came in lower — Clips 1 and 2 both ended up as
real photos (zero Runway cost) rather than AI-generated/animated, and the
revolver AI-still path was abandoned entirely in favor of the real photo.
The 16 credits spent on two failed revolver stills is real sunk cost from
a path that was ultimately replaced, not part of what shipped.

## Motion pass — inspection and a real catch
Doorframe motion clip (5.04s raw) passed the opening/mid checks but a
**full-clip check caught a defect the opening frames missed**: a dark
shadow artifact — reading as a person's head/shoulder silhouette — starts
forming around 3.6-4.0s and is fully formed by the end of the clip,
violating the "no people, no new object... first frame to last" constraint
in the motion prompt. Confirmed clean up to ~3.5s via frame-by-frame check.
**Fix: trimmed to the last clean frame (3.7s) and freeze-extended locally
in ffmpeg** rather than spending another 60 credits on a reshoot — the
freeze also happens to match the original spec's own intent ("slowing on
the last and most prominent hole"), since the trim point already lands on
a held view of the most prominent wall hole.

**Technical note:** the freeze-extended segment and the trimmed motion
segment were initially concatenated at mismatched frame rates (24fps vs
25fps elsewhere in the reel) — caught via frame-count verification before
assembly, not just duration numbers, and rebuilt with an explicit `fps=25`
on every segment. Worth flagging as a new lesson: `ffprobe`'s reported
`duration` on a concat-demuxer output can be misleading when segment frame
rates don't match; count actual frames (`-count_frames`) to verify, not
just duration, whenever segments come from different sources (Runway
output vs. a locally-rendered freeze-frame).

## Assembly
Combined source: Clip1 (5s) + Clip2 (5s) + Clip3 (6.12s: 3.7s motion +
2.32s freeze) = 16.12s, run through the shared `assembleReel()` pipeline
with `musicKey: 'tension-documentary'`, portrait card, and standard CTA
card. Total with portrait+CTA: **23.12s** — above the brief's stated
"~18-20s" target, but consistent with the Hobbs series' own established
20-25s norm (this is the four-clip structure plus two caption cards on
Clip 3, which the ~18-20s estimate didn't fully account for).

## On-screen text (final, fact-checked)
1. "The night of June 4, 1968. The Ambassador Hotel, Los Angeles." (corrected from "June 5" — see Clip 1 sourcing above)
2. "This revolver holds eight bullets."
3. "Researcher Lisa Pease found evidence of at least twelve." (attributed to Pease by name, not asserted as undisputed fact)
4. "Researchers call it the second Dallas."
5. Portrait: "Walter has studied this case as long as he's studied his brother's. He'll tell you what doesn't add up."
6. CTA: "Ask him about it." / "talkwithicons.com" / "Real conversations feed real rescue dogs."

## Deliverable
Blob URL: `https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/3d2f7ec0-4d79-43e4-b770-17ccec242711.mp4`
Duration: 23.12s. Not deployed/pushed to main.
