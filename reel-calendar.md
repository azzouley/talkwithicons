# TalkWithIcons Reel Posting Calendar

Generated 2026-09-22, updated 2026-09-22 with phone-postable Blob links.
Covers the entire current finished-reel backlog: 34 reels across 8
characters (updated 2026-09-24). Days 1-2 are posted; everything else is
"delivered, not deployed".

**Days 1-14 (2026-09-23 – 2026-10-06):** one reel per day, posted manually.
**Day 15 (2026-10-07) is the earliest date to connect Buffer** for scheduled
posting — from there, 3 reels/week on Mon/Wed/Fri until the backlog runs out.
**Backlog runs out 2026-11-20** (the 34th and last reel in this inventory).

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

**Updated 2026-09-24:** 12 reels that were missing from this calendar were folded into the rotation: 5 Aela, 5 Leonardo da Vinci, 2 Father Elia Rocca. Days 1-2 are posted. Everything unposted was re-slotted from Sep 25 with the same rule (character with the most reels left, never twice in a row, series order kept). Two swaps put Houdini "The Code" (Oct 30) and Rocca "Anneliese" (Oct 28) next to Halloween. **Backlog now runs out 2026-11-20.** Every row's caption, with a copy button, is in the published Reel Calendar artifact. All end cards now say "Link in bio" (see project memory / REEL_PRODUCTION.md). Captions now match: every unposted caption's CTA reads "… Link in bio." instead of "at talkwithicons.com" (rescue-dog line and hashtags unchanged). The two posted reels keep their original captions as a record of what went live. Caption files for the 12 added reels are in `reel-specs/` (aela-*, davinci-*, rocca-*).

| # | Date | Day | Character | Reel | Blob URL (open on phone) |
|---|------|-----|-----------|------|---------------------------|
| 1 | 2026-09-23 | Wed | Walter Hobbs | Umbrella Man — *posted* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day01-hobbs-umbrella-man.mp4 |
| 2 | 2026-09-24 | Thu | Houdini | The Vanishing Elephant — *posted* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day02-houdini-vanishing-elephant.mp4 |
| 3 | 2026-09-25 | Fri | Walter Hobbs | Fifteen | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day03-hobbs-fifteen.mp4 |
| 4 | 2026-09-26 | Sat | Aela | Not From Here — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/08b39a8a-97a1-449e-9cc5-9a6cd444037e.mp4 |
| 5 | 2026-09-27 | Sun | Leonardo da Vinci | Mona Lisa — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/cf65329d-0c29-4120-a94e-5b4aa3ab0427.mp4 |
| 6 | 2026-09-28 | Mon | Walter Hobbs | Prayer Man | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day05-hobbs-prayer-man.mp4 |
| 7 | 2026-09-29 | Tue | Arthur Vance | Ariel School | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-ariel-draft1.mp4 |
| 8 | 2026-09-30 | Wed | Houdini | Rohan | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day04-houdini-rohan.mp4 |
| 9 | 2026-10-01 | Thu | Aela | Same First Question — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/a404d556-17d7-4374-9b63-0a8df746eb88.mp4 |
| 10 | 2026-10-02 | Fri | Leonardo da Vinci | The Last Supper — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/55e9dda1-761d-4d84-8d79-f23e733df684.mp4 |
| 11 | 2026-10-03 | Sat | Walter Hobbs | Window | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day07-hobbs-window.mp4 |
| 12 | 2026-10-04 | Sun | Tesla | Papers | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day10-tesla-papers.mp4 |
| 13 | 2026-10-05 | Mon | Vincent van Gogh | The Night with Gauguin | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day12-vincent-gauguin-night.mp4 |
| 14 | 2026-10-06 | Tue | Arthur Vance | Villas-Boas | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-vilasboas-draft1.mp4 |
| 15 | 2026-10-07 | Wed | Houdini | Confession | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day08-houdini-confession.mp4 |
| 16 | 2026-10-09 | Fri | Aela | While You Sleep — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/cfbf235b-cb19-4144-89a9-b83396a65a8e.mp4 |
| 17 | 2026-10-12 | Mon | Leonardo da Vinci | The 1476 Accusation — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/ad040c5b-c59a-4912-9e81-dc643de0eb3a.mp4 |
| 18 | 2026-10-14 | Wed | Walter Hobbs | Babushka | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day09-hobbs-babushka.mp4 |
| 19 | 2026-10-16 | Fri | Father Elia Rocca | Recent Graduate — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/rocca-recent-graduate-draft1.mp4 |
| 20 | 2026-10-19 | Mon | Tesla | Radio | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day15-tesla-radio.mp4 |
| 21 | 2026-10-21 | Wed | Vincent van Gogh | Halos | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day17-vincent-halos.mp4 |
| 22 | 2026-10-23 | Fri | Arthur Vance | Travis Walton | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day16-vance-travis-walton.mp4 |
| 23 | 2026-10-26 | Mon | Leonardo da Vinci | Salvator Mundi — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/79f01c33-b07e-40c0-8913-50162d5e56bf.mp4 |
| 24 | 2026-10-28 | Wed | Father Elia Rocca | Anneliese — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/rocca-anneliese-draft1.mp4 |
| 25 | 2026-10-30 | Fri | Houdini | The Code | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day14-houdini-the-code.mp4 |
| 26 | 2026-11-02 | Mon | Walter Hobbs | I Don't Either | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day13-hobbs-i-dont-either.mp4 |
| 27 | 2026-11-04 | Wed | Aela | Find the Pleiades — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/c6b582f7-f4c3-4f90-9942-4a984ab94bec.mp4 |
| 28 | 2026-11-06 | Fri | Tesla | Wardenclyffe | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day20-tesla-wardenclyffe.mp4 |
| 29 | 2026-11-09 | Mon | Vincent van Gogh | Yellow | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day22-vincent-yellow.mp4 |
| 30 | 2026-11-11 | Wed | Arthur Vance | Owatonna | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/vance-owatonna-draft1.mp4 |
| 31 | 2026-11-13 | Fri | Houdini | Never Escape | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day19-houdini-never-escape.mp4 |
| 32 | 2026-11-16 | Mon | Aela | The Names — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/38fbc111-721a-4344-8dfd-4c8192b272ee.mp4 |
| 33 | 2026-11-18 | Wed | Leonardo da Vinci | Mirror Writing — *added 9/24* | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/bbf667f2-1b5e-4a14-abcb-3dda63d3146e.mp4 |
| 34 | 2026-11-20 | Fri | Walter Hobbs | RFK Ballistics | https://5mrqeih32vtf7mev.public.blob.vercel-storage.com/reels/day18-hobbs-rfk-ballistics.mp4 |

**Total: 34 reels across 8 characters (2 posted), all phone-postable directly from their Blob URL.**

## How to post from a Blob URL on your phone

1. Open the row's Blob URL in your phone's browser (or tap the link on the
   published calendar artifact).
2. Tap the browser's download / save-video option — it lands in your
   camera roll.
3. Instagram → + → Reel → pick it from your camera roll → paste the
   caption (RFK Ballistics has one ready to copy on the artifact page;
   the rest, describe the hook in your own words) → post.
