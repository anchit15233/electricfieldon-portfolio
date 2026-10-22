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

To choose a featured post, use its `id` from `data.js` (or `posts.json`) and add it to `featuredPostIds`. The post artwork is never rewritten by the featured selection.

## Files

- `index.html` — homepage
- `archive.html` — complete writing archive
- `styles.css` — visual styling and responsive layout
- `app.js` — rendering, filters, collection browsing and carousel viewer
- `site-config.js` — simple customisation settings
- `data.js` — post metadata used by the static website
- `posts.json`, `posts.csv`, `asset-integrity.json` — inventory/manifests (not used by the site; blocked from the live site in `netlify.toml`)
- `assets/media/` — original artwork, shown untouched in the viewer
- `assets/thumbs/` — smaller copies of each post's first image, used only on grid cards
- `tools/make-thumbs.py` — regenerates thumbnails
- `404.html` — not-found page
- `netlify.toml` — static Netlify configuration

## Adding new posts

1. Update `data.js` (and copy the new images into `assets/media/`).
2. Regenerate thumbnails: `pip install pillow && python3 tools/make-thumbs.py`. If a thumbnail is missing, the card falls back to the original image, so nothing breaks, it's just heavier.
3. Piece numbers are computed from post dates (oldest = 001), so existing numbers never change.

## Linking to a single piece

Each opened piece gets a shareable URL such as `archive.html#piece-18131672362827668`. The viewer's **Copy link** button copies it. If a post has a `source_url` in `data.js`, "Visit Instagram" opens that post instead of the profile.

## Deploy to Netlify

This is a static site. No build command is required. Use the repository root (`.`) as the publish directory. If Git is connected to Netlify, pushing a commit to the production branch triggers a deployment.

Do not upload the original Instagram export ZIP or unrelated personal information to the code repository.
