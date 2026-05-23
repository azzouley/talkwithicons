# TalkWithIcons Session Notes — Do Not Repeat

## CLAUDE RULE — PROMPTS AND LONG TEXT FOR COPYING
When Steve needs to copy a large block of text (system prompts, bio copy, any text going into Vapi or another tool), ALWAYS display it in a code block in the chat. Never create a file and present it — file viewers require payment and waste time. Code blocks have a built-in copy icon. This is non-negotiable. 10 minutes was lost on May 23 2026 because a file was created instead of a code block.

## Pricing — confirmed, never to be invented
- First 3 minutes free
- $2.99 for the next 3 minutes
- $1.00 per minute after that
- Donation language: "every paid call triggers at minimum a meal donation for a rescue dog"

## Character page order — from the homepage grid
Einstein, Nostradamus, Twain, Tesla, Holmes, Aela, Bennet, Curie

## Image filenames in repo
einstein.webp, nostradamus.jpeg, twain.png, tesla.jpeg, holmes.jpeg, aela.jpeg, bennet.jpeg, curie.jpeg

## Rules — do not violate
1. Never invent pricing, copy, or policy. If not confirmed by user, leave a placeholder and ask.
2. Never add words the user did not say. If they say "add X after Y," add X after Y — nothing else.
3. Follow the homepage grid order exactly. Do not reconstruct from memory.
4. When the user gives exact wording, use it exactly. Do not paraphrase, expand, or rewrite.
5. External image URLs break on Vercel. Always use local files from the images/ folder.
6. amCharts v3 ignores real coordinates. Use Leaflet.js for maps.
7. Present download link first, then Claude Code prompt — separately, never combined.
8. Never send user to Claude Code for something that can be done directly here.
