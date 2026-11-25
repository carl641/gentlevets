# Gentle Vet Animal Hospital — website rebuild

A faster, cleaner rebuild of thegentlevets.com in plain HTML, CSS and JavaScript (no build step, no frameworks).

## Pages
- `index.html` — home: hero, quick links (booking, pharmacy, PetPage, emergency), services, low-stress handling, what to expect, doctors, reviews, pricing teaser, emergency clinics, FAQs, articles, hours/map/contact form
- `pricing.html` — dog / cat / exotics price lists with tabs (linkable: `pricing.html#cats`) and live search
- `team.html` — all 25 team members with role filters

## Files
- `assets/css/styles.css` — all styles; brand colors are CSS variables at the top
- `assets/js/main.js` — mobile menu, live "Open now" status (Central time), holiday notice, team filter, pricing tabs/search, contact form
- `assets/img/` — logo and photos from the current site

## Things to update
- **Hours / holiday closures:** `HOURS` and `CLOSED_DATES` at the top of `main.js`; the notice bar text is in each page's header (`data-expires` hides it automatically after that date).
- **Contact form:** currently opens the visitor's email app addressed to petcare@thegentlevets.com. Point it at a form service (Formspree, Netlify Forms, etc.) for direct submission.
- **Booking, pharmacy, PetPage, 3D tour** link to the existing services.

## Run locally
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.
