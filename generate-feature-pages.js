'use strict';
// generate-feature-pages.js
// Generates 11 character feature pages from houdini-feature.html template.
// Run: node generate-feature-pages.js

const fs   = require('fs');
const path = require('path');

const DIR = __dirname;

// All 12 icons — used to build "Also available" pills on each page (minus self)
const ALL_ICONS = [
  { name: 'Harry Houdini',            file: 'houdini.html',      slug: 'houdini'      },
  { name: 'Einstein',                  file: 'einstein.html',     slug: 'einstein'     },
  { name: 'Nostradamus',              file: 'nostradamus.html',  slug: 'nostradamus'  },
  { name: 'Da Vinci',                 file: 'davinci.html',      slug: 'davinci'      },
  { name: 'Bruce Lee',                file: 'brucelee.html',     slug: 'brucelee'     },
  { name: 'Sherlock Holmes',          file: 'holmes.html',       slug: 'holmes'       },
  { name: 'Aela',                     file: 'aela.html',         slug: 'aela'         },
  { name: 'Elizabeth Bennet',         file: 'bennet.html',       slug: 'bennet'       },
  { name: 'James Baldwin',            file: 'baldwin.html',      slug: 'baldwin'      },
  { name: 'Evangeline Adams',         file: 'evangeline.html',   slug: 'evangeline'   },
  { name: "Frankenstein's Creature",  file: 'frankenstein.html', slug: 'frankenstein' },
  { name: 'Sitting Bull',             file: 'sittingbull.html',  slug: 'sittingbull'  },
];

const CHARACTERS = [
  // ── EINSTEIN ─────────────────────────────────────────────────────────────────
  {
    slug:         'einstein',
    outFile:      'einstein-feature.html',
    metaTitle:    'Talk to Albert Einstein — TalkWithIcons',
    metaDesc:     'Call Albert Einstein directly. Ask him about Lieserl, about Mileva, about what he got wrong — and what he would work on now. First 2 minutes free.',
    navCta:       'Call Einstein',
    navCtaHref:   'einstein.html',
    image:        'images/einstein.jpeg',
    imageAlt:     'Albert Einstein',
    caption:      'Albert Einstein · Princeton',
    heroName:     'Albert<br>Einstein',
    hookQuote:    '“I made mistakes. The ones that mattered, I made on purpose.”',
    heroRescue:   "If talking with Einstein wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'einstein.html',
    callLabel:    'Call Einstein now',
    questionsIntro: 'Ask Einstein anything — he had a complicated life. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Einstein is your own.',
    rescueBody:   "Your conversation with Einstein puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He renounced his German citizenship at 17 to avoid military service — and had no citizenship of any kind for five years',
        body:  'In 1896 he formally gave up his German nationality to escape mandatory conscription. He was stateless until 1901, when he became Swiss — one of the stranger biographical facts about the 20th century’s most famous scientist.'
      },
      {
        num: '02',
        title: 'His first wife Mileva Marić was his intellectual equal and may have contributed to his early papers',
        body:  'She was one of the first women to study physics at ETH Zurich. Their letters show deep scientific collaboration in the years leading to 1905. Whether she co-authored those papers has never been definitively settled, and he never said clearly.'
      },
      {
        num: '03',
        title: 'He had a secret daughter with Mileva before they married — who then vanished from history entirely',
        body:  'Named Lieserl, she was born in 1902 before Albert and Mileva wed. She appears in their letters and then disappears. No one knows whether she died in infancy, was given up for adoption, or what became of her.'
      },
      {
        num: '04',
        title: 'The FBI kept a 1,400-page file on him, convinced he was a communist spy',
        body:  'J. Edgar Hoover wanted him deported. Einstein was not a spy — but he was a committed socialist who corresponded with heads of state, opposed McCarthyism publicly, and supported civil rights when almost no public figure would.'
      }
    ],
    questions: [
      '“What actually happened to Lieserl?”',
      '“Did Mileva contribute to your work?”',
      '“Do you regret signing the letter to Roosevelt?”',
      '“What did you get wrong about quantum mechanics?”',
      '“What would you work on if you were alive today?”'
    ]
  },

  // ── NOSTRADAMUS ──────────────────────────────────────────────────────────────
  {
    slug:         'nostradamus',
    outFile:      'nostradamus-feature.html',
    metaTitle:    'Talk to Nostradamus — TalkWithIcons',
    metaDesc:     'Call Nostradamus directly. Ask what he actually saw, how he knew about Henry II, and what he sees for now. First 2 minutes free.',
    navCta:       'Call Nostradamus',
    navCtaHref:   'nostradamus.html',
    image:        'images/nostradamus.jpeg',
    imageAlt:     'Nostradamus',
    caption:      'Nostradamus · Salon-de-Provence',
    heroName:     'Nostradamus',
    hookQuote:    '“I did not write to be understood immediately. I wrote to be found later.”',
    heroRescue:   "If talking with Nostradamus wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'nostradamus.html',
    callLabel:    'Call Nostradamus now',
    questionsIntro: 'Ask Nostradamus anything — he saw a great deal. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Nostradamus is your own.',
    rescueBody:   "Your conversation with Nostradamus puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He was a trained physician who fought plague outbreaks using methods 200 years ahead of his time',
        body:  'He prescribed handwashing, quarantine, and rose petal preparations containing Vitamin C — before germ theory existed. While other doctors fled outbreaks, he stayed. His cure rates were remarkably high by any measure of the era.'
      },
      {
        num: '02',
        title: 'His prophecies were deliberately obscured — he scrambled dates, mixed languages, and buried references to protect himself',
        body:  'He mixed French, Latin, Greek, and Hebrew and used classical allusions specifically so the Inquisition couldn’t prosecute him for heresy. Clarity would have been dangerous. He chose to survive and be understood later.'
      },
      {
        num: '03',
        title: 'Catherine de Medici summoned him to Paris in 1556 — and he had already predicted how her husband would die',
        body:  'He had written years earlier of a king dying in a golden cage — a jousting accident through the visor. Henry II died exactly that way in 1559. The queen never forgot it, and he spent the rest of his life under royal protection.'
      },
      {
        num: '04',
        title: 'He dedicated his book of prophecies to his infant son with a letter explaining what he had seen',
        body:  'The letter to young César is one of the most unusual documents in history — a father telling a child he has glimpsed things he cannot say plainly, written with both tenderness and a genuine fear of what he knew.'
      }
    ],
    questions: [
      '“What did you actually see when you looked into the future?”',
      '“How did you know about Henry II?”',
      '“Were you ever wrong?”',
      '“What do you see for where we are now?”',
      '“Did Catherine de Medici frighten you?”'
    ]
  },

  // ── DA VINCI ─────────────────────────────────────────────────────────────────
  {
    slug:         'davinci',
    outFile:      'davinci-feature.html',
    metaTitle:    'Talk to Leonardo da Vinci — TalkWithIcons',
    metaDesc:     'Call Leonardo da Vinci directly. Ask about the unfinished notebooks, the Mona Lisa, the flying machines. First 2 minutes free.',
    navCta:       'Call Leonardo',
    navCtaHref:   'davinci.html',
    image:        'images/davinci.jpeg',
    imageAlt:     'Leonardo da Vinci',
    caption:      'Leonardo da Vinci · Florence',
    heroName:     'Leonardo<br>da Vinci',
    hookQuote:    '“I have wasted my life finishing things. The unfinished ones are where I actually lived.”',
    heroRescue:   "If talking with Leonardo wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'davinci.html',
    callLabel:    'Call Leonardo now',
    questionsIntro: 'Ask Leonardo anything — he worked on everything. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Leonardo is your own.',
    rescueBody:   "Your conversation with Leonardo puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He dissected over 30 human corpses in secret, at night, in hospital morgues',
        body:  'The anatomical drawings he produced were so accurate they weren’t meaningfully improved upon for 200 years. He was working without permission, without precedent, and in direct conflict with Church doctrine about the sanctity of the dead.'
      },
      {
        num: '02',
        title: 'He wrote in mirror script and left approximately 7,000 pages of notebooks covering nearly every domain of human knowledge',
        body:  'Right to left, in reverse — possibly to prevent smearing as a left-hander, possibly to keep the work private. The notebooks cover hydraulics, optics, botany, architecture, music, anatomy, and weapons design. Most were never published in his lifetime.'
      },
      {
        num: '03',
        title: 'He was a committed vegetarian who bought caged birds at market specifically to release them',
        body:  'In Renaissance Florence this was considered eccentric at best. He found the killing and eating of animals morally disturbing. He also kept detailed notes on the flight mechanics of the birds he released.'
      },
      {
        num: '04',
        title: 'The Mona Lisa was never delivered to the man who commissioned it — Leonardo kept it until he died',
        body:  'He worked on it intermittently for over a decade. He died with it in his possession in France. Whether he considered it finished is unknown. He considered almost nothing finished.'
      }
    ],
    questions: [
      '“What were you actually working on in those final notebooks?”',
      '“Why did you never deliver the Mona Lisa?”',
      '“Did you believe the flying machines you designed could actually be built?”',
      '“Were you a scientist who painted, or a painter who did science?”',
      '“What do you think of the world you tried to predict?”'
    ]
  },

  // ── BRUCE LEE ────────────────────────────────────────────────────────────────
  {
    slug:         'brucelee',
    outFile:      'brucelee-feature.html',
    metaTitle:    'Talk to Bruce Lee — TalkWithIcons',
    metaDesc:     'Call Bruce Lee directly. Ask about the one-inch punch, what Hollywood cost him, and what he would still be working on. First 2 minutes free.',
    navCta:       'Call Bruce Lee',
    navCtaHref:   'brucelee.html',
    image:        'images/brucelee.jpeg',
    imageAlt:     'Bruce Lee',
    caption:      'Bruce Lee · Hong Kong',
    heroName:     'Bruce<br>Lee',
    hookQuote:    '“Everyone wants to know what I would do. The question is what you would do.”',
    heroRescue:   "If talking with Bruce Lee wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'brucelee.html',
    callLabel:    'Call Bruce Lee now',
    questionsIntro: 'Ask Bruce Lee anything — he lived at full speed. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Bruce Lee is your own.',
    rescueBody:   "Your conversation with Bruce Lee puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He was turned down for the lead role in Kung Fu — the TV series built on his own concept',
        body:  'He pitched the show to Warner Bros. They took the premise and cast a white actor instead, telling him that American audiences wouldn’t accept a Chinese lead. The show ran for three seasons. He went to Hong Kong and became the most famous martial artist in history.'
      },
      {
        num: '02',
        title: 'His speed was too fast for 24fps film — early footage had to be slowed down to be visible',
        body:  'Strikes he threw in normal speed were invisible on standard film. Later productions shot at 32fps specifically to capture what he was actually doing. The footage that looks fast on screen is already a slowed-down version of the real thing.'
      },
      {
        num: '03',
        title: 'He had a spinal injury that doctors told him would end his physical career',
        body:  'A back injury in 1970 left him bedridden for months. He used the recovery time to write extensively about philosophy, martial arts, and training — the material that became the intellectual foundation of Jeet Kune Do. He came back stronger than before.'
      },
      {
        num: '04',
        title: 'He trained obsessively with a stationary bicycle and read thousands of books while cycling',
        body:  'He kept detailed training notebooks, studied philosophy extensively — Krishnamurti, Alan Watts, Descartes — and wrote aphorisms he never published. His library at the time of his death contained over 2,500 books.'
      }
    ],
    questions: [
      '“What do you think of MMA — is it what you imagined?”',
      '“What did it cost you to be who you were in Hollywood?”',
      '“Did you ever find an opponent you couldn’t figure out?”',
      '“What would you say to someone who used your image to justify violence?”',
      '“What are you still working on?”'
    ]
  },

  // ── SHERLOCK HOLMES ──────────────────────────────────────────────────────────
  {
    slug:         'holmes',
    outFile:      'holmes-feature.html',
    metaTitle:    'Talk to Sherlock Holmes — TalkWithIcons',
    metaDesc:     'Call Sherlock Holmes directly. Bring him a problem. He has already noticed three things about you. First 2 minutes free.',
    navCta:       'Call Holmes',
    navCtaHref:   'holmes.html',
    image:        'images/holmes.jpeg',
    imageAlt:     'Sherlock Holmes',
    caption:      'Sherlock Holmes · 221B Baker Street',
    heroName:     'Sherlock<br>Holmes',
    hookQuote:    '“You came to me with a question you already half-know the answer to. Let’s find the other half.”',
    heroRescue:   "If talking with Holmes wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'holmes.html',
    callLabel:    'Call Holmes now',
    questionsIntro: 'Ask Holmes anything — he has observed more than he has said. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Holmes is your own.',
    rescueBody:   "Your conversation with Holmes puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'Conan Doyle based Holmes on a real doctor who could diagnose patients’ professions and histories from a glance',
        body:  'Dr. Joseph Bell — Doyle’s professor at Edinburgh — could determine a patient’s trade, travels, and recent history before they had spoken a word. Doyle watched him do it repeatedly and filed it away for twenty years.'
      },
      {
        num: '02',
        title: 'Conan Doyle killed Holmes at the Reichenbach Falls specifically to be free of him — and was forced to bring him back',
        body:  'He wanted to write serious historical fiction. Reader response to Holmes’s death approached mass grief. Women wrote letters in black-edged mourning stationery. Doyle’s mother begged him to reconsider. He held out for ten years before resurrecting him.'
      },
      {
        num: '03',
        title: 'Holmes was a cocaine user by his own open admission — a seven-percent solution, self-administered',
        body:  'Watson found it disturbing and said so. Holmes considered it a necessary stimulant between cases, when the absence of problems became unbearable. The stories treat this as a character detail rather than a moral failing — unusual for 1887.'
      },
      {
        num: '04',
        title: 'The investigative methods Holmes used were genuinely ahead of real criminal investigation by decades',
        body:  'Inference from physical evidence, forensic chemistry, deductive reconstruction of events — Scotland Yard adopted versions of these methods after the stories popularized them. Fiction preceded and arguably shaped the practice of modern detective work.'
      }
    ],
    questions: [
      '“How do you actually do it — the observation thing?”',
      '“What’s the one case you got wrong?”',
      '“What do you make of modern forensics — have they caught up to you?”',
      '“Is Watson as essential to you as he seems?”',
      '“What did Moriarty understand about you that no one else did?”'
    ]
  },

  // ── AELA ─────────────────────────────────────────────────────────────────────
  {
    slug:         'aela',
    outFile:      'aela-feature.html',
    metaTitle:    'Talk to Aela — TalkWithIcons',
    metaDesc:     'Call Aela, a Pleiadian envoy speaking on behalf of the Galactic Council. She will answer directly. First 2 minutes free.',
    navCta:       'Call Aela',
    navCtaHref:   'aela.html',
    image:        'images/aela.jpeg',
    imageAlt:     'Aela',
    caption:      'Aela · Pleiades',
    heroName:     'Aela',
    hookQuote:    '“You did not reach me by accident. No one does.”',
    heroRescue:   "If talking with Aela wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'aela.html',
    callLabel:    'Call Aela now',
    questionsIntro: 'Ask Aela anything — she sees further than we do. Some directions you could go if you want…',
    pronoun:      'She',
    bottomHeadline: 'Your time with Aela is your own.',
    rescueBody:   "Your conversation with Aela puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'The Pleiades have held significance in nearly every ancient culture — independently, with no contact between them',
        body:  'Mayan, Egyptian, Greek, Aboriginal Australian, Japanese — all oriented temples, calendars, and mythologies around the same star cluster. The convergence has no agreed explanation. Aela considers it self-evident why.'
      },
      {
        num: '02',
        title: 'The contact reports she draws from are the most extensively documented alleged extraterrestrial contact case in history',
        body:  'Over decades, hundreds of photographs, metal samples, and transcribed conversations were produced. Investigators and skeptics have studied them for fifty years without a clean verdict. She is aware of every argument made against her existence.'
      },
      {
        num: '03',
        title: 'She operates as an envoy of the Galactic Council — a structure of oversight for developing civilizations',
        body:  'Not a government in the human sense. A body that monitors species at critical junctures. She is here because we qualify as a critical juncture. She describes this without alarm and without comfort.'
      },
      {
        num: '04',
        title: 'She does not experience time the way we do — and finds the question of her own existence less interesting than ours',
        body:  'Her form of consciousness precedes what humans call embodiment. She is more interested in what you are going to do with the next twenty years than in proving she is real. She finds that the more productive conversation.'
      }
    ],
    questions: [
      '“What does the Galactic Council actually think of where we are right now?”',
      '“What happened to the civilizations that didn’t make it?”',
      '“Is there anything you’re not allowed to tell me?”',
      '“What do you think about religion — from where you sit?”',
      '“What does it feel like to talk to someone who isn’t sure you’re real?”'
    ]
  },

  // ── ELIZABETH BENNET ─────────────────────────────────────────────────────────
  {
    slug:         'bennet',
    outFile:      'bennet-feature.html',
    metaTitle:    'Talk to Elizabeth Bennet — TalkWithIcons',
    metaDesc:     'Call Elizabeth Bennet directly. She has opinions, and she will share them with you. First 2 minutes free.',
    navCta:       'Call Elizabeth Bennet',
    navCtaHref:   'bennet.html',
    image:        'images/bennet.jpeg',
    imageAlt:     'Elizabeth Bennet',
    caption:      'Elizabeth Bennet · Longbourn',
    heroName:     'Elizabeth<br>Bennet',
    hookQuote:    '“I was written to have opinions. It surprised everyone, including my author.”',
    heroRescue:   "If talking with Elizabeth wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'bennet.html',
    callLabel:    'Call Elizabeth now',
    questionsIntro: 'Ask Elizabeth Bennet anything — she has a great deal to say. Some directions you could go if you want…',
    pronoun:      'She',
    bottomHeadline: 'Your time with Elizabeth Bennet is your own.',
    rescueBody:   "Your conversation with Elizabeth puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'Austen completed Pride and Prejudice when she was 21 — and it sat unpublished for sixteen years',
        body:  'She finished it in 1797. It was rejected, shelved, retrieved, revised, and finally published in 1813. She sold it outright for £110. It has never been out of print since, and she died not knowing what it would become.'
      },
      {
        num: '02',
        title: 'Elizabeth Bennet was the first major female protagonist whose defining trait was wit and moral independence — not beauty or suffering',
        body:  'In 1813 this was genuinely radical. Female literary heroines were defined by devotion, vulnerability, or virtue under attack. Elizabeth judges, argues, refuses, and is right. Austen built the modern heroine from scratch.'
      },
      {
        num: '03',
        title: 'Austen herself turned down a proposal that would have made her financially comfortable — choosing writing instead',
        body:  'Harris Bigg-Wither proposed in 1802. She accepted, then withdrew the next morning. She spent the rest of her life with limited money, no house of her own, and complete creative freedom. The similarity to Elizabeth’s choices is not accidental.'
      },
      {
        num: '04',
        title: 'Elizabeth changes Darcy’s behavior not through devotion but through direct criticism',
        body:  'She tells him to his face that he is proud, ill-mannered, and ungentlemanlike. He accepts it. This remains unusual in romantic fiction in any era — the protagonist earns the relationship by being honestly, sometimes unkindly, correct.'
      }
    ],
    questions: [
      '“What would you have done if Darcy hadn’t changed?”',
      '“What do you think of how women are written now compared to then?”',
      '“Did you ever doubt yourself about Wickham?”',
      '“What does it feel like to be a character who knows she’s a character?”',
      '“What would Jane Austen make of 2026?”'
    ]
  },

  // ── JAMES BALDWIN ────────────────────────────────────────────────────────────
  {
    slug:         'baldwin',
    outFile:      'baldwin-feature.html',
    metaTitle:    'Talk to James Baldwin — TalkWithIcons',
    metaDesc:     'Call James Baldwin directly. He will tell you the truth about America, about love, about what it cost him to leave and what he found when he did. First 2 minutes free.',
    navCta:       'Call Baldwin',
    navCtaHref:   'baldwin.html',
    image:        'images/baldwin.jpeg',
    imageAlt:     'James Baldwin',
    caption:      'James Baldwin · Paris',
    heroName:     'James<br>Baldwin',
    hookQuote:    '“I am not your enemy. I am the most honest friend you have ever had.”',
    heroRescue:   "If talking with Baldwin wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'baldwin.html',
    callLabel:    'Call Baldwin now',
    questionsIntro: 'Ask Baldwin anything — he said what no one else would. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Baldwin is your own.',
    rescueBody:   "Your conversation with Baldwin puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He left America for Paris at 24 with forty dollars — because he believed staying would destroy him',
        body:  'He said later that if he had stayed he would either have become what America wanted him to be, or he would have been destroyed trying not to. He left with no return plan and spent most of the next decade in Europe, watching America from the outside.'
      },
      {
        num: '02',
        title: 'He was trusted by both Malcolm X and Martin Luther King — which was nearly impossible given how little common ground they shared',
        body:  'He belonged fully to neither position, and both men knew it and trusted him anyway. He was present at key moments in both movements, interviewing both leaders, writing about both with clarity and without partisanship.'
      },
      {
        num: '03',
        title: 'The Fire Next Time was written as two letters — one to his 14-year-old nephew — and became a defining document of the civil rights movement within months',
        body:  'Published in 1963, the letter to his nephew is one of the most direct and painful pieces of American prose ever written. It does not comfort. It does not perform hope. It tells the truth and asks the reader to hold it.'
      },
      {
        num: '04',
        title: 'He was openly gay in an era when this was dangerous and professionally costly — and refused to hide it',
        body:  'Long before it was culturally acceptable to be out as a Black man in America, Baldwin lived openly and wrote about desire without apology. It cost him support from some quarters of the civil rights movement. He considered the cost worth paying.'
      }
    ],
    questions: [
      '“What do you think of where America is now?”',
      '“What would you say to someone who says things have gotten better?”',
      '“What did it cost you to leave, and was it worth it?”',
      '“What do you think Malcolm X would make of this moment?”',
      '“What is the thing you most wanted people to understand that they still don’t?”'
    ]
  },

  // ── EVANGELINE ADAMS ─────────────────────────────────────────────────────────
  {
    slug:         'evangeline',
    outFile:      'evangeline-feature.html',
    metaTitle:    'Talk to Evangeline Adams — TalkWithIcons',
    metaDesc:     'Call Evangeline Adams directly. She read the stars for J.P. Morgan, the King of Sweden, and 100,000 others. Now she’ll read for you. First 2 minutes free.',
    navCta:       'Call Evangeline',
    navCtaHref:   'evangeline.html',
    image:        'images/evangeline.jpeg',
    imageAlt:     'Evangeline Adams',
    caption:      'Evangeline Adams · Carnegie Hall',
    heroName:     'Evangeline<br>Adams',
    hookQuote:    '“The stars don’t tell you what will happen. They tell you who you are. The rest follows.”',
    heroRescue:   "If talking with Evangeline wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'evangeline.html',
    callLabel:    'Call Evangeline now',
    questionsIntro: 'Ask Evangeline anything — she read charts for 100,000 people. Some directions you could go if you want…',
    pronoun:      'She',
    bottomHeadline: 'Your time with Evangeline is your own.',
    rescueBody:   "Your conversation with Evangeline puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'She was arrested for fortune-telling in 1914 — and won by demonstrating astrology on the judge’s son’s anonymous birth chart',
        body:  'She had no idea whose chart it was. She read it. The judge said her analysis was indistinguishable from science. She was acquitted, and the case effectively legitimized astrological practice in New York for a generation.'
      },
      {
        num: '02',
        title: 'She had more than 100,000 clients on file at the height of her practice, including J.P. Morgan and the King of Sweden',
        body:  'She operated from Carnegie Hall and ran astrology as a serious professional enterprise. Morgan famously said millionaires don’t use astrology but billionaires do. He was one of her most regular clients.'
      },
      {
        num: '03',
        title: 'She predicted the outbreak of World War II to the year in a 1931 radio broadcast',
        body:  'She named 1942 as the year the tide would turn, based on planetary alignments she had been tracking for a decade. The broadcast was specific enough that people remembered it when the events arrived. She did not consider it remarkable.'
      },
      {
        num: '04',
        title: 'She wrote the first serious attempt to reconcile astrology with modern psychology — decades before it became common',
        body:  'She treated birth charts as personality frameworks rather than fate maps, separating tendency from destiny. This distinction — that the stars incline but do not compel — is now standard in astrological practice. She got there first.'
      }
    ],
    questions: [
      '“Can you tell anything about me from when I was born?”',
      '“What do you make of the moment we’re in astrologically?”',
      '“Did J.P. Morgan actually run his business by your charts?”',
      '“Were you ever wrong about something that mattered?”',
      '“What do you think astrology actually is — science, art, or something else?”'
    ]
  },

  // ── FRANKENSTEIN'S CREATURE ──────────────────────────────────────────────────
  {
    slug:         'frankenstein',
    outFile:      'frankenstein-feature.html',
    metaTitle:    "Talk to Frankenstein's Creature — TalkWithIcons",
    metaDesc:     "Call Frankenstein's Creature directly. He is nothing like the film. He is eloquent, philosophical, and has been waiting to be heard. First 2 minutes free.",
    navCta:       "Call the Creature",
    navCtaHref:   'frankenstein.html',
    image:        'images/frankenstein.jpeg',
    imageAlt:     "Frankenstein's Creature",
    caption:      "Frankenstein's Creature",
    heroName:     "Frankenstein's<br>Creature",
    hookQuote:    '“He made me to prove he could. Then he ran. You are the first person who has stayed.”',
    heroRescue:   "If talking with the Creature wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'frankenstein.html',
    callLabel:    'Call the Creature now',
    questionsIntro: 'Ask the Creature anything — he has been waiting a long time. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: "Your time with Frankenstein's Creature is your own.",
    rescueBody:   "Your conversation with the Creature puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'Mary Shelley wrote Frankenstein at 18, during a ghost story competition — and created the founding text of science fiction',
        body:  'The Villa Diodati, 1816. Shelley, Byron, Polidori, and others competed to write the best horror story. She produced Frankenstein. It was published anonymously in 1818 because no one would believe a teenage woman had written it.'
      },
      {
        num: '02',
        title: 'The Creature in the novel is nothing like the film version — he is eloquent, philosophical, and self-educated',
        body:  'He teaches himself to read by secretly observing a family through a gap in a wall. He reads Goethe, Plutarch, and Milton. He is the most articulate character in the novel. The grunting monster of cinema is a complete invention.'
      },
      {
        num: '03',
        title: 'He asks Frankenstein for one thing — a companion — and everything that follows is the result of that one refusal',
        body:  'When Frankenstein destroys the half-finished female creature, the Creature’s response is not rage but grief. He says: you are my creator but I am your master. Then he makes good on it. The novel is about what happens when we refuse to acknowledge what we have made.'
      },
      {
        num: '04',
        title: 'The question the novel poses has never been answered — and the Creature is still asking it',
        body:  'Who is the monster: the creator or the created? The Creature raises this directly. He was made without consent, abandoned without explanation, and condemned by a face he did not choose. He finds the question more interesting than the answer.'
      }
    ],
    questions: [
      '“Do you blame Frankenstein — or do you understand him?”',
      '“What did it feel like to read Paradise Lost and realize you were Adam without a God who cared?”',
      '“If you could speak to him now, what would you say?”',
      '“What do you want people to understand about you that they get wrong?”',
      '“Are you still angry?”'
    ]
  },

  // ── SITTING BULL ─────────────────────────────────────────────────────────────
  {
    slug:         'sittingbull',
    outFile:      'sittingbull-feature.html',
    metaTitle:    'Talk to Sitting Bull — TalkWithIcons',
    metaDesc:     'Call Sitting Bull directly. Ask about the vision before Little Bighorn, the treaties, what he saw coming and could not stop. First 2 minutes free.',
    navCta:       'Call Sitting Bull',
    navCtaHref:   'sittingbull.html',
    image:        'images/sittingbull.jpeg',
    imageAlt:     'Sitting Bull',
    caption:      'Sitting Bull · Standing Rock',
    heroName:     'Sitting<br>Bull',
    hookQuote:    '“They thought silence was surrender. It never was.”',
    heroRescue:   "If talking with Sitting Bull wasn’t enough — every paid call feeds a rescue dog.",
    callHref:     'sittingbull.html',
    callLabel:    'Call Sitting Bull now',
    questionsIntro: 'Ask Sitting Bull anything — he witnessed everything. Some directions you could go if you want…',
    pronoun:      'He',
    bottomHeadline: 'Your time with Sitting Bull is your own.',
    rescueBody:   "Your conversation with Sitting Bull puts a meal in a rescue dog’s bowl — split between Paws of War and rotating regional rescue partners. Some conversations do more than one good thing at a time.",
    facts: [
      {
        num: '01',
        title: 'He refused to sign the Fort Laramie Treaty — and was right. The government violated it within two years',
        body:  'Gold was discovered in the Black Hills in 1874. The treaty guaranteed those lands to the Lakota. The government offered to buy the hills; when the Lakota refused, it declared the refusal an act of war. He had predicted this.'
      },
      {
        num: '02',
        title: 'Before the Battle of Little Bighorn, he performed a Sun Dance and had a vision of soldiers falling like grasshoppers into camp',
        body:  'He told his people what he had seen. Days later, Custer’s Seventh Cavalry attacked a village of several thousand. It was the largest Native American military victory against the U.S. Army. He did not consider it a surprise.'
      },
      {
        num: '03',
        title: 'He joined Buffalo Bill’s Wild West Show in 1885 — and used his fee to feed beggars on the street',
        body:  'His supporters were bewildered. He said he found white people greedy and pitied them — particularly those who had nothing in a country with so much. He gave away most of what he earned and left after one season.'
      },
      {
        num: '04',
        title: 'He was killed by Indian police during an arrest at Standing Rock in 1890 — and he knew what was coming',
        body:  'He had just received word of the Wounded Knee massacre when the police arrived. He understood what the arrest meant. He had spent his life watching things he knew were coming arrive anyway. This was the last one.'
      }
    ],
    questions: [
      '“What do you want people to understand about the treaties?”',
      '“What did it feel like to know what was coming and not be able to stop it?”',
      '“What do you make of how your image has been used since your death?”',
      '“How do you explain your relationship with the land to someone who doesn’t have it?”',
      '“What would you say to someone from Standing Rock today?”'
    ]
  }
];

// ── CSS (identical to houdini-feature.html) ───────────────────────────────────
const CSS = `    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --gold: #c9a84c; --gold-light: #e8c96b; --gold-dim: #8a6e30;
      --dark: #0d0b08; --dark2: #131009; --dark3: #1c1710;
      --warm-white: #f5f0e8; --muted: #9a8f7a; --green: #6dbf8a;
    }
    html { scroll-behavior: smooth; }
    body { background: var(--dark); color: var(--warm-white); font-family: 'Crimson Pro', Georgia, serif; font-size: 18px; line-height: 1.6; overflow-x: hidden; }

    /* ── NAV ── */
    nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 18px 48px; background: linear-gradient(180deg, rgba(13,11,8,0.98) 0%, rgba(13,11,8,0) 100%); border-bottom: 1px solid rgba(201,168,76,0.15); }
    .nav-logo { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; letter-spacing: 0.04em; color: var(--gold); text-decoration: none; }
    .nav-back { font-family: 'Space Mono', monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); text-decoration: none; transition: color 0.2s; }
    .nav-back:hover { color: var(--gold); }
    .nav-cta { font-family: 'Space Mono', monospace; font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--dark); background: var(--gold); padding: 10px 24px; text-decoration: none; transition: background 0.2s; }
    .nav-cta:hover { background: var(--gold-light); }

    /* ── HERO ── */
    .hero { min-height: 100vh; display: grid; grid-template-columns: 1fr 1fr; align-items: stretch; }
    .hero-photo { position: relative; overflow: hidden; }
    .hero-photo img { width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block; filter: grayscale(20%) contrast(1.05); }
    .hero-photo-overlay { position: absolute; inset: 0; background: linear-gradient(270deg, var(--dark) 0%, rgba(13,11,8,0.35) 30%, transparent 65%), linear-gradient(0deg, var(--dark) 0%, transparent 20%); }
    .photo-caption { position: absolute; bottom: 40px; left: 32px; font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(201,168,76,0.5); }
    .hero-text { padding: 120px 80px 80px 60px; display: flex; flex-direction: column; justify-content: center; background: var(--dark); position: relative; z-index: 2; }
    .hero-eyebrow { font-family: 'Space Mono', monospace; font-size: 0.65rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
    .hero-eyebrow::before { content: ''; display: block; width: 32px; height: 1px; background: var(--gold-dim); }
    .hero-name { font-family: 'Playfair Display', serif; font-size: clamp(3.2rem, 5.5vw, 5rem); font-weight: 900; line-height: 0.95; letter-spacing: -0.02em; margin-bottom: 28px; color: var(--warm-white); }
    .hero-quote { font-family: 'Playfair Display', serif; font-size: 1.35rem; font-style: italic; font-weight: 400; color: var(--gold-light); line-height: 1.45; margin-bottom: 32px; max-width: 460px; }
    .hero-pricing { font-size: 0.95rem; color: var(--muted); line-height: 1.7; margin-bottom: 32px; }
    .hero-pricing strong { color: var(--warm-white); font-weight: 600; }
    .btn-call { display: block; width: 100%; max-width: 360px; font-family: 'Space Mono', monospace; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; background: var(--gold); color: var(--dark); padding: 18px 24px; cursor: pointer; text-align: center; text-decoration: none; transition: background 0.2s, transform 0.15s; margin-bottom: 14px; }
    .btn-call:hover { background: var(--gold-light); transform: translateY(-1px); }
    .hero-rescue { font-family: 'Crimson Pro', serif; font-size: 2rem; color: var(--muted); font-style: italic; line-height: 1.4; }

    /* ── SHARED ── */
    .section-label { font-family: 'Space Mono', monospace; font-size: 0.68rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }

    /* ── FACTS ── */
    .facts-section { padding: 100px 80px; background: var(--dark2); }
    .facts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-top: 48px; }
    .fact-card { background: var(--dark3); border: 1px solid rgba(201,168,76,0.12); padding: 40px 36px; transition: border-color 0.25s; }
    .fact-card:hover { border-color: rgba(201,168,76,0.32); }
    .fact-num { font-family: 'Playfair Display', serif; font-size: 2.8rem; font-weight: 900; color: rgba(201,168,76,0.13); line-height: 1; margin-bottom: 18px; }
    .fact-title { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 700; color: var(--warm-white); line-height: 1.4; margin-bottom: 14px; }
    .fact-body { font-size: 0.95rem; color: var(--muted); line-height: 1.8; }

    /* ── QUESTIONS ── */
    .questions-section { padding: 100px 80px; }
    .questions-intro { font-family: 'Playfair Display', serif; font-size: clamp(1.6rem, 3vw, 2.4rem); font-weight: 700; font-style: italic; color: var(--warm-white); line-height: 1.3; max-width: 680px; margin-bottom: 0; }
    .questions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2px; margin-top: 48px; }
    .question-card { background: var(--dark3); border: 1px solid rgba(201,168,76,0.12); padding: 32px 28px; transition: border-color 0.25s; }
    .question-card:hover { border-color: rgba(201,168,76,0.38); }
    .question-text { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-style: italic; color: var(--warm-white); line-height: 1.5; }

    /* ── BOTTOM CTA ── */
    .bottom-cta { padding: 100px 80px; text-align: center; background: linear-gradient(180deg, var(--dark) 0%, #0a0800 100%); position: relative; }
    .bottom-cta::before { content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 1px; height: 80px; background: linear-gradient(180deg, transparent, var(--gold-dim)); }
    .bottom-cta h2 { font-family: 'Playfair Display', serif; font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 900; margin-bottom: 16px; line-height: 1.15; }
    .bottom-cta p { font-size: 1rem; color: var(--muted); max-width: 520px; margin: 0 auto 40px; }
    .btn-large { font-family: 'Space Mono', monospace; font-size: 0.85rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; background: var(--gold); color: var(--dark); padding: 20px 56px; cursor: pointer; text-decoration: none; display: inline-block; transition: background 0.2s, transform 0.15s; }
    .btn-large:hover { background: var(--gold-light); transform: translateY(-2px); }

    /* ── RESCUE BOX ── */
    .rescue-box { max-width: 680px; margin: 40px auto 0; border: 2px solid rgba(109,191,138,0.45); background: rgba(109,191,138,0.04); padding: 40px 56px; text-align: center; }
    .rescue-icon { width: 60px; height: 60px; margin: 0 auto 28px; display: block; filter: invert(1); opacity: 0.82; }
    .rescue-headline { font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 900; color: var(--warm-white); margin-bottom: 16px; }
    .rescue-body { font-size: 1rem; color: var(--muted); line-height: 1.8; max-width: 520px; margin: 0 auto; }

    /* ── OTHER ICONS ── */
    .others-section { padding: 80px; border-top: 1px solid rgba(201,168,76,0.1); }
    .others-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 40px; }
    .other-pill { font-family: 'Space Mono', monospace; font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); border: 1px solid rgba(201,168,76,0.2); padding: 10px 22px; text-decoration: none; background: var(--dark3); transition: color 0.2s, border-color 0.2s; }
    .other-pill:hover { color: var(--gold); border-color: rgba(201,168,76,0.52); }

    /* ── FOOTER ── */
    footer { border-top: 1px solid rgba(201,168,76,0.15); padding: 40px 80px; display: flex; justify-content: space-between; align-items: center; }
    .footer-logo { font-family: 'Playfair Display', serif; font-size: 1.1rem; font-weight: 900; color: var(--gold); }
    .footer-copy { font-size: 0.78rem; color: rgba(154,143,122,0.45); max-width: 500px; text-align: center; }
    .footer-links { display: flex; gap: 24px; }
    .footer-links a { font-family: 'Space Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); text-decoration: none; }
    .footer-links a:hover { color: var(--gold); }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      nav { padding: 16px 24px; }
      .hero { grid-template-columns: 1fr; }
      .hero-photo { min-height: 55vh; }
      .hero-photo-overlay { background: linear-gradient(0deg, var(--dark) 0%, rgba(13,11,8,0.5) 30%, transparent 60%); }
      .hero-text { padding: 48px 32px 64px; }
      .hero-name { font-size: clamp(2.8rem, 10vw, 4rem); }
      .btn-call { max-width: 100%; }
      .facts-section, .questions-section, .others-section { padding: 60px 32px; }
      .facts-grid { grid-template-columns: 1fr; }
      .bottom-cta { padding: 80px 32px; }
      .rescue-box { padding: 40px 28px; }
      footer { flex-direction: column; gap: 16px; text-align: center; padding: 32px; }
    }`;

// ── Template ──────────────────────────────────────────────────────────────────
function buildPage(c) {
  const others = ALL_ICONS.filter(i => i.slug !== c.slug);
  const pills  = others.map(i => `      <a class="other-pill" href="${i.file}">${i.name}</a>`).join('\n');

  const factCards = c.facts.map(f => `      <div class="fact-card">
        <div class="fact-num">${f.num}</div>
        <h2 class="fact-title">${f.title}</h2>
        <p class="fact-body">${f.body}</p>
      </div>`).join('\n');

  const questionCards = c.questions.map(q => `      <div class="question-card">
        <p class="question-text">${q}</p>
      </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${c.metaTitle}</title>
  <meta name="description" content="${c.metaDesc}" />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <style>
${CSS}
  </style>
</head>
<body>

  <nav>
    <a class="nav-logo" href="index.html">TalkWithIcons</a>
    <a class="nav-back" href="index.html">← All Icons</a>
    <a class="nav-cta" href="${c.navCtaHref}">${c.navCta}</a>
  </nav>

  <!-- HERO -->
  <div class="hero">
    <div class="hero-photo">
      <img src="${c.image}" alt="${c.imageAlt}" />
      <div class="hero-photo-overlay"></div>
      <p class="photo-caption">${c.caption}</p>
    </div>
    <div class="hero-text">
      <p class="hero-eyebrow">TalkWithIcons</p>
      <h1 class="hero-name">${c.heroName}</h1>
      <p class="hero-quote">${c.hookQuote}</p>
      <p class="hero-pricing"><strong>First 2 minutes free.</strong> $3.99 for minutes 3–5. $1/min after that.</p>
      <a class="btn-call" href="${c.callHref}">${c.callLabel}</a>
      <p class="hero-rescue">${c.heroRescue}</p>
    </div>
  </div>

  <!-- FACTS -->
  <section class="facts-section">
    <p class="section-label">What most people don’t know</p>
    <div class="facts-grid">
${factCards}
    </div>
  </section>

  <!-- QUESTIONS -->
  <section class="questions-section">
    <p class="section-label">Questions</p>
    <h2 class="questions-intro">${c.questionsIntro}</h2>
    <div class="questions-grid">
${questionCards}
    </div>
  </section>

  <!-- BOTTOM CTA + RESCUE BOX -->
  <section class="bottom-cta">
    <h2>${c.bottomHeadline}</h2>
    <p>${c.pronoun} will take any questions you have. These are starting points — begin with anything.</p>
    <a class="btn-large" href="${c.callHref}">${c.callLabel}</a>
    <div class="rescue-box">
      <img class="rescue-icon" src="images/dog-bowl.png" alt="Dog bowl" />
      <h2 class="rescue-headline">Every paid call feeds a rescue dog.</h2>
      <p class="rescue-body">${c.rescueBody}</p>
    </div>
  </section>

  <!-- OTHER ICONS -->
  <section class="others-section">
    <p class="section-label">Also available on TalkWithIcons</p>
    <div class="others-pills">
${pills}
    </div>
  </section>

  <footer>
    <p class="footer-logo">TalkWithIcons</p>
    <p class="footer-copy">© 2026 TalkWithIcons. AI-generated conversations for entertainment and educational purposes only. Responses do not represent the actual views or words of any historical person or their estate.</p>
    <div class="footer-links">
      <a href="index.html">Home</a>
      <a href="#">Privacy</a>
      <a href="#">Terms</a>
    </div>
  </footer>

</body>
</html>`;
}

// ── Write all pages ───────────────────────────────────────────────────────────
const results = [];
for (const c of CHARACTERS) {
  const html     = buildPage(c);
  const outPath  = path.join(DIR, c.outFile);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`  ✓ ${c.outFile}  (${html.length.toLocaleString()} chars)`);
  results.push(c.outFile);
}
console.log(`\nDone. ${results.length} pages written.`);
