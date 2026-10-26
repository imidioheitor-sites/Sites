# Burma Superstar — Menu Sync

A delivery-menu control room for Burma Superstar (San Francisco). One screen showing
every dish across every US delivery platform, so a mismatch is visible before a
customer finds it.

**Deliverable:** `index.html` — one file, no build step, no framework.

## The model

The restaurant's own website is the **reference**. Every other platform keeps its own
stored copy of the listing, exactly as in real life — which is why they drift. Each
platform is graded against the reference on **five dimensions**:

| Chip | Dimension | Flagged when |
|:--:|---|---|
| `$` | **Price** | below the reference, or more than 30% over it |
| `T` | **Menu tag** | filed under a different section than the reference |
| `I` | **Image** | no photo on that platform |
| `D` | **Description** | copy no longer matches the reference |
| `M` | **Modifications** | add-ons, spice levels or swaps missing or different |

Rolled up per dish into **In sync** / **Drifted** / **Broken** (not listed, sold out,
or priced under the reference).

Platforms — the four majors are highlighted, the rest still tracked:

**Reference** (your site) · **DoorDash** · **Uber Eats** · **Grubhub** · **Caviar** ·
Seamless · Postmates · ChowNow · Toast · Yelp

## Editing

**Click any dish** to open the editor. It shows one pane per platform with every
field editable: price, menu tag, listed, available, image, description and
modifications.

The important part: **edit the reference and every platform is re-graded live.**
Change the price on your own site and the platforms that no longer match flip to
Drifted while you watch. Two shortcuts fix things fast:

- **Copy the reference into &lt;platform&gt;** — heals one platform.
- **Push reference to every platform** — heals all of them at once (unlisted
  platforms are left alone).

Changes are saved to `localStorage`; **Reset to seed data** undoes everything.
A hand-edited price stops counting as an estimate.

## Import / export

CSV is **long format — one row per dish per platform** (12 dishes × 10 platforms =
120 rows), which is what you actually want in a spreadsheet when comparing five
dimensions.

```
dish_id,dish_name,burmese,platform,listed,available,price,tag,image,description,modifications,verified
```

- `platform` — one of `reference, doordash, ubereats, grubhub, caviar, seamless, postmates, chownow, toast, yelp`
- `listed` / `available` / `image` / `verified` — `yes` or `no`
- `modifications` — pipe-separated: `Add egg +$3|Spice level`

JSON export/import carries the same structure verbatim.

## About the data — read this

The dish names, descriptions and several prices are **real**, recovered from public
sources:

- Tea Leaf Salad, Nan Gyi Dok, Coconut Rice, Garlic Noodles, Pork Belly and Sesame
  Beef carry their **real menu descriptions**.
- Verified prices: Tea Leaf Salad **$16.00** reference / **$19.00** DoorDash,
  Samusa Soup **$23.45** DoorDash, Platha & Dip **$17.45** DoorDash.
- Remaining prices are **estimates**, anchored to the restaurant's published
  **$9–$18** dine-in range.

Estimated prices are drawn with a dashed underline and the footer counts how many
remain. Hovering a price says whether it is verified or estimated.

**Why not all real:** this build environment's network policy blocks every menu
source — the restaurant's own site, all four major platforms, every aggregator
(allmenus, zmenu, menupix, Yelp, TripAdvisor) and even the official menu PDFs. Only
package registries are reachable. The numbers cannot be fetched from here; they have
to come from you, which is what the editor and the CSV import are for.

## Assets

`index.html` loads its media from a CDN by default so it works the moment you open
it. To make the folder self-contained:

```bash
./fetch-assets.sh            # download + compress for the web
./fetch-assets.sh --1080p    # download + rescale the hero video to 1920x1080
```

Downloads the video and stills into `assets/`, compresses them if `ffmpeg` /
ImageMagick are present, and flips `ASSET_LOCAL` in `index.html` to `true`.

### On the hero video resolution

The hero video is **1284×716, 15.04s** — 720p class, not the 1080p originally
asked for. Kling's `pro` mode (true 1080p) is gated behind a Plus subscription,
and re-generating at 1080p costs **120–135 credits**, which the budget did not
allow. `--1080p` gives you a genuine 1920×1080 file via lanczos resampling; it
fixes the spec but cannot add detail that was never rendered.

## Interaction

- **Hero** — scroll-driven 15s video of the tea leaf salad turning in 3D, no baked-in text.
- **TextPressure** — the `MENU SYNC` headline bends its variable-font weight, width and slant toward the cursor.
- **Portal** — a scroll-driven aperture that opens through the dish and swallows the screen.
- **3D product** — the signature dish as a layered volume you can drag to rotate.
- **Object reveal on hover** — hovering a menu row floats its photo under the cursor.
- **Cursor** — a warm spice-ember trail with a magnetic dot that grows over anything interactive.
- **Bento** — spotlight, border glow, 3D tilt, magnetism, particles and a click ripple.

Pointer effects are disabled on touch and under `prefers-reduced-motion`, where the
video is replaced by a still.

Verified: no horizontal scroll at 320/390/768/1440, drawer usable at every width,
zero JavaScript errors.
