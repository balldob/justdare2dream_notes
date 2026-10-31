# Just Dare2Dream — Notes

A notes app in the Just Dare2Dream homepage style. Write notes, pin the important ones, search them all, and delete what you don't need. Notes save automatically as you type.

Plain HTML, CSS and JavaScript in `public/`, with no build step and no dependencies. Notes are saved in the visitor's browser (`localStorage`, key `jd2d-notes-v1`). Nothing is sent to a server, and each device keeps its own notes.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --directory public
```

Then open http://localhost:8000.

## Deploy as a Cloudflare Worker

Create a Worker from this repository with these build settings:

- **Root directory:** leave empty
- **Build command:** leave empty
- **Deploy command:** `npx wrangler deploy`

`wrangler.jsonc` serves `public/` as static assets. Then add a custom domain under the Worker's **Settings → Domains & Routes**.

## Assets

The Space Grotesk fonts in `public/assets/` are licensed under the SIL Open Font License (see `space-grotesk-LICENSE.txt`). DM Sans loads from Google Fonts. `logo-mark.png` is cropped from the Just Dare2Dream logo.
