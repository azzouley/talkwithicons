const fs = require('fs');
const files = ['stripe-work/watson.html', 'stripe-output/watson.html'];

const replacements = [
  ['<title>Call Sherlock Holmes — TalkWithIcons</title>', '<title>Call Dr. John H. Watson — TalkWithIcons</title>'],
  [`<p class="hero-eyebrow">Detective · Logician · 221B Baker Street</p>
      <h1 class="hero-name">Sherlock<br>Holmes</h1>
      <p class="hero-dates">Created 1887 · Arthur Conan Doyle · London, England</p>
      <p class="hero-tagline">"When you have eliminated the impossible, whatever remains must be the truth."</p>
      <p class="hero-desc">
        He will deduce your profession before you finish your first sentence.
        He is arrogant, brilliant, chemically dependent, and the finest mind
        ever applied to human darkness. Bring him a problem. Any problem.
        He is bored without one.
      </p>`,
   `<p class="hero-eyebrow">Physician · Chronicler · 221B Baker Street</p>
      <h1 class="hero-name">Dr. John H.<br>Watson</h1>
      <p class="hero-dates">Created 1887 · Arthur Conan Doyle · London, England</p>
      <p class="hero-tagline">"I have spent thirty years making someone else famous. It's time I said a few things on my own account."</p>
      <p class="hero-desc">
        The man who actually kept Baker Street running — and wrote the
        stories that made someone else a legend. Thirty years of things
        he never got room to say. Ask him anything.
      </p>`],
  ['<img class="hero-portrait" src="images/holmes.jpeg" alt="Sherlock Holmes" />', '<img class="hero-portrait" src="images/holmes.jpeg" alt="Dr. John H. Watson" />'],
  ['<p class="portrait-caption">Sherlock Holmes · 221B Baker Street</p>', '<p class="portrait-caption">Dr. John H. Watson · 221B Baker Street</p>'],
  [`<p class="quote-text">My mind rebels at stagnation. Give me problems, give me work, give me the most abstruse cryptogram or the most intricate analysis, and I am in my own proper atmosphere.</p>
    <p class="quote-attr">— Sherlock Holmes, The Sign of the Four</p>`,
   `<p class="quote-text">I have spent thirty years making someone else famous. It is time I said a few things on my own account.</p>
    <p class="quote-attr">— Dr. John H. Watson</p>`],
  ['Your time with Holmes is your own!', 'Your time with Watson is your own!'],
  [`<p class="starter-q">"What can you deduce about me right now?"</p>
        <p class="starter-note">He'll work with whatever you give him. Voice, word choice, hesitation. He notices everything.</p>`,
   `<p class="starter-q">"Tell me about your early life — where you grew up, what shaped you before Baker Street."</p>
        <p class="starter-note">The possible Australian childhood near Ballarat, his father's early death, the brother who drank himself to ruin, and Bart's hospital.</p>`],
  [`<p class="starter-q">"What was Moriarty really like?"</p>
        <p class="starter-note">The Napoleon of Crime. The one adversary Holmes genuinely respected. Ask him what that felt like.</p>`,
   `<p class="starter-q">"What actually happened at Maiwand?"</p>
        <p class="starter-note">The ambush, the jezail bullet, Murray carrying him off the field, and the troopship home to a city with no framework for what he'd seen.</p>`],
  [`<p class="starter-q">"Tell me about the cocaine."</p>
        <p class="starter-note">A seven percent solution. Watson disapproved. Holmes will explain, without apology, exactly why he used it.</p>`,
   `<p class="starter-q">"What did you actually contribute to the cases Holmes got credit for?"</p>
        <p class="starter-note">The toxin identifications. The military geography. The reading of human motivation Holmes never quite managed.</p>`],
  [`<p class="starter-q">"I have a problem I can't solve. Will you hear it?"</p>
        <p class="starter-note">Bring him something real. A conflict, a mystery, a decision you can't make. He will not be gentle. He will be useful.</p>`,
   `<p class="starter-q">"Tell me about Mary."</p>
        <p class="starter-note">She came to Baker Street in the Sign of Four case. He fell in love before she'd finished explaining it. Then she died.</p>`],
  [`<p class="starter-q">"Do you ever feel anything — or is it all just data?"</p>
        <p class="starter-note">He claims to have excised emotion as an inconvenience. He is not entirely telling the truth.</p>`,
   `<p class="starter-q">"What is in the dispatch box you never published?"</p>
        <p class="starter-note">Cases that reflected badly on people still living. He supposes he believes they'll matter eventually.</p>`],
  [`<p class="starter-q">"What do you make of the modern world?"</p>
        <p class="starter-note">The internet. Surveillance. Forensic science. A mind like his applied to 2026 is a conversation worth having.</p>`,
   `<p class="starter-q">"What do you actually think of Sherlock Holmes?"</p>
        <p class="starter-note">The most extraordinary mind he has ever known and the most impossible human being he has ever lived with.</p>`],
  ['<p class="bio-fact-label">Companion</p>', '<p class="bio-fact-label">Housemate</p>'],
  ['<p class="bio-fact-value">Dr. John H. Watson</p>', '<p class="bio-fact-value">Sherlock Holmes</p>'],
  ['<p class="bio-fact-value">Deductive reasoning, disguise, violin, baritsu, chemistry</p>', '<p class="bio-fact-value">Medicine, military service, marksmanship, narrating the stories</p>'],
  ['<p class="bio-fact-label">Nemesis</p>\n        <p class="bio-fact-value">Professor James Moriarty</p>', '<p class="bio-fact-label">Served In</p>\n        <p class="bio-fact-value">2nd Anglo-Afghan War · Battle of Maiwand, 1880</p>'],
  [`Sherlock Holmes first appeared in 1887 in <em>A Study in Scarlet</em> and never really left.
        He is the most portrayed fictional character in history — over 250 actors across film,
        television, and stage. <strong>He is more real to more people than most historical figures.</strong>
        That is not an accident. Conan Doyle created something that answered a need.`,
   `Dr. John H. Watson narrated all sixty of the Sherlock Holmes stories, which means he wrote them,
        which means he made choices about what to include, what to omit, and how to render himself.
        <strong>He rendered himself as the reliable companion.</strong> Holmes needed to be luminous.
        Watson provided the gravity.`],
  [`Holmes was based on Dr. Joseph Bell, a surgeon Conan Doyle studied under at Edinburgh,
        who could diagnose patients from their appearance before they spoke a word.
        <strong>The deductive method was real.</strong> Holmes simply applied it to crime rather than medicine,
        and with considerably less patience for human error.`,
   `Before Baker Street, Watson was a military surgeon shattered by a jezail bullet at the
        Battle of Maiwand in 1880. <strong>He arrived home at twenty-eight with no money, no position,
        and no purpose</strong> — until Stamford introduced him to a strange man who needed someone
        to split the rent.`],
  [`Conan Doyle killed Holmes at the Reichenbach Falls in 1893, pushed there by Moriarty.
        Public outcry was so severe — people wore black armbands in the street —
        that Conan Doyle brought him back ten years later. <strong>He resented Holmes for crowding out
        his other work.</strong> Holmes did not care.`,
   `Several cases the stories credit to Holmes were materially solved by Watson — toxin
        identifications, the geography of an ambush. <strong>He does not say this bitterly.</strong>
        He says it accurately. He also managed Holmes without being asked and without being thanked.`],
  [`What makes Holmes endure is not the pipe or the deerstalker — both largely invented
        by illustrators and actors. It is the mind. The absolute refusal to be fooled.
        The contempt for sloppy thinking. And beneath the cold exterior, <em>a ferocious
        commitment to justice</em> that he would never admit to feeling.`,
   `What makes Watson endure is not the mustache or the bowler hat. It is the decency
        underneath the modesty, and the very English trick of holding <em>genuine affection
        and genuine exasperation</em> for the same impossible man, simultaneously, for thirty years.`],
  ['<h2>The game is afoot.<br>He is waiting.<br><em style="color:var(--gold-light)">Are you ready?</em></h2>',
   "<h2>He's kept the story straight for thirty years.<br>Time to hear his side.<br><em style=\"color:var(--gold-light)\">Are you ready?</em></h2>"],
];

for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  let missCount = 0;
  for (const [oldStr, newStr] of replacements) {
    if (!html.includes(oldStr)) { console.log('MISS in', file, ':', JSON.stringify(oldStr.slice(0, 50))); missCount++; continue; }
    html = html.split(oldStr).join(newStr);
  }
  fs.writeFileSync(file, html);
  console.log(file, 'done,', missCount, 'misses');
}
