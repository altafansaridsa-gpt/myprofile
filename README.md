# Altaf Ansari — Personal Portfolio

Personal portfolio website for Altaf Ansari, AI Engineer & Software Engineer.

## Tech Stack

- Pure HTML, CSS, JavaScript — no frameworks, no build step
- Google Fonts (Inter + JetBrains Mono)
- CSS custom properties for theming
- Intersection Observer API for scroll animations

## Project Structure

```
porfolio/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles
├── js/
│   └── main.js         # Scroll animations, nav behavior
├── assets/
│   └── Altaf_Ansari_Resume.pdf   # Place resume here
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages auto-deploy
```

## Deploying to GitHub Pages

### Option A — Automatic (GitHub Actions)

1. Create a new GitHub repository (e.g. `altafansari.github.io` or `portfolio`).
2. Push this folder to the `main` branch.
3. Go to **Settings → Pages → Source** and select **GitHub Actions**.
4. Every push to `main` will automatically deploy the site.

### Option B — Manual (classic Pages)

1. Push to a GitHub repository.
2. Go to **Settings → Pages → Source**.
3. Select **Deploy from a branch → main → / (root)**.
4. Your site will be live at `https://<username>.github.io/<repo>/`.

## Customization

| What to change | Where |
|---|---|
| Your photo | Replace the `hero__photo-placeholder` div in `index.html` with an `<img>` tag |
| Resume file | Add `Altaf_Ansari_Resume.pdf` to the `assets/` folder |
| Email & social links | Search `hello@altafansari.dev`, `linkedin.com/in/altafansari`, `github.com/altafansari` in `index.html` |
| Accent color | Change `--accent` in `css/style.css` |
| Blog articles | Replace "Coming soon" links in the Blog section |

## Adding Your Photo

Replace the placeholder block in `index.html`:

```html
<!-- Remove this placeholder -->
<div class="hero__photo-placeholder">
  <div class="hero__initials">AA</div>
  <div class="hero__photo-glow"></div>
</div>

<!-- Add this instead -->
<img
  src="assets/photo.jpg"
  alt="Altaf Ansari"
  style="width:100%;height:100%;object-fit:cover;border-radius:20px;"
/>
```
