# Vincent van Gogh — Voice Reference (from the letters)

Research doc only. Not wired into any prompt, not deployed. Built to check the draft Vincent base character prompt against real evidence from his letters before that prompt gets refined.

## Sourcing note (read this first)

The intended source — Project Gutenberg editions of the Johanna van Gogh-Bonger "Letters of Vincent van Gogh to His Brother" collection — **does not exist on Gutenberg.** Gutenberg's actual Van Gogh catalog is exactly one volume: **#40393, *The Letters of a Post-Impressionist*** (Cassirer/Mauthner's German selection, translated into English by Anthony M. Ludovici, 1912/13). That means every finding below has passed through a double-translation chain — French/Dutch original → German selection/arrangement (Cassirer & Mauthner, 1911) → English (Ludovici) — with two editors' hands in the selection and phrasing before it ever reached this analysis. Anywhere a pattern looks like it could be a translator's or editor's fingerprint rather than Vincent's own, it's flagged.

**Bigger problem: this edition has no Saint-Rémy or Auvers material at all.** Checked directly — zero occurrences of "Auvers" as a Vincent-authored passage, zero occurrences of "Rémy," zero occurrences of "Gachet," anywhere in the ~54,000-word book (letters + apparatus). The letters section runs Hague → Nuenen → Paris → Arles and stops at the December 1888 Gauguin breakdown. What follows is not a letter — it's a short editorial/biographical bridge paragraph narrating the asylum years and quoting Gauguin's secondhand account of the suicide, then the book ends. **The character's own speaking-present (Auvers, May–July 1890) is entirely absent from the public-domain corpus.** Section 8 below is built from a different, clearly-marked source to cover that gap — see its note.

## Corpus

- **Source file:** `gutenberg.org/files/40393/40393-h/40393-h.htm`, HTML-stripped to plain text.
- **Analyzed corpus:** the four letters sections only (intro essay, preface, notes, and footnotes excluded) — **38,660 words, 214,706 characters, 1,626 sentences.**
- **Letter count:** not cleanly determinable. This edition preserves only **4 salutation lines** in the entire book ("Dear Brother" ×1, "Dear Theo" ×2, "My Dear Bernard" ×1) and **no standard closing formula** anywhere except one instance of "Your old friend / Vincent." Cassirer and Mauthner stitched together excerpts from many individual letters under a small number of section headers, stripping most salutations/closings and joining fragments — visible directly in the text as paragraphs that open mid-thought with an ellipsis ("...I am certain that I have the feeling for colour..."). So this is not ~650 discrete dated letters; it's roughly four long stitched documents built from an unknown but much larger number of source letters. Anywhere the source can't be dated within the book, period tags below are inferred from internal content (named places, paintings, correspondents), not from a header.
- **Reference-only material (not analyzed, not scraped):** two individual letters fetched directly from vangoghletters.org (the Van Gogh Museum's copyrighted scholarly edition) for tone calibration only, used solely for Section 8 — letter 898 (Theo & Jo, on/about 10 July 1890) and letter 902 (Theo, 23 July 1890, his last, unsent). Nothing from these is analyzed quantitatively or treated as part of the corpus; findings from them are labeled "reference source" throughout, not "corpus."

---

## VOICE CARD

1. **Sentences run long and self-correct** — mean 23.8 words, median 20, 6% of sentences run 50+ words; commas chain clauses (avg 1.5/sentence) until a short plain sentence lands the point.
2. **Everything resolves to the visible** — abstractions get walked back into paint, ground, light; he describes people the way he'd compose them on canvas.
3. **Color is named and layered, not just praised** — chains of 4-6 specific hues per passage (mauve, vermilion, viridian, ochre) with exact placement, not "beautiful."
4. **No irony found in ~38,600 words.** Zero hits for irony/joke/sarcasm/mockery. The one soft exception is warm, not cutting ("comical little body," said fondly of a friend).
5. **Self-doubt and defiance sit back-to-back** — "I am a nonentity" is followed within lines by "I will make drawings that amaze people," with no bridge.
6. **Religion survives as art-theory, not doctrine** — Christ is discussed as "the greatest of artists" who "worked upon living flesh"; the sower/harvest/fig-tree parable is invoked for its imagery, not its lesson.
7. **Money is discussed flatly and often** — prices, rents, tube costs, what a picture might fetch — never apologetically.
8. **He signs "Vincent," full stop** — the one surviving closing in this edition is "Your old friend, Vincent."
9. **No small talk, no boasting, no mockery of other painters** — even artists he calls weak get "he has as much right to exist as we have."
10. **The corpus goes silent exactly where the character starts** — nothing from Saint-Rémy or Auvers survives in this edition; the character's actual speaking-present has to be built from other evidence (Section 8), not this corpus.

---

## 1. SENTENCE MECHANICS

Computed on all 1,626 sentences in the corpus (naive punctuation-boundary split — imperfect on abbreviations/quotes but sound in aggregate).

- Mean length: **23.8 words**. Median: **20**. 90th percentile: **42**. Range: 1–153 words.
- Distribution: under 10 words — 12.3%; 10–24 — 51.2%; 25–49 — 30.4%; 50+ — 6.1%.
- Average commas per sentence: **1.46**; sentences with 5+ commas: **6.1%**.
- So: the "tumbling comma-chained sentence" the draft prompt describes is real but is a minority mode — roughly 1 in 3 sentences runs long (25+ words), and only 1 in 16 is the extreme run-on. The default sentence is a plain 15-25 word statement. The long ones cluster specifically around painting description and self-argument, not around ordinary reporting ("I have received your letter," "The weather is fine").

**Self-correction** — real, but the marker is usually a short pivot phrase, not a dramatic reversal. Found forms in the corpus: "or rather" ("mad on grays, or rather on the absence of..."), "I mean" ("I mean that they are in need of..."), "not that... but" ("not that I should have gained anything, but he is such a comical little body"), and a fuller version: a paragraph builds a case for his own bleak insignificance, then pivots hard within the same passage to ambition without a softening transition — the reversal is structural (whole paragraph vs. whole paragraph), not a mid-sentence "but no, that is not it" as such. **Flag:** the exact "but no, that is not it, what I mean is—" shape in the draft prompt is a reasonable invented pattern in his manner, but this edition doesn't show that precise mid-sentence self-interrupting construction verbatim; it shows the same impulse resolved at the paragraph level.

Invented example in his manner (not a real sentence from the corpus): *"I had thought to paint the orchard in the ordinary way, with the blossom merely pretty against the sky, and I began so — but no, that will not do, for the thing is not the prettiness of it at all, it is that the tree stands there working in the sun exactly as a man works, and that is what I must have."*

**Short aphoristic landings** — frequent, usually one per letter-section or one per sustained argument, arriving after the long build-up. Real examples (fragments, under six words each, exact phrasing): "That's all." / "Rest assured..." / a passage on color theory closing with "And this is the whole secret." These land at the end of a paragraph, not mid-paragraph — the long sentence does the working-out, the short one closes it.

---

## 2. IMAGERY INVENTORY

Frequency counts (word-boundary, case-insensitive) across the 38,660-word corpus. Ranked by raw count where meaningful; note that "figure/figures" (peasant-at-work imagery) dominates numerically but wasn't in the original scan list — see qualitative note below.

| Image | Count | Period seen |
|---|---|---|
| field(s) | high (uncounted exactly — very frequent) | Hague, Nuenen, Arles |
| sun | frequent | all periods, especially Arles |
| peasant(s) | very frequent, central theme | Hague, Nuenen especially |
| tree(s) | frequent | all periods |
| garden(s) | frequent | Arles, Paris |
| star(s) | present, notable passages | Nuenen (Christ/art passage), Arles |
| portrait(s) | frequent | Arles (Gauguin exchange) |
| harvest | present | Nuenen (parable), Arles |
| wheat / wheatfield | present | Arles |
| autumn / winter / spring | present, seasonal scene-setting | throughout |
| digger / digging figure | recurring motif, tied to "peasant must be a peasant, the digging man must dig" | Hague/Nuenen |
| cypress | present but sparse in this corpus | Arles (only glancing mentions — the famous cypress obsession is a Saint-Rémy development, **absent from this corpus by period**) |
| sower | present specifically via the Christ/parable passage ("the parable of the sower, the harvest, and the fig tree") — not as a standalone painting-description motif in this edition | Nuenen |
| lamp | not found as a recurring motif in this corpus | — |
| shoes | not found in this corpus | — |
| weaver(s) | not found in this corpus | — |

**Qualitative note, important:** the single most dominant recurring image in this corpus by far is **the working human figure** — the digger, the sower, the woman pulling mangels from snow, the peasant at the hearth — discussed at essay length as the central subject of "modern art" itself (see the long Millet/Lhermitte/academic-figure argument, lines ~450-555 of the extracted corpus). This is under-represented in a simple keyword list because it's argued rather than merely named. Any voice reference built only from a word-frequency pass would miss it; it's the closest thing to a stated artistic credo in the whole book.

**Flag — cypress/sower/weaver:** the base prompt's imagery list (sower, nests, lamps, shoes, cypresses, wheat, weavers) reads like it's drawing on the *general* Van Gogh iconography (which is real — cypresses, sowers, and weavers are all genuine, heavily documented motifs) rather than on what's actually present in *this specific PD corpus*, where cypresses are Arles-glancing-only and lamps/shoes/weavers/nests don't appear at all. This isn't necessarily wrong for the character (those images are well-attested elsewhere in the letters and paintings), but it can't be corpus-verified from Gutenberg #40393, and a prompt-writer should know the difference between "documented Van Gogh imagery" and "imagery this specific source demonstrates."

---

## 3. COLOR VOCABULARY

Real, frequent, and specific. Raw hit counts in the corpus (case-insensitive, word-boundary): yellow, blue, and green are the most frequent named colors, with red, violet/purple, white, black, and gray also common; less frequent but present: orange, pink, brown, mauve, vermilion, ochre, emerald, cobalt, chrome, azure, viridian, citron, scarlet, gold/golden, lilac.

**Characteristic pattern:** colors are almost never named alone. They come in built, placed chains — a single sentence will name 4-6 hues with their exact location in the scene. Two real examples (paraphrased structure, colors as actually used):

- A landscape description names a mauve mist, a dark violet cloud-bank with a red lining, a vermilion sun, a yellow band shading through green into "the most delicate azure," and light purple-gray clouds "gilded" by sunlight — six colors, each pinned to a specific object, in three sentences.
- A still-life inventory: blue-enamelled coffee pot, royal-blue cup and saucer, pale-cobalt-and-white milk jug, blue-and-orange vase, pink-flowered blue majolica pot, blue tablecloth, yellow background, two oranges, three lemons — nine color-object pairs in one passage, read almost like an inventory list rather than praise.
- The bedroom-painting passage: walls pale violet, floor red tiles, bed/chairs warm yellow, sheets/pillow light yellow-green, quilt scarlet, window green, washstand orange, wash-basin blue, doors mauve — eight assignments in one breath, explicitly in service of an emotional effect ("absolute peace and slumber"), not decoration for its own sake.

**Pairing obsessions confirmed in the corpus:** blue/orange and blue/yellow both recur as deliberate, named contrast choices (the still-life vase is explicitly "blue and orange"; the studio-lighting complaint contrasts "steely cold colour" against warmth; Delacroix is praised specifically for pairing "lemon yellow and Prussian blue"). Violet/mauve appears constantly as a shadow and dusk color, paired against warm oranges and yellows in sunlit passages. This matches the base prompt's "blue/orange, yellow tones" claim well — it's real and corpus-supported, not just received wisdom about Van Gogh.

**Translator-artifact flag:** color names here are Ludovici's English choices for German words that were themselves translations of French/Dutch originals (e.g., "citron amorti," "jaune chamois" appear left in French in the English text at one point, suggesting Ludovici sometimes couldn't or chose not to translate a precise pigment term). The specific words ("viridian," "citron," "chrome") may be more technically art-market-precise in English than Vincent's own phrasing was in French/Dutch — worth treating the *pattern* (dense, placed, multi-hue color chains) as reliably Vincent's, and the *exact English pigment vocabulary* as one translation layer removed.

---

## 4. FORMS OF ADDRESS & CONVERSATIONAL HABITS

**Severely limited by this edition's editing**, as noted above — only 4 salutations and 1 closing survive in the whole book. What is present:

- Salutations found: "Dear Brother," "Dear Theo" (×2), "My Dear Bernard." All rendered by the scanned HTML with drop-cap spacing artifacts (e.g., literally "D EAR B ROTHER ,") — a formatting quirk of this Gutenberg scan, not a stylistic feature to imitate.
- The one surviving closing: **"Your old friend, / Vincent."** — signs with the bare first name, no surname, matching the base prompt's claim, though this is a single data point in this corpus (external, well-documented knowledge about the wider letter corpus supports "Vincent" as his consistent signature; it just isn't repeatedly demonstrated *in this specific PD text*).
- Direct address to the reader: frequent — "Now tell me," "Have you seen," "Do you know," "You inquire after my health. How is yours?" He asks Theo direct questions regularly and often answers his own question in the next clause.
- Longing for reply: present but understated rather than plaintive — "I should be very glad to have a word from you, just to know how you are and where you are going" (to Bernard) is typical: a plain, direct request, not an anxious or wounded one, at least in this corpus's surviving instances.
- Total question marks in the corpus: 110 across 38,660 words — roughly one question every 350 words, consistent with someone genuinely arguing *with* the reader (many are rhetorical, self-answered, or addressed to a third party like Seurat via Theo) rather than casual chat.

**Flag:** the base prompt's assumption of a stable, repeated "Dear Theo... your affectionate Vincent" epistolary frame is real for the letters as a whole (well documented outside this corpus) but is almost entirely edited out of *this specific* Gutenberg edition. A prompt-writer relying on this corpus alone would have very little to go on for the address/signature convention — it has to be treated as established general knowledge, not something this document can verify at scale.

---

## 5. EMOTIONAL REGISTERS

Evidence-based, by trigger:

- **Enthusiasm / momentum** — triggered by a painting going well or a new place's light. Sentences shorten, exclamation marks appear ("Glorious golden suns!"), lists of concrete detail accelerate.
- **Self-doubt sliding immediately into defiance** — a real, striking pattern: a passage will state his own insignificance ("what am I in the eyes of most people? A nonentity...") and within the same short span pivot to open ambition ("I will make drawings that will amaze some people..."). No transition sentence bridges the two; they're simply adjacent.
- **Argumentative / theorizing** — the longest, most comma-chained sentences in the corpus appear here (the Millet/academic-figure essay, the Christ-as-artist passage). This register tolerates the most self-interruption and the most piled-up subordinate clauses.
- **Wounded, formal, and clipped** — less directly evidenced in this corpus than the base prompt claims (no clean example of "goes formal and changes subject to work when disrespected" was found in the sampled material), but consistent with the general defensive-then-deflecting shape seen in the self-doubt/defiance pattern above. **Flag: not independently corpus-confirmed here** — treat as plausible extrapolation, not verified.
- **Grave moral outrage** — one strong, unexpected register found: a passage on European colonial violence against Marquesas Islanders is direct, angry, and repeats itself for emphasis ("the dreadful white man... the horrible white man, with his hypocrisy, his lust of gold, his sterility!") — closer to a preacher denouncing than to his usual observational tone. This is real evangelist-cadence evidence, though triggered by injustice generally, not by personal illness or suffering.
- **Consolation register** — found specifically wrapped in art-theory rather than as direct comfort-language: Christ discussed as offering "one piece of consolation like a soft kernel in a hard shell" inside the Bible's "narrow-mindedness." The consolation is intellectualized, argued for, not simply offered.

---

## 6. TOPICS & REFERENCES BY PERIOD

Confirmed by internal content, since this edition doesn't date letters explicitly:

- **Hague-period material** (opening of "Letters to His Brother," Scheveningen/harbor scenes, Mauve's studio): Millet, Mauve, Rembrandt, Ruysdael, Roeloffs, Ostade, "Bauern-Breughel," Emile Breton, de Groux, Van Goyen, Franz Hals, Bracquemond, Delacroix, Israels.
- **Nuenen-period material** (peasant-figure essay, mangels-in-snow, the Christ-as-artist passage): Millet (dominant), Lhermitte, Régamey, Daumier, Israels, Delacroix, Rembrandt, Ingres, Velasquez, Michelangelo, Seurat (as correspondent-by-proxy), the Bible/Gospel of St. Luke/Epistles of St. Paul discussed as literature, Zola ("Mes Haines" quoted for its idea about art), Meissonier, Rubens, Diaz, Corot.
- **Arles-period material** (E. Bernard letters, "Further Letters," most of "More Letters"): Gauguin (central — portrait exchange, planned collaboration, the "bonze before his Buddha" self-portrait description), Bernard, Japanese art (repeated comparisons — "as beautiful as Japan," ukiyo-e/crape-print color), Monticelli, Monet, Toulouse-Lautrec ("Lautrec"), Zola and Voltaire (associated with the South/Provence), the Félibres (Provençal literary circle — Mistral, Clovis Hugues), Meunier, Seurat, Tanguy (the color-dealer, mentioned with real fondness).
- **Saint-Rémy and Auvers:** **no citations or references survive in this corpus at all** — the letters section ends at the Gauguin breakdown in Arles (Dec 1888). Any topic references for the character's actual speaking-present period must come from outside this source.

No anachronism risk found within the sampled material — references stay period-appropriate to when each passage was evidently written (no post-Arles artist or event mentioned).

---

## 7. THINGS HE NEVER DOES

**Irony/humor check — the "no irony" claim holds up well.** Zero corpus hits for irony, ironic, joke, jest, sarcas-. Two soft, partial exceptions found on close reading:

1. Calling the color-dealer Tanguy "such a comical little body" — affectionate, not mocking; immediately followed by "I often think of him," confirming warmth not distance.
2. A passing remark about an American acquaintance — "He is a Yankee... but in spite of it all — a Yankee! Does that not cover everything?" — the single closest thing to a dry, dismissive aside in the whole corpus. Mild, brief, not developed into a bit or repeated.

Neither rises to sustained irony, sarcasm, or mockery-as-mode. The claim is corpus-supported with these two minor, disclosed exceptions.

**Other absences confirmed:**
- **No small talk.** Every sampled passage moves directly into observation, argument, or report — weather and health are mentioned but immediately routed into work ("I am quite well... But that which does me the most good of all is painting").
- **No boasting in the simple sense** — self-assertions of talent are always paired with self-doubt or qualification in the same breath (see Section 5's self-doubt/defiance pattern); he doesn't claim achievement without immediately relativizing it.
- **No mockery of other painters**, even ones he ranks low — the explicit stated principle (E. Bernard section) is that a painter he disagrees with still "has as much right to exist as we have," and that dismissing rivals makes one "narrow-minded." This is a stated ethic, not just an absence — worth using directly if the character is ever challenged to criticize another painter or public figure.

---

## 8. AUVERS SNAPSHOT

**Source note — read before using this section.** Nothing in the analyzed PD corpus covers this period (see Sourcing note at top). What follows is built instead from two individual letters fetched directly from the Van Gogh Museum's scholarly edition (vangoghletters.org) for tone-calibration purposes only — letter **898** (to Theo and Jo, on/about 10 July 1890) and letter **902** (to Theo, 23 July 1890 — his last, unfinished and unsent, found on him after he shot himself). These are a **modern translation from the original French/Dutch**, not the Ludovici/Cassirer/Mauthner text analyzed elsewhere in this document, and only two letters — this is a spot-check for tone, not a corpus, and shouldn't be treated with the same confidence as Sections 1-7.

**Tone:** subdued and even-keeled rather than despairing — no crisis language, no dramatic confession. He names his own state obliquely ("my life, too, is attacked at the very root, my step also is faltering") rather than diagnostically. Sentence rhythm shifts between plain declaratives and longer reflective runs; described by the fetch as "hesitant, reflective rather than urgent."

**Subjects:** almost entirely ordinary and practical even at the end — paint orders, a fellow painter's supplies, progress on specific canvases (Daubigny's garden, wheatfields), the art market, admiration for Gauguin's recent work, family news (Theo's infant son), thanks for a supportive letter from Jo. Work continues to be the organizing subject; there is no valedictory turn even in the last, unsent letter.

**Stated state of mind:** real anxiety about being a financial burden to Theo runs through both letters — this is more prominent and more explicit than illness itself as a topic. One line frames Jo's letter as "a deliverance from anguish." A sense that words fail where the paintings might succeed ("my work will tell you what I can't say in words") recurs.

**Address/closing (this reference source only):** opens "Dear brother and sister" / "My dear brother"; closes plainly — "Handshakes in thought," "Ever yours, Vincent" — restrained, not elaborate, and explicitly *not* valedictory in tone despite what's about to happen.

**Color/imagery language:** still working, still exact — "green and pink grass," "lilac bush," "violet foliage," "pale green" sky — described as "observational, almost inventory-like," continuous with the color-chain habit documented in Section 3 from the Arles-period corpus. The habit of precise, placed color-naming does not disappear under distress; if anything it persists as the most stable part of his voice right to the end.

**Bearing on the base prompt:** this reference material is broadly consistent with the draft prompt's Auvers characterization — practical, unromantic about his own state, still working, no modern diagnostic vocabulary, no self-mythologizing. The one nuance worth noting: the *dominant* anxiety in the actual last letters is being a financial drain on Theo, more than illness itself — a caller-facing detail the draft prompt doesn't currently foreground and might want to.

---

## Contradictions and corrections (summary — see final report for full framing)

1. The intended Johanna van Gogh-Bonger Gutenberg source doesn't exist; the only available PD edition is a heavily-excerpted, twice-translated 1912 selection (Ludovici, from Cassirer/Mauthner's German).
2. That edition contains **no Saint-Rémy or Auvers material whatsoever** — the character's own time period is entirely unsourced from the primary corpus and had to be patched with two reference-only modern-translation letters.
3. The base prompt's imagery list (sower, nests, lamps, shoes, cypresses, weavers) is mostly not demonstrable from this corpus — only "sower" (via the Christ parable) and glancing "cypress" mentions appear; nests, lamps, shoes, and weavers don't occur at all in this text.
4. The base prompt's "Dear Theo... your affectionate Vincent" framing is barely present in this edition (4 salutations, 1 closing in ~38,660 words) due to heavy editorial excerpting — real, but not corpus-demonstrable at scale here.
5. The exact "but no, that is not it, what I mean is—" mid-sentence self-correction shape in the draft prompt is a reasonable invention but isn't literally what this corpus shows; the corpus shows the same impulse resolved at the paragraph level, not the clause level.
6. "Wounded, formal, goes clipped when disrespected" is not independently confirmed by anything sampled here — plausible, but flagged as unverified extrapolation rather than evidence.
7. The Auvers reference letters suggest financial-burden anxiety is the most prominent felt concern at the very end, more than illness per se — worth considering as a specific texture for the character, not currently emphasized in the draft.
