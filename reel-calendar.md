# TalkWithIcons Reel Posting Calendar

Generated 2026-09-22, updated 2026-09-22 with phone-postable Blob links.
Covers the entire current finished-reel backlog: 22 reels across 5
characters. None of these have been posted yet (confirmed via per-reel
specs / project notes — everything here is "delivered, not deployed").

**Days 1-14 (2026-09-23 – 2026-10-06):** one reel per day, posted manually.
**Day 15 (2026-10-07) is the earliest date to connect Buffer** for scheduled
posting — from there, 3 reels/week on Mon/Wed/Fri until the backlog runs out.
**Backlog runs out 2026-10-23** (the 22nd and last reel in this inventory).

Rotation rule: no character posts on two consecutive scheduled days: each
character's own reels stay in their defined series order (Hobbs 1→2→3→5→6→
I Don't Either→RFK Ballistics; Houdini 1→5; Tesla Papers→Radio→Wardenclyffe;
Vance Ariel School→Villas-Boas→Travis Walton→Owatonna; Vincent/Van Gogh
Gauguin Night→Halos→Yellow). Hobbs has the longest queue (7), so a straight
round-robin would force two Hobbs posts back-to-back once every other queue
ran dry — this schedule instead always posts whichever character has the
most reels still remaining (excluding whoever posted last), which avoids
that entirely.

**Every row now has a Blob URL that opens/downloads directly on a phone —
no PC step needed for any reel.** 19 files (everything that only had a
local path before) were uploaded to the same Vercel Blob store the three
Arthur Vance reels already used, under stable `reels/dayNN-character-title.mp4`
names. All 22 URLs (the 19 new + the 3 pre-existing Vance ones) were
verified with an HTTP HEAD request: status 200 and remote `content-length`
matching the local file's byte size exactly for the 19 new uploads; the 3
pre-existing ones returned 200 with real, non-zero sizes. Local file paths
are kept below for reference/PC editing; the Blob URL is what to actually
open on a phone.

| # | Date | Day | Character | Reel | Blob URL (open on phone) | Local file path | Caption |
|---|------|-----|-----------|------|---------------------------|------------------|---------|
| 1 | 2026-09-23 | Wed | Walter Hobbs | Umbrella Man | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day01-hobbs-umbrella-man.mp4 | `vapi-backup-response-limit/hobbs-final-v2-faded.mp4` | — |
| 2 | 2026-09-24 | Thu | Houdini | The Vanishing Elephant | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day02-houdini-vanishing-elephant.mp4 | `vapi-backup-response-limit/houdini1-final-v4.mp4` | — |
| 3 | 2026-09-25 | Fri | Walter Hobbs | Fifteen | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day03-hobbs-fifteen.mp4 | `vapi-backup-response-limit/hobbs2-final-faded.mp4` | — |
| 4 | 2026-09-26 | Sat | Houdini | Rohan | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day04-houdini-rohan.mp4 | `vapi-backup-response-limit/houdini2-final-v2.mp4` | — |
| 5 | 2026-09-27 | Sun | Walter Hobbs | Prayer Man | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day05-hobbs-prayer-man.mp4 | `vapi-backup-response-limit/hobbs3-final-v4-faded.mp4` | — |
| 6 | 2026-09-28 | Mon | Arthur Vance | Ariel School | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-ariel-draft1.mp4 | none (delivered to Blob directly — see `reel-specs/vance-reel-ariel-school.md`) | — |
| 7 | 2026-09-29 | Tue | Walter Hobbs | Window | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day07-hobbs-window.mp4 | `vapi-backup-response-limit/hobbs5-final-faded.mp4` | — |
| 8 | 2026-09-30 | Wed | Houdini | Confession | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day08-houdini-confession.mp4 | `vapi-backup-response-limit/houdini3-final-v5.mp4` | — |
| 9 | 2026-10-01 | Thu | Walter Hobbs | Babushka | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day09-hobbs-babushka.mp4 | `vapi-backup-response-limit/hobbs6-final-faded.mp4` | — |
| 10 | 2026-10-02 | Fri | Tesla | Papers | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day10-tesla-papers.mp4 | `vapi-backup-response-limit/tesla1-final-v2.mp4` | See `reel-specs/tesla-papers-caption.txt` (full text in the artifact, with a copy button) |
| 11 | 2026-10-03 | Sat | Arthur Vance | Villas-Boas | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-vilasboas-draft1.mp4 | none (delivered to Blob directly — see `reel-specs/vance-reel-villas-boas-v2.md`) | — |
| 12 | 2026-10-04 | Sun | Vincent van Gogh | The Night with Gauguin | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day12-vincent-gauguin-night.mp4 | `vapi-backup-response-limit/vincent-gauguinnight-FINAL3.mp4` | — |
| 13 | 2026-10-05 | Mon | Walter Hobbs | I Don't Either | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day13-hobbs-i-dont-either.mp4 | `vapi-backup-response-limit/hobbs-idonteither-final.mp4` | — |
| 14 | 2026-10-06 | Tue | Houdini | The Code | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day14-houdini-the-code.mp4 | `vapi-backup-response-limit/houdini4-final.mp4` | — |
| **15** | **2026-10-07** | **Wed** | **Tesla** | **Radio** — *earliest date to connect Buffer* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day15-tesla-radio.mp4 | `vapi-backup-response-limit/tesla2-final-v2.mp4` | — |
| 16 | 2026-10-09 | Fri | Arthur Vance | Travis Walton | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day16-vance-travis-walton.mp4 | `vapi-backup-response-limit/vance-travis-walton-final.mp4` | — |
| 17 | 2026-10-12 | Mon | Vincent van Gogh | Halos | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day17-vincent-halos.mp4 | `vapi-backup-response-limit/vangogh-halos-FINAL2.mp4` | — |
| 18 | 2026-10-14 | Wed | Walter Hobbs | RFK Ballistics | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day18-hobbs-rfk-ballistics.mp4 | `vapi-backup/hobbs-rfk-final.mp4` | See `reel-specs/hobbs-rfk-caption.txt` (full text in the artifact, with a copy button) |
| 19 | 2026-10-16 | Fri | Houdini | Never Escape | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day19-houdini-never-escape.mp4 | `vapi-backup-response-limit/houdini5-verify-final.mp4` | — |
| 20 | 2026-10-19 | Mon | Tesla | Wardenclyffe | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day20-tesla-wardenclyffe.mp4 | `vapi-backup-response-limit/wardenclyffe-final.mp4` | — |
| 21 | 2026-10-21 | Wed | Arthur Vance | Owatonna | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-owatonna-draft1.mp4 | none (delivered to Blob directly — see `reel-specs/vance-reel-owatonna.md`) | — |
| **22** | **2026-10-23** | **Fri** | Vincent van Gogh | Yellow — *backlog runs out* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day22-vincent-yellow.mp4 | `vapi-backup-response-limit/vangogh-yellow-FINAL2.mp4` | — |

**Total: 22 finished reels, all phone-postable directly from their Blob URL.**

## How to post from a Blob URL on your phone

1. Open the row's Blob URL in your phone's browser (or tap the link on the
   published calendar artifact).
2. Tap the browser's download / save-video option — it lands in your
   camera roll.
3. Instagram → + → Reel → pick it from your camera roll → paste the
   caption (RFK Ballistics has one ready to copy on the artifact page;
   the rest, describe the hook in your own words) → post.
