# electricfieldon — Writing Portfolio

A static, mobile-friendly writing portfolio made from an Instagram export. The site uses plain HTML, CSS and JavaScript; no package installation or build command is required.

## Run locally

1. Extract this folder if it is still zipped.
2. Open `index.html` in a modern browser.

## Main files

- `index.html` — page structure
- `styles.css` — layout and visual styling
- `app.js` — filters, collection browsing and carousel interactions
- `data.js` — post metadata and references to media assets
- `data/posts.json` and `data/posts.csv` — export/inventory data
- `assets/media/` — display copies of the original post images
- `netlify.toml` — Netlify static publish configuration

## Deploy with Netlify

This is a static site, so it does not need a build command. When importing the repository into Netlify, use the repository root as the publish directory (`.`) or accept the settings supplied by `netlify.toml`.

## Publish via GitHub Desktop (no terminal needed)

1. Download and extract the project ZIP.
2. In GitHub Desktop, choose **File → New repository** and name it `electricfieldon-portfolio`.
3. Click **Show in Explorer** (Windows) or reveal the repository folder in Finder (Mac).
4. Copy the contents of the extracted project into that repository folder. Keep `index.html` directly in the repository root.
5. Return to GitHub Desktop, enter a summary such as `Add writing portfolio`, and click **Commit to main**.
6. Click **Publish repository**. Keeping the repository private is fine for Netlify deployment; authorise Netlify to access it when connecting the site.

Do not add your original Instagram account export ZIP or any unrelated personal information to this repository.

## Content notes

The post artwork files are included as source media; the website should not edit or redesign them. Language and theme tags may need manual review before treating them as final classifications. Posts without direct Instagram URLs cannot automatically link back to the original post yet.
