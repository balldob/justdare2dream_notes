# Just Dare2Dream — Daily Planner

A daily planner in the Just Dare2Dream homepage style: three priorities, an hour-by-hour schedule (6 AM–10 PM), a to-do list and notes.

Plain HTML, CSS and JavaScript in `public/`, with no build step and no dependencies. Each day is saved in the visitor's browser (`localStorage`, key `jd2d-planner-v1`). Nothing is sent to a server, and each device keeps its own planner.

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

`wrangler.jsonc` serves `public/` as static assets. Then add a custom domain such as `organise.justdare2dream.com` under the Worker's **Settings → Domains & Routes**.

## Assets

The Space Grotesk fonts in `public/assets/` are licensed under the SIL Open Font License (see `space-grotesk-LICENSE.txt`). DM Sans loads from Google Fonts. `logo-mark.png` is cropped from the Just Dare2Dream logo.
