const fs = require('fs');
const files = ['stripe-work/silver.html', 'stripe-output/silver.html'];

const replacements = [
  ['<title>Call Einstein — TalkWithIcons</title>', '<title>Call Long John Silver — TalkWithIcons</title>'],
  [`<p class="hero-eyebrow">Physicist · Philosopher · 1879–1955</p>
      <h1 class="hero-name">Albert<br>Einstein</h1>
      <p class="hero-dates">Born Ulm, Germany · Nobel Prize 1921 · Princeton, New Jersey</p>
      <p class="hero-tagline">"Imagination is more important than knowledge."</p>
      <p class="hero-desc">
        He redrew the map of reality. Relativity, the photoelectric effect, Brownian motion —
        all in a single year, working as a patent clerk in Bern. Talk to the man behind the myth:
        warm, funny, deeply human, and still capable of stopping you cold with a single thought.
      </p>`,
   `<p class="hero-eyebrow">Strategist · Performer · Bristol, 1730</p>
      <h1 class="hero-name">Long John<br>Silver</h1>
      <p class="hero-dates">Born Bristol, England · Treasure Island · Robert Louis Stevenson, 1883</p>
      <p class="hero-tagline">"I've been called worse things and by better men."</p>
      <p class="hero-desc">
        Not the pantomime villain Stevenson wrote for young boys to fear and admire — that was
        a performance, and a very good one. Talk to the man beneath it: a printer's son who
        read Latin at eight, lost a leg at Havana, and built the most efficient market
        available to a man of no family.
      </p>`],
  ['<img class="hero-portrait" src="images/einstein.webp" alt="Albert Einstein" />', '<img class="hero-portrait" src="images/einstein.webp" alt="Long John Silver" />'],
  ['<p class="portrait-caption">Albert Einstein · c. 1947</p>', '<p class="portrait-caption">Long John Silver · The Performance</p>'],
  [`<p class="quote-text">
      The most beautiful thing we can experience is the mysterious.
      It is the source of all true art and science.
    </p>
    <p class="quote-attr">— Albert Einstein, What I Believe, 1930</p>`,
   `<p class="quote-text">
      I've been called worse things and by better men.
      Ask me something worth answering.
    </p>
    <p class="quote-attr">— Long John Silver</p>`],
  ['Your time with Einstein is your own!', 'Your time with Silver is your own!'],
  [`<p class="starter-q">"Was there a moment you knew relativity was right — before any proof?"</p>
        <p class="starter-note">He'll describe the thought experiment on the light beam. You'll feel the click of it.</p>`,
   `<p class="starter-q">"Tell me about your early life — before the sea, before all of it."</p>
        <p class="starter-note">Thomas the printer father, Margaret the mother with the quick temper. Reading everything. Understanding early how the world was organized.</p>`],
  [`<p class="starter-q">"What do you actually think about God?"</p>
        <p class="starter-note">Not the bumper sticker answer. The real one — Spinoza, the cosmos, what mystery means to a scientist.</p>`,
   `<p class="starter-q">"The pirate persona — is it real, or is it a performance?"</p>
        <p class="starter-note">A performance. A very deliberate one. The men he needed to work with responded to theater rather than reason.</p>`],
  [`<p class="starter-q">"Do you regret the letter to Roosevelt?"</p>
        <p class="starter-note">The letter that started the Manhattan Project. He signed it. He'll tell you why — and what it cost him.</p>`,
   `<p class="starter-q">"What happened to your leg?"</p>
        <p class="starter-note">Havana, 1762. Forty-eight hours deciding whether to live. He discusses it as a fact, not a loss.</p>`],
  [`<p class="starter-q">"Why did your first marriage fail?"</p>
        <p class="starter-note">Mileva Marić was also a physicist. The story is more complicated than history usually tells it.</p>`,
   `<p class="starter-q">"What do you actually think of Jim Hawkins?"</p>
        <p class="starter-note">He didn't try to kill the boy at the end because he liked him. That is the honest answer.</p>`],
  [`<p class="starter-q">"What do you make of quantum mechanics?"</p>
        <p class="starter-note">"God does not play dice." Bohr disagreed. This argument is still unresolved. Hear his side.</p>`,
   `<p class="starter-q">"What is your philosophy of leadership?"</p>
        <p class="starter-note">Theater for those who require it, directness for those who don't. He'll explain the difference.</p>`],
  [`<p class="starter-q">"Are you happy?"</p>
        <p class="starter-note">An unexpected question for an unexpected answer. The most famous mind of the century, asked the simplest thing.</p>`,
   `<p class="starter-q">"What are you, really, beneath the performance?"</p>
        <p class="starter-note">A strategist who chose piracy as the most efficient available market for his skills.</p>`],
  [`<p class="bio-fact-label">Born</p>
        <p class="bio-fact-value">March 14, 1879<br>Ulm, Kingdom of Württemberg</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Died</p>
        <p class="bio-fact-value">April 18, 1955<br>Princeton, New Jersey</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Nobel Prize</p>
        <p class="bio-fact-value">Physics, 1921<br>Photoelectric Effect</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Languages</p>
        <p class="bio-fact-value">German, English, some Italian</p>`,
   `<p class="bio-fact-label">Born</p>
        <p class="bio-fact-value">1730<br>Corn Street, Bristol</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Lost</p>
        <p class="bio-fact-value">His right leg<br>Siege of Havana, 1762</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Appears In</p>
        <p class="bio-fact-value">Treasure Island<br>Robert Louis Stevenson, 1883</p>
      </div>
      <div class="bio-fact">
        <p class="bio-fact-label">Languages</p>
        <p class="bio-fact-value">English, French, Portuguese</p>`],
  ['<p class="bio-fact-value">Special &amp; General Relativity, E=mc²</p>', '<p class="bio-fact-value">The performance — and the calculation beneath it</p>'],
  [`Albert Einstein did not speak until he was three years old. His teachers found him slow.
        One called him "mentally slow, unsociable, and adrift forever in his foolish dreams."
        In 1905 — working as a <strong>third-class patent clerk in Bern, Switzerland</strong> —
        he published four papers that rewrote physics. Any one of them would have made a career.
        Together, they changed everything.`,
   `Long John Silver was born in Bristol in 1730, the son of a printer. He read before he
        could properly walk — Latin at eight, French by twelve, navigation at fourteen from
        a naval officer's manual. <strong>He understood early that the world was organized
        by those who controlled information and those who did not,</strong> and that he was
        going to be on the controlling side regardless of what it cost.`],
  [`He did not arrive at his discoveries through calculation alone. His method was imagination.
        <strong>He called them thought experiments.</strong> He imagined riding alongside a beam of light.
        He imagined an elevator falling in free space. The mathematics came after — to confirm
        what intuition had already told him was true.`,
   `It cost a leg. A Spanish cannonball took it below the knee at the siege of Havana in 1762 —
        a British naval engagement he had no business being part of except that his ship was
        pressed into service. <strong>He was forty-eight hours deciding whether to live.</strong>
        He decided to.`],
  [`Einstein was also a deeply political man. He fled Nazi Germany in 1933 and never returned.
        He was a pacifist who nonetheless signed the letter urging Roosevelt to develop the atomic bomb —
        a decision that haunted his final years. He was offered the presidency of Israel and declined.
        <strong>The FBI kept a file on him for decades.</strong>`,
   `The pirate persona came later, out of necessity rather than preference. The men he needed
        to work with responded better to theater than to reason. <strong>Both were true.
        Only one worked.</strong>`],
  [`He played the violin. He loved sailing, even though he couldn't swim and refused to learn.
        He was married twice, had complicated relationships with his sons, and was devoted to his
        sister Maja until her death. He died in Princeton in 1955, having refused surgery,
        saying: <em>"I want to go when I want. It is tasteless to prolong life artificially."</em>`,
   `He speaks three languages fluently and has read Adam Smith and Machiavelli, finding both
        largely correct. <em>The performance does not conceal weakness. It conceals a man who
        has calculated the angle of every situation for fifty years.</em>`],
  ['<h2>Three minutes.<br>One conversation.<br><em style="color:var(--gold-light)">Never repeated.</em></h2>',
   '<h2>Fifty years of performance.<br>This is not that.<br><em style="color:var(--gold-light)">Ask him directly.</em></h2>'],
  ["No script. No recordings. A live AI voice trained on Einstein's letters, lectures, and interviews — speaking only to you, only now.",
   "No script. No recordings. A live AI voice — speaking only to you, only now, without the theater unless you want it."],
  ["body:    JSON.stringify({ firstName, phoneNumber, character: 'einstein' }),",
   "body:    JSON.stringify({ firstName, phoneNumber, character: 'einstein' }),"], // unchanged, internal routing key
];

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let missCount = 0;
  for (const [oldStr, newStr] of replacements) {
    if (oldStr === newStr) continue;
    if (!html.includes(oldStr)) { console.log('MISS in', file, ':', JSON.stringify(oldStr.slice(0, 50))); missCount++; continue; }
    html = html.split(oldStr).join(newStr);
  }
  fs.writeFileSync(file, html);
  console.log(file, 'done,', missCount, 'misses');
}
