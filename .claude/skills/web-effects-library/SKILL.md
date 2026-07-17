---
name: web-effects-library
description: Library of interactive, "out-of-the-standard" web effects and a workflow for building distinctive small-business marketing sites. Provides 9 ready-to-drop React Bits components (curved inputs, animated bento grids, WebGL fluid cursor, 3D glass/lens, dot fields, card swaps, wave backgrounds, decay cards, cube grids) with full source, plus two reference design systems. Use when building a landing page or marketing site that needs a scrollable video hero, interactive cursor effects, animated backgrounds, or premium micro-interactions, or when the user asks for an effect/component from this library by name.
license: MIT
---

# Web Effects Library

A curated library of interactive web effects plus a build playbook for creating distinctive, non-templated marketing sites for small businesses. Every component ships with full, copy-pasteable source in `references/components/`. Pull only what a given section needs — do not load the whole library.

## When to use

- Building a scrollable hero landing page with a video and 3D atmosphere.
- Adding interactive cursor effects, animated backgrounds, or premium micro-interactions.
- The user asks for a specific effect by name (e.g. "add a SplashCursor", "use MagicBento", "DotField background").
- You want a distinctive, "out-of-the-standard" look instead of a generic template.

## Effect Catalog

Each entry links to a reference file with the usage example, full prop table, and complete component source (JavaScript + CSS variant, React Bits).

| Component | What it does | Reach for it when | Deps |
|---|---|---|---|
| **CurvedInput** | Text/email input bar bent along a circular arc with a matching submit button | Email capture, hero search, newsletter CTA that shouldn't look like a plain form | none |
| **MagicBento** | Animated bento grid with spotlight, border-glow, tilt, and particle effects | Feature grids, "why us" sections, product highlight boards | none |
| **Waves** | Animated wavy line field rendered on canvas | Ambient section/hero background with motion but low cost | none |
| **DecayCard** | Image card that distorts with an SVG displacement/decay effect on pointer move | A single hero image or product shot that should feel alive on hover | none |
| **SplashCursor** | WebGL fluid-simulation trail that follows the cursor | Signature full-page cursor atmosphere; the "wow" interactive moment | none (WebGL) |
| **Cubes** | Interactive grid of 3D cubes that react and tilt toward the cursor | Playful interactive backdrop or section divider with depth | none |
| **FluidGlass** | Three.js glass/lens refraction overlay (`lens`, `bar`, or `cube` mode) | Refracting glass nav bar or a lens that distorts content behind it | `three @react-three/fiber @react-three/drei maath` |
| **CardSwap** | Stack of cards that cycle/swap with a 3D animated transition | Rotating testimonials, feature showcases, "one thing at a time" storytelling | none |
| **DotField** | Interactive dot grid that bulges, glows, and optionally sparkles around the cursor | Elegant low-key hero/section background that responds to the cursor | none |

**Load a component only when you use it:** read `references/components/<kebab-name>.md` (e.g. `references/components/splash-cursor.md`).

## Build Workflow (distinctive small-business site)

Full brief in `references/site-build-brief.md`. Core requirements:

1. **Scrollable hero with a video.** Mount a 1080p, ~15s video in the hero. The video must feature **3D elements tied to the business** and carry **no text baked into it**. A strong pattern: a 3D animation of one of the business's real products (e.g. sourced from their Google Drive). Keep generation cost low (this brief caps Higgsfield usage at ~60 credits).
2. **Interactive cursor effects.** Add a cursor effect from the catalog (SplashCursor / DotField / Cubes) so the page reacts to the visitor.
3. **Mobile-first optimization.** Everything must work and stay performant on phones — gate heavy WebGL effects behind capability/`prefers-reduced-motion` checks and provide lighter fallbacks.
4. **Pick effects deliberately.** Choose 1-2 signature effects, not all nine. Over-animation reads as AI-generated; restraint reads as premium (see `frontend-design` and `modern-web-design` skills).
5. **Ground it in a real style.** Use `references/style-references.md` for two fully-specified design systems (tokens, typography, do's/don'ts, example component prompts) you can adapt — the dark-void "Dala" constellation system and a Tailwind-v4 product-reveal system.
6. **Deliver a final HTML file** with the video mounted and the chosen effects wired in.

## Integration checklist (per component)

1. Install any listed dependencies (most need none).
2. Copy the component source from its reference file into the project (`components/` or `components/ui/`).
3. Import and render using the usage example as a starting point.
4. Tune props via the prop table; keep the effect subtle and purposeful.
5. Verify mobile performance and `prefers-reduced-motion` behavior before shipping.

## References

- `references/site-build-brief.md` — the full out-of-the-standard site brief.
- `references/components/*.md` — one file per effect: usage, props, full source.
- `references/style-references.md` — two example design systems to adapt (not copy).

## Related skills

`frontend-design`, `modern-web-design`, `web-design` (visual direction), `motion-framer` and `animated-component-libraries` (animation), `lightweight-3d-effects` (Vanta/Zdog/Tilt), `animate` (Higgsfield/scene video generation).
