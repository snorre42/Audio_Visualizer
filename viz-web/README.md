# Audio Visualizer — Web Version

Self-contained interactive audio visualizer for embedding on websites
(including Canva portfolio pages via the Embed element).

## Files

- `index.html` — the page
- `visualizer.js` — all visualizer logic
- `three.min.js` — Three.js library (vendored)

Three files, no build step, no dependencies. Just upload them and link to
`index.html`.

---

## Part 1 — Host it on GitHub Pages (free)

### Step 1: Create a new repository

1. Go to https://github.com/new
2. Repository name: `audio-visualizer` (or anything you like)
3. Public (required for free GitHub Pages)
4. **Check** "Add a README file" so the repo isn't empty
5. Click **Create repository**

### Step 2: Upload the three files

1. On the repo page, click **Add file → Upload files**
2. Drag `index.html`, `visualizer.js`, and `three.min.js` into the upload area
3. Scroll down, click **Commit changes**

### Step 3: Turn on GitHub Pages

1. In the repo, click **Settings** (top right tab)
2. In the left sidebar, click **Pages**
3. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main` and `/ (root)`
4. Click **Save**
5. Wait ~30 seconds. Refresh the page. You'll see:
   "Your site is live at `https://YOUR-USERNAME.github.io/audio-visualizer/`"
6. Copy that URL. Open it in a new tab to confirm it loads.

You now have a public URL hosting the visualizer.

---

## Part 2 — Embed on your Canva website

### Step 1: Add the Embed element

1. Open your Canva website project
2. On the left toolbar, click **Elements**
3. Scroll down (or search) to find **Embed**
4. Click the Embed option — a dialog opens asking for a URL

### Step 2: Paste your URL

1. Paste the GitHub Pages URL you copied earlier
   (e.g. `https://yourname.github.io/audio-visualizer/`)
2. Click **Add to design**

The visualizer will appear as a block on your page. Resize it like any other
element — drag the corners.

### Step 3: Publish

1. Click **Publish website** (or the publish button at the top right)
2. Choose your domain or use the free Canva subdomain
3. Visitors can interact with the visualizer live

---

## Important notes for visitors

**Microphone permission**: Canva embeds run in an iframe, and iframes inherit
permissions from the parent page. If a visitor clicks the mic button, the
browser will ask permission. This usually works fine on modern browsers but
the user must explicitly click the button — it can't auto-start.

**File upload works** — visitors can drop their own audio files in.

**Browser support**: Chrome, Edge, Firefox, Safari all work. Mobile browsers
work but the panel UI is cramped on tiny screens.

**Sound**: Visitors will hear audio if they upload a file or use the demos.
Their device speakers need to be on.

---

## Troubleshooting

**The Canva embed shows "Couldn't embed this URL"**
This happens occasionally with new GitHub Pages URLs that Iframely hasn't
indexed yet. Two fixes:
1. Wait 10–20 minutes after the GitHub Pages site goes live, then try again.
2. If it still doesn't work, use Canva's **Button** element with a link to
   the URL instead — visitors click and open it in a new tab.

**Visualizer shows but doesn't react to mic**
Click the mic button explicitly — browsers won't let it auto-start.

**Visualizer is tiny in Canva**
Drag the corner handles to resize the embed block. Aspect ratio doesn't need
to be 16:9 — the visualizer adapts to any size.

**Want to update the visualizer**
Edit your files locally, drag them back into the GitHub repo to replace.
Changes go live within seconds.

---

## Custom domain (optional)

If you want `viz.yourname.com` instead of `yourname.github.io/audio-visualizer/`:
1. In the repo Settings → Pages, add your custom domain
2. Add a CNAME record at your DNS provider pointing to `yourname.github.io`
3. Canva embed will work the same way with the new URL.
