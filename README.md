# electricfieldon — Writing Portfolio

A static, mobile-friendly writing portfolio made from an Instagram export. The site uses plain HTML, CSS and JavaScript; no package installation or build command is required.

## How the site is laid out

The site is a book.

- `index.html` opens on a cloth-bound **cover**. Tapping it opens the book to the **Contents**: the left page has a frontispiece picture and a short "Begin here" list (your featured posts), and the right page lists the **chapters**. Each chapter is one mood from `site-config.js`.
- A chapter (`index.html#chapter-quiet-thoughts`) shows its pieces as plates, newest first, with the page number under each.
- `archive.html` is the **Index**: every piece grouped by month, with search, chapter chips, and language, form and order filters. Old `archive.html?collection=…` links still work.
- Opening any piece shows it as an open book: artwork on the left, caption on the right. Arrow keys or swiping go through the images and then on to the next piece in the same chapter.

Page numbers come from post dates (oldest is p. 1), so adding posts never renumbers older ones. The cover is skipped for the rest of a visit once opened, and whenever someone arrives by a direct link.

To give a piece a proper title instead of one taken from its caption, add `"title": "..."` to that post in `data.js`.

## Run locally

Open `index.html` in a modern browser. Open `archive.html` to view the complete archive.

## Customise links and featured posts

Edit `site-config.js`:

- `instagram` controls the external profile link label and URL.
- `featuredPostIds` controls the "Begin here" list and its order. The first one is the frontispiece.
- `collections` are the chapters, in book order. Names must match the collection names in `data.js` post tags.
- `coverLine` is the line printed on the cover.

To choose a featured post, use its `id` from `data.js` (or `posts.json`) and add it to `featuredPostIds`. The post artwork is never rewritten by the featured selection.

## Files

- `index.html` — cover, contents and chapters
- `archive.html` — the index of all pieces
- `styles.css` — visual styling and responsive layout
- `app.js` — the cover, contents, chapters, index and reader
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
