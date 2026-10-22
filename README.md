# electricfieldon — Writing Portfolio

A static, mobile-friendly writing portfolio made from an Instagram export. The site uses plain HTML, CSS and JavaScript; no package installation or build command is required.

## Pages

- `index.html` — the focused homepage: Featured Posts and Browse by Mood.
- `archive.html` — separate complete archive with search and optional filters.

## Run locally

Open `index.html` in a modern browser. Open `archive.html` to view the complete archive.

## Customise links and featured posts

Edit `site-config.js`:

- `navigation` controls navigation labels and their destinations.
- `instagram` controls the external profile link label and URL.
- `featuredPostIds` controls which posts appear in Featured and their order.
- `collections` controls the mood cards shown on the homepage. Collection names should match the collection names in `data.js` post tags.

To choose a featured post, use its `id` from `data/posts.json` (or `data.js`) and add it to `featuredPostIds`. The post artwork is never rewritten by the featured selection.

## Files

- `index.html` — homepage
- `archive.html` — complete writing archive
- `styles.css` — visual styling and responsive layout
- `app.js` — rendering, filters, collection browsing and carousel viewer
- `site-config.js` — simple customisation settings
- `data.js` — post metadata used by the static website
- `data/posts.json` and `data/posts.csv` — inventory/manifests
- `assets/media/` — original-image-derived display media; these files are not edited by the UI
- `netlify.toml` — static Netlify configuration

## Deploy to Netlify

This is a static site. No build command is required. Use the repository root (`.`) as the publish directory. If Git is connected to Netlify, pushing a commit to the production branch triggers a deployment.

Do not upload the original Instagram export ZIP or unrelated personal information to the code repository.
