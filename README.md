# SoviCare website (preview)

Static front end built from the Figma frames marked **✅ CURRENT · APPROVED 01.10** (file `WIP — SOVICARE | WEBSITE`), the developer handoff and the brand hub. Not indexed (`noindex` + `robots.txt`).

## Structure

- `src/*.html` — page sources. SVG marks are inlined at build time from `assets/` with `{{svg:name|class|attrs}}` tokens.
- `index.html`, `404.html` — built pages (do not edit by hand; edit `src/` and rebuild).
- `css/site.css` — tokens, components, responsive (desktop 1440 → mobile 390), reduced motion.
- `js/site.js` — header scroll state, hero entrance, kit pivots, trust-strip mark loop, stories carousel, How it works tabs, FAQ accordion, answer tiles, mobile menu and sticky bar.
- `assets/` — images and SVGs exported from the approved Figma frames.

## Decisions and open items (homepage)

| Item | What the site does | Status |
|---|---|---|
| Answer tile selected state | Annex (approved 01.10): scale 1.02 + Green border, 180ms. The older exceptions log said Paper, no border, no scale. The annex wins until told otherwise. | Confirm |
| Hero video | No video file yet. The poster image drifts slowly (14s); the pause button stops it; reduced motion shows the still poster. | Needs video |
| Stories slides 2 and 3 | Figma has one slide. Slides 2–3 reuse approved photos with placeholder quotes marked “Illustrative. Pending approval.” | Needs content |
| How it works, steps 2–4 | Figma shows step 1 only. Detail text and panel captions for steps 2–4 are drafts in the same voice. | Needs approval |
| FAQ answers 2–5 | Placeholder answers, marked “Placeholder … Final wording pending.” | Needs approval |
| Assessment, newsletter, sign in | Not connected. Buttons show a clear “demo” message. | Backend later |
| Inner pages | Links go to the in-progress page (404.html) until each page is built. | In progress |
